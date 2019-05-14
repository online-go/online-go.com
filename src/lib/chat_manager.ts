/*
 * Copyright (C) 2012-2019  Online-Go.com
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

interface Events {
    "chat": any;
    "join": Array<any>;
    "part": any;
}

let name_match_regex = /^loading...$/;
data.watch("config.user", (user) => {
    try {
        name_match_regex = new RegExp("\b" + user.username.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "\b", "i");
    } catch (e) {
        console.error("Failed to construct name matching regular expression", e);
    }
});


const rtl_channels = {
    "global-arabic": true,
    "global-hebrew": true,
};

let last_proxy_id = 0;

class ChatChannel extends TypedEventEmitter<Events> {
    channel: string;
    display_name: string;
    proxies: {[id: number]: ChatChannelProxy} = {};
    joining: boolean = false;
    chat_log   = [];
    chat_ids   = {};
    has_unread = false;
    user_list  = {};
    users_by_rank = [];
    users_by_name = [];
    user_count = 0;
    rtl_mode   = false;


    constructor(channel: string, display_name: string) {
        super();
        this.channel = channel;
        this.rtl_mode = channel in rtl_channels;
        this.joining = true;
        setTimeout(() => this.joining = false, 10000); /* don't notify for name matches within 10s of joining a channel */
        comm_socket.on("connect", this._rejoin);
        this._rejoin();
    }

    _rejoin = () => {{{
        if (comm_socket.connected) {
            comm_socket.emit("chat/join", {"channel": this.channel});
        }
    }}}
    _destroy() {{{
        if (comm_socket.connected) {
            comm_socket.emit("chat/part", {"channel": this.channel});
        }
        comm_socket.off("connect", this._rejoin);
        this.removeAllListeners();
    }}}
    createProxy(): ChatChannelProxy {{{
        let proxy = new ChatChannelProxy(this);
        this.proxies[proxy.id] = proxy;
        return proxy;
    }}}
    removeProxy(proxy: ChatChannelProxy): void {{{
        delete this.proxies[proxy.id];
        if (Object.keys(this.proxies).length === 0) {
            this._destroy();
            chat_manager._removeChannel(this.channel);
        }
    }}}

    handleChat(obj) {{{
        if (obj.message.i in this.chat_ids) {
            return;
        }
        this.chat_ids[obj.message.i] = true;
        this.chat_log.push(obj);

        try {
            this.emit("chat", obj);
        } catch (e) {
            console.error(e);
        }

        try {
            if (typeof(obj.message.m) === "string") {
                if (name_match_regex.test(obj.message.m)) {
                    if (!this.joining) {
                        emitNotification("[" + this.display_name + "]: " + obj.username,
                                         "[" + this.display_name + "] " + obj.username + ": " + obj.message.m);
                    } else {
                        console.log("Not sending name match notification since we just joined the channel ", obj.channel);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }}}
    handleJoins(users: Array<any>): void {{{
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

    }}}
    handlePart(user): void {{{
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
    }}}
    _update_sorted_lists() {{{
        this.users_by_name = [];
        this.users_by_rank = [];
        for (let id in this.user_list) {
            this.users_by_name.push(this.user_list[id]);
            this.users_by_rank.push(this.user_list[id]);
        }
        this.users_by_name.sort((a, b) => a.username.localeCompare(b.username));
        this.users_by_rank.sort(users_by_rank);
    }}}
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
    }

    part() {{{
        this._destroy();
    }}}

    _onChat = (...args) => {{{
        this.emit.apply(this, ["chat"].concat(args));
    }}}
    _onJoin = (...args) => {{{
        this.emit.apply(this, ["join"].concat(args));
    }}}
    _onPart = (...args) => {{{
        this.emit.apply(this, ["part"].concat(args));
    }}}
    _destroy() {{{
        this.channel.off("chat", this._onChat);
        this.channel.off("join", this._onJoin);
        this.channel.off("part", this._onPart);
        this.removeAllListeners();
        this.channel.removeProxy(this);
    }}}
}


class ChatManager {
    channels: {[channel: string]: ChatChannel} = {};

    constructor() {
        comm_socket.on("chat-message", this.onMessage);
        comm_socket.on("chat-join", this.onJoin);
        comm_socket.on("chat-part", this.onPart);
    }

    onMessage = (obj) => {{{
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
    }}}
    onJoin = (joins) => {{{
        for (let i = 0; i < joins.users.length; ++i) {
            player_cache.update(joins.users[i]);
        }

        if (!(joins.channel in this.channels)) {
            return;
        }

        this.channels[joins.channel].handleJoins(joins.users);
    }}}
    onPart = (part) => {{{
        if (!(part.channel in this.channels)) {
            return;
        }

        this.channels[part.channel].handlePart(part.user);
    }}}
    join(channel: string, display_name: string): ChatChannelProxy {{{
        if (!(channel in this.channels)) {
            this.channels[channel] = new ChatChannel(channel, display_name);
        }

        return this.channels[channel].createProxy();
    }}}

    _removeChannel(channel: string): void {{{
        delete this.channels[channel];
    }}}
}



export const chat_manager = new ChatManager();
