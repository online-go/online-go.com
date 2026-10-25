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

/* Each presenter of the game actions (tab bar, "..." menu, dock / mobile
 * list) has its own order. These tests pin the exact sequence of each
 * presenter for representative states. */

import { render, renderHook } from "@testing-library/react";
import * as React from "react";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import { GameAction } from "./GameAction";
import { GameActionList } from "./GameActionList";
import { GameActionsPanel } from "./GameActionsPanel";
import { sortBarActions } from "./gameActionTab";
import { GameActionsArgs, useGameActions } from "./useGameActions";
import { TEST_USER } from "./test_user";

const ME = { id: TEST_USER.id, username: TEST_USER.username };
const OPPONENT = { id: 456, username: "test_user2" };
const OTHER = { id: 789, username: "test_user3" };

const MOVES: [number, number, number][] = [
    [16, 3, 9136.12],
    [3, 2, 1897.853],
    [15, 16, 4274.0],
    [14, 2, 3816],
];

type State =
    | "player"
    | "player-waiting"
    | "player-finished"
    | "player-waiting-analysis-disabled"
    | "spectator"
    | "spectator-finished"
    | "mobile"
    | "mobile-analysis-disabled";

function stateArgs(state: State): GameActionsArgs {
    const base: GameActionsArgs = {
        controller: null,
        is_mobile: false,
        historical_black: null,
        historical_white: null,
        estimating_score: false,
        settings: { open: false, onClick: () => undefined },
        chat: { enabled: true, visible: false, unread: false, toggle: () => undefined },
        moderator: { visible: false, onToggle: () => undefined },
    };
    switch (state) {
        case "player":
            // Four moves played, white went last, so it is my (black) turn.
            return {
                ...base,
                tournament_id: 5,
                tournament_name: "Cup",
                controller: new GobanController({
                    game_id: 456789,
                    moves: MOVES,
                    players: { black: ME, white: OPPONENT },
                }),
            };
        case "player-waiting":
            // I am white and black is to move, so it is the opponent's turn
            // and Plan conditional moves is offered. No tournament.
            return {
                ...base,
                controller: new GobanController({
                    game_id: 456790,
                    moves: MOVES,
                    players: { black: OPPONENT, white: ME },
                }),
            };
        case "player-finished":
            // I am black and the game is over.
            return {
                ...base,
                controller: new GobanController({
                    game_id: 456791,
                    phase: "finished",
                    moves: MOVES,
                    players: { black: ME, white: OPPONENT },
                }),
            };
        case "player-waiting-analysis-disabled":
            // Same as "player-waiting" (opponent's turn), but analysis is
            // off for this game.
            return {
                ...base,
                controller: new GobanController({
                    game_id: 456792,
                    disable_analysis: true,
                    moves: MOVES,
                    players: { black: OPPONENT, white: ME },
                }),
            };
        case "spectator":
            return {
                ...base,
                controller: new GobanController({
                    game_id: 3456,
                    moves: MOVES,
                    players: { black: OPPONENT, white: OTHER },
                }),
            };
        case "spectator-finished":
            return {
                ...base,
                controller: new GobanController({
                    game_id: 1234,
                    phase: "finished",
                    black_player_id: OPPONENT.id,
                    white_player_id: OTHER.id,
                    moves: MOVES,
                    players: { black: OPPONENT, white: OTHER },
                }),
            };
        case "mobile":
            return {
                ...base,
                is_mobile: true,
                controller: new GobanController({
                    game_id: 2345,
                    moves: MOVES,
                    players: { black: OPPONENT, white: OTHER },
                }),
            };
        case "mobile-analysis-disabled":
            return {
                ...base,
                is_mobile: true,
                controller: new GobanController({
                    game_id: 2346,
                    disable_analysis: true,
                    moves: MOVES,
                    players: { black: OPPONENT, white: OTHER },
                }),
            };
    }
}

function actionsFor(state: State): GameAction[] {
    const args = stateArgs(state);
    return renderHook(() => useGameActions(args)).result.current;
}

