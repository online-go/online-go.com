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

import * as React from "react";
import { useState, useCallback, useEffect, useMemo } from "react";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { UIPush } from "@/components/UIPush";
import { openBecomeASiteSupporterModal } from "@/views/Supporter";
import { errorAlerter, errorLogger } from "@/lib/misc";
import { toast } from "@/lib/toast";
import { post } from "@/lib/requests";
import { _ } from "@/lib/translate";
import { ReviewChart } from "./ReviewChart";
import { SummaryTable } from "./SummaryTable";
import {
    MoveTree,
    JGOFAIReview,
    JGOFAIReviewMove,
    DEFAULT_SCORE_DIFF_THRESHOLDS,
    ScoreDiffThresholds,
    ColoredCircle,
} from "goban";
import { alert } from "@/lib/swal_config";
import { useGobanControllerOrNull } from "@/views/Game/goban_context";
import { MODERATOR_POWERS } from "@/lib/moderation";

// Sub components and utilities
import { ReviewSelector } from "./ReviewSelector";
import { WorstMovesList } from "./WorstMovesList";
import { ScoreWinRateToggle } from "./ScoreWinRateToggle";
import {
    powerToSeeTable,
    canStartFullReview,
    canRequestVariationAnalysis,
    trimMaxMoves,
    fillAIMarksBacktracking,
} from "./utils";
import { useAIReviewData, useAIReviewList, useWorstMoves } from "./hooks";

// Constants
const WORST_MOVES_SHOWN = 6;
const TOAST_DURATION_MS = 2000;
const COMPOSITE_KEY_MULTIPLIER = 1000000;

import { generateHeatmapAndMarks } from "./generateHeatmapAndMarks";
import { Errcode } from "@/components/Errcode";

export interface AIReviewEntry {
    move_number: number;
    win_rate: number;
    score: number;
    num_variations: number;
}

interface AIReviewProperties {
    move: MoveTree;
    game_id: number;
    hidden: boolean;
    onAIReviewSelected: (ai_review: JGOFAIReview) => void;
}

/**
 * This component displays AI analysis of Go game moves, including win rates,
 * score estimates, and move quality assessments. It manages multiple AI reviews,
 * handles real-time updates via WebSocket, and provides interactive visualization
 * of AI-suggested variations.
 */
