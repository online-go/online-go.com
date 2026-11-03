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
import { emitNotification, showsYourMoveNotifications } from "./NotificationManager";

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
        data.set("config.desktop_notifications", { challenge: false, yourMove: true });
        emitNotification("off", "body", undefined, "challenge");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).not.toHaveBeenCalled();

        emitNotification("unlisted", "body", undefined, "friendRequest");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).toHaveBeenCalledTimes(1);
    });

    test("a pop-up with no settings row shows while any desktop setting is on", () => {
        data.set("config.desktop_notifications", { challenge: false, yourMove: true });
        emitNotification("Private Message", "body");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).toHaveBeenCalledTimes(1);
    });

    test("with every desktop setting off, no pop-up shows, typed or not", () => {
        data.set("config.desktop_notifications", { challenge: false, yourMove: false });
        emitNotification("Private Message", "body");
        jest.advanceTimersByTime(1000);
        emitNotification("Game Started", "body", undefined, "gameStarted");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).not.toHaveBeenCalled();
    });

    test("a pop-up shows when the server sent no desktop settings", () => {
        emitNotification("Private Message", "body");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).toHaveBeenCalledTimes(1);

        data.set("config.desktop_notifications", {});
        emitNotification("Another message", "body");
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).toHaveBeenCalledTimes(2);
    });
});

describe("showsYourMoveNotifications", () => {
    beforeEach(() => {
        (window as any).Notification = { permission: "granted" };
        preferences.set("desktop-notifications", true);
        jest.spyOn(navigator, "userAgent", "get").mockReturnValue(
            "Mozilla/5.0 (X11; Linux x86_64)",
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
        data.remove("config.desktop_notifications");
    });

    test("a computer's browser that's allowed to shows them", () => {
        expect(showsYourMoveNotifications()).toBe(true);
    });

    test("not without the browser's permission", () => {
        (window as any).Notification = { permission: "default" };
        expect(showsYourMoveNotifications()).toBe(false);
    });

    test("not with this browser's pop-ups turned off", () => {
        preferences.set("desktop-notifications", false);
        expect(showsYourMoveNotifications()).toBe(false);
    });

    test("not with the player's desktop setting for their move turned off", () => {
        data.set("config.desktop_notifications", { yourMove: false, challenge: true });
        expect(showsYourMoveNotifications()).toBe(false);
    });

    test("not on a phone, which can't show them from a page", () => {
        jest.spyOn(navigator, "userAgent", "get").mockReturnValue(
            "Mozilla/5.0 (Linux; Android 14) Mobile",
        );
        expect(showsYourMoveNotifications()).toBe(false);
    });

    test("not in a browser with no notifications at all", () => {
        delete (window as any).Notification;
        expect(showsYourMoveNotifications()).toBe(false);
    });
});
