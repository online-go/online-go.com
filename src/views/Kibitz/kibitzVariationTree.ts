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

function findMatchingBranch(
    parent: MoveTree,
    x: number,
    y: number,
    player: number,
    edited: boolean,
): MoveTree | null {
    for (const branch of parent.branches) {
        if (
            branch.x === x &&
            branch.y === y &&
            branch.edited === edited &&
            (!edited || branch.player === player)
        ) {
            return branch;
        }
    }

    return null;
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
    fromMoveNumber: number,
    moves: string,
): MoveTree[] {
    const engine = controller.goban.engine;
    const decodedMoves = engine.decodeMoves(moves);
    const pathNodes: MoveTree[] = [];
    let cursor = engine.move_tree.index(fromMoveNumber);
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

    engine.jumpTo(cursor);

    for (let index = 0; index < decodedMoves.length; ++index) {
        const move = decodedMoves[index];
        const edited = !!move.edited;
        const player = engine.playerByColor(move.color || 0);
        const existingBranch = findMatchingBranch(cursor, move.x, move.y, player, edited);

        if (existingBranch && !duplicatesSharedTrunkPrefix && !duplicatesTrunkOnlyLine) {
            cursor = existingBranch;
            engine.jumpTo(cursor);
            pathNodes.push(cursor);
            continue;
        }

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
        typeof variation.analysis_from !== "number" ||
        typeof variation.analysis_moves !== "string"
    ) {
        return { variationId: variation.id, endpoint: null };
    }

    let pathNodes: MoveTree[];
    try {
        pathNodes = followKibitzVariationPath(
            controller,
            variation.analysis_from,
            variation.analysis_moves,
        );
    } catch (error) {
        console.warn("kibitz: failed to apply variation", variation.id, error);
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
