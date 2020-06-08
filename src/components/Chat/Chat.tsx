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
import {_, pgettext, interpolate} from "translate";
import {Player} from "Player";
import {profanity_filter} from "profanity_filter";
import {comm_socket} from "sockets";
import * as data from "data";
import * as preferences from "preferences";
import {Flag} from "Flag";
import {Card} from "material";
import {TabCompleteInput} from "TabCompleteInput";
import { PlayerCacheEntry } from "player_cache";
import {string_splitter, n2s, dup} from "misc";
import {SeekGraph} from "SeekGraph";
import {PersistentElement} from "PersistentElement";
import {chat_manager, users_by_rank, ChatChannelProxy, global_channels, group_channels, tournament_channels, resolveChannelDisplayName} from 'chat_manager';
import * as moment from "moment";
import {popover} from "popover";
import {ChatDetails} from './ChatDetails';
import {shouldOpenNewTab} from 'misc';
import { active } from "d3";


declare let swal;


data.setDefault("chat.joined", {});

let name_match_regex = /^loading...$/;
data.watch("config.user", (user) => {
    let cleaned_username_regex = user.username.replace(/[\\^$*+.()|[\]{}]/g, "\\$&");
    name_match_regex = new RegExp(
          "\\b"  + cleaned_username_regex + "\\b"
        + "|\\bplayer ?" + user.id + "\\b"
        + "|\\bhttps?:\\/\\/online-go\\.com\\/user\\/view\\/" + user.id + "\\b"
        , "i");
});

let rtl_mode:{[channel: string]: boolean} = {};
for (let chan of global_channels) {
    rtl_mode[chan.id] = !!chan.rtl;
}

interface Channel {
    name: string;
    chat_log: Array<ChatMessage>;
    chat_ids: {
        [uuid:string]: boolean
    };
    unread_ct: number;
    mentioned: boolean;
    user_list: {
        [player_id:string]: ChatUser
    };
    user_count: number;
    rtl_mode: boolean;
}
let channels:{[channel:string]: ChatChannelProxy} = {};

function getChannel(channel) {
    if (!(channel in channels)) {
        return {
            name: "<error>",
            chat_log: [],
            chat_ids: {},
            unread_ct: 0,
            mentioned: false,
            user_list: {},
            user_count: 0,
            rtl_mode: rtl_mode[channel],
            markAsRead() {}
        };
    }
    return channels[channel].channel;
}

interface ChatMessage {
    channel: string;
    username: string;
    id: number;
    ranking: number;
    professional: boolean;
    ui_class: string;
    message: {
        i: string; // uuid;
        t: number; // epoch in seconds
        m: string; // the text
    };
    system_message_type?:'flood';
    system?:boolean; // true if it's a system message
}
interface ChatUser extends PlayerCacheEntry {
    professional: boolean;
}
interface ChatProperties {
    channel?: string;
    autofocus?: boolean;
    showChannels?: boolean;
    showUserList?: boolean;
    updateTitle: boolean;
    fakelink?: boolean;
}

interface ChatState {
    online_count: number;
    chat_log: Array<ChatMessage>;
    user_list: {[player_id:string]: ChatUser};
    joined_channels: Array<string>;
    active_channel: string;
    lock_active_channel: boolean;
    show_all_global_channels: boolean;
    show_all_group_channels: boolean;
    show_all_tournament_channels: boolean;
    user_sort_order: 'alpha' | 'rank';
    force_show_channels: boolean;
    force_show_users: boolean;
    show_say_hi_placeholder: boolean;
    rtl_mode: boolean;
}


export function setActiveChannel(channel: string) {
    if (!channel) {
        throw new Error(`Invalid channel ID: ${channel}`);
    }
    data.set("chat.active_channel", channel);
}


export class Chat extends React.Component<ChatProperties, ChatState> {
    refs: {
        input;
        chat_log;
        elt;
    };

    received_messages = {};
    online_count_interval = null;
    joining_channel = {};
    defered_state_update = null;
    send_tokens = 5;
    scrolled_to_bottom: boolean = true;
    flood_protection = null;
    unread_ct: number = 0;

    seekgraph: SeekGraph;
    seekgraph_canvas: any;



    constructor(props) {
        super(props);
        this.state = {
            online_count: 0,
            chat_log: [],
            user_list: {},
            joined_channels: this.props.channel ? [this.props.channel] : data.get("chat.joined"),
            active_channel: this.props.channel ? this.props.channel : data.get("chat.active_channel", "global-english"),
            lock_active_channel: "channel" in this.props,
            show_all_global_channels: preferences.get("chat.show-all-global-channels"),
            show_all_group_channels: preferences.get("chat.show-all-group-channels"),
            show_all_tournament_channels: preferences.get("chat.show-all-tournament-channels"),
            user_sort_order: preferences.get("chat.user-sort-order"),
            force_show_channels: false,
            force_show_users: false,
            show_say_hi_placeholder: true,
            rtl_mode: false,
        };

        this.seekgraph_canvas = $("<canvas class='SeekGraph'>")[0];
    }

