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

/** What this registry needs of a board: the ability to repaint its tree. */
interface MoveTreeBoard {
    move_tree_redraw: (no_warp?: boolean) => void;
}

/**
 * The boards that are on screen, so a change to what a move tree draws — the
 * line palette, for one — can reach the trees that are already up. Nothing
 * else about such a change would prompt a repaint.
 *
 * This is deliberately a module of its own rather than part of
 * `GobanController`: the views that read the palette import the store beside
 * it, and they have no business pulling a controller's dependencies in.
 */
const boards = new Set<MoveTreeBoard>();

/** Registers a board and returns the call that drops it again. */
export function registerMoveTreeBoard(board: MoveTreeBoard): () => void {
    boards.add(board);
    return () => {
        boards.delete(board);
    };
}

/** Repaints the move tree of every registered board. */
export function redrawMoveTrees(): void {
    for (const board of boards) {
        try {
            board.move_tree_redraw();
        } catch {
            // A board mid-teardown has nothing to draw.
        }
    }
}
