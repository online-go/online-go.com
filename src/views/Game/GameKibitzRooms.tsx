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
import { KibitzRoomCard, KibitzRoomCards } from "@/components/KibitzRoomCard";
import type { KibitzRoomSummary } from "@/models/kibitz";

interface GameKibitzRoomsProps {
    rooms: KibitzRoomSummary[];
}

/**
 * Footer for the game chat's user list: one card per kibitz room whose
 * current board is this game, in the order given, each linking to the room.
 * Renders nothing when there are no rooms. The sibling on the Chat page is
 * `ChatKibitzRoom`, keyed by chat channel instead of game.
 */
export function GameKibitzRooms({ rooms }: GameKibitzRoomsProps): React.ReactElement | null {
    if (rooms.length === 0) {
        return null;
    }

    return (
        <KibitzRoomCards>
            {rooms.map((room) => (
                <KibitzRoomCard key={room.id} room={room} description={room.description} />
            ))}
        </KibitzRoomCards>
    );
}