    componentDidMount() {

        comm_socket.on("connect", this.connect);
        comm_socket.on("disconnect", this.disconnect);
        if (comm_socket.connected) {
            this.connect();
        }

        if (this.props.autofocus) {
            $(this.refs.input.refs.input).focus();
        }
        this.autoscroll();
        $(window).on("focus", this.onDocumentFocus);

        let joined = data.get("chat.joined");

        for (let channel in joined) {
            this.join(channel);
        }
        if (!(this.state.active_channel in joined)) {
            this.join(this.state.active_channel);
        }
        this.setActiveChannel(this.state.active_channel);

        data.watch("chat.active_channel", this.onActiveChannelChanged, false, false);

        this.seekgraph = new SeekGraph({
            canvas: this.seekgraph_canvas,
            show_live_games: true,
        });

        let I;
        let sanityCheck = 100;
        let resizeSeekgraph = () => {
            --sanityCheck;
            if ($(this.seekgraph_canvas).width() > 0) {
                this.seekgraph.resize($(this.seekgraph_canvas).width(), $(this.seekgraph_canvas).height());
                clearInterval(I);
            }
            else if (sanityCheck <= 0) {
                clearInterval(I);
            }
        };
        I = setInterval(resizeSeekgraph, 50);
        resizeSeekgraph();
    }
    componentDidUpdate() {
        this.autoscroll();
    }
    componentWillUnmount() {
        data.unwatch("chat.active_channel", this.onActiveChannelChanged);
        let joined = data.get("chat.joined");
        for (let channel in joined) {
            this.part(channel, true, true);
        }
        this.disconnect();
        Object.keys(channels).forEach(key => {
            channels[key].part();
        });
        comm_socket.off("connect", this.connect);
        comm_socket.off("disconnect", this.disconnect);
        $(window).off("focus", this.onDocumentFocus);
        if (this.props.updateTitle) {
            window.document.title = "OGS";
        }
        this.seekgraph.destroy();
    }

    connect = () => {
        this.online_count_interval = setInterval(() => {
            comm_socket.send("getOnlineCount", {interval: 1800}, (ct) => this.setState({online_count: ct}));
        }, 30000);
        comm_socket.send("getOnlineCount", {interval: 1800}, (ct) => this.setState({online_count: ct}));
    }
    disconnect = () => {
        clearInterval(this.online_count_interval);
    }
    onDocumentFocus = () => {
        this.unread_ct = 0;
        if (this.props.updateTitle) {
            window.document.title = _("Chat");
        }
    }

    onChatMessageRemoved = (obj) => {
        this.syncStateSoon();
    }
    onChatMessage = (obj) => {
        let c = getChannel(obj.channel);
        this.syncStateSoon();

        if (document.hasFocus()) {
            if (this.props.updateTitle) {
                window.document.title = _("Chat");
            }
        } else {
            if (this.props.updateTitle) {
                window.document.title = `(${this.unread_ct}) ` + _("Chat");
            }
        }
    }
    onChatJoin = (joins) => {
        this.syncStateSoon();
    }
    onChatPart = (part) => {
        this.syncStateSoon();
    }
    systemMessage(text:string, system_message_type:'flood') {
        let c = getChannel(this.state.active_channel);
        c.chat_log.push({
            channel: this.state.active_channel,
            username: 'system',
            id: -1,
            ranking: 99,
            professional: false,
            ui_class: '',
            message: {
                i: n2s(Date.now()),
                t: Date.now() / 1000,
                m: text,
            },
            system: true,
            system_message_type: system_message_type,
        });
        this.syncStateSoon();
    }
    clearSystemMessages(system_message_type: 'flood') {
        for (let channel in channels) {
            let c = getChannel(channel);
            for (let i = 0; i < c.chat_log.length; ++i) {
                if (c.chat_log[i].system && system_message_type === c.chat_log[i].system_message_type) {
                    c.chat_log.splice(i, 1);
                    --i;
                }
            }
        }
        this.syncStateSoon();
    }

