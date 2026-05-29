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
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";

export function cloneOfficialTrunkMoveTreeJson(moveTree: MoveTree): MoveTreeJson {
    const { branches: _branches, ...json } = moveTree.toJson();

    if (moveTree.trunk_next) {
        json.trunk_next = cloneOfficialTrunkMoveTreeJson(moveTree.trunk_next);
    }

    return json;
}

function cloneMoveTreeJson(moveTree: MoveTreeJson): MoveTreeJson {
    return JSON.parse(JSON.stringify(moveTree)) as MoveTreeJson;
}

export function restoreMainBoardToOfficialTail(controller: GobanController): MoveTree | null {
    const { engine } = controller.goban;
    const officialTail = getMoveTreeTrunkTail(engine.move_tree);

    if (!officialTail || officialTail.move_number <= 0) {
        return null;
    }

    engine.jumpTo(officialTail);
    engine.setLastOfficialMove();
    controller.goban.redraw(true);

    return officialTail;
}

export function canHydrateMainBoardFromRoomBaseSnapshot({
    mainBoardController,
    currentGame,
    currentRoomGameId,
    requiredMoveNumber,
    roomBaseSnapshot,
}: {
    mainBoardController: GobanController | null | undefined;
    currentGame: KibitzWatchedGame | null | undefined;
    currentRoomGameId: number | null | undefined;
    requiredMoveNumber: number;
    roomBaseSnapshot: KibitzCurrentGameBaseSnapshot | null | undefined;
}): boolean {
    if (!mainBoardController || currentRoomGameId == null || requiredMoveNumber <= 0) {
        return false;
    }

    if (!roomBaseSnapshot) {
        return false;
    }

    const controllerGameId =
        mainBoardController.goban?.config?.game_id != null
            ? Number(mainBoardController.goban.config.game_id)
            : null;
    if (controllerGameId !== currentRoomGameId) {
        return false;
    }

    if (roomBaseSnapshot.gameId !== currentRoomGameId) {
        return false;
    }

    if (
        currentGame?.live &&
        requiredMoveNumber === 0 &&
        roomBaseSnapshot.trunkTailMoveNumber === 0 &&
        !(
            roomBaseSnapshot.source === "game-details" ||
            roomBaseSnapshot.source === "selected-game-details"
        )
    ) {
        return false;
    }

    if (roomBaseSnapshot.trunkTailMoveNumber < requiredMoveNumber) {
        return false;
    }

    if (!roomBaseSnapshot.config?.move_tree) {
        return false;
    }

    const currentTail =
        getMoveTreeTrunkTail(mainBoardController.goban.engine?.move_tree)?.move_number ?? 0;
    return currentTail < requiredMoveNumber;
}

export function hydrateMainBoardFromRoomBaseSnapshot({
    mainBoardController,
    currentGame,
    currentRoomGameId,
    requiredMoveNumber,
    roomBaseSnapshot,
}: {
    mainBoardController: GobanController;
    currentGame: KibitzWatchedGame | null | undefined;
    currentRoomGameId: number;
    requiredMoveNumber: number;
    roomBaseSnapshot: KibitzCurrentGameBaseSnapshot;
}): MoveTree | null {
    if (
        !canHydrateMainBoardFromRoomBaseSnapshot({
            mainBoardController,
            currentGame,
            currentRoomGameId,
            requiredMoveNumber,
            roomBaseSnapshot,
        })
    ) {
        return null;
    }

    const goban = mainBoardController.goban;
    const previousMode = goban.mode;

    if (goban.mode === "analyze") {
        goban.mode = "play";
    }

    try {
        goban.load({
            ...roomBaseSnapshot.config,
            game_id: currentRoomGameId,
            moves: undefined,
            move_tree: roomBaseSnapshot.config.move_tree
                ? cloneMoveTreeJson(roomBaseSnapshot.config.move_tree)
                : undefined,
        });
    } finally {
        goban.mode = previousMode;
    }

    return restoreMainBoardToOfficialTail(mainBoardController);
}

export function captureCurrentGameBaseSnapshotFromController(
    controller: GobanController | null,
    game: KibitzWatchedGame | null | undefined,
    roomId: string | null | undefined = null,
    source: KibitzCurrentGameBaseSnapshot["source"] = "main-board",
    expectedMoveNumber?: number,
): KibitzCurrentGameBaseSnapshot | null {
    if (!controller || !game) {
        return null;
    }

    if (!controller.goban.parent?.isConnected) {
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
        roomId: roomId ?? null,
        trunkTailMoveNumber: officialTail.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: officialTail.getMoveStringToThisPoint(),
        source,
        fetchedMoveCount: null,
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
