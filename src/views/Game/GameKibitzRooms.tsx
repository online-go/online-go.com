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
import { browserHistory } from "@/lib/ogsHistory";
import { interpolate, npgettext, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary } from "@/models/kibitz";
import "./GameKibitzRooms.css";

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
        <div className="GameKibitzRooms">
            <div className="kibitz-header">
                {pgettext(
                    "Heading above the kibitz room cards in the game chat user list",
                    "Kibitz",
                )}
                <i className="fa fa-comments" aria-hidden="true" />
            </div>
            {rooms.map((room) => {
                const viewer_count = room.viewer_count ?? 0;
                const description = room.description?.trim() ?? "";
                return (
                    <button
                        key={room.id}
                        type="button"
                        className="kibitz-room-card"
                        onClick={() => browserHistory.push(`/kibitz/${room.id}`)}
                    >
                        <span className="room-title">{room.title}</span>
                        <span className="room-info-row">
                            {description ? (
                                <span className="room-live-line" title={description}>
                                    {description}
                                </span>
                            ) : (
                                <span />
                            )}
                            <span
                                className="room-viewer-count"
                                title={interpolate(
                                    npgettext(
                                        "Tooltip for the viewer count on a kibitz room card in the game chat user list",
                                        "{{count}} person here",
                                        "{{count}} people here",
                                        viewer_count,
                                    ),
                                    { count: viewer_count },
                                )}
                            >
                                <span className="room-viewer-number">{viewer_count}</span>
                                <span className="room-viewer-icon" aria-hidden="true">
                                    <svg viewBox="0 0 16 16" focusable="false" aria-hidden="true">
                                        <path
                                            d="M8 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 1c-2.7 0-5 1.4-5 3.2V14h10v-1.8C13 10.4 10.7 9 8 9Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </span>
                            </span>
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
