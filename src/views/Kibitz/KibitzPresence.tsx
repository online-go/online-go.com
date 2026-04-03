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
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzRoomSummary } from "@/models/kibitz";
import { User } from "goban";
import "./KibitzPresence.css";

interface KibitzPresenceProps {
    room: KibitzRoomSummary;
}

export function KibitzPresence({ room }: KibitzPresenceProps): React.ReactElement {
    const [proxy, setProxy] = React.useState<ChatChannelProxy | null>(null);
    const [, refresh] = React.useState(0);

    React.useEffect(() => {
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
    }, [room.channel]);

    const users: User[] = proxy ? Object.values(proxy.channel.user_list).sort(users_by_rank) : [];

    return (
        <div className="KibitzPresence">
            <div className="KibitzPresence-title">
                {pgettext("Heading for the user presence panel in a kibitz room", "Presence")}
            </div>
            <div className="KibitzPresence-body">
                <div className="presence-stat">
                    {interpolate(
                        pgettext("Viewer count summary inside a kibitz room", "{{count}} watching"),
                        { count: room.viewer_count },
                    )}
                </div>
                <div className="presence-stat">{room.kind}</div>
                {users.length > 0 ? (
                    <div className="presence-users">
                        {users.map((user) => (
                            <div key={user.id} className="presence-user">
                                <Player user={user} flag rank noextracontrols />
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
