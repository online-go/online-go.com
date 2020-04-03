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

import {comm_socket} from "sockets";
import {TypedEventEmitter} from "TypedEventEmitter";
import * as data from "data";
import {emitNotification} from "Notifications";
import * as player_cache from "player_cache";
import {bounded_rank} from 'rank_utils';
import cached from 'cached';
import { ActiveTournamentList, GroupList } from 'types';
import {_, interpolate} from "translate";

interface Events {
    "chat": any;
    "chat-removed": any;
    "join": Array<any>;
    "part": any;
    "unread-count-changed": any;
}

export interface UnreadChanged {
    "channel": string;
    "unread_ct": number;
    "unread_delta": number;
    "mentioned": Boolean;
    "previous_mentioned": Boolean;
}

/* Any modifications to this must also be mirrored on the server */
export let global_channels: Array<any> = [
    {"id": "global-english" , "name": "English", "country": "us", "language": "english"},
    {"id": "global-help" , "name": "Help", "country": "un"},
    {"id": "global-offtopic" , "name": "Off Topic", "country": "un"},
    {"id": "global-japanese", "name": "日本語 ", "country": "jp", "language": "japanese"},
    {"id": "global-chinese" , "name": "中文"   , "country": "cn", "language": "chinese"},
    {"id": "global-korean"  , "name": "한국어" , "country": "kr", "language": "korean"},
    {"id": "global-russian"  , "name": "Русский" , "country": "ru"},
    {"id": "global-polish"  , "name": "Polski" , "country": "pl"},
    {"id": "global-arabic", "name": "العَرَبِيَّةُ", "country": "_Arab_League", "rtl": true},
    {"id": "global-bulgarian"  , "name": "Български" , "country": "bg"},
    {"id": "global-catalan"  , "name": "Català" , "country": "es"},
    {"id": "global-czech"  , "name": "Čeština" , "country": "cz"},
    {"id": "global-esperanto"  , "name": "Esperanto" , "country": "_Esperanto"},
    {"id": "global-german"  , "name": "Deutsch" , "country": "de", "language": "german"},
    {"id": "global-spanish"  , "name": "Español" , "country": "es", "language": "spanish"},
    {"id": "global-french"  , "name": "Français" , "country": "fr", "language": "french"},
    {"id": "global-filipino"  , "name": "Filipino" , "country": "ph"},
    {"id": "global-indonesian", "name": "Indonesian", "country": "id"},
    {"id": "global-hebrew", "name": "עִבְרִית", "country": "il", "rtl": true},
    {"id": "global-hindi"  , "name": "हिन्दी" , "country": "in"},
    {"id": "global-nepali" , "name": "नेपाली", "country": "np"},
    {"id": "global-bangla"  , "name": "বাংলা" , "country": "bd"},
    {"id": "global-lithuanian", "name": "Lietuvių", "country": "lt"},
    {"id": "global-hungarian"  , "name": "Magyar" , "country": "hu"},
    {"id": "global-dutch"  , "name": "Nederlands" , "country": "nl", "language": "dutch"},
    {"id": "global-norwegian"  , "name": "Norsk" , "country": "no"},
    {"id": "global-italian"  , "name": "Italiano" , "country": "it", "language": "italian"},
    {"id": "global-portuguese"  , "name": "Português" , "country": "pt", "language": "portuguese"},
    {"id": "global-romanian"  , "name": "Română" , "country": "ro"},
    {"id": "global-swedish"  , "name": "Svenska" , "country": "se"},
    {"id": "global-finnish"  , "name": "Suomi" , "country": "fi"},
    {"id": "global-turkish"  , "name": "Türkçe" , "country": "tr"},
    {"id": "global-ukrainian"  , "name": "Українська" , "country": "ua"},
    {"id": "global-vietnamese"  , "name": "Tiếng Việt" , "country": "vn"},
    {"id": "global-thai"  , "name": "ภาษาไทย" , "country": "th"},
];
data.watch("config.ogs", (settings) => {
    if (settings && settings.channels) {
        global_channels = settings.channels;
    }
});


export function resolveChannelDisplayName(channel: string): string {
    if (channel.startsWith("global-")) {
        global_channels.forEach(element => {
            if (channel === element.id) {
                return element.name;
            }
        });
    } else if (channel.startsWith("tournament-")) {
        let id:number = parseInt(channel.substring(11));
        tournament_channels.forEach(element => {
            if (id === element.id) {
                return element.name;
            }
        });
    } else if (channel.startsWith("group-")) {
        let id:number = parseInt(channel.substring(6));
        group_channels.forEach(element => {
            if (id === element.id) {
                return element.name;
            }
        });
    } else if (channel.startsWith("game-")) {
        return interpolate(_("Game {{number}}"), {"number": channel.substring(5)});
    } else if (channel.startsWith("review-")) {
        return interpolate(_("Review {{number}}"), {"number": channel.substring(7)});
    }
    return "<error>";
}

