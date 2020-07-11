/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
//import {post, get} from "requests";
//import {errorAlerter} from "misc";
//import {Chat} from "Chat";
import { ChatChannelList, EmbeddedChat, ChatUsersList } from "Chat";


interface ChatViewProperties {
    match: {
        params: {
            channel?: string;
        }
    };
}


export function ChatView(props: ChatViewProperties):JSX.Element {
    let channel = props?.match?.params?.channel;
    if (!channel) {
        channel = 'english';
    }

    return (
        <div className="ChatView">
            <ChatChannelList channel={channel} />
            <EmbeddedChat channel={channel} autoFocus={true} updateTitle={true} />
            <ChatUsersList channel={channel} />
        </div>
    );
}
