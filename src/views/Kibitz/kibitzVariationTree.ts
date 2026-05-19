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

import { MoveTree as GobanMoveTree, type MoveTree, type MoveTreeJson } from "goban";
import type { GobanController } from "@/lib/GobanController";
import type { KibitzVariationSummary } from "@/models/kibitz";
import { logKibitzVariationDebug, warnKibitzVariationDebug } from "./kibitzVariationDebug";

export const KIBITZ_VARIATION_COLORS = GobanMoveTree.line_colors;

export type KibitzVariationColorIndex = number;

export interface AppliedKibitzVariation {
    variationId: string;
    endpoint: MoveTree | null;
}

function lineTreeNodes(lineTree: MoveTreeJson | undefined): MoveTreeJson[] {
    const nodes: MoveTreeJson[] = [];
    let cursor = lineTree;

    while (cursor) {
        nodes.push(cursor);
        cursor = cursor.trunk_next;
    }

    return nodes;
}

function sameMove(left: MoveTree, right: MoveTreeJson): boolean {
    return left.x === right.x && left.y === right.y;
}

function alignLineTreeNodes(pathNodes: MoveTree[], annotatedNodes: MoveTreeJson[]): MoveTreeJson[] {
    if (pathNodes.length === 0 || annotatedNodes.length === 0) {
        return [];
    }

    const firstPathNode = pathNodes[0];
    const firstMatchingIndex = annotatedNodes.findIndex((node) => sameMove(firstPathNode, node));

    if (firstMatchingIndex < 0) {
        return [];
    }

    return annotatedNodes.slice(firstMatchingIndex);
}

function applyLineAnnotations(
    nodes: MoveTree[],
    lineTree: MoveTreeJson | undefined,
    includeMarks: boolean,
): void {
    const annotatedNodes = alignLineTreeNodes(nodes, lineTreeNodes(lineTree));
    const count = Math.min(nodes.length, annotatedNodes.length);

    for (let i = 0; i < count; ++i) {
        const source = annotatedNodes[i];

        if (!sameMove(nodes[i], source)) {
            continue;
        }

        const annotation: MoveTreeJson = {
            x: source.x,
            y: source.y,
            text: source.text,
            correct_answer: source.correct_answer,
            wrong_answer: source.wrong_answer,
        };

        if (includeMarks) {
            annotation.marks = source.marks;
            annotation.pen_marks = source.pen_marks;
        }

        nodes[i].loadJsonForThisNode(annotation);
    }
}

function applyLineColor(nodes: MoveTree[], colorIndex: KibitzVariationColorIndex): void {
    for (const node of nodes) {
        node.line_color = colorIndex;
    }
}

function summarizeMoveTreeNode(node: MoveTree | null | undefined): Record<string, unknown> | null {
    if (!node) {
        return null;
    }

    return {
        id: node.id,
        moveNumber: node.move_number,
        x: node.x,
        y: node.y,
        player: node.player,
        edited: node.edited,
        parentId: node.parent?.id,
        trunkNextId: node.trunk_next?.id,
        branchIds: node.branches.map((branch) => branch.id),
    };
}

function duplicateTrunkMoveAsBranch(
    engine: GobanController["goban"]["engine"],
    parent: MoveTree,
    trunkMove: MoveTree,
): MoveTree {
    const branch = new GobanMoveTree(
        engine,
        false,
        trunkMove.x,
        trunkMove.y,
        trunkMove.edited,
        trunkMove.player,
        trunkMove.move_number,
        parent,
        trunkMove.state,
    );

    parent.branches.push(branch);
    engine.move_tree_layout_dirty = true;
    return branch;
}

function duplicateOfficialTrunkAsBranch(controller: GobanController, parent: MoveTree): MoveTree[] {
    const engine = controller.goban.engine;
    const pathNodes: MoveTree[] = [];
    let branchCursor = parent;
    let trunkCursor = parent.trunk_next;

    while (trunkCursor) {
        branchCursor = duplicateTrunkMoveAsBranch(engine, branchCursor, trunkCursor);
        pathNodes.push(branchCursor);

        if (trunkCursor === engine.last_official_move) {
            break;
        }

        trunkCursor = trunkCursor.trunk_next;
    }

    return pathNodes;
}

export function officialTrunkNodeByMoveNumber(root: MoveTree, moveNumber: number): MoveTree | null {
    let cursor: MoveTree | undefined = root;

    while (cursor) {
        if (cursor.move_number === moveNumber) {
            return cursor;
        }

        cursor = cursor.trunk_next;
    }

    return null;
}

function moveMatchesNode(
    node: MoveTree | undefined,
    x: number,
    y: number,
    player: number,
    edited: boolean,
): node is MoveTree {
    return (
        node != null &&
        node.x === x &&
        node.y === y &&
        node.edited === edited &&
        (!edited || node.player === player)
    );
}

