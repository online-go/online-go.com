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

import { GobanEngine, type GobanEngineConfig, type MoveTree, type MoveTreeJson } from "goban";
import {
    getMoveTreeTrunkTail,
    restoreGobanToOfficialTail,
    type GobanController,
} from "@/lib/GobanController";
import type { KibitzWatchedGame } from "@/models/kibitz";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";

export function createCurrentGameMiniGobanSnapshotOverrides(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    currentGameId: number | null | undefined,
): ReadonlyMap<number, KibitzCurrentGameBaseSnapshot["config"] | null> | undefined {
    if (currentGameId == null) {
        return undefined;
    }

    if (!snapshot || snapshot.gameId !== currentGameId) {
        return new Map([[currentGameId, null]]);
    }

    return new Map([[currentGameId, cloneMiniGobanSnapshotConfig(snapshot.config)]]);
}

function cloneMiniGobanSnapshotConfig(
    source: KibitzCurrentGameBaseSnapshot["config"],
): KibitzCurrentGameBaseSnapshot["config"] {
    const {
        board_div: _boardDiv,
        title_div: _titleDiv,
        move_tree_container: _moveTreeContainer,
        move_tree: moveTree,
        server_socket: _serverSocket,
        ...serializableSource
    } = source;
    const seen = new WeakSet<object>();
    const config = JSON.parse(
        JSON.stringify(serializableSource, (_key, value: unknown) => {
            if (typeof value === "function") {
                return undefined;
            }
            if (value && typeof value === "object") {
                if (seen.has(value)) {
                    return undefined;
                }
                seen.add(value);
            }
            return value;
        }),
    ) as KibitzCurrentGameBaseSnapshot["config"];

    return {
        ...config,
        connect_to_chat: false,
        game_id: undefined,
        moves: undefined,
        move_tree: moveTree ? cloneMoveTreeJson(moveTree) : undefined,
        server_socket: undefined,
    };
}

function cloneOfficialTrunkMoveTreeJson(moveTree: MoveTree): MoveTreeJson {
    const { branches: _branches, ...json } = moveTree.toJson();

    if (moveTree.trunk_next) {
        json.trunk_next = cloneOfficialTrunkMoveTreeJson(moveTree.trunk_next);
    }

    return json;
}

interface KibitzGameDetailsForSnapshot {
    width: number;
    height: number;
    gamedata?: {
        moves?: unknown;
    };
}

function buildSnapshotFromEngine({
    engine,
    gameId,
    roomId,
    source,
    requiredSnapshotMoveNumber,
}: {
    engine: GobanEngine;
    gameId: number;
    roomId: string | null | undefined;
    source: KibitzCurrentGameBaseSnapshot["source"];
    requiredSnapshotMoveNumber: number;
}): KibitzCurrentGameBaseSnapshot | null {
    const officialTail = getMoveTreeTrunkTail(engine.move_tree);
    if (!officialTail || officialTail.move_number < requiredSnapshotMoveNumber) {
        return null;
    }

    return {
        gameId,
        roomId: roomId ?? null,
        trunkTailMoveNumber: officialTail.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: officialTail.getMoveStringToThisPoint(),
        source,
        fetchedMoveCount: null,
        config: {
            ...(engine.config as Record<string, unknown>),
            game_id: gameId,
            moves: undefined,
            move_tree: cloneOfficialTrunkMoveTreeJson(engine.move_tree),
        },
    };
}

export function buildCurrentGameBaseSnapshotFromGameDetails({
    details,
    gameId,
    roomId,
    requiredSnapshotMoveNumber,
    source = "selected-game-details",
}: {
    details: KibitzGameDetailsForSnapshot;
    gameId: number;
    roomId?: string | null;
    requiredSnapshotMoveNumber?: number;
    source?: KibitzCurrentGameBaseSnapshot["source"];
}): KibitzCurrentGameBaseSnapshot | null {
    const moves = details?.gamedata?.moves;
    if (!Array.isArray(moves)) {
        return null;
    }

    if (
        !Number.isFinite(details.width) ||
        !Number.isFinite(details.height) ||
        details.width <= 0 ||
        details.height <= 0
    ) {
        return null;
    }

    const engine = new GobanEngine({
        ...details.gamedata,
        game_id: gameId,
        width: details.width,
        height: details.height,
        moves,
    } as unknown as GobanEngineConfig);

    return buildSnapshotFromEngine({
        engine,
        gameId,
        roomId,
        source,
        requiredSnapshotMoveNumber: requiredSnapshotMoveNumber ?? moves.length,
    });
}

function cloneMoveTreeJson(moveTree: MoveTreeJson): MoveTreeJson {
    return JSON.parse(JSON.stringify(moveTree)) as MoveTreeJson;
}

export function restoreMainBoardToOfficialTail(controller: GobanController): MoveTree | null {
    return restoreGobanToOfficialTail(controller.goban);
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
