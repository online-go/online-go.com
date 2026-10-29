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

import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { emitNotification } from "./NotificationManager";

jest.mock("@/lib/misc", () => ({
    ...jest.requireActual("@/lib/misc"),
    ogs_has_focus: () => false,
}));

describe("emitNotification", () => {
    const NotificationStub = jest.fn();

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(Date.now() + 60000); // past the page-load grace period
        NotificationStub.mockClear();
        (window as any).Notification = Object.assign(NotificationStub, { permission: "granted" });
        preferences.set("desktop-notifications", true);
    });

    afterEach(() => {
        jest.useRealTimers();
        data.remove("config.desktop_notifications");
    });

    test("a type turned off for desktop shows no pop-up", () => {
        data.set("config.desktop_notifications", { challenge: false });
        emitNotification("off", "body", undefined, "challenge");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).not.toHaveBeenCalled();

        emitNotification("unlisted", "body", undefined, "friendRequest");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).toHaveBeenCalledTimes(1);
    });
});
