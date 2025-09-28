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
    MoveTree,
    getWorstMoves,
    AIReviewWorstMoveEntry,
    Goban,
} from "goban";
import { ai_socket } from "@/lib/sockets";
import { close_all_popovers } from "@/lib/popover";
import { get, post } from "@/lib/requests";
import { errorLogger } from "@/lib/misc";

// ==================== useAIReviewData Hook ====================

interface UseAIReviewDataProps {
    gameId: number;
    moveTree?: MoveTree;
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
export function useAIReviewData({ gameId, moveTree }: UseAIReviewDataProps): UseAIReviewDataReturn {
    const reviewDataRef = useRef<AIReviewData | undefined>(undefined);
    const [updateCount, setUpdateCount] = useState(0);

    const setSelectedAIReview = useCallback(
        (aiReview: JGOFAIReview | undefined) => {
            close_all_popovers();

            // Clean up existing AIReviewData instance if it exists
            if (reviewDataRef.current) {
                reviewDataRef.current.destroy();
                reviewDataRef.current = undefined;
            }

            // Create new AIReviewData instance if we have the required data
            if (aiReview?.uuid && aiReview?.id && ai_socket && moveTree) {
                reviewDataRef.current = new AIReviewData(ai_socket, moveTree, aiReview, gameId);

                const handleUpdate = () => {
                    setUpdateCount((prev) => prev + 1);
                };

                reviewDataRef.current.on("update", handleUpdate);
                reviewDataRef.current.on("metadata", handleUpdate);

                // Trigger initial sync
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
                .then((res) => {
                    if (res.id) {
                        setReviewing(true);
                    }
                })
                .catch((err) => {
                    errorLogger(err);
                    setTimeout(start_review, 500);
                });
        };

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
                ? Object.values(reviewData.moves).map((move) => ({
                      move_number: move.move_number + 1,
                      player: goban.engine!.move_tree!.index(move.move_number).player,
                      delta: move.win_rate,
                      move: move.move,
                  }))
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
