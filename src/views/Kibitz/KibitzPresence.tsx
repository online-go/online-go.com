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
import { Player } from "@/components/Player";
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary, KibitzRoomUser } from "@/models/kibitz";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import "./KibitzPresence.css";

interface KibitzPresenceProps {
    room: KibitzRoomSummary;
    users: KibitzRoomUser[];
}

export function KibitzPresence({ room, users }: KibitzPresenceProps): React.ReactElement {
    const [viewerCountFlash, setViewerCountFlash] = React.useState(false);
    const previousViewerCountRef = React.useRef<number | null>(null);

    // The active-room viewer_count is kept current by the controller via the
    // viewer-count-changed UIPush event; no per-component chat join is needed.
    const viewerCount = room.viewer_count;

    React.useEffect(() => {
        if (previousViewerCountRef.current == null) {
            previousViewerCountRef.current = viewerCount;
            return;
        }

        if (previousViewerCountRef.current === viewerCount) {
            return;
        }

        const previousViewerCount = previousViewerCountRef.current;
        previousViewerCountRef.current = viewerCount;

        if (viewerCount <= previousViewerCount) {
            setViewerCountFlash(false);
            return;
        }

        setViewerCountFlash(true);
        const timeout = window.setTimeout(() => {
            setViewerCountFlash(false);
        }, 700);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [viewerCount]);

    return (
        <div className="KibitzPresence">
            <div className="KibitzPresence-body">
                <div className="presence-header">
                    <div className="presence-users-heading">
                        {pgettext(
                            "Heading for the current room user list in kibitz",
                            "In the room",
                        )}
                    </div>
                    <div
                        className={
                            "presence-stat" + (viewerCountFlash ? " viewer-count-flash" : "")
                        }
                    >
                        <span className="presence-stat-icon" aria-hidden="true">
                            <svg viewBox="0 0 16 16" focusable="false">
                                <path
                                    d="M8 8a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 1c-2.7 0-5 1.4-5 3.2V14h10v-1.8C13 10.4 10.7 9 8 9Z"
                                    fill="currentColor"
                                />
                            </svg>
                        </span>
                        <span className="presence-stat-text">
                            {interpolate(
                                pgettext(
                                    "Viewer count summary inside a kibitz room",
                                    "{{count}} watching",
                                ),
                                { count: viewerCount },
                            )}
                        </span>
                    </div>
                </div>
                {users.length > 0 ? (
                    <div className="presence-users">
                        {users.map((user) => (
                            <div key={user.id} className="presence-user">
                                <KibitzUserAvatar
                                    user={user}
                                    size={16}
                                    className="presence-avatar inline"
                                    iconClassName="presence-avatar-icon"
                                />
                                <Player user={user} flag rank noextracontrols />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="presence-empty">
                        {pgettext(
                            "Empty state for the room presence roster in kibitz",
                            "No one is in the room yet.",
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
