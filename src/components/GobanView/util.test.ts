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

import { Goban } from "goban";
import { user_color } from "./util";

function fakeGoban(opts: {
    black_id: number;
    white_id: number;
    rengo?: boolean;
    rengo_teams?: { black: Array<{ id: number }>; white: Array<{ id: number }> };
}): Goban {
    const engine = {
        playerColor: (id: number): "black" | "white" | "invalid" =>
            id === opts.black_id ? "black" : id === opts.white_id ? "white" : "invalid",
        rengo: opts.rengo ?? false,
        rengo_teams: opts.rengo_teams,
    };
    return { engine } as unknown as Goban;
}

describe("user_color", () => {
    test("returns the seat color for a player", () => {
        const goban = fakeGoban({ black_id: 1, white_id: 2 });
        expect(user_color(goban, 1)).toBe("black");
        expect(user_color(goban, 2)).toBe("white");
    });

    test("returns null for a spectator", () => {
        const goban = fakeGoban({ black_id: 1, white_id: 2 });
        expect(user_color(goban, 99)).toBeNull();
    });

    test("finds rengo team members", () => {
        const goban = fakeGoban({
            black_id: 1,
            white_id: 2,
            rengo: true,
            rengo_teams: { black: [{ id: 1 }, { id: 5 }], white: [{ id: 2 }, { id: 6 }] },
        });
        expect(user_color(goban, 6)).toBe("white");
    });
});

import {
    boardAlignmentClass,
    GobanViewBoardAlignment,
    selectVisibleTabs,
    stageFitsWithSlider,
    TabBarSlot,
} from "./util";

interface Tab extends TabBarSlot {
    id: string;
}

const BUTTON = 40;
const GAP = 8;

const settings: Tab = { id: "settings", align: "left" };
const analyze: Tab = { id: "analyze", align: "left" };
const estimate: Tab = { id: "estimate", align: "left", priority: 3 };
const undo: Tab = { id: "undo", align: "center" };
const link: Tab = { id: "link", align: "right", priority: 2 };
const info: Tab = { id: "info", align: "right", priority: 1 };
const more: Tab = { id: "more", align: "right" };

const tabs = [settings, analyze, estimate, undo, link, info, more];

/** Width of `n` buttons in one group. */
const group = (n: number) => n * BUTTON + (n - 1) * GAP;

const ids = (result: Tab[]) => result.map((t) => t.id);

describe("selectVisibleTabs", () => {
    test("shows every tab when the bar cannot be measured", () => {
        expect(ids(selectVisibleTabs(tabs, 0, 0, GAP))).toEqual(ids(tabs));
    });

    test("always shows the required tabs, even with no room", () => {
        expect(ids(selectVisibleTabs(tabs, 0, BUTTON, GAP))).toEqual([
            "settings",
            "analyze",
            "undo",
            "more",
        ]);
    });

    test("shows all tabs when everything fits", () => {
        const width = group(3) + group(1) + group(3);
        expect(ids(selectVisibleTabs(tabs, width, BUTTON, GAP))).toEqual(ids(tabs));
    });

    test("drops the lowest priority tab first", () => {
        const width = group(3) + group(1) + group(3) - 1;
        expect(ids(selectVisibleTabs(tabs, width, BUTTON, GAP))).toEqual([
            "settings",
            "analyze",
            "estimate",
            "undo",
            "link",
            "more",
        ]);
    });

    test("keeps the highest priority tab when only one fits", () => {
        const width = group(3) + group(1) + group(1);
        expect(ids(selectVisibleTabs(tabs, width, BUTTON, GAP))).toEqual([
            "settings",
            "analyze",
            "estimate",
            "undo",
            "more",
        ]);
    });

    test("keeps the order of the input", () => {
        const reordered = [info, more, link, settings, estimate, analyze, undo];
        const width = group(3) + group(1) + group(3);
        expect(ids(selectVisibleTabs(reordered, width, BUTTON, GAP))).toEqual(ids(reordered));
    });
});

describe("boardAlignmentClass", () => {
    test("maps each alignment to its root class", () => {
        expect(boardAlignmentClass("window")).toBe("board-align-window");
        expect(boardAlignmentClass("container")).toBe("board-align-container");
        expect(boardAlignmentClass("group")).toBe("board-align-group");
    });

    test("falls back to container centering for unknown stored values", () => {
        expect(boardAlignmentClass("bogus" as GobanViewBoardAlignment)).toBe(
            "board-align-container",
        );
        expect(boardAlignmentClass(undefined as unknown as GobanViewBoardAlignment)).toBe(
            "board-align-container",
        );
    });
});

describe("stageFitsWithSlider", () => {
    test("fits when the slots, the full board and the slider all have room", () => {
        expect(stageFitsWithSlider({ available: 700, slider: 36, slots: 264, board: 400 })).toBe(
            true,
        );
    });

    test("does not fit when the slider would make the board shrink", () => {
        expect(stageFitsWithSlider({ available: 699, slider: 36, slots: 264, board: 400 })).toBe(
            false,
        );
    });
});
