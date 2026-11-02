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

import { useEffect, useState } from "react";
import { get } from "@/lib/requests";
import { socket } from "@/lib/sockets";
import { push_manager } from "@/components/UIPush/UIPush";
import type { KibitzRoomSummary } from "@/models/kibitz";

/** UIPush channel carrying kibitz directory events (room changes, viewer
 * counts). Matches DIRECTORY_BROADCAST_CHANNEL on the server. */
const KIBITZ_DIRECTORY_CHANNEL = "kibitz-rooms";

/** Most-watched room first; ties keep their existing order. */
function sortRoomsByViewers(rooms: KibitzRoomSummary[]): KibitzRoomSummary[] {
    return [...rooms].sort((a, b) => (b.viewer_count ?? 0) - (a.viewer_count ?? 0));
}

/**
 * The kibitz rooms whose current board is `game_id`, kept live.
 *
 * One fetch of `kibitz/rooms?game=` seeds the list; after that the
 * `kibitz-rooms` directory pushes maintain it. `room-created` and
 * `room-updated` (sent for each board change) test the payload's
 * `current_game_id`: a match adds or replaces the room, anything else drops
 * it, so a room that moves away disappears and a room that moves onto this
 * game appears. `viewer-count-changed` updates a count by channel,
 * `room-removed` drops by id, and `rooms-refresh` or a socket reconnect
 * fetch again. The channel is subscribed before the first fetch so no event
 * between the two is lost.
 *
 * While `hidden` is true, or without a game id, the hook does nothing and
 * returns an empty list; the Game page passes `hidden` for a player whose
 * game has not finished, mirroring the server's room access rule.
 */
export function useGameKibitzRooms(
    game_id: number | undefined,
    hidden: boolean,
): KibitzRoomSummary[] {
    const [rooms, setRooms] = useState<KibitzRoomSummary[]>([]);

    useEffect(() => {
        if (game_id === undefined || hidden) {
            setRooms([]);
            return;
        }
        let cancelled = false;

        const refresh = () => {
            get("kibitz/rooms", { game: game_id })
                .then((fetched: KibitzRoomSummary[]) => {
                    if (!cancelled) {
                        // A server without the `game` filter returns every
                        // room, so apply the membership test here too.
                        setRooms(
                            sortRoomsByViewers(
                                (fetched ?? []).filter((r) => r.current_game_id === game_id),
                            ),
                        );
                    }
                })
                .catch(() => {
                    if (!cancelled) {
                        setRooms([]);
                    }
                });
        };

        const onRoomPayload = (payload: KibitzRoomSummary) => {
            if (!payload?.id) {
                return;
            }
            setRooms((prev) => {
                const others = prev.filter((r) => r.id !== payload.id);
                if (payload.current_game_id !== game_id) {
                    return others.length === prev.length ? prev : others;
                }
                const existing = prev.find((r) => r.id === payload.id);
                return sortRoomsByViewers([
                    ...others,
                    existing ? { ...existing, ...payload } : payload,
                ]);
            });
        };

        const onViewerCountChanged = (payload: { channel?: string; viewer_count?: number }) => {
            if (typeof payload?.viewer_count !== "number") {
                return;
            }
            const viewer_count = payload.viewer_count;
            setRooms((prev) =>
                prev.some((r) => r.channel === payload.channel)
                    ? sortRoomsByViewers(
                          prev.map((r) =>
                              r.channel === payload.channel ? { ...r, viewer_count } : r,
                          ),
                      )
                    : prev,
            );
        };

        const onRoomRemoved = (payload: { id?: string } | undefined) => {
            setRooms((prev) => prev.filter((r) => r.id !== payload?.id));
        };

        const handlers = [
            push_manager.on("room-created", onRoomPayload),
            push_manager.on("room-updated", onRoomPayload),
            push_manager.on("viewer-count-changed", onViewerCountChanged),
            push_manager.on("room-removed", onRoomRemoved),
            push_manager.on("rooms-refresh", refresh),
        ];
        push_manager.subscribe(KIBITZ_DIRECTORY_CHANNEL);
        refresh();
        socket.on("connect", refresh);

        return () => {
            cancelled = true;
            for (const handler of handlers) {
                push_manager.off(handler);
            }
            push_manager.unsubscribe(KIBITZ_DIRECTORY_CHANNEL);
            socket.off("connect", refresh);
        };
    }, [game_id, hidden]);

    return rooms;
}
