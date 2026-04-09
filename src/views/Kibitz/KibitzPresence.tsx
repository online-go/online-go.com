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
import { chat_manager, ChatChannelProxy, users_by_rank } from "@/lib/chat_manager";
import { pgettext } from "@/lib/translate";
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

    const channelUsers: User[] = proxy
        ? Object.values(proxy.channel.user_list).sort(users_by_rank)
        : [];
    const visibleUsers = mode === "demo" ? users : channelUsers;
    const stackedUsers = visibleUsers.slice(0, 5);
    const overflowCount = Math.max(0, visibleUsers.length - stackedUsers.length);

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
                    {stackedUsers.length > 0 ? (
                        <div className="presence-avatar-stack" aria-hidden="true">
                            {stackedUsers.map((user) => (
                                <span
                                    key={user.id}
                                    className="presence-avatar"
                                    title={user.username}
                                >
                                    {getUserInitials(user.username)}
                                </span>
                            ))}
                            {overflowCount > 0 ? (
                                <span className="presence-avatar presence-avatar-overflow">
                                    +{overflowCount}
                                </span>
                            ) : null}
                        </div>
                    ) : null}
                </div>
                {visibleUsers.length > 0 ? (
                    <div className="presence-users">
                        {visibleUsers.map((user) => (
                            <div key={user.id} className="presence-user">
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
