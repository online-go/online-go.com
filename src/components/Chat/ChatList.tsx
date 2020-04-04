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
import { group_channels, tournament_channels, global_channels, ChatChannelProxy, chat_manager } from "chat_manager";
import * as data from "data";
import { PersistentElement } from "PersistentElement";
import { Flag } from "Flag";


interface ChatListProperties {
    show_all?: boolean;
    show_read?: boolean;
    show_subscribed_notifications?: boolean;
    join_subscriptions?: boolean;
    join_joined?: boolean;
}

export class ChatList extends React.PureComponent<ChatListProperties, any> {
    channels: {[channel:string]: ChatChannelProxy} = {};
    chat_subscriptions: {[channel:string]: {[subscription:string]: Boolean}} = {};
    constructor(props) {
        super(props);
        this.state = {
            show_all: props.show_all,
            show_read: props.show_read,
            show_subscribed_notifications: props.show_subscribed_notifications,
            join_subscriptions: props.join_subscriptions,
            join_joined: props.join_joined,
            global_channels: [],
            group_channels: [],
            tournament_channels: [],
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
        this.updateChannelLists();
    }

    onUnreadCountChange = (obj) => {
        this.updateChannelLists();
    }

    updateChannelLists() {
        let showChannel = (channel: string) => {
            if (this.state.show_all) {
                return true;
            }
            if (channel in this.channels) {
                if (this.state.show_read) {
                    return true;
                }
                if (this.state.show_subscribed_notifications) {
                    if ("unread" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].unread && this.channels[channel].channel.unread_ct > 0) {
                        return true;
                    }
                    if ("mentioned" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].mentioned && this.channels[channel].channel.mentioned) {
                        return true;
                    }
                }
            }
            return false;
        };
        // global-channels
        let globals = [];
        let tournaments = [];
        let groups = [];
        for (let idx = 0; idx < global_channels.length; idx = idx + 1) {
            if (showChannel(global_channels[idx].id)) {
                globals.push(global_channels[idx]);
            }
        }
        for (let idx = 0; idx < tournament_channels.length; idx = idx + 1) {
            if (showChannel("tournament-" + tournament_channels[idx].id)) {
                tournaments.push(tournament_channels[idx]);
            }
        }
        for (let idx = 0; idx < group_channels.length; idx = idx + 1) {
            if (showChannel("group-" + group_channels[idx].id)) {
                groups.push(group_channels[idx]);
            }
        }
        this.setState({
            global_channels: globals,
            tournament_channels: tournaments,
            group_channels: groups
        });
        console.warn(globals);
    }

    render() {
        let user = data.get('user');
        let user_country = user.country || 'un';

        let chan_class = (chan: string): string => {
            if (!(chan in this.channels)) {
                return "";
            }
            return (this.channels[chan].channel.unread_ct > 0 ? " unread" : "") +
                (this.channels[chan].channel.mentioned ? " mentioned" : "");
//                (chan in this.state.joined_channels ? " joined" : " unjoined")+
        };

        let user_count = (channel: string) => {
            if (!(channel in this.channels)) {
                return null;
            }
            let c = this.channels[channel].channel;
            if (c.unread_ct > 0) {
                return <span className="unread-count" data-count={"(" + c.unread_ct + ")"} data-menu="▼" data-channel={channel} />;
            }
            /*
            if (c.user_count) {
                return <span className='user-count' data-count={c.user_count} data-leave={_("leave")} onClick={this.part.bind(this, channel, false, false)} />;
            }
            */
            return null;
        };

//        let showChannels = !!this.props.showChannels;
//        let showUserList = !!this.props.showUserList;
        return (
            <div className="ChatList">
                <div className={"channels" + (!this.state.show_all_group_channels ? " hide-unjoined" : "")}>
                    {(this.state.group_channels.length > 0 || null) && (
                        <div className="channel-header">
                            <span>{_("Group Channels")}</span>
                            <i className={"channel-expand-toggle " + (this.state.show_all_group_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                        </div>
                    ) }
                    {this.state.group_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                (this.state.active_channel === ("group-" + chan.id) ? "channel active" : "channel")
                                + chan_class("group-" + chan.id)
                            }
                        >
                            <span className="channel-name" data-channel={"group-" + chan.id}>
                                <img className="icon" src={chan.icon}/> {chan.name}
                            </span>
                            {user_count("group-" + chan.id)}
                        </div>
                    ))}
                </div>

                <div className={"channels" + (!this.state.show_all_tournament_channels ? " hide-unjoined" : "")}>
                    {(this.state.tournament_channels.length > 0 || null) && (
                        <div className="channel-header">
                            <span>{_("Tournament Channels")}</span>
                            <i className={"channel-expand-toggle " + (this.state.show_all_tournament_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                        </div>
                    )}
                    {this.state.tournament_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                (this.state.active_channel === ("tournament-" + chan.id) ? "channel active" : "channel")
                                + chan_class("tournament-" + chan.id)
                            }
                        >
                            <span className="channel-name" data-channel={"tournament-" + chan.id} >
                                <i className="fa fa-trophy" /> {chan.name}
                            </span>
                            {user_count("tournament-" + chan.id)}
                        </div>
                    ))}
                </div>

                <div className={"channels" + (!this.state.show_all_global_channels ? " hide-unjoined" : "")}>
                    <div className="channel-header">
                        <span>{_("Global Channels")}</span>
                        <i className={"channel-expand-toggle " + (this.state.show_all_global_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                    </div>
                    {this.state.global_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                (this.state.active_channel === chan.id ? "channel active" : "channel")
                                + chan_class(chan.id)
                            }
                        >
                            <span className="channel-name" data-channel={chan.id}>
                                <Flag country={chan.country} language={chan.language} user_country={user_country} /> {chan.name}
                            </span>
                            {user_count(chan.id)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
