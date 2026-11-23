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
import { hasKibitzAnalysisContent } from "./kibitzAnalysisContent";

/** How many variations can be on the board at once: one per line colour.
 *  Both of goban's palettes hold the same seven. */
export const KIBITZ_VARIATION_COLOR_COUNT = GobanMoveTree.LINE_COLORS_DARK.length;

type KibitzVariationColorIndex = number;

export interface AppliedKibitzVariation {
    variationId: string;
    endpoint: MoveTree | null;
    /** True when a review variation's branch point is no longer in the
     *  review, so its line was replayed from the start of the board. */
    detached?: boolean;
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

/** The node at the end of `path` (as from `getMoveStringToThisPoint`), or
 *  null when any step of it is not in the tree. Unlike `followPath` this
 *  never places a move, so a node that left the board is not recreated. */
export function findNodeByMovePath(controller: GobanController, path: string): MoveTree | null {
    const { engine } = controller.goban;
    let cur: MoveTree | null = engine.move_tree;
    for (const mv of engine.decodeMoves(path)) {
        cur = cur?.lookupMove(mv.x, mv.y, engine.playerByColor(mv.color || 0), !!mv.edited) ?? null;
        if (!cur) {
            return null;
        }
    }
    return cur;
}

interface VariationAnchor {
    /** The node the line is laid from. */
    node: MoveTree;
    /** The moves to lay from it. A detached review variation replays its
     *  branch point's path as well as its own moves. */
    moves: string;
    /** How many of the leading `moves` belong to the replayed path rather
     *  than to the variation. */
    prefixMoveCount: number;
    detached: boolean;
}

/**
 * Where a variation is laid onto the board.
 *
 * A game's variation branches from its official trunk at move `analysis_from`,
 * and a game's trunk only grows. A review's trunk does not: a demo board's
 * undo takes recorded moves away, and other moves can take their place. So a
 * review variation also carries `analysis_from_path`, the path from the root
 * to its branch point. When that node is still in the review the line is laid
 * from it. When it is not, the path and the line are replayed from the root,
 * which puts the same stones on the board as when the variation was made.
 */
function resolveVariationAnchor(
    controller: GobanController,
    variation: KibitzVariationSummary,
): VariationAnchor | null {
    const engine = controller.goban.engine;
    const moves = variation.analysis_moves ?? "";
    const path = variation.analysis_from_path;
    if (variation.review_id && typeof path === "string") {
        const node = findNodeByMovePath(controller, path);
        if (node) {
            return { node, moves, prefixMoveCount: 0, detached: false };
        }
        return {
            node: engine.move_tree,
            moves: path + moves,
            prefixMoveCount: engine.decodeMoves(path).length,
            detached: true,
        };
    }
    if (typeof variation.analysis_from !== "number" || !Number.isFinite(variation.analysis_from)) {
        return null;
    }
    const node = officialTrunkNodeByMoveNumber(engine.move_tree, variation.analysis_from);
    return node ? { node, moves, prefixMoveCount: 0, detached: false } : null;
}

export function isVariationOfficialAnchorReady(
    controller: GobanController,
    variation: KibitzVariationSummary,
): boolean {
    if (!controller.goban.engine?.move_tree) {
        return false;
    }

    if (variation.review_id && typeof variation.analysis_from_path === "string") {
        // A review variation always has a place to go: its branch point, or
        // the root to replay it from.
        return true;
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
    anchor: MoveTree,
    moves: string,
): MoveTree[] {
    const engine = controller.goban.engine;
    const decodedMoves = engine.decodeMoves(moves);
    const pathNodes: MoveTree[] = [];

    let cursor = anchor;

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

/** Puts an annotation-only post's marks and drawings on `node`. */
function applyPositionAnnotations(
    controller: GobanController,
    node: MoveTree,
    variation: KibitzVariationSummary,
): void {
    controller.goban.engine.jumpTo(node);
    node.clearMarks();
    controller.goban.setMarks(variation.analysis_marks ?? {}, true);
    node.pen_marks = (variation.analysis_pen_marks ?? []).map((mark) => ({
        color: mark.color,
        points: [...mark.points],
    }));
    controller.goban.pen_marks = node.pen_marks;
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
        !hasKibitzAnalysisContent(
            variation.analysis_moves,
            variation.analysis_marks,
            variation.analysis_pen_marks,
        )
    ) {
        console.warn("kibitz-variation:refusing-malformed-variation", {
            variationId: variation.id,
            analysisFrom: variation.analysis_from ?? null,
            analysisMoves:
                typeof variation.analysis_moves === "string" ? variation.analysis_moves : null,
        });
        return { variationId: variation.id, endpoint: null };
    }

    const anchor = isVariationOfficialAnchorReady(controller, variation)
        ? resolveVariationAnchor(controller, variation)
        : null;
    if (!anchor) {
        console.warn("kibitz-variation:anchor-not-ready", {
            variationId: variation.id,
            analysisFrom: variation.analysis_from,
            lastOfficialMove: controller.goban.engine.last_official_move?.move_number ?? null,
        });
        return { variationId: variation.id, endpoint: null };
    }
    const detached = anchor.detached;

    if (anchor.moves === "") {
        if (includeMarks) {
            // Only the selected post annotates the secondary board's copied trunk.
            applyPositionAnnotations(controller, anchor.node, variation);
        }
        return { variationId: variation.id, endpoint: anchor.node, detached };
    }

    let pathNodes: MoveTree[];
    try {
        pathNodes = followKibitzVariationPath(controller, variation.id, anchor.node, anchor.moves);
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

    const endpoint = pathNodes[pathNodes.length - 1] ?? null;
    // A replayed path is the way to the branch point, not part of the line.
    const lineNodes = pathNodes.slice(anchor.prefixMoveCount);

    // A detached annotation-only post was replayed to its position; its
    // annotations belong on the end of that path.
    if (detached && variation.analysis_moves === "" && endpoint && includeMarks) {
        applyPositionAnnotations(controller, endpoint, variation);
    }

    applyLineAnnotations(lineNodes, variation.analysis_line_tree, includeMarks);
    applyLineColor(lineNodes, colorIndex);

    return { variationId: variation.id, endpoint, detached };
}
