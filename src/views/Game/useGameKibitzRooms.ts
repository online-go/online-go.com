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

import { useMemo } from "react";
import { get } from "@/lib/requests";
import { KibitzDirectorySource, useKibitzDirectoryRooms } from "@/lib/useKibitzDirectoryRooms";
import type { KibitzRoomSummary } from "@/models/kibitz";

/** The board a page shows: a game, or a review (a demo board or a review of
 *  a game). A review id wins, since a review of a game has both. */
export interface GameKibitzBoard {
    game_id?: number;
    review_id?: number;
}

/**
 * The kibitz rooms whose current board is the page's game or review, kept
 * live: seeded from `kibitz/rooms?game=` or `?review=` and followed through
 * `useKibitzDirectoryRooms`.
 *
 * While `hidden` is true, or without a board, the hook does nothing and
 * returns an empty list; the Game page passes `hidden` for a player whose
 * game has not finished, mirroring the server's room access rule.
 */
export function useGameKibitzRooms(
    board: GameKibitzBoard | undefined,
    hidden: boolean,
): KibitzRoomSummary[] {
    const review_id = board?.review_id || undefined;
    const game_id = review_id ? undefined : board?.game_id || undefined;
    const source = useMemo<KibitzDirectorySource<KibitzRoomSummary> | null>(() => {
        if (hidden) {
            return null;
        }
        if (review_id) {
            return {
                fetchRooms: () => get("kibitz/rooms", { review: review_id }),
                matches: (room) => room.current_review_id === review_id,
            };
        }
        if (game_id) {
            return {
                fetchRooms: () => get("kibitz/rooms", { game: game_id }),
                matches: (room) => room.current_game_id === game_id,
            };
        }
        return null;
    }, [game_id, review_id, hidden]);
    return useKibitzDirectoryRooms(source);
}
