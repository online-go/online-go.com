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

import {
    AI_QUALITY_BADGES,
    DEFAULT_SCORE_DIFF_THRESHOLDS,
    JGOFAIReviewMove,
    JGOFNumericPlayerColor,
    MoveTree,
} from "goban";
import {
    EXCELLENT_BLEND_CAP,
    generateHeatmapAndMarks,
    lerpColor,
    qualityColor,
} from "./generateHeatmapAndMarks";

describe("qualityColor", () => {
    test("no data gives no color", () => {
        expect(qualityColor(undefined, undefined)).toBeNull();
    });

    test("no loss leans toward excellent but keeps some green", () => {
        expect(qualityColor(0, 0)).toBe(
            lerpColor(AI_QUALITY_BADGES.great.color, AI_QUALITY_BADGES.excellent.color, 0.75),
        );
        expect(EXCELLENT_BLEND_CAP).toBe(0.75);
    });

    test("the middle of the great band is pure great", () => {
        const t = DEFAULT_SCORE_DIFF_THRESHOLDS;
        expect(qualityColor((t.Excellent + t.Great) / 2, 0)).toBe(AI_QUALITY_BADGES.great.color);
    });

    test("a large score loss is a blunder even when the win rate barely moves", () => {
        expect(qualityColor(15, 0.1)).toBe(AI_QUALITY_BADGES.blunder.color);
    });

    test("a large win rate loss is a blunder even when the score barely moves", () => {
        expect(qualityColor(1, 90)).toBe(AI_QUALITY_BADGES.blunder.color);
    });

    test("the worse metric decides the color", () => {
        const from_score = qualityColor(3, undefined);
        const from_win_rate = qualityColor(undefined, 2);
        expect(qualityColor(3, 2)).toBe(from_score);
        expect(qualityColor(0.1, 2)).toBe(from_win_rate);
    });

    test("a missing metric does not pull the color down", () => {
        expect(qualityColor(undefined, 90)).toBe(AI_QUALITY_BADGES.blunder.color);
        expect(qualityColor(15, undefined)).toBe(AI_QUALITY_BADGES.blunder.color);
    });
});

describe("generateHeatmapAndMarks played move", () => {
    function makeGoban() {
        const calls: string[] = [];
        const board: number[][] = [];
        for (let y = 0; y < 9; y++) {
            board.push(new Array(9).fill(0));
        }
        return {
            calls,
            setSubscriptMark: (x: number, y: number, text: string) => {
                calls.push(`subscript ${x},${y} ${text}`);
            },
            setMark: (x: number, y: number, mark: string) => {
                calls.push(`mark ${x},${y} ${mark}`);
            },
            setSubscript2Mark: (x: number, y: number, text: string) => {
                calls.push(`subscript2 ${x},${y} ${text}`);
            },
            deleteCustomMark: (x: number, y: number, mark: string) => {
                calls.push(`delete ${x},${y} ${mark}`);
            },
            setAIQualityMark: (x: number, y: number, quality: string) => {
                calls.push(`quality ${x},${y} ${quality}`);
            },
            engine: { width: 9, height: 9, board },
        };
    }

    const review_move: JGOFAIReviewMove = {
        move_number: 3,
        move: { x: 0, y: 0 },
        win_rate: 0.5,
        score: 0,
        branches: [
            { moves: [{ x: 4, y: 4 }], visits: 500, win_rate: 0.5, score: 0 },
            { moves: [{ x: 2, y: 2 }], visits: 200, win_rate: 0.45, score: -2 },
            { moves: [{ x: 3, y: 3 }], visits: 200, win_rate: 0.45, score: -2 },
        ],
    } as unknown as JGOFAIReviewMove;

    const cur_move = { player: JGOFNumericPlayerColor.WHITE } as MoveTree;

    function run(goban: ReturnType<typeof makeGoban>, played_move: MoveTree, extra = {}) {
        return generateHeatmapAndMarks({
            ai_review_move: review_move,
            played_move,
            cur_move,
            played_move_category: "inaccuracy",
            played_move_delta: null,
            goban,
            strength: 1000,
            useScore: true,
            hasScores: true,
            show_visit_counts: false,
            ...extra,
        });
    }

    test("the played move is a normal quality-colored circle with a badge, not a stone", () => {
        const goban = makeGoban();
        const result = run(goban, { x: 2, y: 2, player: JGOFNumericPlayerColor.BLACK } as MoveTree);

        const played = result.colored_circles.find((c) => c.move.x === 2 && c.move.y === 2);
        const other = result.colored_circles.find((c) => c.move.x === 3 && c.move.y === 3);
        expect(played).toBeDefined();
        expect(played?.color).toBe(other?.color);
        expect(played?.border_width).toBe(other?.border_width);
        expect(played?.border_color).toBe(other?.border_color);
        expect(goban.calls).not.toContain("mark 2,2 black");
        expect(goban.calls).not.toContain("mark 2,2 white");
        expect(goban.calls).not.toContain("mark 2,2 sub_triangle");
        expect(goban.calls).toContain("quality 2,2 inaccuracy");
        expect(goban.calls).toContain("subscript 2,2 -2.0");
    });

    test("a played blue move is the normal blue move circle with a badge", () => {
        const goban = makeGoban();
        const result = run(
            goban,
            { x: 4, y: 4, player: JGOFNumericPlayerColor.BLACK } as MoveTree,
            {
                played_move_category: "excellent",
            },
        );

        const played = result.colored_circles.find((c) => c.move.x === 4 && c.move.y === 4);
        expect(played?.border_width).toBe(0.2);
        expect(played?.color).toContain("rgba(0, 130, 255");
        expect(goban.calls).toContain("mark 4,4 blue_move");
        expect(goban.calls).toContain("quality 4,4 excellent");
    });

    test("a played move outside the analyzed branches still gets a circle, delta and badge", () => {
        const goban = makeGoban();
        const result = run(
            goban,
            { x: 6, y: 6, player: JGOFNumericPlayerColor.BLACK } as MoveTree,
            {
                played_move_category: "blunder",
                played_move_delta: -9,
            },
        );

        const played = result.colored_circles.find((c) => c.move.x === 6 && c.move.y === 6);
        expect(played?.border_width).toBe(0.1);
        expect(played?.border_color).toBe(qualityColor(9, undefined));
        expect(goban.calls).toContain("subscript 6,6 -9.0");
        expect(goban.calls).toContain("quality 6,6 blunder");
        expect(goban.calls).not.toContain("mark 6,6 black");
    });

    test("without a classification the played move gets a plain triangle instead of a badge", () => {
        const goban = makeGoban();
        run(goban, { x: 2, y: 2, player: JGOFNumericPlayerColor.BLACK } as MoveTree, {
            played_move_category: null,
        });
        expect(goban.calls.some((c) => c.startsWith("quality 2,2"))).toBe(false);
        expect(goban.calls).toContain("mark 2,2 sub_triangle");
    });
});
