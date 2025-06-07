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

import { _ } from "@/lib/translate";
import { JGOFAIReview, JGOFNumericPlayerColor, GobanRenderer } from "goban";
import { sameIntersection } from "@/lib/misc";

export type MoveCategory = "Excellent" | "Great" | "Good" | "Inaccuracy" | "Mistake" | "Blunder";
export type FastCategory = Extract<MoveCategory, "Good" | "Inaccuracy" | "Mistake" | "Blunder">;

export const currentFullCategories: MoveCategory[] = [
    "Excellent",
    "Great",
    "Good",
    "Inaccuracy",
    "Mistake",
    "Blunder",
];
export const currentFastCategories: FastCategory[] = ["Good", "Inaccuracy", "Mistake", "Blunder"];

export type PlayerMoveCounts = {
    [K in MoveCategory]: number;
};

export type MoveCounters = {
    black: PlayerMoveCounts;
    white: PlayerMoveCounts;
};

export type OtherCounters = {
    black: number;
    white: number;
};

export type ScoreLossList = {
    black: number[];
    white: number[];
};

export interface AiSummaryTableData {
    ai_table_rows: string[][];
    avg_score_loss: { black: number; white: number };
    median_score_loss: { black: number; white: number };
    moves_pending: number;
    max_entries: number;
    should_show_table: boolean; // used to signal that we don't have enough data yet
    strong_move_rate: { black: number; white: number };
}

export type CategorizationMethod = "old" | "new";

export type ScoreDiffThresholds = {
    Excellent: number;
    Great: number;
    Good: number;
    Inaccuracy: number;
    Mistake: number;
};

function medianList(numbers: number[]): number {
    const mid = numbers.length === 0 ? undefined : Math.floor(numbers.length / 2);
    if (mid === undefined) {
        return -1;
    }

    const median = numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid] + numbers[mid - 1]) / 2;
    return median;
}

function handicapOffset(goban: GobanRenderer): number {
    if (
        goban &&
        goban.engine &&
        goban.engine.free_handicap_placement &&
        goban.engine.handicap > 0
    ) {
        return goban.engine.handicap;
    }
    return 0;
}

function getPlayerColorsMoveList(goban: GobanRenderer) {
    const init_move = goban.engine.move_tree;
    const move_list: any[] = [];
    let cur_move = init_move.trunk_next;

    while (cur_move !== undefined) {
        move_list.push(cur_move.player);
        cur_move = cur_move.trunk_next;
    }
    return move_list;
}

function categorizeFastReview(
    ai_review: JGOFAIReview,
    goban: GobanRenderer,
    handicap_offset: number,
    move_player_list: any[],
    scoreDiffThresholds?: ScoreDiffThresholds,
): {
    move_counters: MoveCounters;
    score_loss_list: ScoreLossList;
    total_score_loss: { black: number; white: number };
} {
    const scores = ai_review.scores;
    if (!scores) {
        throw new Error("Scores are required for fast review categorization");
    }

    const move_counters: MoveCounters = {
        black: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
        white: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
    };
    const score_loss_list: ScoreLossList = { black: [], white: [] };
    const total_score_loss = { black: 0, white: 0 };
    const worst_move_keys = Object.keys(ai_review.moves);

    for (let j = 0; j < worst_move_keys.length; j++) {
        (scores as any)[worst_move_keys[j]] = ai_review.moves[worst_move_keys[j]].score;
    }

    for (let move_index = handicap_offset; move_index < scores.length - 1; move_index++) {
        let score_diff = scores[move_index + 1] - scores[move_index];
        const is_b_player = move_player_list[move_index] === JGOFNumericPlayerColor.BLACK;
        const player = is_b_player ? "black" : "white";
        score_diff = is_b_player ? -1 * score_diff : score_diff;
        total_score_loss[player] += score_diff;
        score_loss_list[player].push(score_diff);

        const thresholds = {
            Good: scoreDiffThresholds?.Good ?? 1,
            Inaccuracy: scoreDiffThresholds?.Inaccuracy ?? 2,
            Mistake: scoreDiffThresholds?.Mistake ?? 5,
        };

        if (score_diff < thresholds.Good) {
            move_counters[player].Good += 1;
        } else if (score_diff < thresholds.Inaccuracy) {
            move_counters[player].Inaccuracy += 1;
        } else if (score_diff < thresholds.Mistake) {
            move_counters[player].Mistake += 1;
        } else if (score_diff >= thresholds.Mistake) {
            move_counters[player].Blunder += 1;
        }
    }

    return { move_counters, score_loss_list, total_score_loss };
}

