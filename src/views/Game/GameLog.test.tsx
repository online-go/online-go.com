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
import { act, cleanup, render, screen } from "@testing-library/react";
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
});
