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
import { act, fireEvent, render } from "@testing-library/react";
import { put } from "@/lib/requests";

jest.mock("@/lib/requests", () => ({ put: jest.fn() }));

import { WebhookForm } from "./WebhookForm";

const current = {
    url: "https://hooks.example.com/ogs",
    updated_at: "2026-10-28T00:00:00Z",
    paused_at: null,
    pause_reason: null,
    consecutive_auth_failures: 0,
};

async function saveWith(response: object) {
    (put as jest.Mock).mockResolvedValueOnce(response);
    const view = render(
        <WebhookForm base="me/api_clients/5/push" current={current} onSaved={() => 0} />,
    );
    await act(async () => {
        fireEvent.click(view.getByText("Save webhook"));
    });
    return view;
}

describe("WebhookForm", () => {
    test("shows a newly generated signing secret", async () => {
        const view = await saveWith({ signing_secret: "abc123" });
        expect(view.getByText("abc123")).toBeTruthy();
    });

    test("shows no secret when saving only changed the URL", async () => {
        const view = await saveWith({});
        expect(view.queryByText(/Your signing secret/)).toBeNull();
        expect(put).toHaveBeenLastCalledWith("me/api_clients/5/push/webhook", {
            url: "https://hooks.example.com/ogs",
            rotate_secret: false,
        });
    });
});
