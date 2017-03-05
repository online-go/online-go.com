/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link} from "react-router";
import {_, interpolate} from "translate";
import {post, get} from "requests";
import {Player} from "Player";
import {profanity_filter} from "profanity_filter";
import {comm_socket} from "sockets";
import data from "data";
import preferences from "preferences";
import {emitNotification} from "Notifications";
import {Flag} from "Flag";
import {Card} from "components";
import {TabCompleteInput} from "TabCompleteInput";
import player_cache from "player_cache";
import {string_splitter, n2s, dup} from "misc";
import {SeekGraph} from "SeekGraph";
import {PersistentElement} from "PersistentElement";

declare let swal;


data.setDefault("chat.joined", {});

interface ChatProperties {
    channel?: string;
    autofocus?: boolean;
    showChannels?: boolean;
    showUserList?: boolean;
    updateTitle?: boolean;
}

let name_match_regex = /^loading...$/;
data.watch("config.user", (user) => {
    name_match_regex = new RegExp("\b" + user.username.replace(/[\\^$*+.()|[\]{}]/g, "\$&") + "\b", "i");
});

let global_channels: Array<any> = [ /* {{{ */
    {"id": "global-english" , "name": "English", "country": "us"},
    {"id": "global-help" , "name": "Help", "country": "un"},
    {"id": "global-offtopic" , "name": "Off Topic", "country": "un"},
    {"id": "global-japanese", "name": "日本語 ", "country": "jp"},
    {"id": "global-chinese" , "name": "中文"   , "country": "cn"},
    {"id": "global-korean"  , "name": "한국어" , "country": "kr"},
    {"id": "global-russian"  , "name": "Русский" , "country": "r"},
    {"id": "global-polish"  , "name": "Polski" , "country": "pl"},
    {"id": "global-arabic", "name": "العَرَبِيَّةُ", "country": "_Arab_League", "rtl": true},
    {"id": "global-bulgarian"  , "name": "Български" , "country": "bg"},
    {"id": "global-catalan"  , "name": "Català" , "country": "es"},
    {"id": "global-czech"  , "name": "Čeština" , "country": "cz"},
    {"id": "global-esperanto"  , "name": "Esperanto" , "country": "_Esperanto"},
    {"id": "global-german"  , "name": "Deutsch" , "country": "de"},
    {"id": "global-spanish"  , "name": "Español" , "country": "es"},
    {"id": "global-french"  , "name": "Français" , "country": "fr"},
    {"id": "global-filipino"  , "name": "Filipino" , "country": "ph"},
    {"id": "global-indonesian", "name": "Indonesian", "country": "id"},
    {"id": "global-hebrew", "name": "עִבְרִית", "country": "il", "rtl": true},
    {"id": "global-hindi"  , "name": "हिन्दी" , "country": "in"},
    {"id": "global-nepali" , "name": "नेपाली", "country": "np"},
    {"id": "global-bangla"  , "name": "বাংলা" , "country": "bd"},
    {"id": "global-lithuanian", "name": "Lietuvių", "country": "lt"},
    {"id": "global-hungarian"  , "name": "Magyar" , "country": "h"},
    {"id": "global-dutch"  , "name": "Nederlands" , "country": "nl"},
    {"id": "global-norwegian"  , "name": "Norsk" , "country": "no"},
    {"id": "global-italian"  , "name": "Italiano" , "country": "it"},
    {"id": "global-portuguese"  , "name": "Português" , "country": "pt"},
    {"id": "global-romanian"  , "name": "Română" , "country": "ro"},
    {"id": "global-swedish"  , "name": "Svenska" , "country": "se"},
    {"id": "global-finnish"  , "name": "Suomi" , "country": "fi"},
    {"id": "global-turkish"  , "name": "Türkçe" , "country": "tr"},
    {"id": "global-ukrainian"  , "name": "Українська" , "country": "ua"},
    {"id": "global-vietnamese"  , "name": "Tiếng Việt" , "country": "vn"},
    {"id": "global-thai"  , "name": "ภาษาไทย" , "country": "th"},
]; /* }}} */

