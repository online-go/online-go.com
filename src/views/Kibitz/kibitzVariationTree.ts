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

/** How many variations can be on the board at once: one per line colour.
 *  Both of goban's palettes hold the same seven. */
export const KIBITZ_VARIATION_COLOR_COUNT = GobanMoveTree.LINE_COLORS_DARK.length;

type KibitzVariationColorIndex = number;

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

function duplicateMoveNodeAsBranch(
    engine: GobanController["goban"]["engine"],
    parent: MoveTree,
    sourceNode: MoveTree,
): MoveTree {
    const branch = new GobanMoveTree(
        engine,
        false,
        sourceNode.x,
        sourceNode.y,
        sourceNode.edited,
        sourceNode.player,
        sourceNode.move_number,
        parent,
        sourceNode.state,
    );

    parent.branches.push(branch);
    engine.move_tree_layout_dirty = true;
    return branch;
}

function officialTrunkNodeByMoveNumber(root: MoveTree, moveNumber: number): MoveTree | null {
    let cursor: MoveTree | undefined = root;

    while (cursor) {
        if (cursor.move_number === moveNumber) {
            return cursor;
        }

        cursor = cursor.trunk_next;
    }

    return null;
}

export function isVariationOfficialAnchorReady(
    controller: GobanController,
    variation: KibitzVariationSummary,
): boolean {
    if (!controller.goban.engine?.move_tree) {
        return false;
    }

    if (typeof variation.analysis_from !== "number" || !Number.isFinite(variation.analysis_from)) {
        return false;
    }

    return Boolean(
        officialTrunkNodeByMoveNumber(controller.goban.engine.move_tree, variation.analysis_from),
    );
}

function findMatchingBranch(
    parent: MoveTree,
    x: number,
    y: number,
    player: number,
    edited: boolean,
): MoveTree | null {
    return parent.branches.find((branch) => moveMatchesNode(branch, x, y, player, edited)) ?? null;
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

    if (decodedMoves.length > 0) {
        const firstMove = decodedMoves[0];
        const firstMoveEdited = !!firstMove.edited;
        const firstMovePlayer = engine.playerByColor(firstMove.color || 0);
        if (moveMatchesNode(cursor, firstMove.x, firstMove.y, firstMovePlayer, firstMoveEdited)) {
            cursor = cursor.parent ?? cursor;
        }
    }

    let trunkPrefixCursor = cursor;
    let trunkPrefixLength = 0;

    if (decodedMoves.length === 0) {
        throw new Error(`Variation ${variationId} has no decoded moves`);
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

    engine.jumpTo(cursor);

    for (let index = 0; index < decodedMoves.length; ++index) {
        const move = decodedMoves[index];
        const edited = !!move.edited;
        const player = engine.playerByColor(move.color || 0);

        if (moveMatchesNode(cursor.trunk_next, move.x, move.y, player, edited)) {
            const matchingTrunkNext = cursor.trunk_next;
            const shouldDuplicateMatchingTrunkNext =
                !matchingTrunkNext.trunk ||
                (duplicatesSharedTrunkPrefix && index < trunkPrefixLength) ||
                duplicatesTrunkOnlyLine;

            cursor = shouldDuplicateMatchingTrunkNext
                ? duplicateMoveNodeAsBranch(engine, cursor, matchingTrunkNext)
                : matchingTrunkNext;
            engine.jumpTo(cursor);
            pathNodes.push(cursor);
            continue;
        }

        const matchingBranch = findMatchingBranch(cursor, move.x, move.y, player, edited);
        if (matchingBranch) {
            cursor = duplicateMoveNodeAsBranch(engine, cursor, matchingBranch);
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
        pathNodes.push(cursor);
    }

    return pathNodes;
}

export function applyKibitzVariationToController(
    controller: GobanController,
    variation: KibitzVariationSummary,
    colorIndex: KibitzVariationColorIndex,
    includeMarks: boolean,
): AppliedKibitzVariation {
    if (
        typeof variation.analysis_moves === "string" &&
        variation.analysis_moves.trim().length > 0
    ) {
        try {
            controller.goban.engine.decodeMoves(variation.analysis_moves);
        } catch (error) {
            console.warn("kibitz-variation:undecodable-moves", {
                variationId: variation.id,
                analysisFrom: variation.analysis_from ?? null,
                analysisMoves: variation.analysis_moves,
                error,
            });
            return { variationId: variation.id, endpoint: null };
        }
    }

    if (
        typeof variation.analysis_from !== "number" ||
        !Number.isFinite(variation.analysis_from) ||
        typeof variation.analysis_moves !== "string" ||
        variation.analysis_moves.trim().length === 0
    ) {
        console.warn("kibitz-variation:refusing-malformed-variation", {
            variationId: variation.id,
            analysisFrom: variation.analysis_from ?? null,
            analysisMoves:
                typeof variation.analysis_moves === "string" ? variation.analysis_moves : null,
        });
        return { variationId: variation.id, endpoint: null };
    }

    if (!isVariationOfficialAnchorReady(controller, variation)) {
        console.warn("kibitz-variation:anchor-not-ready", {
            variationId: variation.id,
            analysisFrom: variation.analysis_from,
            lastOfficialMove: controller.goban.engine.last_official_move?.move_number ?? null,
        });
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
        console.warn("kibitz-variation:failed-to-apply", {
            variationId: variation.id,
            error,
            analysisFrom: variation.analysis_from,
            analysisMoves: variation.analysis_moves,
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
