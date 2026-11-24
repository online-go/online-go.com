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

/**
 * Parse a kibitz game-picker manual input into a numeric game id.
 *
 * Accepts either a bare integer ("12345") or a URL containing /game/ID or
 * /game/view/ID. The optional /view segment in the regex covers both forms,
 * so a single match handles all the manually-paste-able variants.
 */
export function parseGameId(input: string): number | null {
    const trimmed = input.trim();

    if (/^\d+$/.test(trimmed)) {
        return Number(trimmed);
    }

    const match = trimmed.match(/\/game(?:\/view)?\/(\d+)(?:\/|$|\?)/i);
    if (match) {
        return Number(match[1]);
    }

    return null;
}

/**
 * Parse the picker's manual input into a board: a game, or a review (a demo
 * board or a review of a game).
 *
 * A bare integer is a game id, as before. A URL names its kind: /game/ID and
 * /game/view/ID are games; /review/ID and /demo/ID, each with an optional
 * /view segment and an optional trailing move number, are reviews.
 */
export function parseKibitzBoardInput(
    input: string,
): { game_id: number } | { review_id: number } | null {
    const trimmed = input.trim();
    const review = trimmed.match(/\/(?:review|demo)(?:\/view)?\/(\d+)(?:\/|$|\?|#)/i);
    if (review) {
        return { review_id: Number(review[1]) };
    }
    const gameId = parseGameId(trimmed);
    return gameId ? { game_id: gameId } : null;
}
