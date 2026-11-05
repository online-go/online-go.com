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

import type { Goban, MoveTree } from "goban";

/** Observe completed board placements without treating move navigation as placement. */
export function observeKibitzVariationPlacement(
    board: Pick<Goban, "on" | "off" | "engine" | "move_selected" | "disableStonePlacement">,
    onPlacement: (path: string) => boolean,
): () => void {
    let candidate: MoveTree | null = null;
    let started = false;
    const reset = () => {
        candidate = null;
    };
    const onMove = (node: MoveTree) => {
        const selected = board.move_selected;
        if (selected && node.x === selected.x && node.y === selected.y) {
            candidate = node;
        }
    };
    const onUpdate = () => {
        if (!candidate || started || board.move_selected) {
            return;
        }
        // Handicap placement can append a pass before the completed update.
        let node: MoveTree | null = board.engine.cur_move;
        while (node && node !== candidate && node.x === -1 && node.y === -1) {
            node = node.parent;
        }
        const placed = node === candidate;
        candidate = null;
        if (placed && onPlacement(board.engine.cur_move.getMoveStringToThisPoint())) {
            started = true;
            board.disableStonePlacement();
        }
    };
    board.on("cur_move", onMove);
    board.on("update", onUpdate);
    board.on("error", reset);
    board.on("load", reset);
    return () => {
        board.off("cur_move", onMove);
        board.off("update", onUpdate);
        board.off("error", reset);
        board.off("load", reset);
    };
}

/** Enable local analysis input on the main board while retaining its live connection. */
export function observeKibitzMainBoardPlacement(
    board: Pick<
        Goban,
        | "on"
        | "off"
        | "engine"
        | "move_selected"
        | "disableStonePlacement"
        | "enableStonePlacement"
        | "setMode"
        | "setAnalyzeTool"
        | "mode"
    >,
    onPlacement: (path: string) => boolean,
): () => void {
    const enable = () => {
        if (board.engine.phase === "stone removal") {
            board.disableStonePlacement();
            return;
        }
        if (board.mode === "score estimation") {
            return;
        }
        board.setMode("analyze");
        board.setAnalyzeTool("stone", "alternate");
        board.enableStonePlacement();
    };
    enable();
    board.on("load", enable);
    board.on("phase", enable);
    const stop = observeKibitzVariationPlacement(board, onPlacement);
    return () => {
        stop();
        board.off("load", enable);
        board.off("phase", enable);
        board.disableStonePlacement();
    };
}
