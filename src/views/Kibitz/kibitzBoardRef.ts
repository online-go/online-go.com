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
 * A Kibitz room watches a board: a game, or a review (a demo board or a
 * review of a game). Game ids and review ids are separate sequences, so a
 * board is identified by its kind as well as its id. Anything that groups or
 * compares boards goes through these helpers rather than comparing ids.
 */

export type KibitzBoardKey = `game:${number}` | `review:${number}`;

/** Anything that names a board: a watched game, a variation, a goban. A
 *  positive `review_id` makes it a review; otherwise `game_id` is the game. */
export interface KibitzBoardIds {
    game_id?: number | null;
    review_id?: number | null;
}

function positive(id: number | null | undefined): id is number {
    return typeof id === "number" && Number.isFinite(id) && id > 0;
}

/** The board's key, or null when it names neither a game nor a review. */
export function boardKey(ids: KibitzBoardIds | null | undefined): KibitzBoardKey | null {
    if (!ids) {
        return null;
    }
    if (positive(ids.review_id)) {
        return `review:${ids.review_id}`;
    }
    if (positive(ids.game_id)) {
        return `game:${ids.game_id}`;
    }
    return null;
}

/** True when both name the same board. Two things that name no board are
 *  not the same board. */
export function sameBoard(
    a: KibitzBoardIds | null | undefined,
    b: KibitzBoardIds | null | undefined,
): boolean {
    const left = boardKey(a);
    return left !== null && left === boardKey(b);
}

export function isReviewBoard(ids: KibitzBoardIds | null | undefined): boolean {
    return positive(ids?.review_id);
}

/** The ids a board key stands for, for building a controller or a wire body. */
export function boardIdsFromKey(key: KibitzBoardKey): { game_id?: number; review_id?: number } {
    const [kind, raw] = key.split(":");
    const id = Number(raw);
    return kind === "review" ? { review_id: id } : { game_id: id };
}

/** The board a goban is connected to or was built for. */
export function gobanBoardKey(
    goban: { game_id?: number | string; review_id?: number | string } | null | undefined,
): KibitzBoardKey | null {
    if (!goban) {
        return null;
    }
    return boardKey({ game_id: Number(goban.game_id), review_id: Number(goban.review_id) });
}

/** Orders boards: games by id, then reviews by id. */
export function compareBoardKeys(left: KibitzBoardKey, right: KibitzBoardKey): number {
    const a = boardIdsFromKey(left);
    const b = boardIdsFromKey(right);
    if ((a.review_id == null) !== (b.review_id == null)) {
        return a.review_id == null ? -1 : 1;
    }
    return (a.review_id ?? a.game_id ?? 0) - (b.review_id ?? b.game_id ?? 0);
}

/** The site page for a board. */
export function boardHref(key: KibitzBoardKey): string {
    const { game_id, review_id } = boardIdsFromKey(key);
    return review_id != null ? `/review/${review_id}` : `/game/${game_id}`;
}
