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
import { setActiveChannel } from "Chat";
import { shouldOpenNewTab } from "misc";
import {browserHistory} from "ogsHistory";
import * as preferences from "preferences";


interface ChatListProperties {
    show_all?: boolean;
    show_read?: boolean;
    show_subscribed_notifications?: boolean;
    join_subscriptions?: boolean;
    join_joined?: boolean;
    highlight_active_channel?: boolean;
    closing_toggle?: () => void;
}

interface ChatListState {
    show_all: boolean;
    show_read: boolean;
    show_subscribed_notifications: boolean;
    join_subscriptions: boolean;
    join_joined: boolean;
    show_all_group_channels: boolean;
    show_all_tournament_channels: boolean;
    show_all_global_channels: boolean;
    highlight_active_channel: boolean;
    active_channel: string;
}

export class ChatList extends React.PureComponent<ChatListProperties, ChatListState> {
    channels: {[channel:string]: ChatChannelProxy} = {};
    chat_subscriptions: {[channel:string]: {[subscription:string]: Boolean}} = {};
    joined_chats = {};
    closing_toggle: () => void = () => null;

    constructor(props) {
        super(props);
        if (props.closing_toggle) {
            this.closing_toggle = props.closing_toggle;
        }
        this.state = {
            show_all: props.show_all,
            show_read: props.show_read,
            show_subscribed_notifications: props.show_subscribed_notifications,
            join_subscriptions: props.join_subscriptions,
            join_joined: props.join_joined,
            show_all_group_channels: props.show_all || preferences.get("chat.show-all-group-channels"),
            show_all_tournament_channels: props.show_all || preferences.get("chat.show-all-tournament-channels"),
            show_all_global_channels: props.show_all || preferences.get("chat.show-all-global-channels"),
            highlight_active_channel: props.highlight_active_channel,
            active_channel: data.get("chat.active_channel", ""),
        };
    }

    componentDidMount() {
        data.watch("chat.active_channel", this.onActiveChannelChanged);
        data.watch("chat-indicator.chat-subscriptions", this.onChatSubscriptionUpdate);
        data.watch("chat.joined", this.onJoinedChanged);
    }

    componentWillUnmount() {
        data.unwatch("chat.active_channel", this.onActiveChannelChanged);
        data.unwatch("chat-indicator.chat-subscriptions", this.onChatSubscriptionUpdate);
        data.unwatch("chat.joined", this.onJoinedChanged);
        Object.keys(this.channels).forEach(channel => {
            this.channels[channel].part();
            delete this.channels[channel];
        });
    }

    onActiveChannelChanged = (channel) => {
        this.setState({
            active_channel: channel,
        });
    }

    onJoinedChanged = (joined: {[channel:string]: number}) => {
        if (joined === undefined) {
            joined = {};
        }
        this.joined_chats = joined;
        this.updateConnectedChannels();
    }

    onChatSubscriptionUpdate = (subscriptions: {[channel:string]: {[channel:string]: Boolean}}) => {
        if (subscriptions === undefined) {
            subscriptions = {};
        }
        this.chat_subscriptions = subscriptions;
        this.updateConnectedChannels();
    }