function categorizeFullReviewNew(
    ai_review: JGOFAIReview,
    handicap_offset: number,
    move_player_list: any[],
    scoreDiffThresholds?: ScoreDiffThresholds,
    includeNegativeScores: boolean = false,
): {
    move_counters: MoveCounters;
    score_loss_list: ScoreLossList;
    total_score_loss: { black: number; white: number };
} {
    const move_counters: MoveCounters = {
        black: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
        white: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
    };
    const score_loss_list: ScoreLossList = { black: [], white: [] };
    const total_score_loss = { black: 0, white: 0 };

    for (
        let move_index = handicap_offset;
        move_index < (ai_review?.scores?.length ?? 0) - 1;
        move_index++
    ) {
        if (
            ai_review?.moves[move_index] === undefined ||
            ai_review?.moves[move_index + 1] === undefined
        ) {
            continue;
        }

        const is_b_player = move_player_list[move_index] === JGOFNumericPlayerColor.BLACK;
        const player = is_b_player ? "black" : "white";

        let score_loss =
            (ai_review?.moves[move_index + 1].score ?? 0) -
            (ai_review?.moves[move_index].score ?? 0);
        score_loss = is_b_player ? -1 * score_loss : score_loss;

        if (includeNegativeScores || score_loss >= 0) {
            total_score_loss[player] += score_loss;
            score_loss_list[player].push(score_loss);
        } else {
            // treat it as zero
            score_loss_list[player].push(0);
        }

        const thresholds = {
            Excellent: scoreDiffThresholds?.Excellent ?? 0.2,
            Great: scoreDiffThresholds?.Great ?? 0.6,
            Good: scoreDiffThresholds?.Good ?? 1.0,
            Inaccuracy: scoreDiffThresholds?.Inaccuracy ?? 2.0,
            Mistake: scoreDiffThresholds?.Mistake ?? 5.0,
        };

        if (score_loss < thresholds.Excellent) {
            move_counters[player].Excellent += 1;
        } else if (score_loss < thresholds.Great) {
            move_counters[player].Great += 1;
        } else if (score_loss < thresholds.Good) {
            move_counters[player].Good += 1;
        } else if (score_loss < thresholds.Inaccuracy) {
            move_counters[player].Inaccuracy += 1;
        } else if (score_loss < thresholds.Mistake) {
            move_counters[player].Mistake += 1;
        } else {
            move_counters[player].Blunder += 1;
        }
    }

    return { move_counters, score_loss_list, total_score_loss };
}

function categorizeFullReviewOld(
    ai_review: JGOFAIReview,
    handicap_offset: number,
    move_player_list: any[],
    scoreDiffThresholds?: ScoreDiffThresholds,
): {
    move_counters: MoveCounters;
    score_loss_list: ScoreLossList;
    total_score_loss: { black: number; white: number };
} {
    const move_counters: MoveCounters = {
        black: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
        white: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
    };
    const score_loss_list: ScoreLossList = { black: [], white: [] };
    const total_score_loss = { black: 0, white: 0 };

    for (
        let current_move = handicap_offset;
        current_move < (ai_review?.scores?.length ?? 0) - 1;
        current_move++
    ) {
        if (
            ai_review?.moves[current_move] === undefined ||
            ai_review?.moves[current_move + 1] === undefined
        ) {
            continue;
        }

        const player_move = ai_review?.moves[current_move + 1].move;
        const is_b_player = move_player_list[current_move] === JGOFNumericPlayerColor.BLACK;
        const player = is_b_player ? "black" : "white";

        const current_branches = ai_review?.moves[current_move].branches.slice(0, 6);
        const blue_move = current_branches[0].moves[0];
        let score_diff =
            (ai_review?.moves[current_move + 1].score ?? 0) -
            (ai_review?.moves[current_move].score ?? 0);
        score_diff = is_b_player ? -1 * score_diff : score_diff;
        total_score_loss[player] += score_diff;
        score_loss_list[player].push(score_diff);

        if (blue_move === undefined) {
            continue;
        } else if (player_move.x === -1) {
            continue;
        } else {
            if (sameIntersection(blue_move, player_move)) {
                move_counters[player].Excellent += 1;
            } else if (
                current_branches.some((branch, index) => {
                    if (!branch.moves.length) {
                        return false;
                    }

                    const check =
                        index > 0 &&
                        sameIntersection(branch.moves[0], player_move) &&
                        branch.visits >= Math.min(50, 0.1 * (ai_review?.strength ?? 0));
                    return check;
                })
            ) {
                move_counters[player].Great += 1;
            } else {
                const thresholds = {
                    Good: scoreDiffThresholds?.Good ?? 1,
                    Inaccuracy: scoreDiffThresholds?.Inaccuracy ?? 2,
                    Mistake: scoreDiffThresholds?.Mistake ?? 5,
                };
                if (score_diff < thresholds.Good) {
                    move_counters[player].Good += 1;
                } else if (score_diff < thresholds.Inaccuracy) {
                    move_counters[player].Inaccuracy += 1;
                } else if (score_diff < thresholds.Mistake) {
                    move_counters[player].Mistake += 1;
                } else if (score_diff >= thresholds.Mistake) {
                    move_counters[player].Blunder += 1;
                }
            }
        }
    }

    return { move_counters, score_loss_list, total_score_loss };
}

