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
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary, KibitzRoomUser } from "@/models/kibitz";
import "./KibitzRoomList.css";

interface KibitzRoomListProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    roomUsersById?: Record<string, KibitzRoomUser[]>;
    onSelectRoom: (roomId: string) => void;
}

function getUserInitials(username: string | undefined): string {
    const trimmedUsername = (username ?? "").trim();

    if (!trimmedUsername) {
        return "?";
    }

    const parts = trimmedUsername.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function KibitzRoomList({
    rooms,
    activeRoomId,
    roomUsersById = {},
    onSelectRoom,
}: KibitzRoomListProps): React.ReactElement {
    return (
        <div className="KibitzRoomList">
            <div className="KibitzRoomList-title">
                {pgettext("Title for the kibitz left rail", "Kibitz")}
            </div>
            <div className="KibitzRoomList-items">
                {rooms.map((room) => {
                    const roomUsers = roomUsersById[room.id] ?? [];
                    const stackedUsers = roomUsers.slice(0, 3);
                    const overflowCount = Math.max(0, roomUsers.length - stackedUsers.length);

                    return (
                        <button
                            key={room.id}
                            className={
                                "KibitzRoomList-item" + (room.id === activeRoomId ? " active" : "")
                            }
                            onClick={() => onSelectRoom(room.id)}
                        >
                            <div className="room-main">
                                <span className="room-title">{room.title}</span>
                                <span className="room-meta">
                                    {interpolate(
                                        pgettext(
                                            "Viewer count label for a kibitz room",
                                            "{{count}} watching",
                                        ),
                                        {
                                            count: room.viewer_count,
                                        },
                                    )}
                                </span>
                            </div>
                            {stackedUsers.length > 0 ? (
                                <div className="room-presence-row">
                                    <span className="room-avatar-stack" aria-hidden="true">
                                        {stackedUsers.map((user) => (
                                            <span
                                                key={user.id}
                                                className="room-avatar"
                                                title={user.username}
                                            >
                                                {getUserInitials(user.username)}
                                            </span>
                                        ))}
                                        {overflowCount > 0 ? (
                                            <span className="room-avatar room-avatar-overflow">
                                                +{overflowCount}
                                            </span>
                                        ) : null}
                                    </span>
                                    <span className="room-presence-label">
                                        {interpolate(
                                            pgettext(
                                                "Compact active-user label for a kibitz room row",
                                                "{{count}} here now",
                                            ),
                                            { count: roomUsers.length },
                                        )}
                                    </span>
                                </div>
                            ) : null}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
