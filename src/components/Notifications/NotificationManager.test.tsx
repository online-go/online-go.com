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
import { getCurrentGameId } from "@/lib/misc";
import { browserHistory } from "@/lib/ogsHistory";
import { socket } from "@/lib/sockets";
import { emitNotification, notification_manager } from "./NotificationManager";

jest.mock("@/lib/misc", () => ({
    ...jest.requireActual("@/lib/misc"),
    ogs_has_focus: () => false,
    getCurrentGameId: jest.fn(),
}));

describe("visiting a game", () => {
    beforeEach(() => {
        jest.spyOn(socket, "send").mockImplementation(() => undefined as never);
        (getCurrentGameId as jest.Mock).mockReturnValue(42);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        notification_manager.notifications = {};
    });

    test("clears the game's notifications, except a Kibitz discussion one", () => {
        notification_manager.notifications = {
            ended: { id: "ended", type: "gameEnded", game_id: 42 },
            discussed: { id: "discussed", type: "kibitzGameDiscussed", game_id: 42 },
            other: { id: "other", type: "gameEnded", game_id: 43 },
        };

        notification_manager.onNavigate();

        expect(Object.keys(notification_manager.notifications).sort()).toEqual([
            "discussed",
            "other",
        ]);
    });
});

describe("a Kibitz discussion desktop notification", () => {
    const NotificationStub = jest.fn();
    let receive: (notification: Record<string, unknown>) => void;

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(Date.now() + 60000); // past the page-load grace period
        NotificationStub.mockClear();
        (window as any).Notification = Object.assign(NotificationStub, { permission: "granted" });
        preferences.set("desktop-notifications", true);
        jest.spyOn(socket, "send").mockImplementation(() => undefined as never);
        jest.spyOn(browserHistory, "push").mockImplementation(() => undefined);
        const handlers: Record<string, (data: never) => void> = {};
        jest.spyOn(socket, "on").mockImplementation(((event: string, handler: never) => {
            handlers[event] = handler;
            return socket;
        }) as never);
        notification_manager.connect();
        receive = (notification) => handlers["notification"](notification as never);
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
        notification_manager.notifications = {};
    });

    function clickPopup() {
        jest.advanceTimersByTime(1000);
        expect(NotificationStub).toHaveBeenCalledTimes(1);
        NotificationStub.mock.instances[0].onclick();
    }

    test("opens the first room and clears the notification when clicked", () => {
        receive({
            id: "1",
            type: "kibitzGameDiscussed",
            game_id: 42,
            rooms: [
                { id: "user-1a2b3c4d", title: "Late-night reviews" },
                { id: "preset-english-chat-live", title: "English chat" },
            ],
        });

        clickPopup();

        expect(browserHistory.push).toHaveBeenCalledWith("/kibitz/user-1a2b3c4d");
        expect(notification_manager.notifications).not.toHaveProperty("1");
    });

    test("opens the game and keeps the notification when it names no room", () => {
        receive({ id: "2", type: "kibitzGameDiscussed", game_id: 42, rooms: [] });

        clickPopup();

        expect(browserHistory.push).toHaveBeenCalledWith("/game/42");
        expect(notification_manager.notifications).toHaveProperty("2");
    });
});

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
