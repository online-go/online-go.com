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
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { GobanEngineConfig } from "goban";
import * as data from "@/lib/data";
import { GameLog, LogEntry } from "./GameLog";
import { socket } from "@/lib/sockets";
import { OgsHelpProvider } from "@/components/OgsHelpProvider";

const LOGGED_IN_USER = {
    anonymous: false,
    id: 123,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

beforeEach(() => {
    data.set("user", LOGGED_IN_USER);
});

jest.mock("@/lib/sockets", () => ({
    socket: { send: jest.fn(), on: jest.fn(), off: jest.fn(), connected: false },
}));

jest.mock("@/components/Player", () => ({
    Player: () => <span data-testid="player" />,
}));

type GameLogCallback = (log: LogEntry[]) => void;

function captureGameLogCallbacks(): Map<number, GameLogCallback> {
    const callbacks = new Map<number, GameLogCallback>();
    (socket.send as jest.Mock).mockImplementation(
        (event: string, payload: { game_id: number }, cb: GameLogCallback) => {
            if (event === "game/log") {
                callbacks.set(payload.game_id, cb);
            }
        },
    );
    return callbacks;
}

function logEntry(event: string): LogEntry {
    return { timestamp: "2026-01-01T00:00:00Z", event, data: {} };
}

function logEntries(count: number): LogEntry[] {
    return Array.from({ length: count }, (_, i) => logEntry(`event_${i}`));
}

function renderGameLog(game_id: number) {
    const goban_config = { game_id } as GobanEngineConfig;
    return render(
        <OgsHelpProvider>
            <GameLog goban_config={goban_config} />
        </OgsHelpProvider>,
    );
}

afterEach(() => {
    data.remove("user");
    cleanup();
    jest.clearAllMocks();
});

describe("GameLog", () => {
    test("ignores a game/log reply that arrives after the game_id has changed", () => {
        const callbacks = captureGameLogCallbacks();

        const { rerender } = renderGameLog(111);
        rerender(
            <OgsHelpProvider>
                <GameLog goban_config={{ game_id: 222 } as GobanEngineConfig} />
            </OgsHelpProvider>,
        );

        act(() => {
            callbacks.get(111)?.([logEntry("old_game_event")]);
        });

        expect(screen.queryByText("old game event")).not.toBeInTheDocument();

        act(() => {
            callbacks.get(222)?.([logEntry("new_game_event")]);
        });

        expect(screen.getByText("new game event")).toBeInTheDocument();
        expect(screen.queryByText("old game event")).not.toBeInTheDocument();
    });

    test("clears the previous game's log as soon as game_id changes", () => {
        const callbacks = captureGameLogCallbacks();

        const { rerender } = renderGameLog(111);
        act(() => {
            callbacks.get(111)?.([logEntry("old_game_event")]);
        });
        expect(screen.getByText("old game event")).toBeInTheDocument();

        rerender(
            <OgsHelpProvider>
                <GameLog goban_config={{ game_id: 222 } as GobanEngineConfig} />
            </OgsHelpProvider>,
        );

        expect(screen.queryByText("old game event")).not.toBeInTheDocument();
    });

    test("shows no pager when the log fits on one page", () => {
        const callbacks = captureGameLogCallbacks();

        renderGameLog(111);
        act(() => {
            callbacks.get(111)?.(logEntries(25));
        });

        expect(screen.getByText("event 0")).toBeInTheDocument();
        expect(screen.getByText("event 24")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Next page" })).not.toBeInTheDocument();
        expect(screen.queryByText(/Page 1/)).not.toBeInTheDocument();
    });

    test("renders only the first page of a long log", () => {
        const callbacks = captureGameLogCallbacks();

        renderGameLog(111);
        act(() => {
            callbacks.get(111)?.(logEntries(60));
        });

        expect(screen.getByText("event 0")).toBeInTheDocument();
        expect(screen.getByText("event 24")).toBeInTheDocument();
        expect(screen.queryByText("event 25")).not.toBeInTheDocument();
        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
    });

    test("next and previous buttons move through pages", () => {
        const callbacks = captureGameLogCallbacks();

        renderGameLog(111);
        act(() => {
            callbacks.get(111)?.(logEntries(60));
        });

        fireEvent.click(screen.getByRole("button", { name: "Next page" }));

        expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();
        expect(screen.getByText("event 25")).toBeInTheDocument();
        expect(screen.getByText("event 49")).toBeInTheDocument();
        expect(screen.queryByText("event 24")).not.toBeInTheDocument();
        expect(screen.queryByText("event 50")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Previous page" }));

        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
        expect(screen.getByText("event 0")).toBeInTheDocument();
    });

    test("last and first buttons jump to the ends", () => {
        const callbacks = captureGameLogCallbacks();

        renderGameLog(111);
        act(() => {
            callbacks.get(111)?.(logEntries(60));
        });

        fireEvent.click(screen.getByRole("button", { name: "Last page" }));

        expect(screen.getByText("Page 3 of 3")).toBeInTheDocument();
        expect(screen.getByText("event 50")).toBeInTheDocument();
        expect(screen.getByText("event 59")).toBeInTheDocument();
        expect(screen.queryByText("event 49")).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "First page" }));

        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
        expect(screen.getByText("event 0")).toBeInTheDocument();
    });

    test("pager resets to the first page when game_id changes", () => {
        const callbacks = captureGameLogCallbacks();

        const { rerender } = renderGameLog(111);
        act(() => {
            callbacks.get(111)?.(logEntries(60));
        });
        fireEvent.click(screen.getByRole("button", { name: "Next page" }));
        expect(screen.getByText("Page 2 of 3")).toBeInTheDocument();

        rerender(
            <OgsHelpProvider>
                <GameLog goban_config={{ game_id: 222 } as GobanEngineConfig} />
            </OgsHelpProvider>,
        );
        act(() => {
            callbacks.get(222)?.(logEntries(60));
        });

        expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();
        expect(screen.getByText("event 0")).toBeInTheDocument();
    });
});
