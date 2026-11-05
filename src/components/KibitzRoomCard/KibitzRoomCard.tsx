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
import { interpolate, npgettext } from "@/lib/translate";
import "./KibitzRoomCard.css";

interface KibitzRoomCardProps {
    room: { id: string; title: string; viewer_count?: number };
    /** Shown beside the viewer count when there are no children. */
    description?: string | null;
    /** Replaces the description line. */
    children?: React.ReactNode;
}

/** A button that opens a kibitz room: its title, one line of detail, and its viewer count. */
export function KibitzRoomCard({
    room,
    description,
    children,
}: KibitzRoomCardProps): React.ReactElement {
    const viewer_count = room.viewer_count ?? 0;
    const trimmed_description = description?.trim();

    return (
        <button
            type="button"
            className="KibitzRoomCard"
            onClick={() => browserHistory.push(`/kibitz/${room.id}`)}
        >
            <span className="room-title">{room.title}</span>
            <span className="room-info-row">
                {children ??
                    (trimmed_description ? (
                        <span className="room-live-line" title={trimmed_description}>
                            {trimmed_description}
                        </span>
                    ) : (
                        <span />
                    ))}
                <span
                    className="room-viewer-count"
                    title={interpolate(
                        npgettext(
                            "Tooltip for the viewer count on a kibitz room card",
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
}
