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
import * as player_cache from "@/lib/player_cache";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import "./KibitzPresence.css";

interface KibitzPresenceProps {
    room: KibitzRoomSummary;
    users: KibitzRoomUser[];
}

export function KibitzPresence({ room, users }: KibitzPresenceProps): React.ReactElement {
    const [viewerCountFlash, setViewerCountFlash] = React.useState(false);
    const [owner, setOwner] = React.useState<player_cache.PlayerCacheEntry | null>(null);
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

    React.useEffect(() => {
        let cancelled = false;

        if (!room.creator_id) {
            setOwner(null);
            return undefined;
        }

        const cachedOwner = player_cache.lookup(room.creator_id);
        if (cachedOwner?.username) {
            setOwner(cachedOwner);
        }

        void player_cache
            .fetch(room.creator_id)
            .then((nextOwner) => {
                if (!cancelled) {
                    setOwner(nextOwner);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setOwner(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [room.creator_id]);

    const ownerUser: KibitzRoomUser | null = owner?.username
        ? {
              id: owner.id,
              username: owner.username,
              ranking: owner.ranking ?? 0,
              professional: owner.pro ?? false,
              ui_class: owner.ui_class ?? "",
              country: owner.country,
              icon: owner.icon,
          }
        : null;
    const regularUsers = ownerUser ? users.filter((user) => user.id !== ownerUser.id) : users;
    const visibleUsers = ownerUser ? [ownerUser, ...regularUsers] : regularUsers;
    const ownerStatus = ownerUser
        ? users.some((user) => user.id === ownerUser.id)
            ? null
            : pgettext("Status shown for pinned kibitz room owners who are not in the room", "away")
        : null;

    return (
        <div className="KibitzPresence">
            <div className={"presence-summary" + (viewerCountFlash ? " viewer-count-flash" : "")}>
                {interpolate(
                    pgettext(
                        "Kibitz presence summary line showing live room occupancy",
                        "In the room · {{count}} watching",
                    ),
                    { count: viewerCount },
                )}
            </div>
            <section
                className="presence-users"
                aria-label={pgettext("Current kibitz room roster section label", "In the room")}
            >
                {visibleUsers.length > 0 ? (
                    visibleUsers.map((user) => {
                        const isOwner = ownerUser !== null && user.id === ownerUser.id;

                        return (
                            <div
                                key={user.id}
                                className={"presence-user" + (isOwner ? " presence-owner" : "")}
                            >
                                <KibitzUserAvatar
                                    user={user}
                                    size={16}
                                    className="presence-avatar inline"
                                    iconClassName="presence-avatar-icon"
                                />
                                <Player user={user} flag rank noextracontrols />
                                {isOwner ? (
                                    <span className="presence-owner-tag">
                                        {pgettext(
                                            "Owner tag shown after the room owner's name",
                                            "owner",
                                        )}
                                    </span>
                                ) : null}
                                {isOwner && ownerStatus ? (
                                    <span className="presence-owner-status">{ownerStatus}</span>
                                ) : null}
                            </div>
                        );
                    })
                ) : (
                    <div className="presence-empty">
                        {pgettext(
                            "Empty state for the room presence roster in kibitz",
                            "No one is in the room yet.",
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
