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
    show_unjoined?: boolean;
    show_read?: boolean;
    show_unsubscribed_chat?: boolean;
    collapse_unjoined?: boolean;
    collapse_read?: boolean;
    collapse_unsubscribed_chat?: boolean;
    join_subscriptions?: boolean;
    join_joined?: boolean;
    highlight_active_channel?: boolean;
    closing_toggle?: () => void;
    collapse_state_store_name?: string;
}

interface ChatListState {
    show_unjoined: boolean;
    show_read: boolean;
    show_unsubscribed_chat: boolean;
    collapse_unjoined: boolean;
    collapse_read: boolean;
    collapse_unsubscribed_chat: boolean;
    join_subscriptions: boolean;
    join_joined: boolean;
    collapsed_channel_groups: {[channel_group:string]: boolean};
    collapse_state_store_name: string;
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
            show_unjoined: props.show_unjoined,
            show_read: props.show_read,
            show_unsubscribed_chat: props.show_unsubscribed_chat,
            collapse_unjoined: props.collapse_unjoined,
            collapse_read: props.collapse_read,
            collapse_unsubscribed_chat: props.collapse_unsubscribed_chat,
            join_subscriptions: props.join_subscriptions,
            join_joined: props.join_joined,
            collapsed_channel_groups: props.collapse_state_store_name ? {global: false, groups: false, tournaments: false} : undefined,
            collapse_state_store_name: props.collapse_state_store_name,
            highlight_active_channel: props.highlight_active_channel,
            active_channel: data.get("chat.active_channel", ""),
        };
    }

    componentDidMount() {
        if (this.state.collapse_state_store_name) {
            data.watch(this.state.collapse_state_store_name, this.onCollapseStoreChanged);
        }
        data.watch("chat.active_channel", this.onActiveChannelChanged);
        data.watch("chat-indicator.chat-subscriptions", this.onChatSubscriptionUpdate);
        data.watch("chat.joined", this.onJoinedChanged);
    }

    componentWillUnmount() {
        data.unwatch(this.state.collapse_state_store_name, this.onCollapseStoreChanged);
        data.unwatch("chat.active_channel", this.onActiveChannelChanged);
        data.unwatch("chat-indicator.chat-subscriptions", this.onChatSubscriptionUpdate);
        data.unwatch("chat.joined", this.onJoinedChanged);
        Object.keys(this.channels).forEach(channel => {
            this.channels[channel].part();
            delete this.channels[channel];
        });
    }

    onCollapseStoreChanged = (obj: {[channel_group: string]: boolean}) => {
        if (!("groups" in obj)) {
            obj.groups = false;
        }
        if (!("global" in obj)) {
            obj.global = false;
        }
        if (!("tournaments" in obj)) {
            obj.tournaments = false;
        }
        this.setState({collapsed_channel_groups: obj});
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
        let collapsed_channel_groups = this.state.collapsed_channel_groups;
        collapsed_channel_groups.global = !collapsed_channel_groups.global;
        if (this.state.collapse_state_store_name) {
            data.set(this.state.collapse_state_store_name, collapsed_channel_groups);
        }
        this.forceUpdate();
    }
    toggleShowAllGroupChannels = () => {
        let collapsed_channel_groups = this.state.collapsed_channel_groups;
        collapsed_channel_groups.groups = !collapsed_channel_groups.groups;
        if (this.state.collapse_state_store_name) {
            data.set(this.state.collapse_state_store_name, collapsed_channel_groups);
        }
        this.forceUpdate();
    }
    toggleShowAllTournamentChannels = () => {
        let collapsed_channel_groups = this.state.collapsed_channel_groups;
        collapsed_channel_groups.tournaments = !collapsed_channel_groups.tournaments;
        if (this.state.collapse_state_store_name) {
            data.set(this.state.collapse_state_store_name, collapsed_channel_groups);
        }
        this.forceUpdate();
    }

    render() {
        let user = data.get('user');
        let user_country = user.country || 'un';

        let chan_class = (channel: string) => {
            let chan_class = "";
            let unread = false;
            if (!(channel in this.joined_chats && this.joined_chats[channel])) {
                chan_class = chan_class + " unjoined";
            }
            if (channel in this.channels) {
                chan_class = chan_class + " chat-subscribed";
                if (channel in this.chat_subscriptions && "unread" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].unread && this.channels[channel].channel.unread_ct > 0) {
                    chan_class = chan_class + " unread";
                    unread = true;
                }
                if (channel in this.chat_subscriptions && "mentioned" in this.chat_subscriptions[channel] && this.chat_subscriptions[channel].mentioned && this.channels[channel].channel.mentioned) {
                    chan_class = chan_class + " mentioned";
                    unread = true;
                }
            } else {
                chan_class = chan_class + " chat-unsubscribed";
            }
            if (!unread) {
                chan_class = chan_class + " read";
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
        let channel_visibility = () => {
            let visibility = "";
            if (this.state.collapse_read) {
                visibility = visibility + " hide-read";
            }
            if (this.state.collapse_unjoined) {
                visibility = visibility + " hide-unjoined";
            }
            if (this.state.collapse_unsubscribed_chat) {
                visibility = visibility + " hide-unsubscribed";
            }
            return visibility;
        };
        return (
            <div className={"ChatList" + (!this.state.show_read ? " hide-read" : "") + (!this.state.show_unjoined ? " hide-unjoined" : "") + (!this.state.show_unsubscribed_chat ? " hide-unscubscribed" : "")}>
                <div className={"channels" + (!this.state.collapsed_channel_groups["groups"] ? channel_visibility() : "")}>
                    {(group_channels.length > 0 || null) && (
                        <div className="channel-header">
                            <span>{_("Group Channels")}</span>
                            <i onClick={this.toggleShowAllGroupChannels} className={"channel-expand-toggle " + (this.state.collapsed_channel_groups["groups"] ?  "fa fa-minus" : "fa fa-plus")}/>
                        </div>
                    ) }
                    {group_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                ((this.state.highlight_active_channel && this.state.active_channel === ("group-" + chan.id)) ? "channel active" : "channel")
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

                <div className={"channels" + (!this.state.collapsed_channel_groups["tournaments"] ? channel_visibility() : "")}>
                    {(tournament_channels.length > 0 || null) && (
                        <div className="channel-header">
                            <span>{_("Tournament Channels")}</span>
                            <i onClick={this.toggleShowAllTournamentChannels} className={"channel-expand-toggle " + (this.state.collapsed_channel_groups["tournaments"] ?  "fa fa-minus" : "fa fa-plus")}/>
                        </div>
                    )}
                    {tournament_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                ((this.state.highlight_active_channel && this.state.active_channel === ("tournament-" + chan.id)) ? "channel active" : "channel")
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

                <div className={"channels" + (!this.state.collapsed_channel_groups["global"] ? channel_visibility() : "")}>
                    <div className="channel-header">
                        <span>{_("Global Channels")}</span>
                        <i onClick={this.toggleShowAllGlobalChannels} className={"channel-expand-toggle " + (this.state.collapsed_channel_groups["global"] ?  "fa fa-minus" : "fa fa-plus")}/>
                    </div>
                    {global_channels.map((chan) => (
                        <div key={chan.id}
                            className={
                                ((this.state.highlight_active_channel && this.state.active_channel === chan.id) ? "channel active" : "channel")
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