export let group_channels: GroupList = [];
export let tournament_channels: ActiveTournamentList = [];

function updateGroups(groups:GroupList) {
    group_channels = groups;
}
function updateTournaments(tournaments:ActiveTournamentList) {
    tournament_channels = tournaments;
}
data.watch(cached.groups, updateGroups);
data.watch(cached.active_tournaments, updateTournaments);


let name_match_regex = /^loading...$/;
data.watch("config.user", (user) => {
    let cleaned_username_regex = user.username.replace(/[\\^$*+.()|[\]{}]/g, "\\$&");
    name_match_regex = new RegExp(
          "\\b"  + cleaned_username_regex + "\\b"
        + "|\\bplayer ?" + user.id + "\\b"
        + "|\\bhttps?:\\/\\/online-go\\.com\\/user\\/view\\/" + user.id + "\\b"
        , "i");
});


const rtl_channels = {
    "global-arabic": true,
    "global-hebrew": true,
};

let last_proxy_id = 0;

class ChatChannel extends TypedEventEmitter<Events> {
    channel: string;
    name: string;
    proxies: {[id: number]: ChatChannelProxy} = {};
    joining: boolean = false;
    chat_log   = [];
    chat_ids   = {};
    has_unread = false;
    unread_ct = 0;
    mentioned = false;
    user_list  = {};
    users_by_rank = [];
    users_by_name = [];
    user_count = 0;
    rtl_mode   = false;
    last_seen_timestamp: number;


    constructor(channel: string, display_name: string) {
        super();
        this.channel = channel;
        this.name = display_name;
        this.rtl_mode = channel in rtl_channels;
        this.joining = true;
        setTimeout(() => this.joining = false, 10000); /* don't notify for name matches within 10s of joining a channel */
        comm_socket.on("connect", this._rejoin);
        this._rejoin();
        let last_seen = data.get("chat-manager.last-seen", {});
        if (channel in last_seen) {
            this.last_seen_timestamp = last_seen[channel];
        } else {
            this.last_seen_timestamp = 0;
        }
    }

    markAsRead() {
        let unread_delta = - this.unread_ct;
        let previous_mentioned = this.mentioned;
        this.unread_ct = 0;
        this.mentioned = false;
        let last_seen = data.get("chat-manager.last-seen", {});
        last_seen[this.channel] = this.last_seen_timestamp;
        data.set("chat-manager.last-seen", last_seen);
        try {
            this.emit("unread-count-changed",
                        {channel: this.channel,
                        unread_ct: this.unread_ct,
                        unread_delta: unread_delta,
                        mentioned: this.mentioned,
                        previous_mentioned: previous_mentioned
                        });
        } catch (e) {
            console.error(e);
        }
    }

    _rejoin = () => {
        if (comm_socket.connected) {
            comm_socket.emit("chat/join", {"channel": this.channel});
        }
    }
    _destroy() {
        if (comm_socket.connected) {
            comm_socket.emit("chat/part", {"channel": this.channel});
        }
        comm_socket.off("connect", this._rejoin);
        this.removeAllListeners();
    }
    createProxy(): ChatChannelProxy {
        let proxy = new ChatChannelProxy(this);
        this.proxies[proxy.id] = proxy;
        return proxy;
    }
    removeProxy(proxy: ChatChannelProxy): void {
        delete this.proxies[proxy.id];
        if (Object.keys(this.proxies).length === 0) {
            this._destroy();
            chat_manager._removeChannel(this.channel);
        }
    }

