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

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
    JGOFAIReview,
    AIReviewData,
    AIReviewUpdateContext,
    MoveTree,
    getWorstMoves,
    AIReviewWorstMoveEntry,
    Goban,
} from "goban";
import { ai_socket } from "@/lib/sockets";
import { get, post } from "@/lib/requests";
import { errorLogger } from "@/lib/misc";

// ==================== useAIReviewData Hook ====================

/**
 * Copies the win rate and score of each analyzed trunk move into the
 * review's `win_rates` and `scores` arrays, and fills the gaps in
 * `win_rates` with the last known win rate. The chart and the win rate
 * display read these arrays during render, so call this before the state
 * change that causes the render.
 */
function syncWinRatesAndScores(reviewData: AIReviewData): void {
    for (const k in reviewData.moves) {
        const move = reviewData.moves[k];
        reviewData.win_rates[move.move_number] = move.win_rate;
        if (move.score !== undefined && reviewData.scores !== undefined) {
            reviewData.scores[move.move_number] = move.score;
        }
    }

    let last_win_rate = 0.5;
    for (let move_number = 0; move_number < reviewData.win_rates.length; ++move_number) {
        if (reviewData.win_rates[move_number] === undefined) {
            reviewData.win_rates[move_number] = last_win_rate;
        }
        last_win_rate = reviewData.win_rates[move_number];
    }
}

interface UseAIReviewDataProps {
    gameId: number;
    moveTree?: MoveTree;
    /** Current move being viewed - used to filter irrelevant updates */
    currentMove?: MoveTree;
}

interface UseAIReviewDataReturn {
    reviewData: AIReviewData | undefined;
    setSelectedAIReview: (aiReview: JGOFAIReview | undefined) => void;
    updateCount: number;
}

/**
 * Custom hook for managing AI review data lifecycle and updates
 * @param props Hook configuration
 * @returns Review data, setter function, and update counter
 */
export function useAIReviewData({
    gameId,
    moveTree,
    currentMove,
}: UseAIReviewDataProps): UseAIReviewDataReturn {
    const reviewDataRef = useRef<AIReviewData | undefined>(undefined);
    const [updateCount, setUpdateCount] = useState(0);
    // Store current move context in a ref so the update handler can access it
    const currentMoveRef = useRef<MoveTree | undefined>(currentMove);
    currentMoveRef.current = currentMove;

    const setSelectedAIReview = useCallback(
        (aiReview: JGOFAIReview | undefined) => {
            // Clean up existing AIReviewData instance if it exists
            if (reviewDataRef.current) {
                reviewDataRef.current.destroy();
                reviewDataRef.current = undefined;
            }

            // Create new AIReviewData instance if we have the required data
            if (aiReview?.uuid && aiReview?.id && ai_socket && moveTree) {
                const reviewData = new AIReviewData(ai_socket, moveTree, aiReview, gameId);
                reviewDataRef.current = reviewData;

                const handleUpdate = (context: AIReviewUpdateContext) => {
                    if (context.type === "move") {
                        syncWinRatesAndScores(reviewData);
                    }

                    // Filter updates to only trigger re-renders when relevant to current view
                    const cur = currentMoveRef.current;
                    if (!cur) {
                        // No current move context, trigger update
                        setUpdateCount((prev) => prev + 1);
                        return;
                    }

                    if (context.type === "move") {
                        // Trunk move updates are always relevant - they update the graph,
                        // win rate display, and potentially the board marks
                        setUpdateCount((prev) => prev + 1);
                    } else if (context.type === "variation") {
                        // For variation updates, only trigger if this is the variation we're viewing
                        // This prevents redundant redraws when multiple variations are analyzed
                        const trunkMove = cur.getBranchPoint();
                        const trunkMoveNumber = trunkMove.move_number;
                        const trunkMoveString = trunkMove.getMoveStringToThisPoint();
                        const curMoveString = cur.getMoveStringToThisPoint();
                        const varString = curMoveString.slice(trunkMoveString.length);
                        const currentVarKey = `${trunkMoveNumber}-${varString}`;

                        if (context.variation_key === currentVarKey) {
                            setUpdateCount((prev) => prev + 1);
                        }
                        // Updates for other variations don't affect current view
                    }
                };

                const handleMetadata = () => {
                    syncWinRatesAndScores(reviewData);
                    // Metadata updates always trigger a refresh
                    setUpdateCount((prev) => prev + 1);
                };

                reviewData.on("update", handleUpdate);
                reviewData.on("metadata", handleMetadata);

                syncWinRatesAndScores(reviewData);
                // Render the new review
                setUpdateCount((prev) => prev + 1);
            }
        },
        [gameId, moveTree],
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (reviewDataRef.current) {
                reviewDataRef.current.destroy();
                reviewDataRef.current = undefined;
            }
        };
    }, []);

    return {
        reviewData: reviewDataRef.current,
        setSelectedAIReview,
        updateCount,
    };
}

