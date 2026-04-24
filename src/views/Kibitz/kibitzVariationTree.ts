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

import type { MoveTree, MoveTreeJson } from "goban";
import type { GobanController } from "@/lib/GobanController";
import type { KibitzVariationSummary } from "@/models/kibitz";

export const KIBITZ_VARIATION_COLORS = [
    "#ff0000",
    "#00aa00",
    "#0000ff",
    "#008c99",
    "#b59b00",
    "#c26700",
    "#9200ff",
] as const;

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

function pathNodesAfterMove(controller: GobanController, from: number): MoveTree[] {
    const endpoint = controller.goban.engine.cur_move;
    const branchPoint = controller.goban.engine.move_tree.index(from);
    const nodes: MoveTree[] = [];
    let cursor: MoveTree | null = endpoint;

    while (cursor && cursor.id !== branchPoint.id) {
        nodes.push(cursor);
        cursor = cursor.parent;
    }

    nodes.reverse();
    return nodes;
}

function applyLineAnnotations(
    nodes: MoveTree[],
    lineTree: MoveTreeJson | undefined,
    includeMarks: boolean,
): void {
    const annotatedNodes = lineTreeNodes(lineTree);
    const count = Math.min(nodes.length, annotatedNodes.length);

    for (let i = 0; i < count; ++i) {
        const source = annotatedNodes[i];
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
        if (!node.trunk) {
            node.line_color = colorIndex;
        }
    }
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

    controller.goban.engine.followPath(variation.analysis_from, variation.analysis_moves);
    const pathNodes = pathNodesAfterMove(controller, variation.analysis_from);

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
