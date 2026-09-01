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
    MoveTree,
    JGOFAIReviewMove,
    JGOFNumericPlayerColor,
    ColoredCircle,
    AIQualityMark,
    AI_QUALITY_BADGES,
    DEFAULT_SCORE_DIFF_THRESHOLDS,
} from "goban";
import { sameIntersection } from "@/lib/misc";
import { errorLogger } from "@/lib/misc";

const BLUE_MOVE_COLOR = "rgb(0, 130, 255)";
/* Reviews without score data cannot be classified by the score-loss
 * thresholds, so their circles use a neutral shade rather than borrowing a
 * quality color that would assert a classification the data can't support. */
const NEUTRAL_CIRCLE_COLOR = "#888888";

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
        dont_draw?: boolean,
        ai_annotation?: boolean,
    ) => void;
    setSubscript2Mark: (
        x: number,
        y: number,
        text: string,
        drawSquare?: boolean,
        ai_annotation?: boolean,
    ) => void;
    deleteCustomMark: (x: number, y: number, mark: string, drawSquare?: boolean) => void;
    setAIQualityMark: (
        x: number,
        y: number,
        quality: AIQualityMark,
        drawSquare?: boolean,
        ai_annotation?: boolean,
    ) => void;
    engine: {
        width: number;
        height: number;
        board: number[][];
    };
}

interface HeatmapGenerationResult {
    marks: { [mark: string]: string };
    colored_circles: ColoredCircle[];
}

interface HeatmapGenerationParams {
    /** The analysis of the current position. */
    ai_review_move: JGOFAIReviewMove;
    /**
     * The move that was played from this position, shown as a translucent
     * stone of its color. Clicking it follows the trunk to the next move.
     */
    played_move: MoveTree | null;
    cur_move: MoveTree;
    /** Move quality classification badge shown on the played move, when available. */
    played_move_category?: AIQualityMark | null;
    /** Delta shown on the played move when it is not among the analyzed branches. */
    played_move_delta?: number | null;
    goban: Goban;
    strength: number;
    useScore: boolean;
    hasScores: boolean;
    /** Show each suggestion's visit count underneath its score difference. */
    show_visit_counts: boolean;
}

function formatDelta(delta: number): string {
    let key = delta.toFixed(1);
    if (key === "0.0" || key === "-0.0") {
        key = "0";
    }
    if (parseFloat(key).toPrecision(2).length < key.length) {
        key = parseFloat(key).toPrecision(2);
    }
    return key;
}

function formatVisits(visits: number): string {
    if (visits >= 10000) {
        return `${Math.round(visits / 1000)}k`;
    }
    if (visits >= 1000) {
        return `${(visits / 1000).toFixed(1)}k`;
    }
    return visits.toString();
}

function hexToRgb(color: string): [number, number, number] {
    return [
        parseInt(color.slice(1, 3), 16),
        parseInt(color.slice(3, 5), 16),
        parseInt(color.slice(5, 7), 16),
    ];
}

function lerpColor(a: string, b: string, t: number): string {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg, bb] = hexToRgb(b);
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return `rgb(${r}, ${g}, ${bl})`;
}

/**
 * The circle color for an alternative move, from its score loss, using the
 * standard move quality palette. The midpoint of each quality band is that
 * quality's pure color, blending linearly toward the neighboring quality as
 * the loss approaches its band. Excellent moves get no special coloring and
 * share the "great" green: blue is reserved for the official blue move and
 * zero-loss alternatives.
 *
 * The displayed delta is negative for a loss, while the quality thresholds
 * classify a positive loss.
 */
function qualityColor(score_delta: number | undefined): string | null {
    if (score_delta === undefined) {
        return null;
    }
    const loss = -score_delta;
    const t = DEFAULT_SCORE_DIFF_THRESHOLDS;
    const stops: Array<[number, string]> = [
        [t.Great / 2, AI_QUALITY_BADGES.great.color],
        [(t.Great + t.Good) / 2, AI_QUALITY_BADGES.good.color],
        [(t.Good + t.Inaccuracy) / 2, AI_QUALITY_BADGES.inaccuracy.color],
        [(t.Inaccuracy + t.Mistake) / 2, AI_QUALITY_BADGES.mistake.color],
        /* fully a blunder at (and beyond) the blunder threshold */
        [t.Mistake, AI_QUALITY_BADGES.blunder.color],
    ];

    if (loss <= stops[0][0]) {
        return stops[0][1];
    }
    for (let i = 1; i < stops.length; i++) {
        if (loss <= stops[i][0]) {
            const [x0, c0] = stops[i - 1];
            const [x1, c1] = stops[i];
            return lerpColor(c0, c1, (loss - x0) / (x1 - x0));
        }
    }
    return stops[stops.length - 1][1];
}

function withAlpha(color: string, alpha: number): string {
    if (color.startsWith("#") && color.length === 7) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
}

/**
 * Generates marks and quality-colored circles for AI review visualization
 */