// ==================== useAIReviewList Hook ====================

interface UseAIReviewListReturn {
    loading: boolean;
    reviewing: boolean;
    aiReviews: Array<JGOFAIReview>;
    selectedAiReview: JGOFAIReview | undefined;
    setSelectedAiReview: (review: JGOFAIReview | undefined) => void;
    refresh: () => void;
    addReview: (review: JGOFAIReview) => void;
}

/**
 * Custom hook for fetching and managing list of AI reviews for a game
 * @param gameId Game ID to fetch reviews for
 * @returns Loading state, review list, selected review, and control functions
 */
export function useAIReviewList(gameId: number | null): UseAIReviewListReturn {
    const [loading, setLoading] = useState(true);
    const [reviewing, setReviewing] = useState(false);
    const [aiReviews, setAiReviews] = useState<Array<JGOFAIReview>>([]);
    const [selectedAiReview, setSelectedAiReview] = useState<JGOFAIReview | undefined>();

    const getAIReviewList = useCallback(() => {
        if (!gameId) {
            return;
        }

        let start_review_attempts_left = 3;
        const start_review = () => {
            if (start_review_attempts_left === 0) {
                errorLogger(new Error("Giving up trying to start AI review"));
                return;
            }
            --start_review_attempts_left;

            post(`games/${gameId}/ai_reviews`, {
                engine: "katago",
                type: "auto",
            })
                .then((res: JGOFAIReview) => {
                    if (res.id) {
                        setReviewing(true);
                        // Add the review to the list and select it
                        setAiReviews([res]);
                        setSelectedAiReview(res);
                    }
                })
                .catch((err) => {
                    errorLogger(err);
                    setTimeout(start_review, 500);
                });
        };

        // Temporary games don't have stored review lists in PostgreSQL
        const is_temporary_game = gameId < 0;
        if (is_temporary_game) {
            setLoading(false);
            setAiReviews([]);
            // But still auto-start a review for temporary games
            start_review();
            return;
        }

        get(`games/${gameId}/ai_reviews`)
            .then((lst: Array<JGOFAIReview>) => {
                setLoading(false);
                setAiReviews(lst);

                if (lst.length) {
                    // Select the best AI review
                    const sortedList = [...lst].sort((a, b) => {
                        if (a.type !== b.type) {
                            return a.type === "full" ? -1 : 1;
                        }

                        if (a.strength - b.strength !== 0) {
                            return b.strength - a.strength;
                        }

                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                    });
                    setSelectedAiReview(sortedList[0]);
                } else {
                    start_review();
                }
            })
            .catch(errorLogger);
    }, [gameId]);

    useEffect(() => {
        if (gameId) {
            getAIReviewList();
        }
    }, [gameId, getAIReviewList]);

    const refresh = useCallback(() => {
        getAIReviewList();
    }, [getAIReviewList]);

    const addReview = useCallback((review: JGOFAIReview) => {
        setAiReviews((prevReviews) => {
            // Check if review already exists
            if (prevReviews.find((r) => r.id === review.id)) {
                return prevReviews;
            }
            // Add new review at the beginning of the list
            return [review, ...prevReviews];
        });
    }, []);

    return {
        loading,
        reviewing,
        aiReviews,
        selectedAiReview,
        setSelectedAiReview,
        refresh,
        addReview,
    };
}

// ==================== useWorstMoves Hook ====================

/**
 * Custom hook to calculate and filter the worst moves from an AI review
 * @param reviewData AI review data containing move analysis
 * @param goban Goban instance with engine and move tree
 * @param updateCount Optional update counter to force recalculation
 * @returns Filtered array of worst moves, limited to 3 per player
 */
export function useWorstMoves(
    reviewData: AIReviewData | null,
    goban: Goban | null,
    updateCount?: number,
): AIReviewWorstMoveEntry[] {
    return useMemo(() => {
        if (
            !reviewData?.moves ||
            !goban?.engine?.move_tree ||
            Object.keys(reviewData.moves).length === 0
        ) {
            return [];
        }

        let black_moves = 0;
        let white_moves = 0;

        let moves: AIReviewWorstMoveEntry[] =
            reviewData.type === "fast"
                ? Object.values(reviewData.moves).map((move) => {
                      /* A fast review entry analyzes a position; the move
                       * it describes is the one played from there */
                      const move_number = move.move_number + 1;
                      return {
                          move_number,
                          player: goban.engine!.move_tree!.index(move_number).player,
                          delta: move.win_rate,
                          move: move.move,
                      };
                  })
                : getWorstMoves(goban.engine.move_tree as MoveTree, reviewData, 100);

        // Filter to show only 3 worst moves per player
        moves = moves.filter(
            (move) =>
                (move.player === 1 && black_moves++ < 3) ||
                (move.player === 2 && white_moves++ < 3),
        );

        // Sort by move number
        moves.sort((a, b) => a.move_number - b.move_number);

        return moves;
    }, [reviewData, goban, updateCount]);
}
