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
import { MoveTree } from "goban";
import { redrawMoveTrees } from "./move_tree_boards";

/**
 * The move tree draws each branch in a colour, and the views that name a
 * variation show the same colour beside it. Goban ships two sets of the same
 * seven hues, and the light one belongs to the light interface: the darker
 * set reads heavy against light panels.
 *
 * The accessible theme is built on the dark one, so it takes the dark set.
 */
export function moveTreeLineColorsFor(theme: string): ReadonlyArray<string> {
    return theme === "light" ? MoveTree.LINE_COLORS_LIGHT : MoveTree.LINE_COLORS_DARK;
}

const listeners = new Set<() => void>();
let snapshot: ReadonlyArray<string> = MoveTree.line_colors;

/**
 * Puts the palette for `theme` in front of every board. Boards already on
 * screen are repainted, since nothing else about a theme change tells them
 * their branch colours moved, and anything rendering a colour beside a
 * variation's name is told through `useMoveTreeLineColors`.
 */
export function applyMoveTreeLineColors(theme: string): void {
    const colors = moveTreeLineColorsFor(theme);
    if (snapshot[0] === colors[0]) {
        return;
    }
    MoveTree.line_colors = [...colors];
    snapshot = MoveTree.line_colors;
    redrawMoveTrees();
    for (const listener of listeners) {
        listener();
    }
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/** The palette the move tree is drawing with, for views that put a colour
 *  beside a variation's name. Re-renders when the theme swaps it. */
export function useMoveTreeLineColors(): ReadonlyArray<string> {
    return React.useSyncExternalStore(
        subscribe,
        () => snapshot,
        () => snapshot,
    );
}
