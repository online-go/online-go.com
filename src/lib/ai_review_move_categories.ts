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
    median_score_loss: number[];
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

export function calculateAiSummaryTableData(
    ai_review: JGOFAIReview | undefined,
    goban: GobanRenderer | null | undefined,
    loading: boolean,
    categorization_method: CategorizationMethod = "old",
    scoreDiffThresholds?: ScoreDiffThresholds,
): AiSummaryTableData {
    if (!goban) {
        return {
            ai_table_rows: [["", "", "", "", ""]],
            avg_score_loss: { black: 0, white: 0 },
            median_score_loss: [0, 0],
            moves_pending: 0,
            max_entries: 0,
            should_show_table: false,
            strong_move_rate: { black: 0, white: 0 },
        };
    }

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
    const default_table_rows = [["", "", "", "", ""]];
    const avg_score_loss = { black: 0, white: 0 };
    const net_score_loss = { black: 0, white: 0 };
    const median_score_loss = [0, 0];
    let moves_missing = 0;
    let max_entries = 0;
    let should_show_table = true;

    if (!ai_review) {
        return {
            ai_table_rows: default_table_rows,
            avg_score_loss,
            median_score_loss,
            moves_pending: moves_missing,
            max_entries,
            should_show_table,
            strong_move_rate: { black: 0, white: 0 },
        };
    }

    if (!ai_review?.engine.includes("katago")) {
        should_show_table = false;
        return {
            ai_table_rows: default_table_rows,
            avg_score_loss,
            median_score_loss,
            moves_pending: moves_missing,
            max_entries,
            should_show_table,
            strong_move_rate: { black: 0, white: 0 },
        };
    }

    const handicap = goban.engine.handicap;
    //only useful when there's free placement, handicap = 1 no offset needed.
    let handicap_offset = handicapOffset(goban);
    handicap_offset = handicap_offset === 1 ? 0 : handicap_offset;
    const b_player = handicap_offset > 0 || handicap > 1 ? 1 : 0;
    const move_player_list = getPlayerColorsMoveList(goban);

    if (ai_review?.type === "fast") {
        const scores = ai_review?.scores;
        const is_uploaded = goban.config.original_sgf !== undefined;
        //one more ai review point than moves in the game, since initial board gets a score.

        if (scores === undefined) {
            return {
                ai_table_rows: default_table_rows,
                avg_score_loss,
                median_score_loss,
                moves_pending: moves_missing,
                max_entries,
                should_show_table,
                strong_move_rate: { black: 0, white: 0 },
            };
        }
        const check1 =
            !is_uploaded && goban.config.moves?.length !== (ai_review?.scores?.length ?? -1) - 1;
        // extra initial ! in all_moves which matches extra empty board score, except in handicap games for some reason.
        // so subtract 1 if black goes second == b_player
        const check2 =
            is_uploaded &&
            (goban.config as any)["all_moves"]?.split("!").length - b_player !==
                ai_review?.scores?.length;

        // if there's less than 4 moves the worst moves doesn't seem to return 3 moves, otherwise look for these three moves.
        const check3 =
            ai_review?.moves === undefined ||
            (Object.keys(ai_review?.moves).length !== 3 && scores.length > 4);
        if (check1 || check2 || check3) {
            return {
                ai_table_rows: default_table_rows,
                avg_score_loss,
                median_score_loss,
                moves_pending: moves_missing,
                max_entries,
                should_show_table,
                strong_move_rate: { black: 0, white: 0 },
            };
        }

        // we don't need the first two rows, as they're for full reviews.
        ai_table_rows.splice(0, 2);
        summary_moves_list.splice(0, 2);
        const num_rows = ai_table_rows.length;
        const move_counters: MoveCounters = {
            black: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
            white: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
        };
        const other_counters: OtherCounters = { black: 0, white: 0 };

        const score_loss_list: ScoreLossList = { black: [], white: [] };
        const worst_move_keys = Object.keys(ai_review?.moves);

        for (let j = 0; j < worst_move_keys.length; j++) {
            (scores as any)[worst_move_keys[j]] = ai_review?.moves[worst_move_keys[j]].score;
        }

        for (let j = handicap_offset; j < scores.length - 1; j++) {
            let score_diff = scores[j + 1] - scores[j];
            const is_b_player = move_player_list[j] === JGOFNumericPlayerColor.BLACK;
            const player = is_b_player ? "black" : "white";
            score_diff = is_b_player ? -1 * score_diff : score_diff;
            net_score_loss[player] += score_diff;
            score_loss_list[player].push(score_diff);

            // Use thresholds if provided, otherwise defaults
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
            } else {
                other_counters[player] += 1;
            }
        }

        let w_total_moves = 0;
        let b_total_moves = 0;

        for (const cat of currentFastCategories) {
            b_total_moves += move_counters.black[cat];
            w_total_moves += move_counters.white[cat];
        }

        console.log("Black score lost each move", net_score_loss.black);
        console.log("Black total moves", b_total_moves);
        console.log("White score lost each move", net_score_loss.white);
        console.log("White total moves", w_total_moves);

        avg_score_loss.black =
            b_total_moves > 0 ? Number((net_score_loss.black / b_total_moves).toFixed(1)) : 0;
        avg_score_loss.white =
            w_total_moves > 0 ? Number((net_score_loss.white / w_total_moves).toFixed(1)) : 0;

        score_loss_list.black.sort((a, b) => a - b);
        score_loss_list.white.sort((a, b) => a - b);

        median_score_loss[0] =
            medianList(score_loss_list.black) !== undefined
                ? Number(medianList(score_loss_list.black).toFixed(1))
                : 0;
        median_score_loss[1] =
            medianList(score_loss_list.white) !== undefined
                ? Number(medianList(score_loss_list.white).toFixed(1))
                : 0;

        for (let j = 0; j < num_rows; j++) {
            const cat = currentFastCategories[j];
            summary_moves_list[j].blackCount = move_counters.black[cat].toString();
            summary_moves_list[j].blackPercent =
                b_total_moves > 0
                    ? ((100 * move_counters.black[cat]) / b_total_moves).toFixed(1)
                    : "";
            summary_moves_list[j].whiteCount = move_counters.white[cat].toString();
            summary_moves_list[j].whitePercent =
                w_total_moves > 0
                    ? ((100 * move_counters.white[cat]) / w_total_moves).toFixed(1)
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

        should_show_table = false;

        return {
            ai_table_rows,
            avg_score_loss,
            median_score_loss,
            moves_pending: moves_missing,
            max_entries,
            should_show_table,
            strong_move_rate: { black: 0, white: 0 },
        };
    } else if (ai_review?.type === "full") {
        const num_rows = ai_table_rows.length;
        const move_counters: MoveCounters = {
            black: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
            white: { Excellent: 0, Great: 0, Good: 0, Inaccuracy: 0, Mistake: 0, Blunder: 0 },
        };
        const other_counters: OtherCounters = { black: 0, white: 0 };
        const score_loss_list: ScoreLossList = { black: [], white: [] };
        const strong_move_rate = { black: 0, white: 0 };

        const move_keys = Object.keys(ai_review?.moves);
        const is_uploaded = goban.config.original_sgf !== undefined;
        // should be one more ai review score and move branches for empty board.
        const check1 = !is_uploaded && goban.config.moves?.length !== move_keys.length - 1;
        // extra initial ! in all_moves which matches extra empty board score, except in handicap games for some reason.
        // so subtract 1 if black goes second == b_player
        const check2 =
            is_uploaded &&
            (goban.config as any)["all_moves"].split("!").length - b_player !== move_keys.length;

        if (loading || ai_review.scores === undefined) {
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
                should_show_table,
                strong_move_rate,
            };
        }

        max_entries = ai_review.scores.length;

        for (
            let current_move = handicap_offset;
            current_move < (ai_review?.scores?.length ?? 0) - 1;
            current_move++
        ) {
            if (
                ai_review?.moves[current_move] === undefined ||
                ai_review?.moves[current_move + 1] === undefined
            ) {
                moves_missing += 1;
                continue;
            }
            const player_move = ai_review?.moves[current_move + 1].move;
            const is_b_player = move_player_list[current_move] === JGOFNumericPlayerColor.BLACK;
            const player = is_b_player ? "black" : "white";

            if (categorization_method === "new") {
                let score_loss =
                    (ai_review?.moves[current_move + 1].score ?? 0) -
                    (ai_review?.moves[current_move].score ?? 0);
                score_loss = is_b_player ? -1 * score_loss : score_loss;

                // Only add positive score losses to APL sum and score loss list
                if (score_loss > 0) {
                    avg_score_loss[player] += score_loss;
                    score_loss_list[player].push(score_loss);
                }

                // Use thresholds if provided, otherwise defaults
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
            } else {
                // Original categorization logic
                const current_branches = ai_review?.moves[current_move].branches.slice(0, 6);
                const blue_move = current_branches[0].moves[0];
                let score_diff =
                    (ai_review?.moves[current_move + 1].score ?? 0) -
                    (ai_review?.moves[current_move].score ?? 0);
                score_diff = is_b_player ? -1 * score_diff : score_diff;
                avg_score_loss[player] += score_diff;
                score_loss_list[player].push(score_diff);

                if (blue_move === undefined) {
                    other_counters[player] += 1;
                } else if (player_move.x === -1) {
                    other_counters[player] += 1;
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
                        // Use thresholds if provided, otherwise defaults
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
                        } else {
                            other_counters[player] += 1;
                        }
                    }
                }
            }
        }

        // Add up the number of moves we actually counted

        let w_total_moves = 0;
        let b_total_moves = 0;

        for (const cat of currentFullCategories) {
            b_total_moves += move_counters.black[cat];
            w_total_moves += move_counters.white[cat];
        }

        // Calculate strong move rate (Excellent + Great + Good) / total moves
        strong_move_rate.black =
            b_total_moves > 0
                ? Number(
                      (
                          ((move_counters.black.Excellent +
                              move_counters.black.Great +
                              move_counters.black.Good) /
                              b_total_moves) *
                          100
                      ).toFixed(1),
                  )
                : 0;
        strong_move_rate.white =
            w_total_moves > 0
                ? Number(
                      (
                          ((move_counters.white.Excellent +
                              move_counters.white.Great +
                              move_counters.white.Good) /
                              w_total_moves) *
                          100
                      ).toFixed(1),
                  )
                : 0;

        // Calculate average score loss

        console.log("Black score lost each move", net_score_loss.black);
        console.log("Black total moves", b_total_moves);
        console.log("White score lost each move", net_score_loss.white);
        console.log("White total moves", w_total_moves);

        avg_score_loss.black =
            b_total_moves > 0 ? Number((avg_score_loss.black / b_total_moves).toFixed(1)) : 0;
        avg_score_loss.white =
            w_total_moves > 0 ? Number((avg_score_loss.white / w_total_moves).toFixed(1)) : 0;

        // Calculate median score loss
        score_loss_list.black.sort((a, b) => a - b);
        score_loss_list.white.sort((a, b) => a - b);

        median_score_loss[0] =
            medianList(score_loss_list.black) !== undefined
                ? Number(medianList(score_loss_list.black).toFixed(1))
                : 0;
        median_score_loss[1] =
            medianList(score_loss_list.white) !== undefined
                ? Number(medianList(score_loss_list.white).toFixed(1))
                : 0;

        // Assemble the categorisation data into the format needed for tabular display
        for (let j = 0; j < num_rows; j++) {
            const cat = currentFullCategories[j];
            summary_moves_list[j].blackCount = move_counters.black[cat].toString();
            summary_moves_list[j].blackPercent =
                b_total_moves > 0
                    ? ((100 * move_counters.black[cat]) / b_total_moves).toFixed(1)
                    : "";
            summary_moves_list[j].whiteCount = move_counters.white[cat].toString();
            summary_moves_list[j].whitePercent =
                w_total_moves > 0
                    ? ((100 * move_counters.white[cat]) / w_total_moves).toFixed(1)
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

        if (!check1 && !check2) {
            should_show_table = false;
        }

        return {
            ai_table_rows,
            avg_score_loss,
            median_score_loss,
            moves_pending: moves_missing,
            max_entries,
            should_show_table,
            strong_move_rate,
        };
    } else {
        return {
            ai_table_rows: default_table_rows,
            avg_score_loss,
            median_score_loss,
            moves_pending: moves_missing,
            max_entries,
            should_show_table,
            strong_move_rate: { black: 0, white: 0 },
        };
    }
}