export function generateHeatmapAndMarks({
    ai_review_move,
    played_move,
    cur_move,
    played_move_category,
    played_move_delta,
    goban,
    strength,
    useScore,
    hasScores,
    show_visit_counts,
}: HeatmapGenerationParams): HeatmapGenerationResult {
    const marks: { [mark: string]: string } = {};
    const colored_circles: ColoredCircle[] = [];

    const branches = ai_review_move.branches.slice(0, 6);

    // Ensure played move is included
    let found_played_branch = false;
    if (played_move) {
        found_played_branch = branches.some(
            (branch) =>
                branch.moves.length > 0 &&
                played_move &&
                sameIntersection(branch.moves[0], played_move),
        );

        if (!found_played_branch) {
            const played_branch = ai_review_move.branches.find(
                (branch) =>
                    branch.moves.length > 0 &&
                    played_move &&
                    sameIntersection(branch.moves[0], played_move),
            );

            if (played_branch) {
                branches.push(played_branch);
                found_played_branch = true;
            }
        }
    }

    const markPlayedMove = (x: number, y: number) => {
        goban.setMark(
            x,
            y,
            played_move?.player === JGOFNumericPlayerColor.BLACK ? "black" : "white",
            true,
            true,
        );
        if (played_move_category) {
            goban.setAIQualityMark(x, y, played_move_category, true, true);
        } else {
            /* No quality classification available: neutral triangle
             * indicator. dont_draw=false so the square repaints even when no
             * colored circles follow (setColoredCircles skips its redraw
             * when the circle list is empty). */
            goban.setMark(x, y, "sub_triangle", false, true);
        }
    };

    /* Suggestions with too few visits are unreliable and are left out, unless
     * none of the alternatives would qualify - then they are all shown. The
     * blue move and the played move always show. */
    const visits_threshold = Math.min(50, 0.1 * strength);
    const max_branch_visits = Math.max(1, ...branches.map((branch) => branch.visits));
    const have_strong_alternatives = branches.some(
        (branch, i) =>
            i !== 0 &&
            branch.moves.length > 0 &&
            branch.moves[0].x !== -1 &&
            !(played_move && sameIntersection(branch.moves[0], played_move)) &&
            branch.visits >= visits_threshold,
    );

    for (let i = 0; i < branches.length; ++i) {
        const branch = branches[i];
        const mv = branch.moves[0];

        if (mv === undefined || mv.x === -1) {
            continue;
        }

        const is_played_move = !!played_move && sameIntersection(mv, played_move);

        if (
            !is_played_move &&
            i !== 0 &&
            branch.visits < visits_threshold &&
            have_strong_alternatives
        ) {
            continue;
        }

        // Skip if the intersection is already occupied - this shouldn't happen but defensive check
        if (goban.engine.board[mv.y][mv.x]) {
            if (process.env.NODE_ENV === "development") {
                errorLogger(
                    new Error(
                        "AI is suggesting moves on intersections that have already been played",
                    ),
                );
            }
            continue; // Skip this branch instead of processing it
        }

        let next_player: JGOFNumericPlayerColor;
        if (played_move) {
            next_player = played_move.player;
        } else {
            next_player =
                cur_move.player === JGOFNumericPlayerColor.BLACK
                    ? JGOFNumericPlayerColor.WHITE
                    : JGOFNumericPlayerColor.BLACK;
        }

        /* Score loss of this branch, used both for the subscript in score
         * mode and for the quality color of the circle */
        const score_delta: number | undefined =
            ai_review_move.score !== undefined && branch.score !== undefined
                ? next_player === JGOFNumericPlayerColor.WHITE
                    ? ai_review_move.score - branch.score
                    : branch.score - ai_review_move.score
                : undefined;

        const delta: number =
            useScore && hasScores && score_delta !== undefined
                ? score_delta
                : 100 *
                  (next_player === JGOFNumericPlayerColor.WHITE
                      ? ai_review_move.win_rate - branch.win_rate
                      : branch.win_rate - ai_review_move.win_rate);

        const key = formatDelta(delta);

        /* The official blue move's circle already says it loses nothing, so
         * its "0" subscript is omitted; every other suggestion always shows
         * its score difference */
        const is_pointless_blue_move_zero = i === 0 && !is_played_move && key === "0";

        if (mv && !is_pointless_blue_move_zero) {
            goban.setSubscriptMark(mv.x, mv.y, key, true, true);
        }

        if (show_visit_counts && !is_played_move) {
            goban.setSubscript2Mark(mv.x, mv.y, formatVisits(branch.visits), true, true);
        } else {
            /* clear any visit count left behind when the option is toggled off */
            goban.deleteCustomMark(mv.x, mv.y, "subscript2", true);
        }

        if (is_played_move) {
            markPlayedMove(mv.x, mv.y);
        } else if (i === 0) {
            /* The official blue move draws bold and solid */
            colored_circles.push({
                move: branch.moves[0],
                color: withAlpha(BLUE_MOVE_COLOR, 0.7),
                border_width: 0.2,
                border_color: BLUE_MOVE_COLOR,
            });
            goban.setMark(mv.x, mv.y, "blue_move", true, true);
        } else {
            /* Other suggestions shade with their share of the visits, like
             * the heatmap squares they replaced. Alternatives that lose
             * nothing ("0" entries) share the blue move's blue; the rest are
             * colored by their quality. */
            const color =
                key === "0" ? BLUE_MOVE_COLOR : (qualityColor(score_delta) ?? NEUTRAL_CIRCLE_COLOR);
            /* Opacity starts at a visible base and scales up with the
             * suggestion's visits relative to the most-visited branch */
            const fill_alpha = 0.25 + 0.55 * (branch.visits / max_branch_visits);
            colored_circles.push({
                move: branch.moves[0],
                color: withAlpha(color, fill_alpha),
                border_width: 0.1,
                border_color: color,
            });
        }
    }

    // The played move was not among the analyzed branches: still show its
    // translucent stone and, when known, its positional delta.
    if (
        played_move &&
        !found_played_branch &&
        played_move.x >= 0 &&
        !goban.engine.board[played_move.y][played_move.x]
    ) {
        if (played_move_delta !== undefined && played_move_delta !== null) {
            goban.setSubscriptMark(
                played_move.x,
                played_move.y,
                formatDelta(played_move_delta),
                true,
                true,
            );
        }
        markPlayedMove(played_move.x, played_move.y);
    }

    return { marks, colored_circles };
}