export function AIReview({ move, game_id, hidden, onAIReviewSelected }: AIReviewProperties) {
    const gobanController = useGobanControllerOrNull();

    // State management
    const [useScore, setUseScore] = useState(preferences.get("ai-review-use-score"));
    const [showTable, setShowTable] = useState(false);
    const [tableHidden, setTableHidden] = useState(!preferences.get("ai-summary-table-show"));
    const [scoreDiffThresholds, setScoreDiffThresholds] = useState<ScoreDiffThresholds>(() => {
        const current = preferences.get("ai-review-score-diff-thresholds") || {};
        return { ...DEFAULT_SCORE_DIFF_THRESHOLDS, ...current };
    });
    const [includeNegativeScoreLoss, setIncludeNegativeScoreLoss] = useState(false);
    const [currentPopupMoves, setCurrentPopupMoves] = useState<number[]>([]);

    const {
        loading,
        reviewing,
        aiReviews,
        selectedAiReview,
        setSelectedAiReview: setSelectedAiReviewInList,
        refresh,
        addReview,
    } = useAIReviewList(game_id);

    const {
        reviewData,
        setSelectedAIReview: setSelectedAIReviewData,
        updateCount,
    } = useAIReviewData({
        gameId: game_id,
        moveTree: gobanController?.goban?.engine?.move_tree,
    });

    // Sync the initially selected review to AIReviewData
    useEffect(() => {
        if (selectedAiReview && !reviewData) {
            // Only set if we have a selected review but no reviewData yet
            // This handles the initial auto-selection from useAIReviewList
            setSelectedAIReviewData(selectedAiReview);
            onAIReviewSelected(selectedAiReview);
        }
    }, [selectedAiReview, reviewData, setSelectedAIReviewData, onAIReviewSelected]);

    // Get user and permissions
    const user = data.get("user");
    const canViewTable = useMemo(
        () => user.is_moderator || powerToSeeTable(user.moderator_powers),
        [user.is_moderator, user.moderator_powers],
    );

    const showFullReviewButton = useMemo(
        () =>
            gobanController
                ? canStartFullReview(user, gobanController, gobanController.goban)
                : false,
        [user, gobanController],
    );

    // Initialize table visibility
    useEffect(() => {
        setShowTable(canViewTable);
    }, [canViewTable]);

    // Handle AI review selection
    const handleAIReviewSelect = useCallback(
        (ai_review: JGOFAIReview) => {
            setSelectedAiReviewInList(ai_review);
            setSelectedAIReviewData(ai_review);
            onAIReviewSelected(ai_review);
            setShowTable(canViewTable);
        },
        [setSelectedAiReviewInList, setSelectedAIReviewData, onAIReviewSelected, canViewTable],
    );

    // Sync AI review data when reviewData or selectedAiReview changes
    useEffect(() => {
        if (!reviewData || !selectedAiReview) {
            return;
        }

        for (const k in reviewData.moves) {
            const move = reviewData.moves[k];
            reviewData.win_rates[move.move_number] = move.win_rate;
            if (move.score !== undefined && reviewData.scores !== undefined) {
                reviewData.scores[move.move_number] = move.score;
            }
        }

        // Fill in missing win rates
        let last_win_rate = 0.5;
        for (let move_number = 0; move_number < reviewData.win_rates.length; ++move_number) {
            if (reviewData.win_rates[move_number] === undefined) {
                reviewData.win_rates[move_number] = last_win_rate;
            }
            last_win_rate = reviewData.win_rates[move_number];
        }
    }, [reviewData, selectedAiReview, updateCount]);

    // Start new AI review
    const startNewAIReview = useCallback(
        (analysis_type: "fast" | "full", engine: "leela_zero" | "katago") => {
            if (user.anonymous) {
                void alert.fire(_("Please sign in first"));
            } else {
                if (
                    user.supporter ||
                    user.professional ||
                    user.is_moderator ||
                    (user.moderator_powers & MODERATOR_POWERS.AI_DETECTOR) !== 0
                ) {
                    post(`games/${game_id}/ai_reviews`, {
                        type: analysis_type,
                        engine: engine,
                    })
                        .then((newReview: JGOFAIReview) => {
                            toast(<div>{_("Analysis started")}</div>, TOAST_DURATION_MS);
                            // Immediately select the new review
                            if (newReview.id && newReview.uuid) {
                                addReview(newReview);
                                handleAIReviewSelect(newReview);
                                refresh();
                            }
                        })
                        .catch(errorAlerter);
                } else {
                    openBecomeASiteSupporterModal();
                }
            }
        },
        [user, game_id, addReview, handleAIReviewSelect, refresh],
    );

    // Handle AI review updates
    const handleAIReviewUpdate = useCallback(
        (data: { refresh?: boolean }) => {
            if ("refresh" in data) {
                refresh();
            }
        },
        [refresh],
    );

    // Calculate table data
    const calculateAndUpdateTableData = useCallback(() => {
        if (!gobanController?.goban || !reviewData) {
            return;
        }

        reviewData.categorize(
            gobanController.goban.engine,
            scoreDiffThresholds,
            includeNegativeScoreLoss,
        );
    }, [gobanController, reviewData, scoreDiffThresholds, includeNegativeScoreLoss]);

    // State for win rate and score from highlights update
    const [winRateScore, setWinRateScore] = useState<[number, number]>([0, 0]);

    /**
     * Retrieves AI review entries for the current variation branch
     */
    const getVariationReviewEntries = useCallback((): Array<AIReviewEntry> => {
        if (!reviewData) {
            return [];
        }

        const ret: Array<AIReviewEntry> = [];
        let cur_move = move;
        const trunk_move = cur_move.getBranchPoint();
        const trunk_move_string = trunk_move.getMoveStringToThisPoint();

        while (cur_move.id !== trunk_move.id) {
            const cur_move_string = cur_move.getMoveStringToThisPoint();
            const var_string = cur_move_string.slice(trunk_move_string.length);
            const var_key = `${trunk_move.move_number}-${var_string}`;

            if (reviewData.analyzed_variations && var_key in reviewData.analyzed_variations) {
                const analysis = reviewData.analyzed_variations[var_key];
                ret.push({
                    move_number: analysis.move_number,
                    win_rate: analysis.win_rate,
                    score: analysis.score || 0,
                    num_variations: analysis.branches.length,
                });
            }

            if (!cur_move.parent) {
                break;
            }
            cur_move = cur_move.parent;
        }

        ret.reverse();
        return ret;
    }, [reviewData, move, updateCount]);

    /**
     * Updates the board visualization with AI analysis marks, heatmaps, and colored circles
     * @returns Tuple of [win_rate, score] for current position
     */
    const updateHighlightsMarksAndHeatmaps = useCallback((): [number, number] => {
        if (!reviewData || !gobanController?.goban) {
            return [0, 0];
        }

        const goban = gobanController.goban;
        let ai_review_move: JGOFAIReviewMove | undefined;
        let win_rate: number;
        let score: number;
        let next_move: MoveTree | null = null;
        const cur_move = move;
        const trunk_move = cur_move.getBranchPoint();
        const move_number = trunk_move.move_number;

        const trunk_move_string = trunk_move.getMoveStringToThisPoint();
        const cur_move_string = cur_move.getMoveStringToThisPoint();
        const var_string = cur_move_string.slice(trunk_move_string.length);
        const var_key = `${trunk_move.move_number}-${var_string}`;
        let have_variation_results = false;

        // Check for interactive review move
        if (reviewData.analyzed_variations && var_key in reviewData.analyzed_variations) {
            have_variation_results = true;
            ai_review_move = reviewData.analyzed_variations[var_key];
        } else if (reviewData.moves[move_number]) {
            ai_review_move = reviewData.moves[move_number];
        }

        const win_rates = reviewData?.win_rates || [];
        const scores = reviewData?.scores || [];

        if (ai_review_move) {
            win_rate = ai_review_move.win_rate;
            score = ai_review_move.score || 0;
        } else {
            win_rate = win_rates[move_number] || reviewData.win_rate;
            score = scores[move_number];

            if (!score && score !== 0) {
                if (scores?.some((s) => typeof s === "number")) {
                    const last_score =
                        scores
                            .slice(0, move_number + 1)
                            .reverse()
                            .find((s) => s) || 0;
                    if (last_score && last_score !== 0) {
                        score = last_score;
                    }
                }
            }
        }

        let marks: { [mark: string]: string } = {};
        let heatmap: Array<Array<number>> | null = null;
        let colored_circles: ColoredCircle[] = [];

        try {
            if ((cur_move.trunk || have_variation_results) && ai_review_move) {
                next_move = cur_move.trunk_next || null;

                // Use the extracted heatmap generator
                const result = generateHeatmapAndMarks({
                    ai_review_move,
                    next_move,
                    cur_move,
                    goban,
                    strength: reviewData.strength,
                    useScore,
                    hasScores: !!reviewData.scores,
                });

                marks = result.marks;
                heatmap = result.heatmap;
                colored_circles = result.colored_circles;
            } else {
                if (!cur_move.trunk) {
                    requestAnalysisOfVariation(cur_move, trunk_move);
                }
                fillAIMarksBacktracking(
                    cur_move,
                    trunk_move,
                    marks,
                    reviewData || null,
                    goban.engine || null,
                );
            }
        } catch (e) {
            errorLogger(e);
        }

        marks = trimMaxMoves(marks);

        try {
            goban.setMarks(marks, true, true);
            goban.setHeatmap(heatmap || undefined, true);
            goban.setColoredCircles(colored_circles, false);
        } catch (e) {
            errorLogger(e);
        }

        return [win_rate, score];
    }, [reviewData, gobanController, move, useScore, updateCount]);

    /**
     * Requests AI analysis for a specific variation branch
     * @param cur_move Current move in the variation
     * @param trunk_move Main branch move from which variation diverges
     * @returns True if request was initiated, false otherwise
     */
    const requestAnalysisOfVariation = useCallback(
        (cur_move: MoveTree, trunk_move: MoveTree): boolean => {
            if (!gobanController?.goban || !reviewData || !selectedAiReview?.id) {
                return false;
            }

            if (!canRequestVariationAnalysis(user, gobanController.goban, gobanController)) {
                return false;
            }

            reviewData.analyze_variation(
                reviewData.uuid,
                game_id,
                Number(selectedAiReview.id),
                cur_move,
                trunk_move,
            );

            return true;
        },
        [gobanController, reviewData, selectedAiReview, user, game_id],
    );

    // Handle threshold changes
    const handleThresholdChange = useCallback(
        (category: string, value: number) => {
            setScoreDiffThresholds((prev) => {
                const updated = { ...prev, [category]: value };
                preferences.set("ai-review-score-diff-thresholds", updated);
                return updated;
            });
            calculateAndUpdateTableData();
        },
        [calculateAndUpdateTableData],
    );

    const handleResetThresholds = useCallback(() => {
        preferences.set("ai-review-score-diff-thresholds", DEFAULT_SCORE_DIFF_THRESHOLDS);
        setScoreDiffThresholds({ ...DEFAULT_SCORE_DIFF_THRESHOLDS });
        calculateAndUpdateTableData();
    }, [calculateAndUpdateTableData]);

    const handleToggleNegativeScores = useCallback(() => {
        setIncludeNegativeScoreLoss((prev) => !prev);
        calculateAndUpdateTableData();
    }, [calculateAndUpdateTableData]);

    // Calculate worst moves using the custom hook
    // Include updateCount to recalculate when review data updates
    // Use gobanController as a dependency to recalculate when it becomes available
    const worst_move_list = useWorstMoves(
        reviewData || null,
        gobanController?.goban || null,
        // Create a composite key that changes when either updateCount or goban availability changes
        updateCount + (gobanController?.goban ? COMPOSITE_KEY_MULTIPLIER : 0),
    );

    // Update highlights and marks when review data or move changes
    // CRITICAL: Include updateCount to re-run when review data syncs internally
    useEffect(() => {
        if (reviewData && !hidden) {
            const [newWinRate, newScore] = updateHighlightsMarksAndHeatmaps();
            setWinRateScore([newWinRate, newScore]);
        } else {
            setWinRateScore([0, 0]);
        }
    }, [reviewData, hidden, move, updateHighlightsMarksAndHeatmaps, updateCount]);

    // Update table data when dependencies change
    useEffect(() => {
        if (showTable) {
            calculateAndUpdateTableData();
        }
    }, [showTable, calculateAndUpdateTableData]);

    // Prepare data for rendering
    const [win_rate, score] = winRateScore;

    const ai_review_chart_entries: Array<AIReviewEntry> =
        reviewData?.win_rates?.map((x, idx) => ({
            move_number: idx,
            win_rate: x,
            score: reviewData?.moves?.[idx]?.score || 0,
            num_variations: reviewData?.moves?.[idx]?.branches.length || 0,
        })) || [];

    const ai_review_chart_variation_entries = getVariationReviewEntries();

    const cur_move = move;
    const trunk_move = cur_move.getBranchPoint();
    const move_number = trunk_move.move_number;
    const variation_move_number =
        cur_move.move_number !== trunk_move.move_number ? cur_move.move_number : -1;

    const show_become_supporter_text =
        !user.anonymous && !user.supporter && !user.is_moderator && !user.professional;

    // Early returns for critical missing data
    if (!gobanController?.goban?.engine || !move) {
        return null;
    }

    if (loading) {
        return null;
    }

    // Handle hidden or no review data states
    if (!reviewData || hidden) {
        return (
            <div className="AIReview">
                <UIPush
                    event="ai-review"
                    channel={`game-${game_id}`}
                    action={handleAIReviewUpdate}
                />
                {!hidden && aiReviews.length === 0 && reviewing && (
                    <div className="reviewing">
                        <span>{_("Queuing AI review")}</span>
                        <i className="fa fa-desktop slowstrobe"></i>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="AIReview">
            <UIPush event="ai-review" channel={`game-${game_id}`} action={handleAIReviewUpdate} />

            {aiReviews.length >= 1 && (
                <ReviewSelector
                    reviews={aiReviews}
                    selectedReview={selectedAiReview}
                    onReviewSelect={handleAIReviewSelect}
                    onStartNewReview={startNewAIReview}
                    showNewReviewButton={showFullReviewButton}
                    winRate={win_rate}
                    score={score}
                    useScore={useScore}
                    hasScores={!!reviewData.scores}
                />
            )}

            {reviewData.error ? (
                <React.Fragment>
                    <h3>{_("Error")}</h3>
                    <Errcode message={reviewData.error} />
                </React.Fragment>
            ) : (
                <React.Fragment>
                    {reviewData && reviewData.win_rates && (
                        <React.Fragment>
                            <ReviewChart
                                ai_review={reviewData}
                                entries={ai_review_chart_entries}
                                variation_entries={ai_review_chart_variation_entries}
                                update_count={updateCount}
                                move_number={move_number}
                                variation_move_number={variation_move_number}
                                set_move={(num: number) => gobanController.gotoMove(num)}
                                use_score={useScore}
                                highlighted_moves={
                                    currentPopupMoves.length > 0
                                        ? currentPopupMoves
                                        : worst_move_list
                                              .slice(0, WORST_MOVES_SHOWN)
                                              .map((m) => m.move_number - 1)
                                }
                            />

                            <div className="worst-moves-container">
                                <WorstMovesList
                                    moves={worst_move_list}
                                    onMoveClick={(moveNumber) =>
                                        gobanController.gotoMove(moveNumber)
                                    }
                                    maxMovesShown={WORST_MOVES_SHOWN}
                                />
                            </div>

                            {reviewData.scores && (
                                <ScoreWinRateToggle
                                    useScore={useScore}
                                    onUseScoreChange={setUseScore}
                                    canViewTable={canViewTable}
                                    tableHidden={tableHidden}
                                    onTableHiddenChange={setTableHidden}
                                    showTableToggle={reviewData?.engine.includes("katago")}
                                />
                            )}

                            {canViewTable && reviewData?.engine.includes("katago") && (
                                <div>
                                    <SummaryTable
                                        categorization={reviewData?.categorize(
                                            gobanController.goban.engine,
                                            scoreDiffThresholds,
                                            includeNegativeScoreLoss,
                                        )}
                                        reviewType={reviewData.type === "fast" ? "fast" : "full"}
                                        table_hidden={tableHidden}
                                        scoreDiffThresholds={scoreDiffThresholds}
                                        onThresholdChange={handleThresholdChange}
                                        onResetThresholds={handleResetThresholds}
                                        includeNegativeScores={includeNegativeScoreLoss}
                                        onToggleNegativeScores={handleToggleNegativeScores}
                                        onPopupMovesChange={(moves) => {
                                            setCurrentPopupMoves(moves);
                                        }}
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    )}

                    {reviewData?.type === "fast" && showFullReviewButton && (
                        <div className="key-moves">
                            <div>
                                <button
                                    className="primary"
                                    onClick={() => startNewAIReview("full", "katago")}
                                >
                                    {_("Full AI Review")}
                                </button>
                                {show_become_supporter_text && (
                                    <div
                                        className="fakelink become-a-site-supporter-line"
                                        onClick={() => startNewAIReview("full", "katago")}
                                    >
                                        {_(
                                            "Become a site supporter today for in-depth interactive AI reviews",
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </React.Fragment>
            )}
        </div>
    );
}
