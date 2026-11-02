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

/**
 * The kibitz rooms whose current board is `game_id`, kept live: seeded from
 * `kibitz/rooms?game=` and followed through `useKibitzDirectoryRooms`.
 *
 * While `hidden` is true, or without a game id, the hook does nothing and
 * returns an empty list; the Game page passes `hidden` for a player whose
 * game has not finished, mirroring the server's room access rule.
 */
export function useGameKibitzRooms(
    game_id: number | undefined,
    hidden: boolean,
): KibitzRoomSummary[] {
    const source = useMemo<KibitzDirectorySource<KibitzRoomSummary> | null>(
        () =>
            game_id === undefined || hidden
                ? null
                : {
                      fetchRooms: () => get("kibitz/rooms", { game: game_id }),
                      matches: (room) => room.current_game_id === game_id,
                  },
        [game_id, hidden],
    );
    return useKibitzDirectoryRooms(source);
}