    handleChat(obj) {
        if (obj.message.i in this.chat_ids) {
            return;
        }
        this.chat_ids[obj.message.i] = true;
        this.chat_log.push(obj);

        let previous_mentioned = this.mentioned;
        let unread_delta = 0;

        try {
            if (typeof(obj.message.m) === "string") {
                if (name_match_regex.test(obj.message.m)) {
                    if (obj.message.t > this.last_seen_timestamp) { // TODO remember chat read position
                        this.mentioned = true;
                        emitNotification("[" + this.name + "]: " + obj.username,
                                         "[" + this.name + "] " + obj.username + ": " + obj.message.m);
                    } else {
                        console.log("Not sending name match notification since we just joined the channel ", obj.channel);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (obj.message.t > this.last_seen_timestamp) {
            this.unread_ct++;
            unread_delta = 1;
            this.last_seen_timestamp = obj.message.t;
        }

        try {
            if (unread_delta !== 0 || this.mentioned !== previous_mentioned) {
                this.emit("unread-count-changed",
                        {channel: this.channel,
                        unread_ct: this.unread_ct,
                        unread_delta: unread_delta,
                        mentioned: this.mentioned,
                        previous_mentioned: previous_mentioned
                        });
            }
        } catch (e) {
            console.log(e);
        }

        try {
            this.emit("chat", obj);
        } catch (e) {
            console.error(e);
        }
    }

    handleChatRemoved(obj) {
        console.log("Chat message removed: ", obj);
        this.chat_ids[obj.uuid] = true;
        for (let idx = 0; idx < this.chat_log.length; ++idx) {
            let entry = this.chat_log[idx];
            if (entry.message.i === obj.uuid) {
                this.chat_log.splice(idx, 1);
            }
        }
        try {
            this.emit("chat-removed", obj);
        } catch (e) {
            console.error(e);
        }
    }

    handleJoins(users: Array<any>): void {
        for (let user of users) {
            if (!(user.id in this.user_list)) {
                this.user_count++;
            }
            this.user_list[user.id] = user;
        }
        this._update_sorted_lists();

        try {
            this.emit("join", users);
        } catch (e) {
            console.error(e);
        }

    }
    handlePart(user): void {
        if (user.id in this.user_list) {
            this.user_count--;
            delete this.user_list[user.id];
        }
        this._update_sorted_lists();

        try {
            this.emit("part", user);
        } catch (e) {
            console.error(e);
        }
    }
    _update_sorted_lists() {
        this.users_by_name = [];
        this.users_by_rank = [];
        for (let id in this.user_list) {
            this.users_by_name.push(this.user_list[id]);
            this.users_by_rank.push(this.user_list[id]);
        }
        this.users_by_name.sort((a, b) => a.username.localeCompare(b.username));
        this.users_by_rank.sort(users_by_rank);
    }
}

export function users_by_rank(a, b) {
    if (a.professional && !b.professional) {
        return -1;
    }
    if (b.professional && !a.professional) {
        return 1;
    }
    if (a.professional && b.professional) {
        return b.ranking - a.ranking;
    }

    let a_rank = Math.floor(bounded_rank(a));
    let b_rank = Math.floor(bounded_rank(b));

    if (a_rank === b_rank && a.username && b.username) {
        return a.username.localeCompare(b.username);
    }
    return b_rank - a_rank;
}


export class ChatChannelProxy extends TypedEventEmitter<Events> {
    id: number = ++last_proxy_id;
    channel: ChatChannel;

    constructor(channel) {
        super();
        this.channel = channel;
        this.channel.on("chat", this._onChat);
        this.channel.on("join", this._onJoin);
        this.channel.on("part", this._onPart);
        this.channel.on("chat-removed", this._onChatRemoved);
        this.channel.on("unread-count-changed", this._onUnreadChanged);
    }

    part() {
        this._destroy();
    }

    _onChat = (...args) => {
        this.emit.apply(this, ["chat"].concat(args));
    }
    _onJoin = (...args) => {
        this.emit.apply(this, ["join"].concat(args));
    }
    _onPart = (...args) => {
        this.emit.apply(this, ["part"].concat(args));
    }
    _onChatRemoved = (...args) => {
        this.emit.apply(this, ["chat-removed"].concat(args));
    }
    _onUnreadChanged = (...args) => {
        this.emit.apply(this, ["unread-count-changed"].concat(args));
    }
    _destroy() {
        this.channel.off("chat", this._onChat);
        this.channel.off("join", this._onJoin);
        this.channel.off("part", this._onPart);
        this.channel.off("chat-removed", this._onChatRemoved);
        this.channel.off("unread-count-changed", this._onUnreadChanged);
        this.removeAllListeners();
        this.channel.removeProxy(this);
    }
}


class ChatManager {
    channels: {[channel: string]: ChatChannel} = {};

    constructor() {
        comm_socket.on("chat-message", this.onMessage);
        comm_socket.on("chat-message-removed", this.onMessageRemoved);
        comm_socket.on("chat-join", this.onJoin);
        comm_socket.on("chat-part", this.onPart);
    }

    onMessage = (obj) => {
        if (!(obj.channel in this.channels)) {
            return;
        }

        player_cache.update({
            id: obj.id,
            username: obj.username,
            ui_class: obj.ui_class,
            country: obj.country,
            ranking: obj.ranking,
            professional: obj.professional,
        }, true);

        this.channels[obj.channel].handleChat(obj);
    }
    onMessageRemoved = (obj) => {
        if (!(obj.channel in this.channels)) {
            return;
        }

        this.channels[obj.channel].handleChatRemoved(obj);
    }
    onJoin = (joins) => {
        for (let i = 0; i < joins.users.length; ++i) {
            player_cache.update(joins.users[i]);
        }

        if (!(joins.channel in this.channels)) {
            return;
        }

        this.channels[joins.channel].handleJoins(joins.users);
    }
    onPart = (part) => {
        if (!(part.channel in this.channels)) {
            return;
        }

        this.channels[part.channel].handlePart(part.user);
    }
    join(channel: string): ChatChannelProxy {
        let display_name = resolveChannelDisplayName(channel);
        if (!(channel in this.channels)) {
            this.channels[channel] = new ChatChannel(channel, display_name);
        }

        return this.channels[channel].createProxy();
    }

    _removeChannel(channel: string): void {
        delete this.channels[channel];
    }
}



export const chat_manager = new ChatManager();
