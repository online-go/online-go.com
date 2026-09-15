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
import * as DynamicHelp from "react-dynamic-help";
import * as data from "@/lib/data";
import { GobanControllerContext } from "./goban_context";
import { GobanController } from "../../lib/GobanController";
import { GameStateHeader } from "./GameStateHeader";

const LOGGED_IN_USER = {
    anonymous: false,
    id: 123,
    username: "test_user",
    // Registered after the undo help flows were introduced, so the flows fire.
    registration_date: "2024-05-10 11:03:24.299562+00:00",
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

type Seat = { id: number; username: string };
const OPPONENT: Seat = { id: 456, username: "test_user2" };
const ME: Seat = { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username };

beforeEach(() => {
    data.set("user", LOGGED_IN_USER);
});

afterEach(() => {
    data.remove("user");
    cleanup();
});

/** A help API double that records which flow the header triggers. */
function helpApi(triggerFlow: jest.Mock): DynamicHelp.AppApi {
    return {
        registerTargetItem: () => ({ ref: () => {}, active: () => true, used: () => {} }),
        triggerFlow,
        signalUsed: () => {},
    } as unknown as DynamicHelp.AppApi;
}

function renderHeader(controller: GobanController, triggerFlow: jest.Mock) {
    return render(
        <DynamicHelp.Api.Provider value={helpApi(triggerFlow)}>
            <GobanControllerContext.Provider value={controller}>
                <GameStateHeader />
            </GobanControllerContext.Provider>
        </DynamicHelp.Api.Provider>,
    );
}

/** Six moves played, black to move. */
function sixMoveGame(players: { black: Seat; white: Seat }) {
    return new GobanController({
        moves: [
            [16, 3, 9136.12], // B
            [3, 2, 1897.853], // W
            [15, 16, 4274.0], // B
            [14, 2, 3816], // W
            [3, 15, 2210], // B
            [16, 16, 1980], // W went last
        ],
        players,
    });
}

function requestUndo(controller: GobanController, requested_by: number) {
    act(() => {
        controller.goban.engine.undo_requested_by = requested_by;
        controller.goban.engine.undo_requested = controller.goban.engine.cur_move.move_number;
        controller.goban.emit("undo_requested", controller.goban.engine.undo_requested);
    });
}

describe("GameStateHeader undo help flows", () => {
    test("the requester sees the 'requested' flow even when it is their turn", () => {
        // Two-move undo: I am black, to move, and ask to take back moves 5 and 6.
        const controller = sixMoveGame({ black: ME, white: OPPONENT });
        const triggerFlow = jest.fn();
        renderHeader(controller, triggerFlow);

        requestUndo(controller, ME.id);

        expect(screen.getByText("test_user has requested an undo")).toBeDefined();
        expect(triggerFlow).toHaveBeenCalledWith("undo-requested-intro");
        expect(triggerFlow).not.toHaveBeenCalledWith("undo-request-received-intro");
    });

    test("the player who can answer sees the 'received' flow even when it is not their turn", () => {
        // The same two-move undo from the other seat: I am white, not to move,
        // and black asks to take back moves 5 and 6. I have to answer.
        const controller = sixMoveGame({ black: OPPONENT, white: ME });
        const triggerFlow = jest.fn();
        renderHeader(controller, triggerFlow);

        requestUndo(controller, OPPONENT.id);

        expect(screen.getByText("test_user2 has requested an undo")).toBeDefined();
        expect(triggerFlow).toHaveBeenCalledWith("undo-request-received-intro");
        expect(triggerFlow).not.toHaveBeenCalledWith("undo-requested-intro");
    });

    test("a request that is already pending when the header mounts triggers only the 'received' flow", () => {
        const controller = sixMoveGame({ black: ME, white: OPPONENT });
        controller.goban.engine.undo_requested_by = OPPONENT.id;
        controller.goban.engine.undo_requested = controller.goban.engine.cur_move.move_number;
        const triggerFlow = jest.fn();
        renderHeader(controller, triggerFlow);

        expect(triggerFlow.mock.calls.map(([flow]) => flow)).toEqual([
            "undo-request-received-intro",
        ]);
    });

    test("one-move undo: the opponent who just moved gets the 'received' flow on their own turn", () => {
        const controller = new GobanController({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B went last, white to move
            ],
            players: { black: OPPONENT, white: ME },
        });
        const triggerFlow = jest.fn();
        renderHeader(controller, triggerFlow);

        requestUndo(controller, OPPONENT.id);

        expect(triggerFlow).toHaveBeenCalledWith("undo-request-received-intro");
        expect(triggerFlow).not.toHaveBeenCalledWith("undo-requested-intro");
    });
});
