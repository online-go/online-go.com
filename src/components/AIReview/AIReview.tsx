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
import { useData } from "@/lib/hooks";
import * as preferences from "@/lib/preferences";
import { UIPush } from "@/components/UIPush";
import { openBecomeASiteSupporterModal } from "@/views/Supporter";
import { errorAlerter, errorLogger } from "@/lib/misc";
import { toast } from "@/lib/toast";
import { post } from "@/lib/requests";
import { close_all_popovers } from "@/lib/popover";
import { _, pgettext, moment } from "@/lib/translate";
import { ReviewChart } from "./ReviewChart";
import { SummaryTable } from "./SummaryTable";
import { FairPlayGameSummary } from "@moderator-ui/FairPlay";
import {
    MoveTree,
    JGOFAIReview,
    JGOFAIReviewMove,
    JGOFNumericPlayerColor,
    ColoredCircle,
    GobanMovesArray,
    AIQualityMark,
} from "goban";
import { alert } from "@/lib/swal_config";
import { useGobanControllerOrNull } from "@/views/Game/goban_context";
import { MODERATOR_POWERS } from "@/lib/moderation";

// Sub components and utilities
import { ReviewSelector } from "./ReviewSelector";
import { WorstMovesList } from "./WorstMovesList";
import { ScoreWinRateToggle } from "./ScoreWinRateToggle";
import { FullReviewButton } from "./FullReviewButton";
import {
    canStartFullReview,
    trimMaxMoves,
    fillAIMarksBacktracking,
    reviewPositionOfMove,
} from "./utils";
import { useAIReviewData, useAIReviewList, useWorstMoves } from "./hooks";

// Constants
const WORST_MOVES_SHOWN = 6;
const TOAST_DURATION_MS = 2000;
const COMPOSITE_KEY_MULTIPLIER = 1000000;

import { generateHeatmapAndMarks } from "./generateHeatmapAndMarks";
import { Errcode } from "@/components/Errcode";
import "./AIReview.css";

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
    simul_black?: boolean | null;
    simul_white?: boolean | null;
    /** When true, shows the FairPlayGameSummary (bound to the moderator tools being open) */
    showFairPlay?: boolean;
    /** When true, shows GameTimings within FairPlayGameSummary */
    showGameTimings?: boolean;
    /** GameTimings props - required when showGameTimings is true */
    moves?: GobanMovesArray;
    start_time?: number;
    end_time?: number;
    free_handicap_placement?: boolean;
    handicap?: number;
    /** Callback for when GameTimings calculates the final action time */
    onFinalActionCalculated?: (final_action_timing: moment.Duration) => void;
}

/**
 * This component displays AI analysis of Go game moves, including win rates,
 * score estimates, and move quality assessments. It manages multiple AI reviews,
 * handles real-time updates via WebSocket, and provides interactive visualization
 * of AI-suggested variations.
 */
