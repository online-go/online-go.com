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

import * as preferences from "@/lib/preferences";
import { MODERATOR_POWERS } from "@/lib/moderation";

// ==================== Engine Utils ====================

export function engineName(engine: string): string {
    switch (engine) {
        case "leela_zero":
            return "Leela Zero";
        case "katago":
        case "katago:fast":
        case "katago:meijin":
            return "KataGo";
    }
    // Log unknown engine names for debugging in development only
    if (process.env.NODE_ENV === "development") {
        console.warn("Unknown engine name", engine);
    }
    return "AI";
}

export function extractShortNetworkVersion(network: string): string {
    // the first part of the katago version describes the network size,
    // second/third is hash I think
    if (network.indexOf("-") > 0) {
        network = network.match(/[^-]*[-]([^-]*)/)?.[1] || "xxxxxx";
    }
    return network.substr(0, 6);
}

// ==================== Move Utils ====================

/**
 * Reduces the number of moves ahead shown in a variation based on user settings
 * @param marks Object containing move marks
 * @returns Trimmed marks object
 */
export function trimMaxMoves(marks: { [mark: string]: string }): { [mark: string]: string } {
    const maxMoves = preferences.get("variation-move-count");

    // If maxMoves is set to 10 (max) or marks has 2 or fewer moves, return as-is
    if (maxMoves >= 10 || Object.keys(marks).length <= 2) {
        return marks;
    }

    // Get all the moves into an array but leave the black and white keys
    let marksArray = Object.entries(marks).reduce(
        (result, entry) => {
            if (entry[0] !== "black" && entry[0] !== "white") {
                result.push({ key: entry[0], value: entry[1] });
            }
            return result;
        },
        [] as { key: string; value: string }[],
    );

    // Use the max moves set by the user or the number of moves in the variation, whichever is lower
    const actualMoves = Math.min(marksArray.length, maxMoves);

    // Chop off anything after the number of moves we want
    marksArray = marksArray.slice(0, actualMoves);

    // Work out whose move the first move is
    const blackFirstMove = marks.black?.substring(0, 2) === marksArray[0]?.value;

    // See if we have an odd number of moves
    const oddMoves = actualMoves % 2 > 0;

    // Black and white have half the moves each...
    let blackMoves = Math.floor(actualMoves / 2);
    let whiteMoves = blackMoves;

    // ... plus one for whoever moves first (if an odd number of moves)
    if (oddMoves) {
        if (blackFirstMove) {
            blackMoves++;
        } else {
            whiteMoves++;
        }
    }

    // Work out how many characters (2 per move) we should restrict the transparency string to
    const blackMoveString = marks.black?.substring(0, 2 * blackMoves) || "";
    const whiteMoveString = marks.white?.substring(0, 2 * whiteMoves) || "";

    // Convert the array back into an object
    const result = marksArray.reduce(
        (target, item) => ({ ...target, [item.key]: item.value }),
        {} as { [mark: string]: string },
    );

    // Add back the black and white keys with the transparency strings if each is non-blank
    if (blackMoveString) {
        result.black = blackMoveString;
    }

    if (whiteMoveString) {
        result.white = whiteMoveString;
    }

    return result;
}

// ==================== Score/Win Rate Utils ====================

export function formatWinRate(winRate: number): string {
    const winRatePercent = winRate * 100.0;
    return winRatePercent.toFixed(1);
}

export function formatScore(score: number): string {
    return Math.abs(score).toFixed(1);
}

// ==================== Permissions Utils ====================

export function powerToSeeTable(moderator_powers: number | undefined): boolean {
    return (
        ((moderator_powers ?? 0) & MODERATOR_POWERS.AI_DETECTOR) !== 0 ||
        ((moderator_powers ?? 0) & MODERATOR_POWERS.ASSESS_AI_PLAY) !== 0
    );
}

interface User {
    id?: number;
    is_moderator?: boolean;
    moderator_powers?: number;
}

interface GobanController {
    creator_id?: number;
}

