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
import { boardIdsFromKey, boardKey, isReviewBoard, type KibitzBoardKey } from "./kibitzBoardRef";
import { returnToReviewPresenter, reviewPresenterNode } from "./kibitzReviewBoard";

export function createCurrentGameMiniGobanSnapshotOverrides(
    snapshot: KibitzCurrentGameBaseSnapshot | null | undefined,
    currentGameId: number | null | undefined,
): ReadonlyMap<number, KibitzCurrentGameBaseSnapshot["config"] | null> | undefined {
    if (currentGameId == null) {
        return undefined;
    }

    if (!snapshot || snapshot.board !== boardKey({ game_id: currentGameId })) {
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
    const ancestors: object[] = [];
    const config = JSON.parse(
        JSON.stringify(serializableSource, function (this: unknown, _key, value: unknown) {
            if (typeof value === "function") {
                return undefined;
            }
            if (value && typeof value === "object") {
                // Shared player records are valid. Omit only references to an
                // ancestor, which would form a cycle in the serialized data.
                while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) {
                    ancestors.pop();
                }
                if (ancestors.includes(value)) {
                    return undefined;
                }
                ancestors.push(value);
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
        board: `game:${gameId}`,
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

/** Puts the main board back on the room's position: the trunk tail of a
 *  game, or the presenter's node of a review. */
export function restoreMainBoardToOfficialTail(controller: GobanController): MoveTree | null {
    if (returnToReviewPresenter(controller.goban)) {
        return reviewPresenterNode(controller.goban);
    }
    return restoreGobanToOfficialTail(controller.goban);
}

function boardKeyFromRaw(gameId: unknown, reviewId: unknown): KibitzBoardKey | null {
    return boardKey({ game_id: Number(gameId), review_id: Number(reviewId) });
}

/** Boards the controller itself reports. A detached details board has none. */
function sourceBoardKeys(controller: GobanController): KibitzBoardKey[] {
    const goban = controller.goban;
    const engine = goban?.engine;
    const keys = [
        boardKeyFromRaw(goban?.game_id, goban?.review_id),
        boardKeyFromRaw(engine?.game_id, engine?.review_id),
        boardKeyFromRaw(engine?.config?.game_id, engine?.config?.review_id),
        boardKeyFromRaw(goban?.config?.game_id, goban?.config?.review_id),
    ];
    return keys.filter((key): key is KibitzBoardKey => key != null);
}

export function captureCurrentGameBaseSnapshotFromController(
    controller: GobanController | null,
    game: KibitzWatchedGame | null | undefined,
    roomId: string | null | undefined = null,
    source: KibitzCurrentGameBaseSnapshot["source"] = "main-board",
    expectedMoveNumber?: number,
): KibitzCurrentGameBaseSnapshot | null {
    const board = boardKey(game);
    if (!controller || !game || !board) {
        return null;
    }

    // The trunk lives in the engine, not in the DOM: a main board that is
    // off screen — which on a phone it is whenever the centre shows a
    // variation or a draft — still has every move of the game.
    const { engine } = controller.goban;
    if (!engine?.move_tree) {
        return null;
    }

    if (game.review_id) {
        return captureReviewSnapshot(controller, board, roomId, source);
    }

    const officialTail = getMoveTreeTrunkTail(engine.move_tree);
    const requiredMoveNumber = expectedMoveNumber ?? game.move_number ?? 0;

    if (!officialTail || officialTail.move_number < requiredMoveNumber) {
        return null;
    }

    // The previous controller stays mounted until its effect is replaced.
    // Do not stamp the next game's id onto that controller's move tree.
    if (sourceBoardKeys(controller).some((key) => key !== board)) {
        return null;
    }

    return {
        board,
        roomId: roomId ?? null,
        trunkTailMoveNumber: officialTail.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: officialTail.getMoveStringToThisPoint(),
        source,
        fetchedMoveCount: null,
        config: {
            ...(engine.config as Record<string, unknown>),
            game_id: game.game_id,
            review_id: game.review_id,
            moves: undefined,
            move_tree: cloneOfficialTrunkMoveTreeJson(engine.move_tree),
        },
    };
}

/**
 * A review's snapshot copies the whole tree, branches included: the
 * presenter's position can be on any branch, and a variation can branch from
 * any node of it. `movePath` is the presenter's node. A review is not a live
 * game, so there is no move count to wait for.
 */
function captureReviewSnapshot(
    controller: GobanController,
    board: KibitzBoardKey,
    roomId: string | null | undefined,
    source: KibitzCurrentGameBaseSnapshot["source"],
): KibitzCurrentGameBaseSnapshot | null {
    const { engine } = controller.goban;
    const presenter = reviewPresenterNode(controller.goban);
    if (!presenter || sourceBoardKeys(controller).some((key) => key !== board)) {
        return null;
    }
    return {
        board,
        roomId: roomId ?? null,
        trunkTailMoveNumber: presenter.move_number,
        moveTreeId: engine.move_tree?.id ?? null,
        movePath: presenter.getMoveStringToThisPoint(),
        source,
        fetchedMoveCount: null,
        config: {
            ...(engine.config as Record<string, unknown>),
            game_id: undefined,
            review_id: controller.goban.review_id,
            moves: undefined,
            move_tree: engine.move_tree.toJson(),
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

    // The presenter of a review steps back and branches on purpose, so the
    // latest snapshot of a review is the right one even when it is earlier.
    if (previous.board !== next.board || isReviewBoard(boardIdsFromKey(next.board))) {
        return next;
    }

    if (next.trunkTailMoveNumber < previous.trunkTailMoveNumber) {
        return previous;
    }

    return next;
}