function validateReviewData(
    ai_review: JGOFAIReview,
    goban: GobanRenderer,
    b_player: number,
): { isValid: boolean; shouldShowTable: boolean } {
    const is_uploaded = goban.config.original_sgf !== undefined;
    const scores = ai_review.scores;

    if (!scores) {
        return { isValid: false, shouldShowTable: true };
    }

    // Common validation for both review types
    const check1 = !is_uploaded && goban.config.moves?.length !== scores.length - 1;
    const check2 =
        is_uploaded &&
        (goban.config as any)["all_moves"]?.split("!").length - b_player !== scores.length;

    if (check1 || check2) {
        return { isValid: false, shouldShowTable: true };
    }

    // Fast review specific validation
    if (ai_review.type === "fast") {
        const check3 =
            ai_review.moves === undefined ||
            (Object.keys(ai_review.moves).length !== 3 && scores.length > 4);
        if (check3) {
            return { isValid: false, shouldShowTable: true };
        }
        return { isValid: true, shouldShowTable: false };
    }

    // Full review specific validation
    if (ai_review.type === "full") {
        return { isValid: true, shouldShowTable: false };
    }

    return { isValid: false, shouldShowTable: true };
}

function setupTableData(reviewType: "fast" | "full"): {
    ai_table_rows: string[][];
    summary_moves_list: {
        blackCount: string;
        blackPercent: string;
        whiteCount: string;
        whitePercent: string;
    }[];
    num_rows: number;
} {
    const summary_moves_list = [
        { blackCount: "", blackPercent: "", whiteCount: "", whitePercent: "" },
        { blackCount: "", blackPercent: "", whiteCount: "", whitePercent: "" },
        { blackCount: "", blackPercent: "", whiteCount: "", whitePercent: "" },
        { blackCount: "", blackPercent: "", whiteCount: "", whitePercent: "" },
        { blackCount: "", blackPercent: "", whiteCount: "", whitePercent: "" },
        { blackCount: "", blackPercent: "", whiteCount: "", whitePercent: "" },
    ];

    const ai_table_rows = [
        [_("Excellent")],
        [_("Great")],
        [_("Good")],
        [_("Inaccuracy")],
        [_("Mistake")],
        [_("Blunder")],
    ];

    if (reviewType === "fast") {
        ai_table_rows.splice(0, 2);
        summary_moves_list.splice(0, 2);
    }

    return {
        ai_table_rows,
        summary_moves_list,
        num_rows: ai_table_rows.length,
    };
}

