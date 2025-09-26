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

import { MoveTree, JGOFAIReviewMove, JGOFNumericPlayerColor, ColoredCircle } from "goban";
import { sameIntersection } from "@/lib/misc";
import { errorLogger } from "@/lib/misc";

interface Goban {
    setSubscriptMark: (
        x: number,
        y: number,
        text: string,
        sub_triangle: boolean,
        keepMark: boolean,
    ) => void;
    setMark: (
        x: number,
        y: number,
        mark: string,
        sub_triangle: boolean,
        keepMark?: boolean,
    ) => void;
    engine: {
        width: number;
        height: number;
        board: number[][];
    };
}

interface HeatmapGenerationResult {
    marks: { [mark: string]: string };
    heatmap: Array<Array<number>> | null;
    colored_circles: ColoredCircle[];
}

interface HeatmapGenerationParams {
    ai_review_move: JGOFAIReviewMove;
    next_move: MoveTree | null;
    cur_move: MoveTree;
    goban: Goban;
    strength: number;
    useScore: boolean;
    hasScores: boolean;
}

/**
 * Generates heatmap, marks, and colored circles for AI review visualization
 */
export function generateHeatmapAndMarks({
    ai_review_move,
    next_move,
    cur_move,
    goban,
    strength,
    useScore,
    hasScores,
}: HeatmapGenerationParams): HeatmapGenerationResult {
    const marks: { [mark: string]: string } = {};
    const colored_circles: ColoredCircle[] = [];

    // Initialize heatmap
    const heatmap: Array<Array<number>> = [];
    for (let y = 0; y < goban.engine.height; y++) {
        const r: number[] = new Array(goban.engine.width).fill(0);
        heatmap.push(r);
    }

    const branches = ai_review_move.branches.slice(0, 6);

    // Ensure played move is included
    if (next_move) {
        const found_next_move = branches.some(
            (branch) =>
                branch.moves.length > 0 &&
                next_move &&
                sameIntersection(branch.moves[0], next_move),
        );

        if (!found_next_move) {
            const played_branch = ai_review_move.branches.find(
                (branch) =>
                    branch.moves.length > 0 &&
                    next_move &&
                    sameIntersection(branch.moves[0], next_move),
            );

            if (played_branch) {
                branches.push(played_branch);
            }
        }
    }

    for (let i = 0; i < branches.length; ++i) {
        const branch = branches[i];
        const mv = branch.moves[0];

        if (mv === undefined || mv.x === -1) {
            continue;
        }

        if (goban.engine.board[mv.y][mv.x]) {
            errorLogger(
                new Error("AI is suggesting moves on intersections that have already been played"),
            );
        }

        heatmap[mv.y][mv.x] = branch.visits / strength;

        let next_player: JGOFNumericPlayerColor;
        if (next_move) {
            next_player = next_move.player;
        } else {
            next_player =
                cur_move.player === JGOFNumericPlayerColor.BLACK
                    ? JGOFNumericPlayerColor.WHITE
                    : JGOFNumericPlayerColor.BLACK;
        }

        const delta: number =
            useScore && hasScores
                ? next_player === JGOFNumericPlayerColor.WHITE
                    ? (ai_review_move.score ?? 0) - (branch.score ?? 0)
                    : (branch.score ?? 0) - (ai_review_move.score ?? 0)
                : 100 *
                  (next_player === JGOFNumericPlayerColor.WHITE
                      ? ai_review_move.win_rate - branch.win_rate
                      : branch.win_rate - ai_review_move.win_rate);

        let key = delta.toFixed(1);
        if (key === "0.0" || key === "-0.0") {
            key = "0";
        }

        if (
            mv &&
            (i === 0 ||
                (next_move && sameIntersection(branch.moves[0], next_move)) ||
                branch.visits >= Math.min(50, 0.1 * strength))
        ) {
            if (parseFloat(key).toPrecision(2).length < key.length) {
                key = parseFloat(key).toPrecision(2);
            }
            goban.setSubscriptMark(mv.x, mv.y, key, true, true);
        }

        const circle: ColoredCircle = {
            move: branch.moves[0],
            color: "rgba(0,0,0,0)",
        };

        if (next_move && sameIntersection(branch.moves[0], next_move)) {
            goban.setMark(mv.x, mv.y, "sub_triangle", true);
            goban.setMark(mv.x, mv.y, "blue_move", true, true);

            circle.border_width = 0.1;
            circle.border_color = "rgb(0, 0, 0)";
            circle.color = i === 0 ? "rgba(0, 130, 255, 0.7)" : "rgba(255, 255, 255, 0.3)";
            colored_circles.push(circle);
        } else if (i === 0) {
            goban.setMark(mv.x, mv.y, "blue_move", true, true);
            circle.border_width = 0.2;
            circle.border_color = "rgb(0, 130, 255)";
            circle.color = "rgba(0, 130, 255, 0.7)";
            colored_circles.push(circle);
        }
    }

    return { marks, heatmap, colored_circles };
}
