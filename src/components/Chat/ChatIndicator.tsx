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
import {chat_manager, ChatChannelProxy, UnreadChanged, global_channels, group_channels, tournament_channels} from "chat_manager";
import * as data from "data";
import { KBShortcut } from "../KBShortcut";
import { ChatList } from "Chat";
import * as preferences from "preferences";
import * as EventEmitter from "eventemitter3";

let chat_subscriptions = {};
data.watch("chat-indicator.chat-subscriptions", onChatSubscriptionUpdate);
function onChatSubscriptionUpdate(pref) {
    chat_subscriptions = pref;
}
let chat_subscribe_new_group_chat_messages = false;
preferences.watch("chat-subscribe-group-chat-unread", onChatSubscribeGroupMessageChange);
function onChatSubscribeGroupMessageChange(pref) {
    chat_subscribe_new_group_chat_messages = pref;
}
let chat_subscribe_new_group_chat_mentioned = false;
preferences.watch("chat-subscribe-group-mentions", onChatSubscribeGroupMentionsChange);
function onChatSubscribeGroupMentionsChange(pref) {
    chat_subscribe_new_group_chat_mentioned = pref;
}
let chat_subscribe_new_tournament_chat_messages = false;
preferences.watch("chat-subscribe-tournament-chat-unread", onChatSubscribeTournamentMessageChange);
function onChatSubscribeTournamentMessageChange(pref) {
    chat_subscribe_new_tournament_chat_messages = pref;
}
let chat_subscribe_new_tournament_chat_mentioned = false;
preferences.watch("chat-subscribe-tournament-mentions", onChatSubscribeTournamentMentionsChange);
function onChatSubscribeTournamentMentionsChange(pref) {
    chat_subscribe_new_tournament_chat_mentioned = pref;
}

export function getUnreadChatPreference(channel:string): boolean {
    if (channel in chat_subscriptions && "unread" in chat_subscriptions[channel]) {
        return chat_subscriptions[channel].unread;
    }
    if (channel.startsWith("group-")) {
        return chat_subscribe_new_group_chat_messages;
    }
    if (channel.startsWith("tournament-")) {
        return chat_subscribe_new_group_chat_messages;
    }
    return false;
}
export function getMentionedChatPreference(channel:string): boolean {
    if (channel in chat_subscriptions && "mentioned" in chat_subscriptions[channel]) {
        return chat_subscriptions[channel].mentioned;
    }
    if (channel.startsWith("group-")) {
        return chat_subscribe_new_group_chat_mentioned;
    }
    if (channel.startsWith("tournament-")) {
        return chat_subscribe_new_group_chat_mentioned;
    }
    return false;
}
export function watchChatSubscriptionChanged(cb: (obj:any) => void):void { // Give a single place to subscribe to setting changes
    preferences.watch("chat-subscribe-group-chat-unread", cb, true, false);
    preferences.watch("chat-subscribe-group-mentions", cb), true, false;
    preferences.watch("chat-subscribe-tournament-chat-unread", cb, true, false);
    preferences.watch("chat-subscribe-tournament-mentions", cb, true, false);
    data.watch("chat-indicator.chat-subscriptions", cb, true, true);
}
export function unwatchChatSubscriptionChanged(cb: (obj:any) => void):void {
    preferences.unwatch("chat-subscribe-group-chat-unread", cb);
    preferences.unwatch("chat-subscribe-group-mentions", cb);
    preferences.unwatch("chat-subscribe-tournament-chat-unread", cb);
    preferences.unwatch("chat-subscribe-tournament-mentions", cb);
    data.unwatch("chat-indicator.chat-subscriptions", cb);
}

let chat_indicator_sinleton:ChatIndicator;

export class ChatIndicator extends React.PureComponent<{}, any> {

    channels: {[channel:string]: ChatChannelProxy} = {};

    constructor(props) {
        super(props);
        this.state = {
            unread_ct: 0,
            mentioned: false,
            show_friend_list: false,
            show_empty_notification: true,
        };
    }

    componentDidMount() {
        preferences.watch("show-empty-chat-notification", this.onShowEmptyNotification);
        watchChatSubscriptionChanged(this.onChatSubscriptionUpdate);
    }

    componentWillUnmount() {
        preferences.unwatch("show-empty-chat-notification", this.onShowEmptyNotification);
        unwatchChatSubscriptionChanged(this.onChatSubscriptionUpdate);
        Object.keys(this.channels).forEach(channel => {
            this.channels[channel].part();
            delete this.channels[channel];
        });
    }

    onShowEmptyNotification = (pref) => {
        this.setState({show_empty_notification: pref});
    }

    onChatSubscriptionUpdate = (obj) => {
        // Join new chats
        let join = (channel:string) => {
            if (!(channel in this.channels) &&
                    getUnreadChatPreference(channel) ||
                    getMentionedChatPreference(channel)) {
                let channelProxy = chat_manager.join(channel);
                channelProxy.on("unread-count-changed", this.onUnreadCountChange);
                this.channels[channel] = channelProxy;
            }
        };
        global_channels.forEach(element => {
            join(element.id);
        });
        group_channels.forEach(element => {
            join("group-" + element.id);
        });
        tournament_channels.forEach(element => {
            join("tournament-" + element.id);
        });
        // remove unsubscribed chats
        Object.keys(this.channels).forEach(channel => {
            if (!(getUnreadChatPreference(channel) ||
                  getMentionedChatPreference(channel))) {
                this.channels[channel].part();
                delete this.channels[channel];
            }
        });
        this.updateStats();
        this.forceUpdate();
    }

    onUnreadCountChange = (obj) => {
        this.updateStats();
    }

    updateStats() {
        let unread_ct = 0;
        let mentioned = false;
        Object.keys(chat_subscriptions).forEach(channel => {
            if (channel in this.channels) {
                if (getUnreadChatPreference(channel)) {
                    unread_ct = unread_ct + this.channels[channel].channel.unread_ct;
                }
                if (getMentionedChatPreference(channel)) {
                    mentioned = mentioned || this.channels[channel].channel.mentioned;
                }
            }
        });
        this.setState({unread_ct: unread_ct,
                       mentioned: mentioned});
    }

    toggleChatList = () => {
        this.setState({
            show_friend_list: !this.state.show_friend_list
        });
    }

    render() {
        return (
            <span className={"ChatIndicator" + (this.state.mentioned ? " mentioned" : (this.state.unread_ct > 0 ? " unread" : ""))}>
                {(this.state.show_empty_notification || this.state.mentioned || this.state.unread_ct > 0) &&
                <span className={"navbar-icon"} onClick={this.toggleChatList} >
                    <i className="fa fa-comment" />
                    <span className="count" >{this.state.unread_ct} </span>
                </span>}
                {(this.state.show_friend_list || null) &&
                    <div>
                        <KBShortcut shortcut="escape" action={this.toggleChatList}/>
                        <ChatList join_subscriptions show_read collapse_read collapse_unsubscribed_chat collapse_state_store_name="chat-indicator.collapse-chat-group" closing_toggle={this.toggleChatList}/>
                    </div>
                }
            </span>
            );
    }
}

