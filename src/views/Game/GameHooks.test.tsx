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
import * as data from "@/lib/data";
import { GobanControllerContext } from "./goban_context";
import { GobanController } from "../../lib/GobanController";
import {
    useCanRequestUndo,
    usePlayerToMoveOnOfficialBranch,
    useResignMode,
    useUndoRequestIsMine,
} from "./GameHooks";

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

const OPPONENT = { id: 456, username: "test_user2" };
const ME = { id: LOGGED_IN_USER.id, username: LOGGED_IN_USER.username };

beforeEach(() => {
    data.set("user", LOGGED_IN_USER);
});

afterEach(() => {
    data.remove("user");
    cleanup();
});

/** Renders the state of the two action-bar hooks so tests can read it. */
function Probe({ controller }: { controller: GobanController }): React.ReactElement {
    const can_request_undo = useCanRequestUndo(controller.goban);
    const undo_request_is_mine = useUndoRequestIsMine(controller.goban);
    const resign_mode = useResignMode(controller.goban);
    const official_player_to_move = usePlayerToMoveOnOfficialBranch(controller.goban);
    return (
        <div>
            <span data-testid="official-player-to-move">{official_player_to_move}</span>
            <span data-testid="can-request-undo">{can_request_undo ? "yes" : "no"}</span>
            <span data-testid="undo-request-is-mine">{undo_request_is_mine ? "yes" : "no"}</span>
            <span data-testid="resign-mode">{resign_mode}</span>
        </div>
    );
}

function renderProbe(controller: GobanController) {
    return render(
        <GobanControllerContext.Provider value={controller}>
            <Probe controller={controller} />
        </GobanControllerContext.Provider>,
    );
}

const canRequestUndo = () => screen.getByTestId("can-request-undo").textContent === "yes";
const undoRequestIsMine = () => screen.getByTestId("undo-request-is-mine").textContent === "yes";
const resignMode = () => screen.getByTestId("resign-mode").textContent;
const officialPlayerToMove = () =>
    parseInt(screen.getByTestId("official-player-to-move").textContent ?? "", 10);

describe("useResignMode", () => {
    test("is 'cancel' in the first 6 moves", () => {
        renderProbe(
            new GobanController({
                moves: [
                    [16, 3, 9136],
                    [3, 2, 18978.5],
                    [15, 16, 4274.5],
                ],
                players: { black: ME, white: OPPONENT },
            }),
        );

        expect(resignMode()).toBe("cancel");
    });

    test("is 'resign' after 6 moves", () => {
        renderProbe(
            new GobanController({
                moves: [
                    [16, 3, 9136],
                    [3, 2, 18978.5],
                    [15, 16, 4274.5],
                    [14, 2, 3816],
                    [2, 15, 6869],
                    [16, 14, 6241.5],
                    [15, 4, 4485],
                ],
                players: { black: ME, white: OPPONENT },
            }),
        );

        expect(resignMode()).toBe("resign");
    });

    test("changes to 'resign' on the 6th move", () => {
        const controller = new GobanController({
            // 5 moves
            moves: [
                [16, 3, 9136.12],
                [3, 2, 1897.853],
                [15, 16, 4274.0],
                [14, 2, 3816],
                [2, 15, 6869],
            ],
            players: { black: ME, white: OPPONENT },
        });
        renderProbe(controller);

        expect(resignMode()).toBe("cancel");

        act(() => {
            controller.goban.engine.place(10, 10);
        });

        expect(resignMode()).toBe("resign");
    });
});