    join(channel: string) {
        if (!channel) {
            throw new Error(`Attempted to join invalid channel: ${channel}`);
        }

        let joined = data.get("chat.joined");
        joined[channel] = 1;
        if (!this.props.channel) {
            data.set("chat.joined", joined);
        }
        this.joining_channel[channel] = true;
        setTimeout(() => {delete this.joining_channel[channel]; }, 10000); /* don't notify for name matches within 10s of joining a channel */

        channels[channel] = chat_manager.join(channel);
        channels[channel].on("chat", this.onChatMessage);
        channels[channel].on("chat-removed", this.onChatMessageRemoved);
        channels[channel].on("join", this.onChatJoin);
        channels[channel].on("part", this.onChatPart);
        this.setState({
            joined_channels: data.get("chat.joined")
        });
    }
    part = (channel:string, dont_autoset_active:boolean, dont_clear_joined:boolean) => {
        channels[channel].part();

        if (!dont_clear_joined) {
            let joined = data.get("chat.joined");
            delete joined[channel];
            if (!this.props.channel) {
                data.set("chat.joined", joined);
            }
            this.setState({
                joined_channels: joined
            });
        }
        delete channels[channel];
        //jdelete this.channels[channel];
        //jdelete this.received_messages[channel];

        if (channel === this.state.active_channel) {
            if (!dont_autoset_active) {
                this.setActiveChannel("global-english");
            }
        }
    }
    syncStateSoon() {
        if (!this.defered_state_update) {
            this.defered_state_update = setTimeout(() => {
                this.defered_state_update = null;
                let c = getChannel(this.state.active_channel);
                c.markAsRead();
                this.setState({
                    chat_log: channels[this.state.active_channel].channel.chat_log,
                    user_list: c.user_list,
                });
            }, 20);
        }
    }
    setActiveChannel = (channel_or_ev) => {
        let channel = channel_or_ev;
        if (channel_or_ev.target) {
            channel = $(channel_or_ev.target).attr("data-channel");
            if (!channel) {
                channel = $(channel_or_ev.target).parent().attr("data-channel");
            }
            if (!channel) {
                channel = $(channel_or_ev.target).parent().parent().attr("data-channel");
            }
        }

        if (!this.props.channel) {
            data.set("chat.active_channel", channel);
        }
    }
    onActiveChannelChanged = (active_channel: string) => {
        if (this.state.active_channel === active_channel) {
            // channel is already active channel
            return;
        }
        if (this.state.lock_active_channel) {
            // don't change active channel
            return;
        }

        if (!active_channel) {
            throw new Error(`Invalid channel ID: ${active_channel}`);
        }

        let state_update: any = {};
        if (active_channel !== this.state.active_channel) {
            state_update.active_channel = active_channel;
        }

        if (!(active_channel in data.get("chat.joined"))) {
            this.join(active_channel);
        }

        let chan = getChannel(active_channel);
        chan.markAsRead();
        state_update.user_list = chan.user_list;
        state_update.chat_log = chan.chat_log;
        state_update.rtl_mode = chan.rtl_mode;
        this.scrolled_to_bottom = true;
        this.setState(state_update);

    }

