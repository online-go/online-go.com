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

import { MoveTree } from "goban";
import { applyMoveTreeLineColors, moveTreeLineColorsFor } from "./move_tree_line_colors";
import { redrawMoveTrees, registerMoveTreeBoard } from "./move_tree_boards";

afterEach(() => {
    applyMoveTreeLineColors("dark");
});

test("the light theme gets the light set, and every other theme the dark one", () => {
    expect(moveTreeLineColorsFor("light")).toBe(MoveTree.LINE_COLORS_LIGHT);
    expect(moveTreeLineColorsFor("dark")).toBe(MoveTree.LINE_COLORS_DARK);
    // Accessible is built on the dark theme, so it reads on a dark ground.
    expect(moveTreeLineColorsFor("accessible")).toBe(MoveTree.LINE_COLORS_DARK);
});

test("both sets hold the same slots, so a branch keeps its colour family", () => {
    expect(MoveTree.LINE_COLORS_LIGHT).toHaveLength(MoveTree.LINE_COLORS_DARK.length);
});

test("applying a theme puts its palette in front of the renderers", () => {
    applyMoveTreeLineColors("light");
    expect(MoveTree.line_colors).toEqual([...MoveTree.LINE_COLORS_LIGHT]);
    applyMoveTreeLineColors("dark");
    expect(MoveTree.line_colors).toEqual([...MoveTree.LINE_COLORS_DARK]);
});

test("boards on screen are repainted when the palette changes, and only then", () => {
    const board = { move_tree_redraw: jest.fn() };
    const unregister = registerMoveTreeBoard(board);

    applyMoveTreeLineColors("light");
    expect(board.move_tree_redraw).toHaveBeenCalledTimes(1);

    // The same theme again is not a change.
    applyMoveTreeLineColors("light");
    expect(board.move_tree_redraw).toHaveBeenCalledTimes(1);

    unregister();
    applyMoveTreeLineColors("dark");
    expect(board.move_tree_redraw).toHaveBeenCalledTimes(1);
});

test("a board that throws mid-teardown does not stop the others repainting", () => {
    const broken = {
        move_tree_redraw: jest.fn(() => {
            throw new Error("torn down");
        }),
    };
    const working = { move_tree_redraw: jest.fn() };
    const unregisterBroken = registerMoveTreeBoard(broken);
    const unregisterWorking = registerMoveTreeBoard(working);

    redrawMoveTrees();
    expect(working.move_tree_redraw).toHaveBeenCalledTimes(1);

    unregisterBroken();
    unregisterWorking();
});