data.watch("config.ogs", (settings) => {
    if (settings && settings.channels) {
        global_channels = settings.channels;
    }
});


let rtl_mode = {};
for (let chan of global_channels) {
    rtl_mode[chan.id] = !!chan.rtl;
}

let channels = { };

function getChannel(channel) { /* {{{ */
    if (!(channel in channels)) {
        channels[channel] = {
            chat_log: [],
            chat_ids: {},
            unread_ct: 0,
            mentioned: false,
            user_list: {},
            user_count: 0,
            rtl_mode: rtl_mode[channel],
        };
    }
    return channels[channel];
}; /* }}} */

export class EmbeddedChat extends React.PureComponent<ChatProperties, any> {
    render() {
        return <Card className="Card EmbeddedChat"><Chat {...this.props} /></Card>;
    }
}

export class Chat extends React.Component<ChatProperties, any> {
    refs: {
        input;
        chat_log;
    };

    received_messages = {};
    online_count_interval = null;
    joining_channel = {};
    channel_names = {};
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
            user_list: [],
            joined_channels: this.props.channel ? [this.props.channel] : data.get("chat.joined"),
            active_channel: this.props.channel ? this.props.channel : data.get("chat.active_channel", "global-english"),
            group_channels: [],
            tournament_channels: [],
            show_all_channels: preferences.get("chat.show-all-channels"),
            user_sort_order: preferences.get("chat.user-sort-order"),
            force_show_channels: false,
            force_show_users: false,
            show_say_hi_placeholder: true,
        };

        this.resolve();
        this.seekgraph_canvas = $("<canvas class='SeekGraph'>")[0];
    }

    resolve() {{{
        if (!data.get("config.user").anonymous) {
            get("me/groups", {page_size: 30})
            .then((groups) => this.setState({group_channels: groups.results.sort((a, b) => a.name.localeCompare(b.name))}))
            .catch((err) => 0);

            get("me/tournaments", {page_size: 30})
            .then((tournaments) => this.setState({tournament_channels: tournaments.results.sort((a, b) => a.name.localeCompare(b.name))}))
            .catch((err) => 0);
        }
    }}}

    componentDidMount() {{{
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


        this.seekgraph = new SeekGraph({
            canvas: this.seekgraph_canvas,
            show_live_games: true,
        });
        this.seekgraph.resize($(this.seekgraph_canvas).width(), $(this.seekgraph_canvas).height());
    }}}
    componentDidUpdate() {{{
        this.autoscroll();
    }}}
    componentWillUnmount() {{{
        this.disconnect();
        comm_socket.off("connect", this.connect);
        comm_socket.off("disconnect", this.disconnect);
        $(window).off("focus", this.onDocumentFocus);
        window.document.title = "OGS";
        this.seekgraph.destroy();
    }}}

    connect = () => {{{
        channels = {};
        comm_socket.on("chat-message", this.onChatMessage);
        comm_socket.on("chat-join", this.onChatJoin);
        comm_socket.on("chat-part", this.onChatPart);
        this.online_count_interval = setInterval(() => {
            comm_socket.send("getOnlineCount", {interval: 1800}, (ct) => this.setState({online_count: ct}));
        }, 30000);
        comm_socket.send("getOnlineCount", {interval: 1800}, (ct) => this.setState({online_count: ct}));

        let joined = data.get("chat.joined");

        for (let channel in joined) {
            this.join(channel);
        }
        this.setActiveChannel(this.state.active_channel);
    }}}
    disconnect = () => {{{
        channels = {};
        comm_socket.off("chat-message", this.onChatMessage);
        comm_socket.off("chat-join", this.onChatJoin);
        comm_socket.off("chat-part", this.onChatPart);

        let joined = data.get("chat.joined");
        for (let channel in joined) {
            this.part(channel, true, true);
        }
        clearInterval(this.online_count_interval);
    }}}
    onDocumentFocus = () => {{{
        this.unread_ct = 0;
        window.document.title = _("Chat");
    }}}

    onChatMessage = (obj) => {{{
        let mentioned = false;
        try {
            if (typeof(obj.message.m) === "string") {
                if (name_match_regex.test(obj.message.m)) {
                    if (!(obj.channel in this.joining_channel)) {
                        mentioned = true;
                        emitNotification("[" + this.channel_names[obj.channel] + "]: " + obj.username,
                                         "[" + this.channel_names[obj.channel] + "] " + obj.username + ": " + obj.message.m);
                    } else {
                        //console.log('Not sending name match notification since we just joined the channel ', obj.channel);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        let c = getChannel(obj.channel);
        if (obj.message.i in c.chat_ids) {
            return;
        }
        c.chat_ids[obj.message.i] = true;

        player_cache.update({
            id: obj.id,
            username: obj.username,
            ui_class: obj.ui_class,
            country: obj.country,
            ranking: obj.ranking,
        }, true);

        c.chat_log.push(obj);
        if (this.state.active_channel === obj.channel) {
            //this.syncStateSoon();
        } else {
            if (!(obj.channel in this.joining_channel)) {
                c.unread_ct++;
                if (mentioned) {
                    c.mentioned = true;
                }
            }
        }

        this.syncStateSoon();

        if (c.channel !== this.state.active_channel) {

        }

        if (document.hasFocus()) {
            this.unread_ct = 0;
            window.document.title = _("Chat");
        } else {
            ++this.unread_ct;
            window.document.title = `(${this.unread_ct}) ` + _("Chat");
        }
    }}}
    onChatJoin = (joins) => {{{
        let c = getChannel(joins.channel);
        for (let i = 0; i < joins.users.length; ++i) {
            player_cache.update(joins.users[i]);
            if (!(joins.users[i].id in c.user_list)) {
                c.user_count++;
            }
            c.user_list[joins.users[i].id] = joins.users[i];
        }
        //if (this.state.active_channel === joins.channel) {
        this.syncStateSoon();
        //}
    }}}
    onChatPart = (part) => {{{
        let c = getChannel(part.channel);
        if ((part.user.id in c.user_list)) {
            c.user_count--;
        }
        delete c.user_list[part.user.id];

        //if (this.state.active_channel === part.channel) {
            this.syncStateSoon();
        //}
    }}}
    systemMessage(text, type) {{{
        let c = getChannel(this.state.active_channel);
        c.chat_log.push({
            message: {
                "i": n2s(Date.now()),
            },
            "system": true,
            "type": type,
            "body": text,
        });
        this.syncStateSoon();
    }}}
    clearSystemMessages(type) {{{
        for (let channel in channels) {
            let c = getChannel(channel);
            for (let i = 0; i < c.chat_log.length; ++i) {
                if (c.chat_log[i].system && type === c.chat_log[i].type) {
                    c.chat_log.splice(i, 1);
                    --i;
                }
            }
        }
        this.syncStateSoon();
    }}}

    join(channel) {{{
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

        if (comm_socket.connected) {
            comm_socket.send("chat/join", {"channel": channel});
            this.setState({
                joined_channels: data.get("chat.joined")
            });
        }
    }}}
    part(channel, dont_autoset_active, dont_clear_joined) {{{
        if (comm_socket.connected) {
            comm_socket.send("chat/part", {"channel": channel});
        }

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
    }}}
    syncStateSoon() {{{
        if (!this.defered_state_update) {
            this.defered_state_update = setTimeout(() => {
                this.defered_state_update = null;
                let c = getChannel(this.state.active_channel);
                this.setState({
                    chat_log: c.chat_log,
                    user_list: c.user_list,
                });
            }, 20);
        }
    }}}
    setActiveChannel = (channel_or_ev) => { /* {{{ */
        let channel = channel_or_ev;
        if (channel_or_ev.target) {
            channel = $(channel_or_ev.target).attr("data-channel");
        }

        if (!channel) {
            throw new Error(`Invalid channel ID: ${channel}`);
        }
        let state_update: any = {};
        if (channel !== this.state.active_channel) {
            state_update.active_channel = channel;
        }

        let chan = getChannel(channel);
        chan.unread_ct = 0;
        chan.mentioned = false;
        if (!(channel in data.get("chat.joined"))) {
            this.join(channel);
        }
        if (!this.props.channel) {
            data.set("chat.active_channel", channel);
        }
        state_update.user_list = chan.user_list;
        state_update.chat_log = chan.chat_log;
        state_update.rtl_mode = chan.rtl_mode;
        this.scrolled_to_bottom = true;
        this.setState(state_update);

        if (!(channel in data.get("chat.joined"))) {
            this.join(channel);
        }

        /*
        this.last_date = "";
        for (let i=0; i < chan.log.length; ++i) {
            this._appendChat(chan.log[i]);
        }

        if (!jQuery.browser.mobile && !jQuery.browser.ios) {
            $(this.id_chat_input).focus();
        }
        this.should_scroll_chatlog = true;
        this.scrollChats();
        */
    } /* }}} */
    sortedUserList(): Array<any> {{{
        let lst = [];
        for (let id in this.state.user_list) {
            lst.push(this.state.user_list[id]);
        }
        let sort_order = this.state.user_sort_order;
        if (sort_order === "rank") {
            lst.sort((a, b) => {
                if (a.ranking - b.ranking === 0)  {
                    return a.username.localeCompare(b.username);
                }
                return b.ranking - a.ranking;
            });
        } else {
            lst.sort((a, b) => {
                return a.username.localeCompare(b.username);
            });
        }
        return lst;
    }}}
    toggleSortOrder = () => {{{
        let new_sort_order = preferences.get("chat.user-sort-order") === "rank" ? "alpha" : "rank";
        preferences.set("chat.user-sort-order", new_sort_order);
        this.setState({"user_sort_order": new_sort_order});
    }}}


    onKeyPress = (event) => {{{
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
    }}}
    sendChat(txt, channel) {{{
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
            obj.ui_class = user.ui_class;
            obj.message = {"i": obj.uuid, "t": Math.floor(Date.now() / 1000), "m": txt};
            this.onChatMessage(obj);
        };

        for (let str of string_splitter(txt, 300)) {
            actually_send(str, channel);
        }
    }}}
    focusInput = () => {{{
        let sel = window.getSelection();

        if (!sel || sel.isCollapsed) {
            $(this.refs.input.refs.input).focus();
        }
    }}}
    updateScrollPosition = () => {{{
        let tf = this.refs.chat_log.scrollHeight - this.refs.chat_log.scrollTop - 10 < this.refs.chat_log.offsetHeight;
        if (tf !== this.scrolled_to_bottom) {
            this.scrolled_to_bottom  = tf;
            this.refs.chat_log.className = "chat-log " + (tf ? "autoscrolling" : "");
        }
        this.scrolled_to_bottom = this.refs.chat_log.scrollHeight - this.refs.chat_log.scrollTop - 10 < this.refs.chat_log.offsetHeight;
    }}}
    autoscroll() {{{
        if (this.scrolled_to_bottom) {
            this.refs.chat_log.scrollTop = this.refs.chat_log.scrollHeight;
            setTimeout(() => this.refs.chat_log.scrollTop = this.refs.chat_log.scrollHeight, 100);
        }
    }}}

    toggleChannelList = () => this.setState({force_show_channels: !this.state.force_show_channels});
    toggleUserList = () => this.setState({force_show_users: !this.state.force_show_users});

    leaveActiveChannel = () => {{{
        this.part(this.state.active_channel, false, false);
    }}}
    toggleShowAllChannels = () => {{{
        preferences.set("chat.show-all-channels", !this.state.show_all_channels),
        this.setState({show_all_channels: !this.state.show_all_channels});
    }}}

    render() {{{
        let sorted_user_list = this.sortedUserList();

        let chan_class = (chan: string): string => {
            return (chan in this.state.joined_channels ? " joined" : " unjoined") +
                (getChannel(chan).unread_ct > 0 ? " unread" : "") +
                (getChannel(chan).mentioned ? " mentioned" : "");
        };

        let user_count = (channel: string) => {
            let c = getChannel(channel);
            if (c.unread_ct) {
                return <span className="unread-count" data-count={"(" + c.unread_ct + ")"} data-leave={_("leave")} onClick={this.part.bind(this, channel, false, false)} />;
            } else if (channel in this.state.joined_channels) {
                return <span className="unread-count" data-count="" data-leave={_("leave")} onClick={this.part.bind(this, channel, false, false)} />;
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
            <div className="Chat">
                {this.props.showChannels &&
                    <div className={"channel-container" + (this.state.force_show_channels ? " force-show" : "")}>
                        <div ref="channels" className={"channels" + (!this.state.show_all_channels ? " hide-unjoined" : "")}>

                            {(this.state.group_channels.length > 0 || null) && (
                                <div className="channel-header">
                                    <span>{_("Group Channels")}</span>
                                    <i onClick={this.toggleShowAllChannels} className={"channel-expand-toggle " + (this.state.show_all_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                                </div>
                            ) }
                            {this.state.group_channels.map((chan) => (
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

                            {(this.state.tournament_channels.length > 0 || null) && (
                                <div className="channel-header">
                                    <span>{_("Tournament Channels")}</span>
                                    <i onClick={this.toggleShowAllChannels} className={"channel-expand-toggle " + (this.state.show_all_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                                </div>
                            )}
                            {this.state.tournament_channels.map((chan) => (
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

                            <div className="channel-header">
                                <span>{_("Global Channels")}</span>
                                <i onClick={this.toggleShowAllChannels} className={"channel-expand-toggle " + (this.state.show_all_channels ?  "fa fa-minus" : "fa fa-plus")}/>
                            </div>
                            {global_channels.map((chan) => (
                                <div key={chan.id}
                                     className={
                                         (this.state.active_channel === chan.id ? "channel active" : "channel")
                                         + chan_class(chan.id)
                                     }
                                >
                                    <span className="channel-name" data-channel={chan.id} onClick={this.setActiveChannel}>
                                        <Flag country={chan.country}/> {chan.name}
                                    </span>
                                    {user_count(chan.id)}
                                </div>
                            ))}

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
                        {this.state.chat_log.map((line) => <ChatLine key={line.message.i} line={line}/>)}
                    </div>
                    <div className="input-container ">
                        {showChannels &&
                            <button className={"channel-toggle" + (this.state.force_show_channels ? " active" : "")} onClick={this.toggleChannelList}>
                                <i className="fa fa-list"/>
                            </button>
                        }

                        <TabCompleteInput ref="input" type="text" className={this.state.rtl_mode ? "rtl" : ""}
                               placeholder={this.state.show_say_hi_placeholder ? _("Say hi!") : ""}
                               disabled={data.get("user").anonymous}
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

                        {sorted_user_list.map((user) => <div key={user.id}><Player user={user} flag rank /></div>)}
                    </div>
                }
            </div>
        );
    }}}
}


function ChatLine(props) {{{
    let line = props.line;
    let user = line;

    if (line.system) {
        return ( <div className="chat-line system">{chat_markup(line.body)}</div>);
    }


    let message = line.message;
    let ts = message.t ? new Date(message.t * 1000) : null;
    let third_person = false;
    let body = message.m;

    if (typeof(body) === 'string') {

      let searchString = (site, parameters) => {

        if (parameters.length === 1) {
            return site + parameters[0]
        }

        return site +
               parameters[0] +
               '+' +
               parameters
                 .slice(1, parameters.length)
                 .join('+')
                 .slice(0);
      };

      let targetUser = (bodyString) => {
        if (bodyString.split(' ')[0] === '-user') {
          return bodyString.split(' ')[1] + ' ';
        } else {
          return '';
        }
      };

      let generateChatSearchLine = (urlString, command, body) => {
        let target = targetUser(body.substr(command.length));
        let params = body.split(' ');
        if (target.length > 0) {
          return  target.slice(0, target.length - 1) + ": " +
                  searchString(urlString, params.slice(3, params.length));
        } else {
          return  searchString(urlString, params.slice(1, params.length));
        }
      };

      if (body.substr(0, 4) === '/me ') {
        third_person = (body.substr(0, 4) === "/me ");
        body = body.substr(4);
      }

      if (body.substr(0, 8) === '/sensei ') {
        body = generateChatSearchLine(
          'http://senseis.xmp.net/?search=', '/sensei ', body
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
        }>
            {(ts) && <span className="timestamp">[{(ts.getHours() < 10 ? " " : "") + ts.getHours() + ":" + (ts.getMinutes() < 10 ? "0" : "") + ts.getMinutes()}]</span>}
            {(user.id || null) && <Player user={user} flare rank={false} />}{(third_person ? " " : ": ")}
            <span className="body">{chat_markup(body)}</span>
        </div>
    );
}}}
export function chat_markup(body, extra_pattern_replacements?: Array<{split: RegExp; pattern: RegExp; replacement: ((m: any, idx: number) => any)}>): Array<JSX.Element> {{{
    let replacements = [
        {split: /(https?:\/\/[^<> ]+)/gi, pattern: /(https?:\/\/[^<> ]+)/gi, replacement: (m, idx) => (<a key={idx} target="_blank" href={m[1]}>{m[1]}</a>)},
        {split: /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,  pattern: /([^<> ]+[@][^<> ]+[.][^<> ]+)/gi,  replacement: (m, idx) => (<a key={idx} target="_blank" href={"mailto:" + m[1]}>{m[1]}</a>)},
        {split: /(^##[0-9]{3,}|[ ]##[0-9]{3,})/gi, pattern: /(^##([0-9]{3,})|([ ])##([0-9]{3,}))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/review/${m[2] || ""}${m[4] || ""}`}>{`${m[3] || ""}##${m[2] || ""}${m[4] || ""}`}</Link>)},
        {split: /(^#[0-9]{3,}|[ ]#[0-9]{3,})/gi, pattern: /(^#([0-9]{3,})|([ ])#([0-9]{3,}))/gi,
            replacement: (m, idx) => (<Link key={idx} to={`/game/${m[2] || ""}${m[4] || ""}`}>{`${m[3] || ""}#${m[2] || ""}${m[4] || ""}`}</Link>)},
        {split: /(player [0-9]+)/gi, pattern: /(player ([0-9]+))/gi, replacement: (m, idx) => (<Link key={idx} to={`/user/view/${m[2]}`}>{m[1]}</Link>)},
        {split: /(#group-[0-9]+)/gi, pattern: /(#group-([0-9]+))/gi, replacement: (m, idx) => (<Link key={idx} to={`/group/${m[2]}`}>{m[1]}</Link>)},
    ];

    if (extra_pattern_replacements) {
        replacements = replacements.concat(extra_pattern_replacements);
    }

    let ret = [profanity_filter(body)];
    for (let r of replacements) {
        ret = [].concat.apply([], ret.map((text_fragment) => {
            //console.log(text_fragment, text_fragment.split(r.split), r.split)

            /*
            let new_fragments = text_fragment.split(r.split)
            if (new_fragments.length > 1) {
                let found_match = false;
                for (let f of new_fragments) {
                    if (f.search(r.pattern) >= 0) {
                        found_match = true;
                        break;
                    }
                }
                if (!found_match) {
                    console.error('Pattern did not match split: ', r.pattern, r.split, text_fragment, new_fragments);
                }
            }
            */

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
}}}