    sortedUserList(): Array<any> {
        let lst = [];
        for (let id in this.state.user_list) {
            lst.push(this.state.user_list[id]);
        }
        let sort_order = this.state.user_sort_order;
        if (sort_order === "rank") {
            lst.sort(users_by_rank);
        } else {
            lst.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });
        }
        return lst;
    }
    toggleSortOrder = () => {
        let new_sort_order:'rank' | 'alpha' = preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        this.setState({"user_sort_order": new_sort_order});
    }


    onKeyPress = (event) => {
        if (event.charCode === 13) {
            let input = event.target as HTMLInputElement;
            if (!comm_socket.connected) {
                swal(_("Connection to server lost"));
                return;
            }

            this.sendChat(input.value, this.state.active_channel);
            this.setState({show_say_hi_placeholder: false});
            input.value = "";
            return false;
        }
    }
    sendChat(txt, channel) {
        let actually_send = (txt, channel) => {
            if (this.flood_protection) {
                return;
            }
            if (txt.trim().length === 0) {
                return;
            }

            if (this.send_tokens <= 0) {
                let chillout_time = 20;
                if (data.get("config.user").supporter) {
                    chillout_time = 10;
                }
                if (data.get("config.user").is_moderator) {
                    chillout_time = 2;
                }

                this.systemMessage(interpolate(_("Anti-flood system engaged. You will be able to talk again in {{time}} seconds."),
                                   {"time": chillout_time}), "flood");
                let start = Date.now();
                this.flood_protection = setInterval(() => {
                    this.clearSystemMessages("flood");
                    let left = chillout_time * 1000 - (Date.now() - start);
                    if (left > 0) {
                        this.systemMessage(interpolate(_("Anti-flood system engaged. You will be able to talk again in {{time}} seconds."),
                                             {"time": Math.round(left / 1000)}), "flood");
                    } else {
                        clearInterval(this.flood_protection);
                        this.flood_protection = null;
                    }
                }, 1000);
                return;
            }
            --this.send_tokens;
            setTimeout(() => { this.send_tokens = Math.min(5, this.send_tokens + 1); }, 2000);

            let user = data.get("config.user");

            let obj: any = {
                "channel": channel,
                "uuid": n2s(user.id) + "." + n2s(Date.now()),
                "message": txt
            };

            comm_socket.send("chat/send", obj);
            obj = dup(obj);
            obj.username = user.username;
            obj.id = user.id;
            obj.ranking = user.ranking;
            obj.professional = user.professional;
            obj.ui_class = user.ui_class;
            obj.message = {"i": obj.uuid, "t": Math.floor(Date.now() / 1000), "m": txt};
            channels[channel].channel.chat_log.push(obj);
        };

        for (let str of string_splitter(txt, 300)) {
            actually_send(str, channel);
        }
    }
    focusInput = () => {
        let sel = window.getSelection();

        if (!sel || sel.isCollapsed) {
            $(this.refs.input.refs.input).focus();
        }
    }
    updateScrollPosition = () => {
        let tf = this.refs.chat_log.scrollHeight - this.refs.chat_log.scrollTop - 10 < this.refs.chat_log.offsetHeight;
        if (tf !== this.scrolled_to_bottom) {
            this.scrolled_to_bottom  = tf;
            this.refs.chat_log.className = "chat-log " + (tf ? "autoscrolling" : "");
        }
        this.scrolled_to_bottom = this.refs.chat_log.scrollHeight - this.refs.chat_log.scrollTop - 10 < this.refs.chat_log.offsetHeight;
    }
    autoscroll() {
        if (this.scrolled_to_bottom) {
            this.refs.chat_log.scrollTop = this.refs.chat_log.scrollHeight;
            setTimeout(() => {
                try {
                    this.refs.chat_log.scrollTop = this.refs.chat_log.scrollHeight;
                } catch (e) {
                }
            } , 100);
        }
    }

    toggleChannelList = () => this.setState({force_show_channels: !this.state.force_show_channels});
    toggleUserList = () => this.setState({force_show_users: !this.state.force_show_users});

    leaveActiveChannel = () => {
        this.part(this.state.active_channel, false, false);
    }
    toggleShowAllGlobalChannels = () => {
        preferences.set("chat.show-all-global-channels", !this.state.show_all_global_channels),
        this.setState({show_all_global_channels: !this.state.show_all_global_channels});
    }
    toggleShowAllGroupChannels = () => {
        preferences.set("chat.show-all-group-channels", !this.state.show_all_group_channels),
        this.setState({show_all_group_channels: !this.state.show_all_group_channels});
    }
    toggleShowAllTournamentChannels = () => {
        preferences.set("chat.show-all-tournament-channels", !this.state.show_all_tournament_channels),
        this.setState({show_all_tournament_channels: !this.state.show_all_tournament_channels});
    }

    render() {
        let sorted_user_list = this.sortedUserList();
        let last_line = null;
        let user = data.get('user');
        let user_country = user.country || 'un';

        let chan_class = (chan: string): string => {
            return (chan in this.state.joined_channels ? " joined" : " unjoined") +
                (getChannel(chan).unread_ct > 0 ? " unread" : "") +
                (getChannel(chan).mentioned ? " mentioned" : "");
        };

        let user_count = (channel: string) => {
            let c = getChannel(channel);
            if (c.unread_ct) {
                return <span className="unread-count" data-count={"(" + c.unread_ct + ")"} data-menu="▼" data-channel={channel} onClick={this.display_details} />;
            } else if (channel in this.state.joined_channels) {
                return <span className="unread-count" data-count="" data-menu="▼" data-channel={channel} onClick={this.display_details} />;
            }
            /*
            if (c.user_count) {
                return <span className='user-count' data-count={c.user_count} data-leave={_("leave")} onClick={this.part.bind(this, channel, false, false)} />;
            }
            */
            return null;
        };

        let showChannels = !!this.props.showChannels;
        let showUserList = !!this.props.showUserList;

        return (
            <div className={"Chat" + (this.state.force_show_users ? " force-show-users" : "")}>
                {this.props.showChannels &&
                    <div className={"channel-container" + (this.state.force_show_channels ? " force-show" : "")}>

                        <div className="all-channels">
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
                                    >
                                        <span className="channel-name" data-channel={"group-" + chan.id} onClick={this.setActiveChannel}>
                                            <img className="icon" src={chan.icon}/> {chan.name}
                                        </span>
                                        {user_count("group-" + chan.id)}
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
                                    >
                                        <span className="channel-name" data-channel={"tournament-" + chan.id} onClick={this.setActiveChannel} >
                                            <i className="fa fa-trophy" /> {chan.name}
                                        </span>
                                        {user_count("tournament-" + chan.id)}
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
                                    >
                                        <span className="channel-name" data-channel={chan.id} onClick={this.setActiveChannel}>
                                            <Flag country={chan.country} language={chan.language} user_country={user_country} /> {chan.name}
                                        </span>
                                        {user_count(chan.id)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="seekgraph-container">
                            <PersistentElement elt={this.seekgraph_canvas} />
                        </div>
                    </div>
                }

                <div className="center-container" >
                    <div ref="chat_log"
                        className={this.state.rtl_mode ? "rtl chat-log" : "chat-log"}
                        onScroll={this.updateScrollPosition}
                        onClick={this.focusInput}
                        >
                        {this.state.chat_log.map((line, idx) => {
                            let ll = last_line;
                            last_line = line;
                            return <ChatLine key={line.message.i} line={line} lastline={ll} />;
                        })}
                    </div>
                    <div className="input-container ">
                        {showChannels &&
                            <button className={"channel-toggle" + (this.state.force_show_channels ? " active" : "")} onClick={this.toggleChannelList}>
                                <i className="fa fa-list"/>
                            </button>
                        }

                        <TabCompleteInput ref="input" type="text" className={this.state.rtl_mode ? "rtl" : ""}
                               placeholder={
                                   !data.get('user').email_validated ? _("Chat will be enabled once your email address has been validated") :
                                       this.state.show_say_hi_placeholder ? _("Say hi!") : ""}
                               disabled={data.get("user").anonymous || !data.get('user').email_validated}
                               onKeyPress={this.onKeyPress}
                               />

                        {showUserList &&
                            <button className={"users-toggle" + (this.state.force_show_users ? " active" : "")} onClick={this.toggleUserList}>
                                <i className="fa fa-users"/>
                            </button>
                        }
                    </div>
                </div>


                {showUserList &&
                    <div ref="users" className={"users" + (this.state.force_show_users ? " force-show" : "")} >
                        <div className="user-header" onClick={this.toggleSortOrder}>
                            <i className={this.state.user_sort_order === "rank" ? "fa fa-sort-numeric-asc" : "fa fa-sort-alpha-asc"} /> {
                                interpolate(_("Users ({{total_online}} online : {{in_chat}} chat)"),
                                            {"total_online": this.state.online_count, "in_chat": sorted_user_list.length})
                            }
                        </div>

                        {sorted_user_list.map((user) => <div key={user.id}><Player user={user} flag rank noextracontrols /></div>)}
                    </div>
                }
            </div>
        );
    }

    display_details = (event) => {
        if (!this.props.fakelink && shouldOpenNewTab(event)) {
            /* let browser deal with opening the window so we don't get the popup warnings */
            return;
        }

        event.stopPropagation();
        event.preventDefault();

        let channel = event.currentTarget.getAttribute('data-channel');
        if (shouldOpenNewTab(event)) {
            let uri = "";
            if (channel.startsWith('group')) {
                uri += '/group/' + channel.slice(6);
            }
            if (channel.startsWith("tournament")) {
                uri += "/tournament/" + channel.slice(11);
            }
            window.open(uri, "_blank");
        }

        popover({
            elt: (<ChatDetails chatChannelId={channel} subscribale={!(channel.startsWith("global") || channel === "shadowban")} partFunc={this.part} />),
            below: event.currentTarget,
            minWidth: 130,
        });
    }
}