export function calculateAiSummaryTableData(
    ai_review: JGOFAIReview | undefined,
    goban: GobanRenderer | null | undefined,
    loading: boolean,
    categorization_method: CategorizationMethod = "old",
    scoreDiffThresholds?: ScoreDiffThresholds,
    includeNegativeScores: boolean = false,
): AiSummaryTableData {
    if (!goban) {
        return {
            ai_table_rows: [["", "", "", "", ""]],
            avg_score_loss: { black: 0, white: 0 },
            median_score_loss: { black: 0, white: 0 },
            moves_pending: 0,
            max_entries: 0,
            should_show_table: false,
            strong_move_rate: { black: 0, white: 0 },
        };
    }

    if (
        !ai_review ||
        !ai_review.engine.includes("katago") ||
        !["fast", "full"].includes(ai_review.type)
    ) {
        return {
            ai_table_rows: [["", "", "", "", ""]],
            avg_score_loss: { black: 0, white: 0 },
            median_score_loss: { black: 0, white: 0 },
            moves_pending: 0,
            max_entries: 0,
            should_show_table: true, // not sure why, it's just always been like this
            strong_move_rate: { black: 0, white: 0 },
        };
    }

    // Make sure the review is valid
    const handicap = goban.engine.handicap;
    let handicap_offset = handicapOffset(goban);
    handicap_offset = handicap_offset === 1 ? 0 : handicap_offset;
    const b_player = handicap_offset > 0 || handicap > 1 ? 1 : 0;
    const move_player_list = getPlayerColorsMoveList(goban);

    const { isValid, shouldShowTable } = validateReviewData(ai_review, goban, b_player);
    if (!isValid) {
        return {
            ai_table_rows: [["", "", "", "", ""]],
            avg_score_loss: { black: 0, white: 0 },
            median_score_loss: { black: 0, white: 0 },
            moves_pending: 0,
            max_entries: 0,
            should_show_table: shouldShowTable,
            strong_move_rate: { black: 0, white: 0 },
        };
    }

    const { ai_table_rows, summary_moves_list, num_rows } = setupTableData(ai_review.type);
    const avg_score_loss = { black: 0, white: 0 };
    const median_score_loss = { black: 0, white: 0 };
    const moves_missing = 0;
    const max_entries = ai_review.scores?.length ?? 0;

    if (loading) {
        for (let j = 0; j < ai_table_rows.length; j++) {
            ai_table_rows[j] = ai_table_rows[j].concat([
                summary_moves_list[j].blackCount,
                summary_moves_list[j].blackPercent,
                summary_moves_list[j].whiteCount,
                summary_moves_list[j].whitePercent,
            ]);
        }
        return {
            ai_table_rows,
            avg_score_loss,
            median_score_loss,
            moves_pending: moves_missing,
            max_entries,
            should_show_table: shouldShowTable,
            strong_move_rate: { black: 0, white: 0 },
        };
    }

    // OK, we can do the actual categorization now
    const result =
        ai_review.type === "fast"
            ? categorizeFastReview(
                  ai_review,
                  goban,
                  handicap_offset,
                  move_player_list,
                  scoreDiffThresholds,
              )
            : categorization_method === "new"
              ? categorizeFullReviewNew(
                    ai_review,
                    handicap_offset,
                    move_player_list,
                    scoreDiffThresholds,
                    includeNegativeScores,
                )
              : categorizeFullReviewOld(
                    ai_review,
                    handicap_offset,
                    move_player_list,
                    scoreDiffThresholds,
                );

    const { move_counters, score_loss_list, total_score_loss } = result;

    const categories = ai_review.type === "fast" ? currentFastCategories : currentFullCategories;

    // Calculate average score loss
    console.log("black total_score_loss", total_score_loss.black);
    console.log("black score_loss_list length", score_loss_list.black.length);
    console.log("black score_loss_list", score_loss_list.black);
    console.log("white total_score_loss", total_score_loss.white);
    console.log("white score_loss_list length", score_loss_list.white.length);
    console.log("white score_loss_list", score_loss_list.white);

    avg_score_loss.black =
        score_loss_list.black.length > 0
            ? Number((total_score_loss.black / score_loss_list.black.length).toFixed(1))
            : 0;
    avg_score_loss.white =
        score_loss_list.white.length > 0
            ? Number((total_score_loss.white / score_loss_list.white.length).toFixed(1))
            : 0;

    // Calculate median score loss
    const sortedScoreLoss = {
        black: [...score_loss_list.black].sort((a, b) => a - b),
        white: [...score_loss_list.white].sort((a, b) => a - b),
    };

    median_score_loss.black = Number(medianList(sortedScoreLoss.black).toFixed(1));
    median_score_loss.white = Number(medianList(sortedScoreLoss.white).toFixed(1));

    // Helper function to calculate strong move rate for a player
    const calculateStrongMoveRate = (counters: PlayerMoveCounts, totalMoves: number): number => {
        if (totalMoves === 0) {
            return 0;
        }
        return Number(
            (((counters.Excellent + counters.Great + counters.Good) / totalMoves) * 100).toFixed(1),
        );
    };

    // SMR

    const totalMoves = {
        black: Object.values(move_counters.black).reduce((sum, count) => sum + count, 0),
        white: Object.values(move_counters.white).reduce((sum, count) => sum + count, 0),
    };
    const strong_move_rate =
        ai_review.type === "full"
            ? {
                  black: calculateStrongMoveRate(move_counters.black, totalMoves.black),
                  white: calculateStrongMoveRate(move_counters.white, totalMoves.white),
              }
            : { black: 0, white: 0 };

    //  Assemble table data
    for (let j = 0; j < num_rows; j++) {
        const cat = categories[j];
        summary_moves_list[j].blackCount = move_counters.black[cat].toString();
        summary_moves_list[j].blackPercent =
            totalMoves.black > 0
                ? ((100 * move_counters.black[cat]) / totalMoves.black).toFixed(1)
                : "";
        summary_moves_list[j].whiteCount = move_counters.white[cat].toString();
        summary_moves_list[j].whitePercent =
            totalMoves.white > 0
                ? ((100 * move_counters.white[cat]) / totalMoves.white).toFixed(1)
                : "";
    }

    for (let j = 0; j < ai_table_rows.length; j++) {
        ai_table_rows[j] = ai_table_rows[j].concat([
            summary_moves_list[j].blackCount,
            summary_moves_list[j].blackPercent,
            summary_moves_list[j].whiteCount,
            summary_moves_list[j].whitePercent,
        ]);
    }

    return {
        ai_table_rows,
        avg_score_loss,
        median_score_loss,
        moves_pending: moves_missing,
        max_entries,
        should_show_table: shouldShowTable,
        strong_move_rate,
    };
}
