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

import type { KibitzRoomSummary, KibitzStreamItem } from "@/models/kibitz";

function isPendingGameChangeNotice(item: KibitzStreamItem): boolean {
    // Current server messages have no subtype; keep this legacy wire-text
    // check restricted to system messages with a valid target game.
    return (
        item.type === "system" &&
        item.source !== "game-chat" &&
        Number.isSafeInteger(item.game_id) &&
        (item.game_id ?? 0) > 0 &&
        item.text.startsWith("This room will switch to a new game soon: ")
    );
}

export function getVisibleKibitzStreamItems(
    room: KibitzRoomSummary,
    items: KibitzStreamItem[],
): KibitzStreamItem[] {
    const pendingGameId =
        room.preset?.selection_status === "change_pending" &&
        room.preset.pending_game_id !== room.current_game?.game_id
            ? room.preset.pending_game_id
            : null;
    let activeNotice: KibitzStreamItem | undefined;

    for (const item of items) {
        if (
            isPendingGameChangeNotice(item) &&
            item.game_id === pendingGameId &&
            (!activeNotice || item.created_at >= activeNotice.created_at)
        ) {
            activeNotice = item;
        }
    }

    return items.filter((item) => !isPendingGameChangeNotice(item) || item === activeNotice);
}