beforeEach(() => data.set("user", TEST_USER));

describe("tab bar order", () => {
    test.each<[State, string[]]>([
        [
            "player",
            ["game-settings", "game-analyze", "game-estimate-score", "game-link", "game-info"],
        ],
        [
            "spectator-finished",
            [
                "game-settings",
                "game-analyze",
                "game-estimate-score",
                "game-review",
                "game-link",
                "game-info",
            ],
        ],
        [
            "mobile",
            [
                "game-settings",
                "game-analyze",
                "game-estimate-score",
                "game-chat-toggle",
                "game-review",
                "game-link",
                "game-info",
            ],
        ],
    ])("%s", (state, expected) => {
        expect(sortBarActions(actionsFor(state)).map((a) => a.id)).toEqual(expected);
    });
});

describe('"..." menu order', () => {
    test.each<[State, string[]]>([
        [
            "player",
            [
                "game-analyze",
                "game-pause",
                "hr",
                "game-tournament",
                "game-undo",
                "game-resign",
                "hr",
                "game-info",
                "game-estimate-score",
                "game-fork",
                "game-call-moderator",
                "game-link",
                "game-download-sgf",
                "game-add-to-library",
            ],
        ],
        [
            "player-waiting",
            [
                "game-analyze",
                "game-conditional",
                "game-pause",
                "hr",
                "game-undo",
                "game-resign",
                "hr",
                "game-info",
                "game-estimate-score",
                "game-fork",
                "game-call-moderator",
                "game-link",
                "game-download-sgf",
                "game-add-to-library",
            ],
        ],
        [
            "spectator-finished",
            [
                "game-analyze",
                "game-review",
                "hr",
                "game-info",
                "game-estimate-score",
                "game-fork",
                "game-call-moderator",
                "game-link",
                "game-download-sgf",
                "game-add-to-library",
            ],
        ],
        [
            "mobile",
            [
                "game-analyze",
                "game-chat-toggle",
                "game-review",
                "hr",
                "game-info",
                "game-estimate-score",
                "game-fork",
                "game-call-moderator",
                "game-link",
                "game-download-sgf",
                "game-add-to-library",
            ],
        ],
    ])("%s", (state, expected) => {
        const { container } = render(<GameActionsPanel actions={actionsFor(state)} />);
        const children = Array.from(container.querySelectorAll(".GameActionsPanel > *"));
        expect(
            children.map((c) => (c.tagName === "HR" ? "hr" : c.getAttribute("data-action-id"))),
        ).toEqual(expected);
    });
});

describe("dock and mobile list order", () => {
    test.each<[State, string[]]>([
        [
            "player",
            [
                "game-tournament",
                "game-zen",
                "game-info",
                "game-analyze",
                // It's the player's own turn (see the "player" state comment
                // above), so these two are listed but disabled: neither is
                // usable, so the tab bar and "..." menu leave them out (see
                // the "tab bar order" and '"..." menu order' tests above).
                "game-conditional",
                "game-pause",
                "game-review",
                "game-estimate-score",
                "game-fork",
                "game-call-moderator",
                "game-link",
                "game-download-sgf",
                "game-add-to-library",
                "game-undo",
                "game-settings",
            ],
        ],
        [
            "spectator-finished",
            [
                "game-zen",
                "game-info",
                "game-analyze",
                "game-review",
                "game-estimate-score",
                "game-fork",
                "game-call-moderator",
                "game-link",
                "game-download-sgf",
                "game-add-to-library",
                "game-settings",
            ],
        ],
    ])("%s", (state, expected) => {
        expect(listOrder(state)).toEqual(expected);
    });

    test.each<State>(["mobile", "mobile-analysis-disabled"])(
        "the %s list has neither Chat nor Previous move",
        (state) => {
            const ids = actionsFor(state).map((a) => a.id);
            expect(ids).toContain(state === "mobile" ? "game-chat-toggle" : "game-step-back");
            expect(listOrder(state)).not.toContain("game-chat-toggle");
            expect(listOrder(state)).not.toContain("game-step-back");
        },
    );
});

