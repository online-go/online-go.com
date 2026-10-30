/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { fireEvent, render } from "@testing-library/react";
import { get, put } from "@/lib/requests";
import * as preferences from "@/lib/preferences";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(() => Promise.resolve({ results: [] })),
    put: jest.fn(() => Promise.resolve({})),
}));

import { NotificationPreferences } from "./NotificationPreferences";

const mockedGet = get as jest.Mock;

function device(provider: string, form_factor: string | null) {
    return {
        id: 1,
        application: provider === "webpush" ? null : { id: 1, name: "SomeApp" },
        provider,
        token: null,
        label: provider === "webpush" ? "Chrome on Linux" : null,
        form_factor,
        apns_environment: null,
        created_at: "2026-10-01T00:00:00Z",
        last_seen_at: "2026-10-29T00:00:00Z",
    };
}

function renderWithDevices(devices: ReturnType<typeof device>[]) {
    mockedGet.mockImplementation(() => Promise.resolve({ results: devices }));
    const state = {
        notifications: {
            yourMove: {
                description: "It is my turn to move",
                value: { email: true, mobile: true },
            },
        },
    };
    return render(
        <NotificationPreferences
            state={state}
            vacation_base_time={0}
            refresh={() => () => 0}
            updateSelfReportedAccountLinkages={() => 0}
        />,
    );
}

beforeEach(() => {
    mockedGet.mockImplementation(() => Promise.resolve({ results: [] }));
    preferences.set("desktop-notifications", false);
});

test("each notification's email, mobile and desktop toggles are saved independently", async () => {
    const description = "It is my turn to move";
    const view = renderWithDevices([device("fcm", "mobile"), device("webpush", "desktop")]);
    await view.findByText("Chrome on Linux");
    const [email, mobile, desktop] = view.getAllByRole("switch");
    expect(desktop).toBeChecked();

    fireEvent.click(desktop);
    expect(put).toHaveBeenLastCalledWith("me/settings", {
        notifications: {
            yourMove: { description, value: { email: true, mobile: true, desktop: false } },
        },
    });

    fireEvent.click(mobile);
    expect(put).toHaveBeenLastCalledWith("me/settings", {
        notifications: {
            yourMove: { description, value: { email: true, mobile: false, desktop: false } },
        },
    });

    fireEvent.click(email);
    expect(put).toHaveBeenLastCalledWith("me/settings", {
        notifications: {
            yourMove: { description, value: { email: false, mobile: false, desktop: false } },
        },
    });
});

test("streak notifications, which aren't released yet, have no settings row", async () => {
    const state = {
        notifications: {
            yourMove: {
                description: "It is my turn to move",
                value: { email: true, mobile: true },
            },
            streak_at_risk_reminder: {
                description: "My streak is at risk",
                value: { email: false, mobile: false, desktop: false },
            },
        },
    };
    const view = render(
        <NotificationPreferences
            state={state}
            vacation_base_time={0}
            refresh={() => () => 0}
            updateSelfReportedAccountLinkages={() => 0}
        />,
    );
    await view.findByText(/No devices/);
    expect(view.getByText("It is my turn to move")).toBeTruthy();
    expect(view.queryByText("My streak is at risk")).toBeNull();
});

test("mobile and desktop toggles are disabled when no device gets notifications that way", async () => {
    const view = renderWithDevices([device("webhook", null)]);
    await view.findByText(/Webhook/);
    const [email, mobile, desktop] = view.getAllByRole("switch");
    expect(email).not.toBeDisabled();
    expect(mobile).toBeDisabled();
    expect(mobile).not.toBeChecked();
    expect(desktop).toBeDisabled();
    expect(desktop).not.toBeChecked();
});

test("a phone browser or native app enables only the mobile toggles", async () => {
    const view = renderWithDevices([device("webpush", "mobile")]);
    await view.findByText("Chrome on Linux");
    const [, mobile, desktop] = view.getAllByRole("switch");
    expect(mobile).not.toBeDisabled();
    expect(mobile).toBeChecked();
    expect(desktop).toBeDisabled();
    expect(desktop).not.toBeChecked();
});

test("desktop toggles stay enabled while this browser shows notifications itself", async () => {
    preferences.set("desktop-notifications", true);
    Object.defineProperty(window, "Notification", {
        value: { permission: "granted" },
        configurable: true,
    });
    try {
        const view = renderWithDevices([]);
        await view.findByText(/No devices/);
        const [, mobile, desktop] = view.getAllByRole("switch");
        expect(mobile).toBeDisabled();
        expect(desktop).not.toBeDisabled();
    } finally {
        delete (window as { Notification?: unknown }).Notification;
    }
});
