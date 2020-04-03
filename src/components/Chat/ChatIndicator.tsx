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
import {Link} from "react-router-dom";
import * as moment from "moment";
import {chat_manager, ChatChannelProxy, UnreadChanged} from "chat_manager";
import * as data from "data";


let chat_indicator_sinleton:ChatIndicator;

export class ChatIndicator extends React.PureComponent<{}, any> {

    channels_watch_mentions: {[channel:string]: ChatChannelProxy} = {};
    channels_watch_messages: {[channel:string]: ChatChannelProxy} = {};

    constructor(props) {
        super(props);
        this.state = {
            unread_ct: 0,
            mentioned: false
        };
    }

    componentDidMount() {
        data.watch("chat-indicator.notify_messages", this.onMessagesWatchListUpdate);
        //this.onMessagesWatchListUpdate(data.get("chat-indicator.notify_messages", []));
        data.watch("chat-indicator.notify_mentions", this.onMentionsWatchListUpdate);
        //this.onMentionsWatchListUpdate(data.get("chat-indicator.notify_mentions", []));
    }

    onMentionsWatchListUpdate = (channels: Array<string>) => {
        // Join new chats
        channels.forEach(channel => {
            if (!(channel in this.channels_watch_mentions)) {
                let channelProxy = chat_manager.join(channel);
                channelProxy.on("unread-count-changed", this.onMentionedChanged);
                this.channels_watch_mentions[channel] = channelProxy;
            }
        });
        // remove unsubscribed chats
        Object.keys(this.channels_watch_mentions).forEach(channel => {
            if (channels.indexOf(channel) < 0) {
                this.channels_watch_mentions[channel].part();
                delete this.channels_watch_mentions[channel];
            }
        });
        this.updateMentions();
    }

    onMessagesWatchListUpdate = (channels: Array<string>) => {
        // Join new chats
        channels.forEach(channel => {
            if (!(channel in this.channels_watch_messages)) {
                let channelProxy = chat_manager.join(channel);
                channelProxy.on("unread-count-changed", this.onUnreadCountChanged);
                this.channels_watch_messages[channel] = channelProxy;
            }
        });
        // remove unsubscribed chats
        Object.keys(this.channels_watch_messages).forEach(channel => {
            if (channels.indexOf(channel) < 0) {
                this.channels_watch_messages[channel].part();
                delete this.channels_watch_messages[channel];
            }
        });
        this.updateUnread();
    }

    onMentionedChanged = (obj: UnreadChanged) => {
        if (obj.mentioned) {
            this.setState({mentioned: true});
        } else {
            this.updateMentions();
        }
    }

    onUnreadCountChanged = (obj: UnreadChanged) => {
        this.updateUnread();

    }

    updateUnread() {
        let unread_ct = 0;
        Object.keys(this.channels_watch_messages).forEach(channel => {
            unread_ct = unread_ct + this.channels_watch_messages[channel].channel.unread_ct;
        });
        this.setState({unread_ct: unread_ct});
    }

    updateMentions() {
        Object.keys(this.channels_watch_mentions).forEach(channel => {
            if (this.channels_watch_mentions[channel].channel.mentioned) {
                this.setState({mentioned: true});
                return;
            }
        });
        this.setState({mentioned: false});
    }

    render() {
        return (
            <span className={"ChatIndicator " + (this.state.mentioned ? "mentioned " : (this.state.unread_ct > 0 ? "unread" : ""))} >
                <i className="fa fa-comment"/>
                <span className="count">{this.state.unread_ct}</span>
            </span>
            );
    }
}