function followKibitzVariationPath(
    controller: GobanController,
    variationId: string,
    fromMoveNumber: number,
    moves: string,
): MoveTree[] {
    const engine = controller.goban.engine;
    const decodedMoves = engine.decodeMoves(moves);
    const pathNodes: MoveTree[] = [];
    const officialTrunkNode = officialTrunkNodeByMoveNumber(engine.move_tree, fromMoveNumber);

    if (!officialTrunkNode) {
        throw new Error(`Official trunk node ${fromMoveNumber} not found`);
    }

    let cursor = officialTrunkNode;

    logKibitzVariationDebug("follow:start", {
        variationId,
        fromMoveNumber,
        decodedMoveCount: decodedMoves.length,
        officialTrunkNode: summarizeMoveTreeNode(officialTrunkNode),
        lastOfficialMove: summarizeMoveTreeNode(engine.last_official_move),
        currentMove: summarizeMoveTreeNode(engine.cur_move),
    });

    if (decodedMoves.length > 0) {
        const firstMove = decodedMoves[0];
        const firstMoveEdited = !!firstMove.edited;
        const firstMovePlayer = engine.playerByColor(firstMove.color || 0);
        if (moveMatchesNode(cursor, firstMove.x, firstMove.y, firstMovePlayer, firstMoveEdited)) {
            logKibitzVariationDebug("follow:first-move-matches-anchor-moving-to-parent", {
                variationId,
                cursor: summarizeMoveTreeNode(cursor),
                parent: summarizeMoveTreeNode(cursor.parent),
                firstMove,
            });
            cursor = cursor.parent ?? cursor;
        }
    }

    let trunkPrefixCursor = cursor;
    let trunkPrefixLength = 0;

    if (decodedMoves.length === 0 && fromMoveNumber === 0) {
        return duplicateOfficialTrunkAsBranch(controller, cursor);
    }

    for (const move of decodedMoves) {
        const edited = !!move.edited;
        const player = engine.playerByColor(move.color || 0);

        if (!moveMatchesNode(trunkPrefixCursor.trunk_next, move.x, move.y, player, edited)) {
            break;
        }

        trunkPrefixCursor = trunkPrefixCursor.trunk_next;
        ++trunkPrefixLength;
    }

    const duplicatesSharedTrunkPrefix =
        trunkPrefixLength > 0 && trunkPrefixLength < decodedMoves.length;
    const duplicatesTrunkOnlyLine =
        trunkPrefixLength > 0 && trunkPrefixLength === decodedMoves.length;

    logKibitzVariationDebug("follow:prefix", {
        variationId,
        fromMoveNumber,
        trunkPrefixLength,
        duplicatesSharedTrunkPrefix,
        duplicatesTrunkOnlyLine,
        cursor: summarizeMoveTreeNode(cursor),
        trunkPrefixCursor: summarizeMoveTreeNode(trunkPrefixCursor),
    });

    engine.jumpTo(cursor);

    for (let index = 0; index < decodedMoves.length; ++index) {
        const move = decodedMoves[index];
        const edited = !!move.edited;
        const player = engine.playerByColor(move.color || 0);

        logKibitzVariationDebug("follow:step", {
            variationId,
            index,
            move: { x: move.x, y: move.y, color: move.color, edited },
            player,
            cursor: summarizeMoveTreeNode(cursor),
            trunkNext: summarizeMoveTreeNode(cursor.trunk_next),
            duplicatesSharedTrunkPrefix,
            duplicatesTrunkOnlyLine,
        });

        if (moveMatchesNode(cursor.trunk_next, move.x, move.y, player, edited)) {
            cursor =
                (duplicatesSharedTrunkPrefix && index < trunkPrefixLength) ||
                duplicatesTrunkOnlyLine
                    ? duplicateTrunkMoveAsBranch(engine, cursor, cursor.trunk_next)
                    : cursor.trunk_next;
            engine.jumpTo(cursor);
            pathNodes.push(cursor);
            continue;
        }

        engine.jumpTo(cursor);
        if (edited) {
            engine.editPlace(move.x, move.y, move.color || 0);
        } else {
            engine.place(move.x, move.y, false, false, true, true);
        }
        cursor = engine.cur_move;
        logKibitzVariationDebug("follow:placed", {
            variationId,
            index,
            cursor: summarizeMoveTreeNode(cursor),
        });
        pathNodes.push(cursor);
    }

    logKibitzVariationDebug("follow:done", {
        variationId,
        endpoint: summarizeMoveTreeNode(pathNodes[pathNodes.length - 1]),
        pathNodeCount: pathNodes.length,
    });

    return pathNodes;
}

export function applyKibitzVariationToController(
    controller: GobanController,
    variation: KibitzVariationSummary,
    colorIndex: KibitzVariationColorIndex,
    includeMarks: boolean,
): AppliedKibitzVariation {
    if (
        typeof variation.analysis_from !== "number" ||
        typeof variation.analysis_moves !== "string"
    ) {
        return { variationId: variation.id, endpoint: null };
    }

    let pathNodes: MoveTree[];
    try {
        pathNodes = followKibitzVariationPath(
            controller,
            variation.id,
            variation.analysis_from,
            variation.analysis_moves,
        );
    } catch (error) {
        warnKibitzVariationDebug("failed to apply variation", {
            variationId: variation.id,
            error,
            analysisFrom: variation.analysis_from,
            analysisMoves: variation.analysis_moves,
            currentMove: summarizeMoveTreeNode(controller.goban.engine.cur_move),
            officialAnchor:
                typeof variation.analysis_from === "number"
                    ? summarizeMoveTreeNode(
                          officialTrunkNodeByMoveNumber(
                              controller.goban.engine.move_tree,
                              variation.analysis_from,
                          ),
                      )
                    : null,
        });
        controller.goban.engine.jumpTo(controller.goban.engine.last_official_move);
        return { variationId: variation.id, endpoint: null };
    }

    applyLineAnnotations(pathNodes, variation.analysis_line_tree, includeMarks);
    applyLineColor(pathNodes, colorIndex);

    return {
        variationId: variation.id,
        endpoint: pathNodes[pathNodes.length - 1] ?? null,
    };
}

export function getKibitzVariationColor(colorIndex: KibitzVariationColorIndex): string {
    return KIBITZ_VARIATION_COLORS[colorIndex % KIBITZ_VARIATION_COLORS.length];
}
