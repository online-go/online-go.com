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

import { act, renderHook } from "@testing-library/react";
import * as data from "@/lib/data";
import { GobanController } from "@/lib/GobanController";
import type { GameButtonAction } from "./GameAction";
import { GameActionsArgs, useGameActions } from "./useGameActions";
import { TEST_USER } from "./test_user";

function args(
    controller: GobanController,
    overrides: Partial<GameActionsArgs> = {},
): GameActionsArgs {
    return {
        controller,
        is_mobile: false,
        historical_black: null,
        historical_white: null,
        estimating_score: false,
        settings: { open: false, onClick: jest.fn() },
        chat: { enabled: true, visible: false, unread: false, toggle: jest.fn() },
        moderator: { visible: true, onToggle: jest.fn() },
        ...overrides,
    };
}

function ids(controller: GobanController, overrides: Partial<GameActionsArgs> = {}) {
    const { result } = renderHook(() => useGameActions(args(controller, overrides)));
    return result.current;
}

beforeEach(() => data.set("user", TEST_USER));

test("no controller means no actions", () => {
    const { result } = renderHook(() =>
        useGameActions({ ...args(new GobanController({ game_id: 1 })), controller: null }),
    );
    expect(result.current).toEqual([]);
});

test("settings, moderator and zen mode are not in the menu", () => {
    data.set("user", { ...TEST_USER, is_moderator: true });
    const menu = ids(new GobanController({ game_id: 123456 })).filter(
        (a) => a.menuOrder !== undefined,
    );
    expect(menu.map((a) => a.id)).not.toContain("game-settings");
    expect(menu.map((a) => a.id)).not.toContain("game-moderator");
    expect(menu.map((a) => a.id)).not.toContain("game-zen");
});

test("every action is defined once", () => {
    const all = ids(new GobanController({ game_id: 123456 }));
    expect(new Set(all.map((a) => a.id)).size).toBe(all.length);
});

test("chat is mobile only", () => {
    const controller = new GobanController({ game_id: 123456 });
    expect(ids(controller).map((a) => a.id)).not.toContain("game-chat-toggle");
    expect(ids(controller, { is_mobile: true }).map((a) => a.id)).toContain("game-chat-toggle");
});

test("the moderator toggle needs moderator rights", () => {
    const controller = new GobanController({ game_id: 123456 });
    expect(ids(controller).map((a) => a.id)).not.toContain("game-moderator");
    data.set("user", { ...TEST_USER, is_moderator: true });
    const mod = ids(controller).find((a) => a.id === "game-moderator");
    expect(mod?.kind).toBe("toggle");
    expect(mod?.menuOrder).toBeUndefined();
    expect(mod?.dockOrder).toBeDefined();
});

test("every row has a label, so a dock icon always has a name", () => {
    for (const action of ids(new GobanController({ game_id: 123456 }), { is_mobile: true })) {
        expect(action.label.length).toBeGreaterThan(0);
    }
});

test("a review page has no analyze, step-back or review action, but links the original game", () => {
    const controller = new GobanController({ game_id: 123456, review_id: 123 });
    const desktop = ids(controller).map((a) => a.id);
    const mobile = ids(controller, { is_mobile: true }).map((a) => a.id);
    for (const list of [desktop, mobile]) {
        expect(list).not.toContain("game-analyze");
        expect(list).not.toContain("game-step-back");
        expect(list).not.toContain("game-review");
        expect(list).toContain("game-original");
    }
});

test("a player in the play phase can request an undo from the dock, but not resign", () => {
    const me = { id: TEST_USER.id, username: TEST_USER.username };
    const controller = new GobanController({
        game_id: 456789,
        moves: [
            [16, 3, 9136.12],
            [3, 2, 1897.853],
            [15, 16, 4274.0],
            [14, 2, 3816],
        ],
        players: { black: me, white: { id: 456, username: "test_user2" } },
    });
    const all = ids(controller, { tournament_id: 5 });
    const dock = all.filter((a) => a.dockOrder !== undefined).map((a) => a.id);
    expect(dock).toContain("game-undo");
    expect(dock).not.toContain("game-resign");
    expect(all.filter((a) => a.menuSection === "play").map((a) => a.id)).toEqual([
        "game-undo",
        "game-resign",
    ]);
});

test("the zen mode row toggles zen mode", () => {
    const controller = new GobanController({ game_id: 123456 });
    const zen = ids(controller).find(
        (a): a is GameButtonAction => a.id === "game-zen" && a.kind === "action",
    );
    expect(zen?.label).toBe("Zen mode");
    expect(zen?.dockOrder).toBeDefined();
    expect(zen?.menuOrder).toBeUndefined();
    act(() => zen?.onClick?.());
    expect(controller.zen_mode).toBe(true);
    act(() => zen?.onClick?.());
    expect(controller.zen_mode).toBe(false);
});
