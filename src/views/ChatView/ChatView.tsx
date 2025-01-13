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
import * as data from "@/lib/data";
import { useState, useEffect, useCallback } from "react";
import { ChatChannelList, ChatLog, ChatUsersList } from "@/components/Chat";
import { useParams } from "react-router";

export function ChatView(): React.ReactElement | null {
    const { channel } = useParams();

    data.set("chat.active_channel", channel);

    const [showing_channels, set_showing_channels]: [boolean, (tf: boolean) => void] = useState(
        false as boolean,
    );
    const [showing_users, set_showing_users]: [boolean, (tf: boolean) => void] = useState(
        false as boolean,
    );

    useEffect(() => {
        set_showing_channels(false);
        set_showing_users(false);
    }, [channel]);

    const onShowChannels = useCallback(
        (tf: boolean) => {
            if (tf !== showing_channels) {
                set_showing_channels(tf);
                set_showing_users(false);
            }
        },
        [channel, showing_channels],
    );

    const onShowUsers = useCallback(
        (tf: boolean) => {
            if (tf !== showing_users) {
                set_showing_users(tf);
                set_showing_channels(false);
            }
        },
        [channel, showing_users],
    );

    if (!channel) {
        console.error("Null channel passed to ChatView");
        return null;
    }

    const subprops = {
        channel: channel,
        showingChannels: showing_channels,
        showingUsers: showing_users,
        onShowChannels,
        onShowUsers,
    };

    return (
        <div
            className={
                "ChatView " +
                (showing_channels ? " show-channels" : "") +
                (showing_users ? " show-users" : "")
            }
        >
            <ChatChannelList {...subprops} />
            <ChatLog autoFocus={true} updateTitle={true} {...subprops} />
            <ChatUsersList {...subprops} />
        </div>
    );
}
