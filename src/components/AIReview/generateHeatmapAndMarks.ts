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
    ScoreDiffThresholds,
} from "goban";
import { sameIntersection } from "@/lib/misc";
import { errorLogger } from "@/lib/misc";

/* Light theme value of --ai-blue-move */
const BLUE_MOVE_COLOR = "#0082FF";
/* Fallback for a suggestion with no loss data at all */
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

/** Linear blend of two "#rrggbb" colors, returned in the same form */
export function lerpColor(a: string, b: string, t: number): string {
    const [ar, ag, ab] = hexToRgb(a);
    const [br, bg, bb] = hexToRgb(b);
    const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");
    return `#${hex(ar + (br - ar) * t)}${hex(ag + (bg - ag) * t)}${hex(ab + (bb - ab) * t)}`;
}

/**
 * Win rate loss thresholds, in percentage points, that pair with
 * DEFAULT_SCORE_DIFF_THRESHOLDS. A point is worth roughly two to four percent
 * of win rate in a close middle game, so these sit at about twice the score
 * thresholds.
 */
export const DEFAULT_WIN_RATE_DIFF_THRESHOLDS: ScoreDiffThresholds = {
    Excellent: 0.4,
    Great: 1.2,
    Good: 2.4,
    Inaccuracy: 8.0,
    Mistake: 20.0,
};

export type QualityPalette = { [quality in AIQualityMark]: string } & { blue_move: string };

function cssColor(style: CSSStyleDeclaration | null, name: string, fallback: string): string {
    const value = style?.getPropertyValue(name).trim();
    return value && /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
}

/**
 * The move quality colors for the current theme, read from the
 * `--move-quality-*` and `--ai-blue-move` CSS variables that also color the
 * board badges and the summary table, so every quality indicator agrees.
 * Falls back to the light theme defaults where the variables are not
 * available.
 */
export function resolveQualityPalette(): QualityPalette {
    const style =
        typeof document === "undefined" ? null : getComputedStyle(document.documentElement);
    const palette = {} as QualityPalette;
    for (const quality of Object.keys(AI_QUALITY_BADGES) as AIQualityMark[]) {
        palette[quality] = cssColor(
            style,
            `--move-quality-${quality}`,
            AI_QUALITY_BADGES[quality].color,
        );
    }
    palette.blue_move = cssColor(style, "--ai-blue-move", BLUE_MOVE_COLOR);
    return palette;
}

/**
 * Where a loss falls on the quality scale, as a fractional index into the
 * quality color stops: 0 is excellent, 1 great, and so on up to 5 for a
 * blunder. The midpoint of each quality band is that quality's whole-number
 * index, so integer positions are pure colors and fractional positions blend
 * toward the neighboring quality. The blunder stop sits at the blunder
 * threshold itself, so any loss at or beyond it is fully red.
 */
function qualitySeverity(loss: number, t: ScoreDiffThresholds): number {
    const stops = [
        t.Excellent / 2,
        (t.Excellent + t.Great) / 2,
        (t.Great + t.Good) / 2,
        (t.Good + t.Inaccuracy) / 2,
        (t.Inaccuracy + t.Mistake) / 2,
        t.Mistake,
    ];

    if (loss <= stops[0]) {
        return 0;
    }
    for (let i = 1; i < stops.length; i++) {
        if (loss <= stops[i]) {
            return i - 1 + (loss - stops[i - 1]) / (stops[i] - stops[i - 1]);
        }
    }
    return stops.length - 1;
}

/**
 * How far a circle color may travel from great toward excellent. Circles at
 * the excellent end keep a little green so they read as part of the green
 * scale rather than as a second kind of blue move.
 */
export const EXCELLENT_BLEND_CAP = 0.75;

/**
 * The circle color for an alternative move, using the standard move quality
 * palette. Both the score loss and the win rate loss are measured against
 * their own thresholds and whichever is worse decides the color: a move that
 * throws away many points in a decided game still reads as a blunder in win
 * rate view, and a move that swings a close game still reads as a blunder in
 * score view. The excellent end of the scale is capped at
 * EXCELLENT_BLEND_CAP toward the excellent blue-green; pure blue is
 * reserved for the official blue move.
 *
 * Losses are positive numbers; the win rate loss is in percentage points.
 * Returns null when neither metric is available.
 */
export function qualityColor(
    score_loss: number | undefined,
    win_rate_loss: number | undefined,
    palette: QualityPalette = resolveQualityPalette(),
): string | null {
    const stops = [
        lerpColor(palette.great, palette.excellent, EXCELLENT_BLEND_CAP),
        palette.great,
        palette.good,
        palette.inaccuracy,
        palette.mistake,
        palette.blunder,
    ];
    const severities: number[] = [];
    if (score_loss !== undefined) {
        severities.push(qualitySeverity(score_loss, DEFAULT_SCORE_DIFF_THRESHOLDS));
    }
    if (win_rate_loss !== undefined) {
        severities.push(qualitySeverity(win_rate_loss, DEFAULT_WIN_RATE_DIFF_THRESHOLDS));
    }
    if (severities.length === 0) {
        return null;
    }

    const severity = Math.max(...severities);
    const i = Math.floor(severity);
    const frac = severity - i;
    if (frac === 0) {
        return stops[i];
    }
    return lerpColor(stops[i], stops[i + 1], frac);
}

export function withAlpha(color: string, alpha: number): string {
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
    const palette = resolveQualityPalette();

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

        const win_rate_delta: number =
            100 *
            (next_player === JGOFNumericPlayerColor.WHITE
                ? ai_review_move.win_rate - branch.win_rate
                : branch.win_rate - ai_review_move.win_rate);

        const delta: number =
            useScore && hasScores && score_delta !== undefined ? score_delta : win_rate_delta;

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
                color: withAlpha(palette.blue_move, 0.7),
                border_width: 0.2,
                border_color: palette.blue_move,
            });
            goban.setMark(mv.x, mv.y, "blue_move", true, true);
        } else {
            /* Other suggestions shade with their share of the visits, like
             * the heatmap squares they replaced, and are colored by their
             * quality. The displayed delta is negative for a loss, while the
             * quality thresholds classify a positive loss. */
            const color =
                qualityColor(
                    score_delta === undefined ? undefined : -score_delta,
                    -win_rate_delta,
                    palette,
                ) ?? NEUTRAL_CIRCLE_COLOR;
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
