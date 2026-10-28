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

jest.mock("@/lib/requests", () => ({
    get: jest.fn(() => Promise.resolve({ results: [] })),
    put: jest.fn(() => Promise.resolve({})),
}));

import { NotificationPreferences } from "./NotificationPreferences";

test("each notification's email and mobile toggles are saved independently", async () => {
    const description = "It is my turn to move";
    const state = {
        notifications: { yourMove: { description, value: { email: true, mobile: true } } },
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
    const [email, mobile] = view.getAllByRole("switch");

    fireEvent.click(mobile);
    expect(put).toHaveBeenLastCalledWith("me/settings", {
        notifications: { yourMove: { description, value: { email: true, mobile: false } } },
    });

    fireEvent.click(email);
    expect(put).toHaveBeenLastCalledWith("me/settings", {
        notifications: { yourMove: { description, value: { email: false, mobile: false } } },
    });
});