export class EmbeddedChat extends React.PureComponent<ChatProperties, {}> {
    render() {
        return <Card className="Card EmbeddedChat"><Chat key={this.props.channel} {...this.props} /></Card>;
    }
}

function searchString(site, parameters) {
    if (parameters.length === 1) {
        return site + parameters[0];
    }

    return site + parameters[0] + '+' +
        parameters.slice(1, parameters.length).join('+').slice(0);
}

function generateChatSearchLine(urlString, command, body) {
    let target = '';
    let bodyString = body.substr(command.length);
    if (bodyString.split(' ')[0] === '-user') {
        target = bodyString.split(' ')[1] + ' ';
    }

    let params = body.split(' ');
    if (target.length > 0) {
        return  target.slice(0, target.length - 1) + ": " +
            searchString(urlString, params.slice(3, params.length));
    } else {
        return  searchString(urlString, params.slice(1, params.length));
    }
}

function ChatLine(props) {
    let line = props.line;
    let lastline = props.lastline;
    let user = line;

    if (line.system) {
        return ( <div className="chat-line system">{chat_markup(line.message.m)}</div>);
    }

    let message = line.message;
    let ts_ll = lastline ? new Date(lastline.message.t * 1000) : null;
    let ts = message.t ? new Date(message.t * 1000) : null;
    let third_person = false;
    let body = message.m;
    let show_date: JSX.Element = null;

    if (!lastline || (ts && ts_ll)) {
        if (ts) {
            if (!lastline || (moment(ts).format("YYYY-MM-DD") !== moment(ts_ll).format("YYYY-MM-DD"))) {
                show_date = <div className="date">{moment(ts).format("LL")}</div>;
            }
        }
    }

    if (typeof(body) === 'string') {
        if (body.substr(0, 4) === '/me ') {
            third_person = (body.substr(0, 4) === "/me ");
            body = body.substr(4);
        }

        if (/^\/senseis?\s/.test(body)) {
            body = generateChatSearchLine(
                'http://senseis.xmp.net/?search=',
                /^\/senseis?\s/.exec(body)[0],
                body
            );
        }

        if (body.substr(0, 8) === '/google ') {
            body = generateChatSearchLine(
                'https://www.google.com/#q=', '/google ', body
            );
        }

        if (body.substr(0, 8) === '/lmgtfy ') {
            body = generateChatSearchLine(
                'https://www.lmgtfy.com/?q=', '/lmgtfy ', body
            );
        }
    }

    let mentions = name_match_regex.test(body);

    return (
        <div className={
             (third_person ? "chat-line third-person" : "chat-line")
             + (user.id === data.get("config.user").id ? " self" : ` chat-user-${user.id}`)
             + (mentions ? " mentions" : "")
        }
            data-chat-id={message.i}
        >
        {show_date}
            {(ts) && <span className="timestamp">[{(ts.getHours() < 10 ? " " : "") + ts.getHours() + ":" + (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()}]</span>}
            {(user.id || null) && <Player user={user} flare rank={false} noextracontrols disableCacheUpdate/>}{(third_person ? " " : ": ")}
            <span className="body">{chat_markup(body)}</span>
        </div>
    );
}
export function chat_markup(body, extra_pattern_replacements?: Array<{split: RegExp; pattern: RegExp; replacement: ((m: any, idx: number) => any)}>): Array<JSX.Element> {
    let replacements = [
        // spam mitigation
        // replace tsumegodojo.worldpress.com urls with tsumegododo.worldpress.com as spam mitigation
        {split: /(https?:\/\/\S*tsumegodojo\S*)/gi, pattern: /(https?:\/\/[^\s\/]*)(tsumegodojo)(\S*)/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1] + "tsumegododo" + m[3]}>{m[1] + "tsumegododo" + m[3]}</a>)},
        {split: /(\S*tsumegodojo\S*)/gi, pattern: /(\S*)(tsumegodojo)(\S*)/gi, replacement: (m, idx) => (m[1] + "tsumegododo" + m[3])},
        // Match github
        {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/pull\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/pull\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} target="_blank" href={`https://github.com/online-go/online-go.com/pull/${m[2]}`}>{"GH-" + m[2]}</a>)},
        {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/issues\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/issues\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} target="_blank" href={`https://github.com/online-go/online-go.com/issues/${m[2]}`}>{"GH-" + m[2]}</a>)},
        {split: /\b((?:gh|pr|issue)[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b((?:gh|pr|issue))[- ]?(?:#)?([0-9]+)\b/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={`https://github.com/online-go/online-go.com/issues/${m[2]}`}>{m[1] + '-' + m[2]}</a>)},
        // links to the wiki
        {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki\/(?:[^\/<> ]+)(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki\/([^\/<> ]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} href={m[1]}>{"wiki: " + m[2].replace(/-/gi, " ").replace(/#/gi, " — ")}</a>)},
        {split: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki#(?:[^\/<> ]+)(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/github\.com\/online-go\/online-go\.com\/wiki#([^\/<> ]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} href={m[1]}>{"wiki: TOC " + m[2].replace(/-/gi, " ").replace(/#/gi, " — ")}</a>)},
        // Match forum links
        {split: /\b(https?:\/\/forums\.online-go\.com\/t\/[a-zA-z0-9-]+\/[0-9]+(?:\/[0-9]+)?(?:\?[^\/<> ]+)?(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/forums\.online-go\.com\/t\/([a-zA-z0-9-]+)\/[0-9]+(?:\/[0-9]+)?(?:\?[^\/<> ]+)?(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{(m[2]).replace(/(\-)/gi, " ")}</a>)},
        // Match online-go links
        // user profiles
        {split: /\b((?:player|user) ?(?:#)?[0-9]+)\b/gi, pattern: /\b(player|user) ?(?:#)?([0-9]+)\b/gi, replacement: (m, idx) => (<Player key={idx} user={{id: Number(m[2])}} rank={false} noextracontrols />)},
        {split: /\b((?:player |user )?https?:\/\/online-go\.com(?:\/player|\/user\/view)\/[0-9]+(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
            pattern: /\b((player |user )?https?:\/\/online-go\.com(?:\/player|\/user\/view)\/([0-9]+)(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
            replacement: (m, idx) => (<Player key={idx} user={{id: Number(m[3])}} rank={false} noextracontrols />)},
        {split: /\b((?:player |user )?https?:\/\/online-go\.com\/(?:u|user(?!\/(?:view|settings|supporter|verifyEmail)))\/(?:[^\/<> ]+)(?:\/|\b))/gi,
            pattern: /\b((player |user )?https?:\/\/online-go\.com\/(?:u|user(?!\/(?:view|settings|supporter|verifyEmail)))\/([^\/<> ]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Player key={idx} user={{"id": -1, username: m[3]}} rank={false} noextracontrols />)},
        {split: /(@"[^"\/]+(?:\/[0-9]+)?")/gi,
            pattern: /(@"([^"\/]+)(?:\/([0-9]+))?")/gi,
            replacement: (m, idx) => (<Player key={idx} user={(m[3] ? {id: Number(m[3])} : {username: m[2]})} rank={false} noextracontrols />)},
        {split: /(%%%PLAYER-[0-9]+%%%)/g, pattern: /(%%%PLAYER-([0-9]+)%%%)/g, replacement: (m, idx) => (<Player key={idx} user={parseInt(m[2])}/>)},
        // games
        {split: /\b((?:game)[- ]?(?:#)?[0-9]{3,})/gi, pattern: /(\bgame)[- ]?(?:#)?([0-9]{3,})/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/game/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:game )?https?:\/\/online-go\.com\/game(?:\/view)?\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((game )?https?:\/\/online-go\.com\/game(?:\/view)?\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/game/${m[3]}`}>{(m[2] ? m[2] : "game ") + m[3]}</Link>)},
        // reviews
        {split: /(^##[0-9]{3,}|[ ]##[0-9]{3,})/gi, pattern: /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/review/${m[2] || ""}${m[4] || ""}`}>{`${m[3] || ""}review ${m[2] || ""}${m[4] || ""}`}</Link>)},
        {split: /\b(review[- ]?(?:#)?[0-9]{3,})/gi, pattern: /\b(review)[- ]?(?:#)?([0-9]{3,})/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/review/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:review )?https?:\/\/online-go\.com\/review(?:\/view)?\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((review )?https?:\/\/online-go\.com\/review(?:\/view)?\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/review/${m[3]}`}>{(m[2] ? m[2] : "review ") + m[3]}</Link>)},
        // demos
        {split: /\b((?:demo )?https?:\/\/online-go\.com\/demo(?:\/view)?\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((demo )?https?:\/\/online-go\.com\/demo(?:\/view)?\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/demo/${m[3]}`}>{(m[2] ? m[2] : "demo ") + m[3]}</Link>)},
        {split: /\b(demo[- ]?(?:#)?[0-9]{3,})/gi, pattern: /\b(demo)[- ]?(?:#)?([0-9]{3,})/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/demo/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        // joseki
        {split: /\b(joseki[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(joseki)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/joseki/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:joseki )?https?:\/\/online-go\.com\/joseki\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((?:joseki )?https?:\/\/online-go\.com\/joseki\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/joseki/${m[2]}`}>{"joseki " + m[2]}</Link>)},
        // library
        {split: /\b((?:library )?https?:\/\/online-go\.com\/library\/[0-9]+(?:\/[0-9]+)?(?:\/|\b))/gi,
            pattern: /\b((joseki )?https?:\/\/online-go\.com\/library\/([0-9]+)(?:\/([0-9]+))?(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/library/${m[3]}` + (m[4] ? `/` + m[4] : ``)}>{"library" + (m[4] ? " " + m[4] : "") + " of player " + m[3]}</Link>)},
        // groups
        {split: /\b(group[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(group)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/group/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:group )?https?:\/\/online-go\.com\/group\/[0-9]+(?:\/[^\/<> ]+)*)/gi,
            pattern: /\b((group )?https?:\/\/online-go\.com\/group\/([0-9]+)(?:\/[^\/<> ]+)*)/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/group/${m[3]}`}>{(m[2] ? m[2] : "group ") + m[3]}</Link>)},
        // tournaments
        {split: /\b(tournament[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(tournament)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/tournament/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:tournament )?https?:\/\/online-go\.com\/tournaments?\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((tournament )?https?:\/\/online-go\.com\/tournaments?\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/tournament/${m[3]}`}>{(m[2] ? m[2] : "tournament ") + m[3]}</Link>)},
        {split: /\b((?:tournament |tournament-record )?https?:\/\/online-go\.com\/tournament-records?\/[0-9]+(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
            pattern: /\b((tournament |tournament-record )?https?:\/\/online-go\.com\/tournament-records?\/([0-9]+)(?:\/[^\/<> ]+)*(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/tournament-records/${m[3]}`}>{(m[2] ? m[2] : "tournament-record ") + m[3]}</Link>)},
        // ladders
        {split: /\b(ladder[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(ladder)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/ladder/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:ladder )?https?:\/\/online-go\.com\/ladder\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((ladder )?https?:\/\/online-go\.com\/ladder\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/ladder/${m[3]}`}>{(m[2] ? m[2] : "ladder") + '-' + m[3]}</Link>)},
        // puzzles
        {split: /\b(puzzle[- ]?(?:#)?[0-9]+)\b/gi, pattern: /\b(puzzle)[- ]?(?:#)?([0-9]+)/gi, replacement: (m, idx) => (<Link key={idx} to={`/puzzle/${m[2]}`}>{m[1] + '-' + m[2]}</Link>)},
        {split: /\b((?:puzzle )?https?:\/\/online-go\.com\/puzzle\/[0-9]+(?:\/|\b))/gi,
            pattern: /\b((puzzle )?https?:\/\/online-go\.com\/puzzle\/([0-9]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/puzzle/${m[3]}`}>{(m[2] ? m[2] : "puzzle ") + m[3]}</Link>)},
        // learning-hub
        {split: /\b((?:tutorial )?https?:\/\/online-go\.com\/(?:(?:docs\/)?learn-to-play-go|learning-hub)\/[-a-z]+(?:\/[0-9]+)?(?:\/|\b))/gi,
            pattern: /\b((tutorial )?https?:\/\/online-go\.com\/(?:(?:docs\/)?learn-to-play-go|learning-hub)\/([-a-z]+)(?:\/([0-9]+))?(?:\/|\b))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/learn-to-play-go/${m[3]}` + (m[4] ? `/` + m[4] : ``)}>{(m[2] ? m[2] : "tutorial ") + m[3] + (m[4] ? " exercise " + (Number(m[4]) + 1) : "")}</Link>)},
        // links to senseis
        {split: /\b(https?:\/\/senseis\.xmp\.net\/\?(?:[^\/<> ]+)*(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/senseis\.xmp\.net\/\?([^\/<> ]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} target='_blank' href={m[1]}>{"senseis: " + m[2]}</a>)},
        // mails
        {split: /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,  pattern: /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,  replacement: (m, idx) => (<a key={idx} target="_blank" href={"mailto:" + m[1]}>{m[1]}</a>)},
        // general urls
        // replaces any url not matched above
        {split: /(https?:\/\/(?!online-go\.com\/)[^<> ]+)/gi, pattern: /(https?:\/\/(?!online-go\.com\/)[^<> ]+)/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{m[1]}</a>)},
        {split: /\b(https?:\/\/online-go\.com\/(?:sign-in|register|overview|play|chat|observe-games|joseki(?!\/[0-9])|player\/settings|player\/supporter|settings|user\/(?:settings|supporter|verifyEmail)|supporter|support|donate|groups|group\/create|tournament\/new(?:\/[0-9]+)?|tournaments(?!\/[0-9])|ladders|puzzles|leaderboards?|developer|admin(?:\/merchant_log)?|announcement-center|moderator|learning-hub(?!\/[-a-z])|(?:docs\/)?learn-to-play-go(?!\/[-a-z])|(?:docs\/)?crash-course-learn-to-play-go(?:\/[0-9]+)?|dev\/(?:styling|goban-test)|docs\/(?:about|privacy-policy|terms-of-service|contact-information|refund-policy|go-rules-comparison-matrix|team|other-go-resources)|2019usgc|usgc2019|api\/[^<> ]+|termination-api\/[^<> ]+)(?:\/|\b))/gi,
            pattern: /\b(https?:\/\/online-go\.com\/(?:sign-in|register|overview|play|chat|observe-games|joseki(?!\/[0-9])|player\/settings|player\/supporter|settings|user\/(?:settings|supporter|verifyEmail)|supporter|support|donate|groups|group\/create|tournament\/new(?:\/[0-9]+)?|tournaments(?!\/[0-9])|ladders|puzzles|leaderboards?|developer|admin(?:\/merchant_log)?|announcement-center|moderator|learning-hub(?!\/[-a-z])|(?:docs\/)?learn-to-play-go(?!\/[-a-z])|(?:docs\/)?crash-course-learn-to-play-go(?:\/[0-9]+)?|dev\/(?:styling|goban-test)|docs\/(?:about|privacy-policy|terms-of-service|contact-information|refund-policy|go-rules-comparison-matrix|team|other-go-resources)|2019usgc|usgc2019|api\/[^<> ]+|termination-api\/[^<> ]+)(?:\/|\b))/gi,
            replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{m[1]}</a>)}
];

    if (extra_pattern_replacements) {
        replacements = replacements.concat(extra_pattern_replacements);
    }

    let ret = [profanity_filter(body)];
    for (let r of replacements) {
        ret = [].concat.apply([], ret.map((text_fragment) => {
            return text_fragment.split(r.split);
        }));
    }

    for (let i = 0; i < ret.length; ++i) {
        let fragment = ret[i];
        let matched = false;
        for (let r of replacements) {
            let m = r.pattern.exec(fragment);
            if (m) {
                ret[i] = r.replacement(m, i);
                matched = true;
                break;
            }
        }
        if (!matched) {
            ret[i] = <span key={i}>{ret[i]}</span>;
        }
    }

    return ret;
}
