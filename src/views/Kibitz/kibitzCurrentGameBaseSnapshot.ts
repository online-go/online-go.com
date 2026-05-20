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

import { type MoveTree, type MoveTreeJson } from "goban";
import { getMoveTreeTrunkTail, type GobanController } from "@/lib/GobanController";
import type { KibitzWatchedGame } from "@/models/kibitz";
import type { KibitzCurrentGameBaseSnapshot } from "./KibitzRoomStage";

export function cloneOfficialTrunkMoveTreeJson(moveTree: MoveTree): MoveTreeJson {
    const { branches: _branches, ...json } = moveTree.toJson();

    if (moveTree.trunk_next) {
        json.trunk_next = cloneOfficialTrunkMoveTreeJson(moveTree.trunk_next);
    }

    return json;
}

export function captureCurrentGameBaseSnapshotFromController(
    controller: GobanController | null,
    game: KibitzWatchedGame | null | undefined,
    source: KibitzCurrentGameBaseSnapshot["source"] = "main-board",
    expectedMoveNumber?: number,
): KibitzCurrentGameBaseSnapshot | null {
    if (!controller || !game) {
        return null;
    }

    const { engine } = controller.goban;
    if (!engine?.move_tree) {
        return null;
    }

    const officialTail = getMoveTreeTrunkTail(engine.move_tree);
    const requiredMoveNumber = expectedMoveNumber ?? game.move_number ?? 0;

    if (!officialTail || officialTail.move_number < requiredMoveNumber) {
        return null;
    }

    return {
        gameId: game.game_id,
        trunkTailMoveNumber: officialTail.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: officialTail.getMoveStringToThisPoint(),
        source,
        config: {
            ...(engine.config as Record<string, unknown>),
            game_id: game.game_id,
            moves: undefined,
            move_tree: cloneOfficialTrunkMoveTreeJson(engine.move_tree),
        },
    };
}

export function chooseFresherCurrentGameBaseSnapshot(
    previous: KibitzCurrentGameBaseSnapshot | null,
    next: KibitzCurrentGameBaseSnapshot,
): KibitzCurrentGameBaseSnapshot {
    if (!previous) {
        return next;
    }

    if (previous.gameId !== next.gameId) {
        return next;
    }

    if (next.trunkTailMoveNumber < previous.trunkTailMoveNumber) {
        return previous;
    }

    return next;
}
