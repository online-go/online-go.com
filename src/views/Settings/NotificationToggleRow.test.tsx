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
import { put } from "@/lib/requests";

jest.mock("@/lib/requests", () => ({ put: jest.fn(() => Promise.resolve({})) }));

import { NotificationToggleRow } from "./NotificationToggleRow";

function renderRow() {
    const state = {
        notifications: {
            yourMove: {
                description: "It is my turn to move",
                value: { email: true, mobile: true },
            },
        },
    };
    const { getAllByRole } = render(
        <NotificationToggleRow
            state={state}
            name="It is my turn to move"
            notification="yourMove"
        />,
    );
    const [email, push] = getAllByRole("switch");
    return { email, push };
}

describe("NotificationToggleRow", () => {
    beforeEach(() => (put as jest.Mock).mockClear());

    test("turning off push keeps email on", () => {
        fireEvent.click(renderRow().push);
        expect(put).toHaveBeenCalledWith("me/settings", {
            notifications: {
                yourMove: {
                    description: "It is my turn to move",
                    value: { email: true, mobile: false },
                },
            },
        });
    });

    test("turning off email keeps push on", () => {
        fireEvent.click(renderRow().email);
        expect(put).toHaveBeenCalledWith("me/settings", {
            notifications: {
                yourMove: {
                    description: "It is my turn to move",
                    value: { email: false, mobile: true },
                },
            },
        });
    });
});
