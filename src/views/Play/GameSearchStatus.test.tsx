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
import { act, fireEvent, render, screen } from "@testing-library/react";
import { del } from "@/lib/requests";
import { automatch_manager, AutomatchPreferences } from "@/lib/automatch_manager";
import { Challenge } from "@/lib/challenge_utils";
import { GameSearchStatus } from "./GameSearchStatus";
import { active_challenges_emitter } from "./hooks";

jest.mock("@/lib/sockets", () => ({
    socket: { on: jest.fn(), off: jest.fn(), send: jest.fn() },
}));

jest.mock("@/lib/requests", () => ({
    del: jest.fn(() => Promise.resolve()),
}));

jest.mock("@/lib/automatch_manager", () => {
    const { EventEmitter } = jest.requireActual("eventemitter3");
    const manager = new EventEmitter();
    manager.active_correspondence_automatchers = {};
    manager.cancel = jest.fn();
    return { automatch_manager: manager };
});

type MockManager = typeof automatch_manager & { cancel: jest.Mock };
const manager = automatch_manager as MockManager;

function correspondenceRequest(uuid: string, timestamp: number): AutomatchPreferences {
    return {
        uuid,
        timestamp,
        size_speed_options: [
            { size: "19x19", speed: "correspondence", system: "fischer" },
            { size: "9x9", speed: "correspondence", system: "fischer" },
        ],
        lower_rank_diff: 2,
        upper_rank_diff: 3,
        rules: { condition: "required", value: "japanese" },
        handicap: { condition: "preferred", value: "enabled" },
    };
}

function liveChallenge(fields: Partial<Challenge>): Challenge {
    return {
        challenge_id: 123,
        time_per_move: 30,
        user_challenge: true,
        rengo: false,
        ...fields,
    } as Challenge;
}

beforeEach(() => {
    manager.active_correspondence_automatchers = {};
    manager.cancel.mockClear();
    (del as jest.Mock).mockClear();
});

describe("GameSearchStatus", () => {
    it("renders nothing when the player is not waiting for a game", () => {
        const { container } = render(<GameSearchStatus />);
        expect(container).toBeEmptyDOMElement();
    });

    it("shows the player's own live custom game and cancels it", () => {
        render(<GameSearchStatus />);

        act(() => {
            active_challenges_emitter.emit("challenges", { 123: liveChallenge({}) });
        });

        expect(
            screen.getByText("Waiting for an opponent to accept your custom game"),
        ).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(del).toHaveBeenCalledWith("challenges/123");

        act(() => {
            active_challenges_emitter.emit("clear");
        });
        expect(screen.queryByText(/Waiting for an opponent/)).not.toBeInTheDocument();
    });

    it("ignores other players' challenges and correspondence challenges", () => {
        const { container } = render(<GameSearchStatus />);

        act(() => {
            active_challenges_emitter.emit("challenges", {
                1: liveChallenge({ challenge_id: 1, user_challenge: false }),
                2: liveChallenge({ challenge_id: 2, time_per_move: 86400 }),
            });
        });

        expect(container).toBeEmptyDOMElement();
    });

    it("uses rengo wording for the player's own live rengo game", () => {
        render(<GameSearchStatus />);

        act(() => {
            active_challenges_emitter.emit("challenges", { 123: liveChallenge({ rengo: true }) });
        });

        expect(screen.getByText("Waiting for players to join your rengo game")).toBeInTheDocument();
    });

    it("shows correspondence requests that exist before it mounts", () => {
        manager.active_correspondence_automatchers = { a: correspondenceRequest("a", 1) };

        render(<GameSearchStatus />);

        expect(screen.getByText("Searching for a correspondence game")).toBeInTheDocument();
        expect(screen.getByText(/19x19, 9x9 .* Opponent rank: -2 to \+3/)).toBeInTheDocument();
    });

    it("follows automatch events and cancels a correspondence request", () => {
        const { container } = render(<GameSearchStatus />);
        expect(container).toBeEmptyDOMElement();

        act(() => {
            manager.active_correspondence_automatchers = {
                b: correspondenceRequest("b", 2),
                a: correspondenceRequest("a", 1),
            };
            manager.emit("entry", correspondenceRequest("b", 2));
        });

        expect(screen.getByText("Searching for correspondence games")).toBeInTheDocument();
        const cancel_buttons = screen.getAllByRole("button", { name: "Cancel" });
        expect(cancel_buttons).toHaveLength(2);

        fireEvent.click(cancel_buttons[0]);
        expect(manager.cancel).toHaveBeenCalledWith("a");

        act(() => {
            manager.active_correspondence_automatchers = {};
            manager.emit("cancel", { uuid: "a" });
        });
        expect(container).toBeEmptyDOMElement();
    });
});
