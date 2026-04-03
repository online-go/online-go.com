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
import type { KibitzRoomSummary } from "@/models/kibitz";
import "./KibitzRoomList.css";

interface KibitzRoomListProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    onSelectRoom: (roomId: string) => void;
}

export function KibitzRoomList({
    rooms,
    activeRoomId,
    onSelectRoom,
}: KibitzRoomListProps): React.ReactElement {
    return (
        <div className="KibitzRoomList">
            <div className="KibitzRoomList-title">
                {pgettext("Heading for a list of kibitz rooms", "Rooms")}
            </div>
            <div className="KibitzRoomList-items">
                {rooms.map((room) => (
                    <button
                        key={room.id}
                        className={
                            "KibitzRoomList-item" + (room.id === activeRoomId ? " active" : "")
                        }
                        onClick={() => onSelectRoom(room.id)}
                    >
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
                    </button>
                ))}
            </div>
        </div>
    );
}