describe("useCanRequestUndo", () => {
    test("true when the opponent just moved", () => {
        renderProbe(
            new GobanController({
                moves: [
                    [16, 3, 9136.12], // B
                    [3, 2, 1897.853], // W
                    [15, 16, 4274.0], // Black went last
                ],
                players: { black: ME, white: OPPONENT },
            }),
        );

        expect(canRequestUndo()).toBe(true);
    });

    test("true when it is my turn", () => {
        renderProbe(
            new GobanController({
                moves: [
                    [16, 3, 9136.12], // B
                    [3, 2, 1897.853], // W
                    [15, 16, 4274.0], // B
                    [14, 2, 3816], // White went last
                ],
                players: { black: ME, white: OPPONENT },
            }),
        );

        expect(canRequestUndo()).toBe(true);
    });

    test("false on the first move", () => {
        renderProbe(
            new GobanController({
                players: { black: ME, white: OPPONENT },
            }),
        );

        expect(canRequestUndo()).toBe(false);
    });

    test("false in rengo", () => {
        renderProbe(
            new GobanController({
                moves: [
                    [16, 3, 9136.12], // B
                    [3, 2, 1897.853], // W
                    [15, 16, 4274.0], // Black went last
                ],
                players: { black: ME, white: OPPONENT },
                rengo: true,
            }),
        );

        expect(canRequestUndo()).toBe(false);
    });

    test("false for a spectator", () => {
        renderProbe(
            new GobanController({
                moves: [
                    [16, 3, 9136.12], // B
                    [3, 2, 1897.853], // W
                    [15, 16, 4274.0], // Black went last
                ],
                players: { black: { id: 987, username: "someone" }, white: OPPONENT },
            }),
        );

        expect(canRequestUndo()).toBe(false);
    });

    test("false while analyzing an earlier position", () => {
        const controller = new GobanController({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // Black went last
            ],
            players: { black: ME, white: OPPONENT },
        });
        renderProbe(controller);

        expect(canRequestUndo()).toBe(true);

        act(() => {
            controller.goban.engine.showPrevious();
            controller.goban.engine.showPrevious();
        });

        expect(canRequestUndo()).toBe(false);
    });

    test("false once an undo is already requested", () => {
        const controller = new GobanController({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B
                [14, 2, 3816], // White went last
            ],
            players: { black: ME, white: OPPONENT },
        });
        renderProbe(controller);

        expect(canRequestUndo()).toBe(true);

        act(() => {
            controller.goban.engine.undo_requested_by = OPPONENT.id;
            controller.goban.engine.undo_requested = 4;
        });

        expect(canRequestUndo()).toBe(false);
    });
});

describe("useUndoRequestIsMine", () => {
    function fourMoveGame() {
        return new GobanController({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // B
                [14, 2, 3816], // White went last
            ],
            players: { black: ME, white: OPPONENT },
        });
    }

    test("false when no undo is pending", () => {
        renderProbe(fourMoveGame());

        expect(undoRequestIsMine()).toBe(false);
    });

    test("true once I request an undo, and false again after I withdraw it", () => {
        const controller = fourMoveGame();
        renderProbe(controller);

        act(() => {
            controller.goban.engine.undo_requested_by = ME.id;
            controller.goban.engine.undo_requested = 4;
        });

        expect(undoRequestIsMine()).toBe(true);
        // The button is the toggle, so requesting must not also leave the
        // "request undo" action available.
        expect(canRequestUndo()).toBe(false);

        act(() => {
            controller.goban.engine.undo_requested_by = undefined;
            controller.goban.engine.undo_requested = undefined;
        });

        expect(undoRequestIsMine()).toBe(false);
        expect(canRequestUndo()).toBe(true);
    });

    test("false when the opponent requested the undo", () => {
        const controller = fourMoveGame();
        renderProbe(controller);

        act(() => {
            controller.goban.engine.undo_requested_by = OPPONENT.id;
            controller.goban.engine.undo_requested = 4;
        });

        expect(undoRequestIsMine()).toBe(false);
    });
});

describe("usePlayerToMoveOnOfficialBranch", () => {
    test("stays on the live player while viewing an earlier move", () => {
        const controller = new GobanController({
            moves: [
                [16, 3, 9136.12], // B
                [3, 2, 1897.853], // W
                [15, 16, 4274.0], // Black went last
            ],
            players: { black: ME, white: OPPONENT },
        });
        renderProbe(controller);

        expect(officialPlayerToMove()).toBe(OPPONENT.id);

        act(() => {
            controller.goban.engine.showPrevious();
        });

        expect(officialPlayerToMove()).toBe(OPPONENT.id);

        act(() => {
            controller.goban.engine.showPrevious();
        });

        expect(officialPlayerToMove()).toBe(OPPONENT.id);
    });
});
