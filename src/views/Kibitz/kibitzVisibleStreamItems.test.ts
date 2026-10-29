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
import { getVisibleKibitzStreamItems } from "./kibitzVisibleStreamItems";

const room: KibitzRoomSummary = {
    id: "room-1",
    channel: "kibitz-room-1",
    title: "Room",
    kind: "preset",
    viewer_count: 0,
    preset: {
        preset_key: "high-ranked-live",
        selection_status: "change_pending",
        pending_game_id: 42,
        change_effective_at: "2026-10-29T19:00:00Z",
    },
};

function notice(id: string, gameId: number, createdAt: number): KibitzStreamItem {
    return {
        id,
        room_id: room.id,
        type: "system",
        created_at: createdAt,
        game_id: gameId,
        text: "This room will switch to a new game soon: Friendly Match",
    };
}

test("keeps only the newest warning for the pending game, regardless of history order", () => {
    const active = notice("active", 42, 300);
    const items = [active, notice("old-target", 41, 200), notice("old-same-game", 42, 100)];
    expect(getVisibleKibitzStreamItems(room, items)).toEqual([active]);
    expect(items).toHaveLength(3);
});

test.each(["watching", "finding_game"] as const)(
    "hides replayed warnings when the room is %s",
    (selectionStatus) => {
        const resolvedRoom: KibitzRoomSummary = {
            ...room,
            preset: { ...room.preset!, selection_status: selectionStatus, pending_game_id: null },
        };
        expect(getVisibleKibitzStreamItems(resolvedRoom, [notice("old", 42, 100)])).toEqual([]);
    },
);

test("hides the warning when the board has switched but pending state has not cleared yet", () => {
    const switchedRoom = {
        ...room,
        current_game: { game_id: 42 } as KibitzRoomSummary["current_game"],
    };
    expect(getVisibleKibitzStreamItems(switchedRoom, [notice("old", 42, 100)])).toEqual([]);
});

test("preserves completed notices, ordinary chat, other system messages and game chat", () => {
    const pending = notice("pending", 42, 100);
    const items: KibitzStreamItem[] = [
        { ...pending, id: "completed", text: "The watched game changed to Friendly Match" },
        { ...pending, id: "quoted", type: "chat" },
        { ...pending, id: "other", text: "Looking for a suitable live game for this room." },
        { ...pending, id: "game-chat", source: "game-chat" },
        { ...pending, id: "unknown-target", game_id: undefined },
    ];
    expect(getVisibleKibitzStreamItems({ ...room, preset: undefined }, items)).toEqual(items);
});