interface Goban {
    engine?: {
        players?: {
            black?: { id?: number };
            white?: { id?: number };
        };
        config?: {
            black_player_id?: number;
            white_player_id?: number;
        };
    };
    review_controller_id?: number;
}

/**
 * Determines if a user has permission to start a full AI review
 * @param user Current user object
 * @param goban_controller Controller for the goban
 * @param goban The goban instance
 * @returns True if user can start a full review
 */
export function canStartFullReview(
    user: User,
    goban_controller: GobanController,
    goban: Goban,
): boolean {
    try {
        if (
            user.id === goban_controller.creator_id ||
            user.id === goban.engine?.players?.black?.id ||
            user.id === goban.engine?.players?.white?.id
        ) {
            return true;
        } else if (
            user.is_moderator ||
            ((user.moderator_powers ?? 0) & MODERATOR_POWERS.AI_DETECTOR) !== 0
        ) {
            return true;
        }
    } catch {
        // no problem, just someone else's sgf or something
    }
    return false;
}

/**
 * Determines if a user can request AI analysis of a variation
 * @param user Current user with anonymous and supporter flags
 * @param goban The goban instance
 * @param goban_controller Controller for the goban
 * @returns True if user can request variation analysis
 */
export function canRequestVariationAnalysis(
    user: User & { anonymous?: boolean; supporter?: boolean },
    goban: Goban,
    goban_controller: GobanController,
): boolean {
    if (user.anonymous) {
        return false;
    }
    if (!user.supporter) {
        return false;
    }

    const black_id = goban?.engine?.config?.black_player_id;
    const white_id = goban?.engine?.config?.white_player_id;
    const creator_id = goban_controller.creator_id || goban?.review_controller_id;

    return user.id === black_id || user.id === white_id || user.id === creator_id;
}

// ==================== AI Marks Utils ====================

import { MoveTree, JGOFAIReviewMove, encodeMove, encodeMoves } from "goban";

interface AIReviewData {
    moves: { [key: number]: JGOFAIReviewMove };
}

interface Engine {
    decodeMoves: (moves: string) => Array<{ x: number; y: number }>;
    player: number;
}

/**
 * Fills AI marks by backtracking through the move tree to find matching variations
 * @param cur_move Current move in the tree
 * @param trunk_move Trunk/main branch move
 * @param marks Object to fill with marks
 * @param reviewData AI review data containing moves and branches
 * @param engine Game engine for decoding moves
 * @returns Whether marks were successfully filled
 */
export function fillAIMarksBacktracking(
    cur_move: MoveTree,
    trunk_move: MoveTree,
    marks: { [mark: string]: string },
    reviewData: AIReviewData | null,
    engine: Engine | null,
): boolean {
    if (!reviewData || !engine) {
        return false;
    }

    for (let j = 0; j <= trunk_move.move_number; j++) {
        const ai_review_move = reviewData.moves[trunk_move.move_number - j];
        if (!ai_review_move) {
            continue;
        }

        let trunk_move_string = trunk_move.getMoveStringToThisPoint();
        trunk_move_string = trunk_move_string.slice(0, trunk_move_string.length - 2 * j);

        const cur_move_string = cur_move.getMoveStringToThisPoint();
        let next_moves: string | undefined;

        for (const branch of ai_review_move.branches) {
            const move_str: string = trunk_move_string + encodeMoves(branch.moves);
            if (move_str.startsWith(cur_move_string)) {
                next_moves = move_str.slice(cur_move_string.length, Infinity);
                break;
            }
        }

        if (next_moves) {
            const decoded_moves = engine.decodeMoves(next_moves);
            let black = "";
            let white = "";

            for (let i = 0; i < decoded_moves.length; ++i) {
                const mv = decoded_moves[i];
                const encoded_mv = encodeMove(mv.x, mv.y);
                marks[i + cur_move.getDistance(trunk_move) + 1] = encoded_mv;
                if ((engine.player - 1 + i) % 2 === 1) {
                    white += encoded_mv;
                } else {
                    black += encoded_mv;
                }
            }
            if (black) {
                marks["black"] = black;
            }
            if (white) {
                marks["white"] = white;
            }
            return true;
        }
    }

    return false;
}