    _join(channel:string) {
        if (this.state.join_subscriptions &&
            channel in this.chat_subscriptions &&
            (("unread" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].unread) ||
             ("mentioned" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].mentioned))) {
                if (!(channel in this.channels)) {
                    let channelProxy = chat_manager.join(channel);
                    channelProxy.on("unread-count-changed", this.onUnreadCountChange);
                    this.channels[channel] = channelProxy;
                }
                return;
        }
        if (this.state.join_joined &&
            channel in this.joined_chats &&
            this.joined_chats[channel]) {
                if (!(channel in this.channels)) {
                    let channelProxy = chat_manager.join(channel);
                    channelProxy.on("unread-count-changed", this.onUnreadCountChange);
                    this.channels[channel] = channelProxy;
                }
                return;
        }
        if (channel in this.channels) {
            this.channels[channel].part();
            delete this.channels[channel];
        }
    }

    updateConnectedChannels() {
        for (let idx = 0; idx < global_channels.length; idx = idx + 1) {
            this._join(global_channels[idx].id);
        }
        for (let idx = 0; idx < tournament_channels.length; idx = idx + 1) {
            this._join("tournament-" + tournament_channels[idx].id);
        }
        for (let idx = 0; idx < group_channels.length; idx = idx + 1) {
            this._join("group-" + group_channels[idx].id);
        }
        this.forceUpdate();
    }

    onUnreadCountChange = (obj) => {
        this.forceUpdate();
    }

    goToChannel = (ev) => {
        setActiveChannel($(ev.target).attr("data-channel"));
        if (ev && shouldOpenNewTab(ev)) {
            window.open("/chat");
        } else {
            //window.open("/game/" + board_ids[idx]);
            if (window.location.pathname !== "/chat") {
                browserHistory.push("/chat");
            }
        }
        this.closing_toggle();
    }

    toggleShowAllGlobalChannels = () => {
        if (this.state.show_all) {
            preferences.set("chat.show-all-global-channels", !this.state.show_all_global_channels);
        }
        this.setState({show_all_global_channels: !this.state.show_all_global_channels});
    }
    toggleShowAllGroupChannels = () => {
        if (this.state.show_all) {
            preferences.set("chat.show-all-group-channels", !this.state.show_all_group_channels);
        }
        this.setState({show_all_group_channels: !this.state.show_all_group_channels});
    }
    toggleShowAllTournamentChannels = () => {
        if (this.state.show_all) {
            preferences.set("chat.show-all-tournament-channels", !this.state.show_all_tournament_channels);
        }
        this.setState({show_all_tournament_channels: !this.state.show_all_tournament_channels});
    }

    render() {
        let user = data.get('user');
        let user_country = user.country || 'un';

        let chan_class = (channel: string) => {
            let chan_class = "";
            if (!(channel in this.joined_chats && this.joined_chats[channel])) {
                chan_class = chan_class + " unjoined";
            }
            if (channel in this.channels) {
                if (channel in this.chat_subscriptions && "unread" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].unread && this.channels[channel].channel.unread_ct > 0) {
                    chan_class = chan_class + " unread";
                }
                if (channel in this.chat_subscriptions && "mentioned" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].mentioned && this.channels[channel].channel.mentioned) {
                    chan_class = chan_class + " mentioned";
                }
            }
            return chan_class;
        };

        let message_count = (channel: string) => {
            if (!(channel in this.channels)) {
                return null;
            }
            let c = this.channels[channel].channel;
            if (c.unread_ct > 0) {
                return <span className="unread-count" data-count={"(" + c.unread_ct + ")"} data-menu="▼" data-channel={channel} />;
            }
            return null;
        };
        return (
            <div className="ChatList">
                <div className={"channels" + (!this.state.show_all_group_channels ? " hide-unjoined" : "")}>
                    {(group_channels.length > 0 || null) && (
                        <div className="channel-header">
                            <span>{_("Group Channels")}</span>
                            <i onClick={this.toggleShowAllGroupChannels} className={"channel-expand-toggle " + (this.state.show_all_group_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                        </div>
                    ) }
                    {group_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                (this.state.active_channel === ("group-" + chan.id) ? "channel active" : "channel")
                                + chan_class("group-" + chan.id)
                            }
                            data-channel={"group-" + chan.id}
                            onClick={this.goToChannel}
                        >
                            <span className="channel-name" data-channel={"group-" + chan.id}>
                                <img className="icon" src={chan.icon}/> {chan.name}
                            </span>
                            {message_count("group-" + chan.id)}
                        </div>
                    ))}
                </div>

                <div className={"channels" + (!this.state.show_all_tournament_channels ? " hide-unjoined" : "")}>
                    {(tournament_channels.length > 0 || null) && (
                        <div className="channel-header">
                            <span>{_("Tournament Channels")}</span>
                            <i onClick={this.toggleShowAllTournamentChannels} className={"channel-expand-toggle " + (this.state.show_all_tournament_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                        </div>
                    )}
                    {tournament_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                (this.state.active_channel === ("tournament-" + chan.id) ? "channel active" : "channel")
                                + chan_class("tournament-" + chan.id)
                            }
                            data-channel={"tournaments-" + chan.id}
                            onClick={this.goToChannel}
                        >
                            <span className="channel-name" data-channel={"tournament-" + chan.id} >
                                <i className="fa fa-trophy" /> {chan.name}
                            </span>
                            {message_count("tournament-" + chan.id)}
                        </div>
                    ))}
                </div>

                <div className={"channels" + (!this.state.show_all_global_channels ? " hide-unjoined" : "")}>
                    <div className="channel-header">
                        <span>{_("Global Channels")}</span>
                        <i onClick={this.toggleShowAllGlobalChannels} className={"channel-expand-toggle " + (this.state.show_all_global_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                    </div>
                    {global_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                (this.state.active_channel === chan.id ? "channel active" : "channel")
                                + chan_class(chan.id)
                            }
                            data-channel={chan.id}
                            onClick={this.goToChannel}
                        >
                            <span className="channel-name" data-channel={chan.id}>
                                <Flag country={chan.country} language={chan.language} user_country={user_country} /> {chan.name}
                            </span>
                            {message_count(chan.id)}
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}
