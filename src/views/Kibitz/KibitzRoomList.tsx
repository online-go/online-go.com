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
    onCreateRoom?: () => void;
    onCreateVariation?: () => void;
}

export function KibitzRoomList({
    rooms,
    activeRoomId,
    roomUsersById: _roomUsersById = {},
    onSelectRoom,
    onCreateRoom,
    onCreateVariation,
}: KibitzRoomListProps): React.ReactElement {
    return (
        <div className="KibitzRoomList">
            <div className="KibitzRoomList-titleRow">
                <div className="KibitzRoomList-titleBlock">
                    <div className="KibitzRoomList-title">
                        {pgettext("Title for the kibitz left rail", "Kibitz")}
                    </div>
                    <div className="KibitzRoomList-subtitle">
                        {interpolate(
                            pgettext(
                                "Subtitle for the kibitz left rail showing room count",
                                "{{count}} live rooms",
                            ),
                            { count: rooms.length },
                        )}
                    </div>
                </div>
                {onCreateRoom || onCreateVariation ? (
                    <div className="KibitzRoomList-actions">
                        {onCreateRoom ? (
                            <button
                                type="button"
                                className="xs primary KibitzRoomList-createButton"
                                onClick={onCreateRoom}
                            >
                                {pgettext(
                                    "Button label for opening the Kibitz create room picker",
                                    "Create room",
                                )}
                            </button>
                        ) : null}
                        {onCreateVariation ? (
                            <button
                                type="button"
                                className="xs primary KibitzRoomList-createButton"
                                onClick={onCreateVariation}
                            >
                                {pgettext(
                                    "Button label for opening Kibitz variation creation",
                                    "Create variation",
                                )}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
            <div className="KibitzRoomList-items">
                {rooms.map((room) => {
                    const isActive = room.id === activeRoomId;
                    const roomDescription =
                        room.description ??
                        pgettext(
                            "Fallback subtitle shown in the kibitz room list when no room description exists",
                            "No room description",
                        );

                    return (
                        <button
                            key={room.id}
                            className={"KibitzRoomList-item" + (isActive ? " active" : "")}
                            onClick={() => onSelectRoom(room.id)}
                        >
                            <span className="room-active-rail" aria-hidden="true" />
                            <div className="room-main">
                                <div className="room-top-row">
                                    <span className="room-title">{room.title}</span>
                                </div>
                                <div className="room-bottom-row">
                                    <span className="room-subtitle" title={roomDescription}>
                                        {roomDescription}
                                    </span>
                                    <span
                                        className="room-viewer-count"
                                        title={interpolate(
                                            pgettext(
                                                "Tooltip for the viewer count shown in the kibitz room list",
                                                "{{count}} people here",
                                            ),
                                            { count: room.viewer_count },
                                        )}
                                    >
                                        <span className="room-viewer-number">
                                            {room.viewer_count}
                                        </span>
                                        <span className="room-viewer-icon" aria-hidden="true">
                                            <svg
                                                viewBox="0 0 16 16"
                                                focusable="false"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M8 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 1c-2.7 0-5 1.4-5 3.2V14h10v-1.8C13 10.4 10.7 9 8 9Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
