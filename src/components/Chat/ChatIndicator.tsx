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
import { KBShortcut } from "../KBShortcut";
import { FriendList } from "../FriendList";
import { ChatList } from "./ChatList";


let chat_indicator_sinleton:ChatIndicator;

export class ChatIndicator extends React.PureComponent<{}, any> {

    channels: {[channel:string]: ChatChannelProxy} = {};
    chat_subscriptions: {[channel:string]: {[channel:string]: Boolean}} = {};

    constructor(props) {
        super(props);
        this.state = {
            unread_ct: 0,
            mentioned: false,
            show_friend_list: false,
        };
    }

    componentDidMount() {
        data.watch("chat-indicator.chat-subscriptions", this.onChatSubscriptionUpdate);
    }

    componentWillUnmount() {
        data.unwatch("chat-indicator.chat-subscriptions", this.onChatSubscriptionUpdate);
        Object.keys(this.channels).forEach(channel => {
            this.channels[channel].part();
            delete this.channels[channel];
        });
    }

    onChatSubscriptionUpdate = (subscriptions: {[channel:string]: {[channel:string]: Boolean}}) => {
        if (subscriptions === undefined) {
            subscriptions = {};
        }
        // Join new chats
        Object.keys(subscriptions).forEach(channel => {
            if (!(channel in this.channels) &&
                    ("unread" in subscriptions[channel] && subscriptions[channel].unread) ||
                    ("mentioned" in subscriptions[channel] && subscriptions[channel].mentioned)) {
                let channelProxy = chat_manager.join(channel);
                channelProxy.on("unread-count-changed", this.onUnreadCountChange);
                this.channels[channel] = channelProxy;
            }
        });
        // remove unsubscribed chats
        Object.keys(this.channels).forEach(channel => {
            if (!(channel in subscriptions) ||
                    !(("unread" in subscriptions[channel] && subscriptions[channel].unread) ||
                      ("mentioned" in subscriptions[channel] && subscriptions[channel].mentioned))) {
                this.channels[channel].part();
                delete this.channels[channel];
            }
        });
        this.chat_subscriptions = subscriptions;
        this.updateStats();
    }

    onUnreadCountChange = (obj) => {
        this.updateStats();
    }

    updateStats() {
        let unread_ct = 0;
        let mentioned = false;
        Object.keys(this.chat_subscriptions).forEach(channel => {
            if (channel in this.channels) {
                if ("unread" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].unread) {
                    unread_ct = unread_ct + this.channels[channel].channel.unread_ct;
                }
                if ("mentioned" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].mentioned) {
                    mentioned = mentioned || this.channels[channel].channel.mentioned;
                }
            }
        });
        this.setState({unread_ct: unread_ct,
                       mentioned: mentioned});
    }

    toggleFriendList = () => {
        this.setState({
            show_friend_list: !this.state.show_friend_list
        });
    }

    render() {
        return (
            <span className={"ChatIndicator " + (this.state.mentioned ? "mentioned " : (this.state.unread_ct > 0 ? "unread" : ""))}  onClick={this.toggleFriendList} >
                <i className="fa fa-comment"/>
                <span className="count">{this.state.unread_ct}</span>
                {(this.state.show_friend_list || null) &&
                    <div>
                        <KBShortcut shortcut="escape" action={this.toggleFriendList}/>
                        <div className='FriendListBackdrop' onClick={this.toggleFriendList} />
                        <ChatList show_subscribed_notifications/>
                    </div>
                }
            </span>
            );
    }
}