/* "Plan conditional moves" and "Review this game" are in the dock and the
 * mobile list, disabled, before they are usable. The tab bar and the "..."
 * menu show them only when they are usable (see `GameAction.bar`). */
describe("dock/list: Plan conditional moves and Review this game", () => {
    function findAction(state: State, id: string): GameAction | undefined {
        return actionsFor(state).find((a) => a.id === id);
    }

    /** Not in the tab bar or the "..." menu (`bar: null`, no `menuOrder`),
     *  which is how those two presenters read "not usable" (see the doc
     *  comment on `GameAction.bar`). */
    function expectHiddenFromBarAndMenu(action: GameAction | undefined): void {
        expect(action?.bar).toBeNull();
        expect(action?.menuOrder).toBeUndefined();
    }

    test("a player during their own turn: conditional listed and disabled, review listed and disabled", () => {
        const conditional = findAction("player", "game-conditional");
        expect(conditional?.dockOrder).toBeDefined();
        expect(conditional?.disabled).toBe(true);
        expectHiddenFromBarAndMenu(conditional);

        const review = findAction("player", "game-review");
        expect(review?.dockOrder).toBeDefined();
        expect(review?.disabled).toBe(true);
        expectHiddenFromBarAndMenu(review);
    });

    test("the actual dock row renders disabled, not omitted, during the player's own turn", () => {
        const { container } = render(<GameActionList actions={actionsFor("player")} />);
        const row = container.querySelector('[data-action-id="game-conditional"]');
        expect(row).not.toBeNull();
        expect(row).toHaveClass("disabled");
        expect(row).toBeDisabled();
    });

    test("the opponent's turn: conditional is listed and enabled", () => {
        const conditional = findAction("player-waiting", "game-conditional");
        expect(conditional?.dockOrder).toBeDefined();
        expect(conditional?.disabled).toBe(false);
        // Usable now, so the tab bar and "..." menu carry it too.
        expect(conditional?.bar).not.toBeNull();
        expect(conditional?.menuOrder).toBeDefined();
    });

    test("a finished game: review is enabled for a signed-in user, disabled for an anonymous one, and conditional is absent", () => {
        expect(findAction("player-finished", "game-conditional")).toBeUndefined();

        const review = findAction("player-finished", "game-review");
        expect(review?.dockOrder).toBeDefined();
        expect(review?.disabled).toBe(false);

        data.set("user", { ...TEST_USER, anonymous: true, id: 0 });
        const anon_review = findAction("player-finished", "game-review");
        expect(anon_review?.dockOrder).toBeDefined();
        expect(anon_review?.disabled).toBe(true);
        expectHiddenFromBarAndMenu(anon_review);
    });

    test("a spectator: review is enabled and conditional is absent", () => {
        expect(findAction("spectator", "game-conditional")).toBeUndefined();
        const review = findAction("spectator", "game-review");
        expect(review?.dockOrder).toBeDefined();
        expect(review?.disabled).toBe(false);
    });

    test("analysis disabled: both conditional and review are disabled", () => {
        // It is the opponent's turn, so conditional is also in the tab bar
        // and the "..." menu, disabled because analysis is off.
        const conditional = findAction("player-waiting-analysis-disabled", "game-conditional");
        expect(conditional?.dockOrder).toBeDefined();
        expect(conditional?.disabled).toBe(true);

        // The player is still mid-game, so review is hidden from the tab
        // bar and "..." menu for that reason as well as analysis being off.
        const review = findAction("player-waiting-analysis-disabled", "game-review");
        expect(review?.dockOrder).toBeDefined();
        expect(review?.disabled).toBe(true);
        expectHiddenFromBarAndMenu(review);
    });
});

function listOrder(state: State): (string | null)[] {
    const { container } = render(
        <div data-testid="host">
            <GameActionList actions={actionsFor(state)} />
        </div>,
    );
    const rows = Array.from(container.querySelectorAll("[data-testid=host] > *"));
    return rows.map((r) => r.getAttribute("data-action-id"));
}
