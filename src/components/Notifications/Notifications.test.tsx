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

const MESSAGE = /Your game was discussed in Kibitz/;

function showDiscussed(fields: Record<string, unknown>) {
    notification_manager.ordered_notifications = [
        {
            id: "1",
            type: "kibitzGameDiscussed",
            black: "alice",
            white: "bob",
            name: "Friendly Match",
            ...fields,
        },
    ];
    render(<NotificationList />);
}

describe("Kibitz discussion notification", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("opens the game and keeps the notification when it is clicked", () => {
        showDiscussed({ game_id: 42 });
        fireEvent.click(screen.getByText(MESSAGE));
        expect(browserHistory.push).toHaveBeenCalledWith("/game/42");
        expect(notification_manager.deleteNotification).not.toHaveBeenCalled();
    });

    test("opens a room, not the game, and clears the notification when a room is clicked", () => {
        showDiscussed({
            game_id: 42,
            rooms: [
                { id: "user-1a2b3c4d", title: "Late-night reviews" },
                { id: "preset-english-chat-live", title: "English chat" },
            ],
        });
        fireEvent.click(screen.getByRole("link", { name: "English chat" }));
        expect(browserHistory.push).toHaveBeenCalledTimes(1);
        expect(browserHistory.push).toHaveBeenCalledWith("/kibitz/preset-english-chat-live");
        expect(notification_manager.deleteNotification).toHaveBeenCalledWith(
            expect.objectContaining({ id: "1", type: "kibitzGameDiscussed" }),
        );
    });

    test.each([
        undefined,
        "user-1a2b3c4d",
        [{ id: "user-1a2b3c4d" }],
        [{ id: "../admin", title: "Bad" }],
    ])("links no room for a malformed room list (%p)", (rooms) => {
        showDiscussed({ game_id: 42, rooms });
        expect(screen.queryByRole("link")).toBeNull();
        fireEvent.click(screen.getByText(MESSAGE));
        expect(browserHistory.push).toHaveBeenCalledWith("/game/42");
    });

    test("does not navigate when the game id is missing", () => {
        showDiscussed({});
        fireEvent.click(screen.getByText(MESSAGE));
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
