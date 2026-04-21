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
import { chat_manager, ChatChannelProxy } from "@/lib/chat_manager";
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzMode, KibitzRoomSummary, KibitzRoomUser } from "@/models/kibitz";
import { User } from "goban";
import "./KibitzPresence.css";

interface KibitzPresenceProps {
    mode: KibitzMode;
    room: KibitzRoomSummary;
    users: KibitzRoomUser[];
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

function getUserIcon(user: KibitzRoomUser | User | null | undefined): string | undefined {
    if (!user || typeof user !== "object") {
        return undefined;
    }

    const icon = "icon" in user ? user.icon : undefined;

    return typeof icon === "string" && icon.length > 0 ? icon : undefined;
}

function PresenceAvatar({
    user,
    className,
}: {
    user: KibitzRoomUser | User;
    className: string;
}): React.ReactElement {
    const username = user.username ?? "";
    const icon = getUserIcon(user);

    return (
        <span className={className} title={username} aria-hidden="true">
            {icon ? (
                <img className="presence-avatar-image" src={icon} alt="" aria-hidden="true" />
            ) : (
                getUserInitials(username)
            )}
        </span>
    );
}

export function KibitzPresence({ mode, room, users }: KibitzPresenceProps): React.ReactElement {
    const [proxy, setProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);

    React.useEffect(() => {
        if (mode === "demo") {
            setProxy(null);
            return;
        }

        const nextProxy = chat_manager.join(room.channel);
        setProxy(nextProxy);

        const sync = () => refresh((value) => value + 1);
        nextProxy.on("join", sync);
        nextProxy.on("part", sync);
        sync();

        return () => {
            nextProxy.off("join", sync);
            nextProxy.off("part", sync);
            nextProxy.part();
        };
    }, [mode, room.channel]);

    const channelUsers: User[] = proxy ? [...proxy.channel.users_by_join].reverse() : [];
    const visibleUsers = mode === "demo" ? users : channelUsers;
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
                    <div className="presence-stat">
                        {interpolate(
                            pgettext(
                                "Viewer count summary inside a kibitz room",
                                "{{count}} watching",
                            ),
                            { count: room.viewer_count },
                        )}
                    </div>
                </div>
                {visibleUsers.length > 0 ? (
                    <div className="presence-users">
                        {visibleUsers.map((user) => (
                            <div key={user.id} className="presence-user">
                                <PresenceAvatar user={user} className="presence-avatar inline" />
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
