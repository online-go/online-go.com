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

import {
    actionButtonsOptions,
    boardAlignmentOptions,
    chatColumnOptions,
    mobileScrollOptions,
    moveControlsOptions,
} from "./options";

describe("layout setting option lists", () => {
    test("the chat column offers the left column (on) and the side panel (off)", () => {
        expect(chatColumnOptions().map((o) => o.value)).toEqual([true, false]);
        expect(chatColumnOptions().map((o) => o.label)).toEqual([
            "Left column",
            "In the side panel",
        ]);
    });

    test("the scrolling layout offers fits the screen (off) and scrolls (on)", () => {
        expect(mobileScrollOptions().map((o) => o.value)).toEqual([false, true]);
        expect(mobileScrollOptions().map((o) => o.label)).toEqual(["Fits the screen", "Scrolls"]);
    });

    test("the action buttons offer the bar and the dock in that order", () => {
        expect(actionButtonsOptions().map((o) => o.value)).toEqual(["bar", "dock"]);
        expect(actionButtonsOptions().map((o) => o.label)).toEqual([
            "Bottom of the side panel",
            "Right side",
        ]);
    });

    test("the move controls offer under-board and docked in that order", () => {
        expect(moveControlsOptions().map((o) => o.value)).toEqual(["under-board", "docked"]);
    });

    test("every option has a label", () => {
        for (const option of [...actionButtonsOptions(), ...moveControlsOptions()]) {
            expect(option.label.length).toBeGreaterThan(0);
        }
    });

    test("the board alignment offers window, container and group in that order", () => {
        expect(boardAlignmentOptions().map((o) => o.value)).toEqual([
            "window",
            "container",
            "group",
        ]);
    });
});
