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
import { act, fireEvent, render, screen } from "@testing-library/react";
import { AccountWarning, AccountWarningMessage } from "./AccountWarning";
import { get, patch } from "@/lib/requests";

const mockUser = { anonymous: false, has_pending_warnings_system_message: true };
const mockEngine = { game_id: 12, phase: "play", time_control: { speed: "live" } };
let mockPath = "/game/12";
jest.mock("@/lib/hooks", () => ({
    useUser: () => mockUser,
    useMainGoban: () => ({ engine: mockEngine }),
}));
jest.mock("react-router-dom", () => ({ useLocation: () => ({ pathname: mockPath }) }));
jest.mock("@/lib/requests", () => ({ get: jest.fn(), patch: jest.fn(() => Promise.resolve()) }));
jest.mock("@/lib/translate", () => ({
    _: (text: string) => text,
    pgettext: (_context: string, text: string) => text,
}));
jest.mock("./CannedMessages", () => ({
    CANNED_MESSAGES: { no_ai_use_bad_report: () => "Report warning" },
}));
jest.mock("@/components/AutoTranslate", () => ({ AutoTranslate: () => null }));

const message: rest_api.warnings.Warning = {
    id: 23,
    created: "2026-09-11T00:00:00Z",
    acknowledged: null,
    player_id: 7,
    moderator: null,
    text: null,
    message_id: "no_ai_use_bad_report",
    severity: "warning",
    interpolation_data: null,
};

beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUser.anonymous = false;
    mockUser.has_pending_warnings_system_message = true;
    mockEngine.phase = "play";
    mockEngine.time_control.speed = "live";
    mockPath = "/game/12";
    jest.mocked(get).mockResolvedValue(message);
});

afterEach(() => {
    jest.useRealTimers();
});

test.each(["live", "blitz"])(
    "defers warnings during %s games and shows them after the game ends",
    async (speed) => {
        mockEngine.time_control.speed = speed;
        await act(async () => {
            render(<AccountWarning />);
        });
        expect(get).toHaveBeenCalledWith("me/warning");
        expect(screen.queryByText("Report warning")).not.toBeInTheDocument();
        act(() => {
            jest.advanceTimersByTime(15000);
        });
        expect(screen.queryByText("Report warning")).not.toBeInTheDocument();
        mockEngine.phase = "finished";
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(screen.getByText("Report warning")).toBeVisible();
    },
);

test("shows a warning during a correspondence game", async () => {
    mockEngine.time_control.speed = "correspondence";
    await act(async () => {
        render(<AccountWarning />);
    });
    expect(screen.getByText("Report warning")).toBeVisible();
});

test.each(["/play", "/"])("shows warnings outside live games at %s", async (path) => {
    mockPath = path;
    await act(async () => {
        render(<AccountWarning />);
    });
    expect(screen.getByText("Report warning")).toBeVisible();
});

test("hides warnings on the terms of service page", async () => {
    mockPath = "/docs/terms-of-service";
    await act(async () => {
        render(<AccountWarning />);
    });
    expect(screen.queryByText("Report warning")).not.toBeInTheDocument();
});

test("requires both ten seconds and acknowledgement before accepting a warning", () => {
    const onAck = jest.fn();
    render(<AccountWarningMessage message={message} onAck={onAck} />);
    const ok = screen.getByRole("button", { name: /^OK/ });
    expect(ok).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I understand"));
    expect(ok).toBeDisabled();
    act(() => {
        jest.advanceTimersByTime(9000);
    });
    expect(ok).toBeDisabled();
    act(() => {
        jest.advanceTimersByTime(1000);
    });
    expect(ok).toBeEnabled();
    fireEvent.click(screen.getByLabelText("I understand"));
    expect(ok).toBeDisabled();
    fireEvent.click(screen.getByLabelText("I understand"));
    fireEvent.click(ok);
    expect(patch).toHaveBeenCalledWith("me/warning/23", { accept: true });
    expect(onAck).toHaveBeenCalledTimes(1);
});

test.each(["info", "acknowledgement"] as const)("accepts %s messages immediately", (severity) => {
    const onAck = jest.fn();
    render(<AccountWarningMessage message={{ ...message, severity }} onAck={onAck} />);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    const ok = screen.getByRole("button", { name: "OK" });
    expect(ok).toBeEnabled();
    fireEvent.click(ok);
    expect(patch).toHaveBeenCalledWith("me/warning/23", { accept: true });
    expect(onAck).toHaveBeenCalledTimes(1);
});

test("refreshing the same warning does not restart its countdown", () => {
    const view = render(<AccountWarningMessage message={message} />);
    fireEvent.click(screen.getByLabelText("I understand"));
    act(() => jest.advanceTimersByTime(9000));
    view.rerender(<AccountWarningMessage message={{ ...message }} />);
    act(() => jest.advanceTimersByTime(1000));
    expect(screen.getByRole("button", { name: /^OK/ })).toBeEnabled();
});

test("a different warning requires a new acknowledgement and countdown", () => {
    const view = render(<AccountWarningMessage message={message} />);
    fireEvent.click(screen.getByLabelText("I understand"));
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.getByRole("button", { name: /^OK/ })).toBeEnabled();
    view.rerender(<AccountWarningMessage message={{ ...message, id: 24 }} />);
    expect(screen.getByLabelText("I understand")).not.toBeChecked();
    fireEvent.click(screen.getByLabelText("I understand"));
    expect(screen.getByRole("button", { name: /^OK/ })).toBeDisabled();
    act(() => jest.advanceTimersByTime(10000));
    expect(screen.getByRole("button", { name: /^OK/ })).toBeEnabled();
});