export function AIReview({
    move,
    game_id,
    hidden,
    onAIReviewSelected,
    simul_black,
    simul_white,
    showFairPlay,
    showGameTimings,
    moves,
    start_time,
    end_time,
    free_handicap_placement,
    handicap,
    onFinalActionCalculated,
}: AIReviewProperties) {
    const gobanController = useGobanControllerOrNull();

    // State management
    const [useScore, setUseScore] = useState(preferences.get("ai-review-use-score"));
    /* The quality colors come from theme CSS variables, so the board marks
     * are regenerated when the theme changes */
    const [theme] = useData("theme", "system");
    const [showVisitCounts] = preferences.usePreference("ai-review-show-visit-counts");
    const [showOnBoard] = preferences.usePreference("ai-review-show-on-board");
    const [tableHidden, setTableHidden] = useState(!preferences.get("ai-summary-table-show"));
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
        currentMove: move,
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

    const showFullReviewButton = useMemo(
        () =>
            gobanController
                ? canStartFullReview(user, gobanController, gobanController.goban)
                : false,
        [user, gobanController, gobanController?.creator_id, gobanController?.goban],
    );

    // Handle AI review selection
    const handleAIReviewSelect = useCallback(
        (ai_review: JGOFAIReview) => {
            // Selecting a review is a user action, so any OGS popover open at the time is
            // dismissed with it. ReviewSelector is a react-select and closes its own menu,
            // so this only affects popovers elsewhere on the page.
            close_all_popovers();

            setSelectedAiReviewInList(ai_review);
            setSelectedAIReviewData(ai_review);
            onAIReviewSelected(ai_review);
        },
        [setSelectedAiReviewInList, setSelectedAIReviewData, onAIReviewSelected],
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

    // State for win rate and score from highlights update
    const [winRateScore, setWinRateScore] = useState<[number, number]>([0, 0]);

    /**
     * Single categorization pass per review update, shared by the played-move
     * badge map and the summary table. categorize() walks the whole game, so
     * it must not run once per render during a streaming review.
     */
    const categorization = useMemo(() => {
        const engine = gobanController?.goban?.engine;
        if (!reviewData || !engine) {
            return null;
        }
        return reviewData.categorize(engine);
    }, [reviewData, gobanController, updateCount]);

    /**
     * Map of trunk move number to its AI review quality classification,
     * used to badge the played move on the board.
     */
    const moveCategoryMap = useMemo((): Map<number, AIQualityMark> | null => {
        if (!categorization) {
            return null;
        }
        const map = new Map<number, AIQualityMark>();
        for (const player of ["black", "white"] as const) {
            const categorized = categorization.categorized_moves[player];
            for (const category of Object.keys(categorized) as (keyof typeof categorized)[]) {
                for (const move_number of categorized[category]) {
                    map.set(move_number, category.toLowerCase() as AIQualityMark);
                }
            }
        }
        return map;
    }, [categorization]);

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
     * Updates the board visualization with AI analysis marks and colored circles
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

        // Marks are written to the engine's current move. When the engine has
        // already navigated away from the move this render is for (rapid
        // navigation, or an update landing mid-jump), writing would smear this
        // move's marks onto another node; skip, the effect for the new move
        // will redraw.
        if (goban.engine.cur_move.id !== cur_move.id) {
            return [win_rate, score];
        }

        // Clear this move's previous AI marks so marks from earlier updates
        // (a different branch set, toggled options, stray writes) don't
        // accumulate under the fresh ones
        cur_move.clearAIMarks();

        // The board display of the review is off: the panel keeps its win
        // rate, chart and table, but nothing is drawn on the board
        if (!showOnBoard) {
            goban.setHeatmap(undefined, true);
            goban.setColoredCircles([], true);
            goban.redraw(true);
            return [win_rate, score];
        }

        let marks: { [mark: string]: string } = {};
        let colored_circles: ColoredCircle[] = [];

        try {
            if ((cur_move.trunk || have_variation_results) && ai_review_move) {
                // The move played from this position, shown as an outlined
                // circle. Clicking it follows the trunk to the next move.
                const played_move = cur_move.trunk_next || null;

                // Positional fallback delta shown on the played move when it
                // is not among the analyzed branches
                let played_move_delta: number | null = null;
                if (played_move) {
                    const next_review_move = reviewData.moves[played_move.move_number];
                    const next_win_rate =
                        next_review_move?.win_rate ?? win_rates[played_move.move_number];
                    const next_score = next_review_move?.score ?? scores[played_move.move_number];

                    if (
                        useScore &&
                        !!reviewData.scores &&
                        ai_review_move.score !== undefined &&
                        next_score !== undefined
                    ) {
                        played_move_delta =
                            played_move.player === JGOFNumericPlayerColor.WHITE
                                ? ai_review_move.score - next_score
                                : next_score - ai_review_move.score;
                    } else if (next_win_rate !== undefined) {
                        played_move_delta =
                            100 *
                            (played_move.player === JGOFNumericPlayerColor.WHITE
                                ? ai_review_move.win_rate - next_win_rate
                                : next_win_rate - ai_review_move.win_rate);
                    }
                }

                // Use the extracted marks generator
                const result = generateHeatmapAndMarks({
                    ai_review_move,
                    played_move,
                    cur_move,
                    played_move_category: played_move
                        ? (moveCategoryMap?.get(played_move.move_number) ?? null)
                        : null,
                    played_move_delta,
                    goban,
                    strength: reviewData.strength,
                    useScore,
                    hasScores: !!reviewData.scores,
                    show_visit_counts: showVisitCounts,
                });

                marks = result.marks;
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
            goban.setHeatmap(undefined, true);
            goban.setColoredCircles(colored_circles, false);
        } catch (e) {
            errorLogger(e);
        }

        return [win_rate, score];
    }, [
        reviewData,
        gobanController,
        move,
        useScore,
        showVisitCounts,
        showOnBoard,
        updateCount,
        moveCategoryMap,
        theme,
    ]);

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

            if (!user.supporter_level) {
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

    // Chart dots sit on the positions the highlighted moves are reviewed from
    const highlighted_moves =
        currentPopupMoves.length > 0
            ? currentPopupMoves
            : worst_move_list.slice(0, WORST_MOVES_SHOWN).map((m) => m.move_number);
    const highlighted_positions = highlighted_moves.map(reviewPositionOfMove);

    const cur_move = move;
    const trunk_move = cur_move.getBranchPoint();
    const move_number = trunk_move.move_number;
    const variation_move_number =
        cur_move.move_number !== trunk_move.move_number ? cur_move.move_number : -1;

    const show_become_supporter_text =
        !user.anonymous && !user.supporter && !user.is_moderator && !user.professional;

    const userIsPlayer =
        user.id === gobanController?.goban?.engine?.config?.black_player_id ||
        user.id === gobanController?.goban?.engine?.config?.white_player_id;

    // Early returns for critical missing data
    if (!gobanController?.goban?.engine || !move) {
        return null;
    }

    if (loading) {
        return null;
    }

    // Handle hidden or no review data states
    if (!reviewData || hidden) {
        // The fair play summary follows the moderator tools alone: it shows
        // while they are open whether or not the AI review is enabled, and
        // the Timing toggle adds the per-move timings to it. All CMs (anyone
        // with moderator_powers) can see it.
        const canShowFairPlay =
            showFairPlay &&
            (user.is_moderator || (user.moderator_powers ?? 0) !== 0) &&
            gobanController?.goban?.engine?.config?.black_player_id &&
            gobanController?.goban?.engine?.config?.white_player_id;

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
                {canShowFairPlay && (
                    <FairPlayGameSummary
                        game_id={game_id}
                        black_player_id={gobanController.goban!.engine.config.black_player_id!}
                        white_player_id={gobanController.goban!.engine.config.white_player_id!}
                        board_size={gobanController.goban!.engine.width}
                        currentMoveNumber={move.move_number - 1}
                        moves={showGameTimings ? moves : undefined}
                        start_time={showGameTimings ? start_time : undefined}
                        end_time={showGameTimings ? end_time : undefined}
                        free_handicap_placement={
                            showGameTimings ? free_handicap_placement : undefined
                        }
                        handicap={showGameTimings ? handicap : undefined}
                        simul_black={showGameTimings ? simul_black : undefined}
                        simul_white={showGameTimings ? simul_white : undefined}
                        onFinalActionCalculated={
                            showGameTimings ? onFinalActionCalculated : undefined
                        }
                    />
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
                                highlighted_moves={highlighted_positions}
                            />

                            <div className="worst-moves-container">
                                <WorstMovesList
                                    moves={worst_move_list}
                                    onMoveClick={(moveNumber) =>
                                        gobanController.gotoMove(reviewPositionOfMove(moveNumber))
                                    }
                                    maxMovesShown={WORST_MOVES_SHOWN}
                                />
                            </div>

                            {reviewData.scores && (
                                <ScoreWinRateToggle
                                    useScore={useScore}
                                    onUseScoreChange={setUseScore}
                                    tableHidden={tableHidden}
                                    onTableHiddenChange={setTableHidden}
                                    showTableToggle={reviewData?.engine.includes("katago")}
                                />
                            )}

                            {reviewData?.engine.includes("katago") &&
                                gobanController?.goban?.engine && (
                                    <SummaryTable
                                        categorization={categorization}
                                        table_hidden={tableHidden}
                                        onPopupMovesChange={(moves) => {
                                            setCurrentPopupMoves(moves);
                                        }}
                                        isFastReview={reviewData.type === "fast"}
                                        onStartFullReview={() => startNewAIReview("full", "katago")}
                                        showBecomeSupporterText={show_become_supporter_text}
                                        userIsPlayer={userIsPlayer}
                                    />
                                )}

                            {(simul_black || simul_white) && (
                                <div className="simul-warning">
                                    {pgettext(
                                        "A label that means the game is played at the same time as another game",
                                        "Simul",
                                    )}
                                    {simul_black && simul_white
                                        ? " (both players)"
                                        : simul_black
                                          ? " (black)"
                                          : " (white)"}
                                </div>
                            )}

                            {reviewData?.type === "fast" && showFullReviewButton && (
                                <FullReviewButton
                                    onStartFullReview={() => startNewAIReview("full", "katago")}
                                    showBecomeSupporterText={show_become_supporter_text}
                                />
                            )}

                            {/* The fair play summary follows the moderator tools alone;
                                the Timing toggle adds the per-move timings. All CMs
                                (anyone with moderator_powers) can see it. */}
                            {showFairPlay &&
                                (user.is_moderator || (user.moderator_powers ?? 0) !== 0) &&
                                gobanController?.goban?.engine?.config?.black_player_id &&
                                gobanController?.goban?.engine?.config?.white_player_id && (
                                    <FairPlayGameSummary
                                        game_id={game_id}
                                        black_player_id={
                                            gobanController.goban!.engine.config.black_player_id
                                        }
                                        white_player_id={
                                            gobanController.goban!.engine.config.white_player_id
                                        }
                                        board_size={gobanController.goban!.engine.width}
                                        currentMoveNumber={move.move_number - 1}
                                        moves={showGameTimings ? moves : undefined}
                                        start_time={showGameTimings ? start_time : undefined}
                                        end_time={showGameTimings ? end_time : undefined}
                                        free_handicap_placement={
                                            showGameTimings ? free_handicap_placement : undefined
                                        }
                                        handicap={showGameTimings ? handicap : undefined}
                                        simul_black={showGameTimings ? simul_black : undefined}
                                        simul_white={showGameTimings ? simul_white : undefined}
                                        ai_review_uuid={selectedAiReview?.uuid}
                                        onFinalActionCalculated={
                                            showGameTimings ? onFinalActionCalculated : undefined
                                        }
                                    />
                                )}
                        </React.Fragment>
                    )}
                </React.Fragment>
            )}
        </div>
    );
}
