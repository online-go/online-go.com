/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */
import * as React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { NotificationList } from "./Notifications";
import { notification_manager } from "./NotificationManager";
import { browserHistory } from "@/lib/ogsHistory";

jest.mock("./NotificationManager", () => ({
    notification_manager: {
        ordered_notifications: [],
        event_emitter: { on: jest.fn(), off: jest.fn() },
        clearAllNonActionableNotifications: jest.fn(),
        deleteNotification: jest.fn(),
    },
}));
jest.mock("@/lib/ogsHistory", () => ({ browserHistory: { push: jest.fn() } }));

describe("Kibitz watched notification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test.each([undefined, [], [{ id: "deleted-room" }]])(
        "opens the game without linking unverified rooms (%p)",
        (rooms) => {
            notification_manager.ordered_notifications = [
                { id: "1", type: "kibitzGameWatched", game_id: 42, rooms },
            ];
            render(<NotificationList />);
            const message = screen.getByText("Your game was watched in Kibitz.");
            expect(screen.queryByRole("link")).toBeNull();
            fireEvent.click(message);
            expect(browserHistory.push).toHaveBeenCalledWith("/game/42");
        },
    );

    test("does not navigate when the game id is missing", () => {
        notification_manager.ordered_notifications = [{ id: "3", type: "kibitzGameWatched" }];
        render(<NotificationList />);
        fireEvent.click(screen.getByText("Your game was watched in Kibitz."));
        expect(browserHistory.push).not.toHaveBeenCalled();
    });

    test("keeps existing game-ended notifications working", () => {
        notification_manager.ordered_notifications = [
            {
                id: "2",
                type: "gameEnded",
                game_id: 43,
                black: "Black",
                white: "White",
                name: "Game",
            },
        ];
        render(<NotificationList />);
        fireEvent.click(screen.getByText(/Game has ended/));
        expect(browserHistory.push).toHaveBeenCalledWith("/game/43");
    });
});
