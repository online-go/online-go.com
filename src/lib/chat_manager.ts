/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import cached from "cached";
import * as data from "data";
import * as player_cache from "player_cache";
import { comm_socket } from "sockets";
import { get } from "requests";
import { TypedEventEmitter } from "TypedEventEmitter";
import { emitNotification } from "Notifications";
import { bounded_rank } from "rank_utils";
import { ActiveTournamentList, GroupList } from "types";
import { _, interpolate } from "translate";
import { shadowban } from "src/views/Moderator";
import { getBlocks } from "BlockPlayer";
import { insert_into_sorted_list, string_splitter, n2s, dup, Timeout } from "misc";

export interface ChatMessage {
    channel: string;
    username: string;
    id: number;
    ranking: number;
    professional: boolean;
    ui_class: string;
    country?: string;
    message: {
        i: string; // uuid;
        t: number; // epoch in seconds
        m: string; // the text
    };
    system_message_type?: "flood";
    system?: boolean; // true if it's a system message
}

export interface ChannelInformation {
    id: string;
    name: string;
    language?: string | Array<string>;
    rtl?: boolean;
    group_id?: number;
    tournament_id?: number;
    icon?: string;
    banner?: string;
    country?: string;
    navigator_language?: boolean;
    primary_language?: boolean;
    sort_order?: number;
}

export interface TopicMessage {
    channel: string;
    username: string;
    id: number;
    ranking: number;
    professional: boolean;
    ui_class: string;
    country?: string;
    topic: string;
    timestamp: number;
}

interface Events {
    chat: ChatMessage | null;
    topic: TopicMessage;
    "chat-removed": any;
    join: Array<any>;
    part: any;
    "unread-count-changed": any;
}

export interface UnreadChanged {
    channel: string;
    unread_ct: number;
    unread_delta: number;
    mentioned: Boolean;
    previous_mentioned: Boolean;
}

const channel_information_cache: { [channel: string]: ChannelInformation } = {};
const channel_information_resolvers: { [channel: string]: Promise<ChannelInformation> } = {};

export const global_channels: Array<ChannelInformation> = [
    { id: "global-english", name: "English", country: "us", language: "en" },
    { id: "global-help", name: "Help", country: "un" },
    { id: "global-offtopic", name: "Off Topic", country: "un" },
    { id: "global-rengo", name: "Rengo", country: "un" },
    { id: "global-japanese", name: "日本語 ", country: "jp", language: "ja" },
    { id: "global-zh-hans", name: "中文", country: "cn", language: ["zh", "zh_hans", "zh_cn"] },
    { id: "global-zh-hant", name: "廣東話", country: "hk", language: ["zh-hk", "zh_hk", "zh_hant", "zh_tw"] },
    { id: "global-korean", name: "한국어", country: "kr", language: "ko" },
    { id: "global-russian", name: "Русский", country: "ru", language: "ru" },
    { id: "global-polish", name: "Polski", country: "pl", language: "pl" },
    { id: "global-arabic", name: "العَرَبِيَّةُ", country: "_Arab_League", language: "ar", rtl: true },
    { id: "global-bulgarian", name: "Български", country: "bg", language: "bg" },
    { id: "global-catalan", name: "Català", country: "_cat", language: "ca" },
    { id: "global-czech", name: "Čeština", country: "cz", language: "cs" },
    { id: "global-esperanto", name: "Esperanto", country: "_Esperanto", language: "eo" },
    { id: "global-german", name: "Deutsch", country: "de", language: "de" },
    { id: "global-spanish", name: "Español", country: "es", language: "es" },
    { id: "global-french", name: "Français", country: "fr", language: "fr" },
    { id: "global-filipino", name: "Filipino", country: "ph", language: "fil" },
    { id: "global-indonesian", name: "Indonesian", country: "id", language: "id" },
    { id: "global-hebrew", name: "עִבְרִית", country: "il", language: "he", rtl: true },
    { id: "global-hindi", name: "हिन्दी", country: "in", language: "hi" },
    { id: "global-nepali", name: "नेपाली", country: "np", language: "ne" },
    { id: "global-bangla", name: "বাংলা", country: "bd", language: "bn" },
    { id: "global-lithuanian", name: "Lietuvių", country: "lt", language: "lt" },
    { id: "global-hungarian", name: "Magyar", country: "hu", language: "hu" },
    { id: "global-dutch", name: "Nederlands", country: "nl", language: "nl" },
    { id: "global-norwegian", name: "Norsk", country: "no", language: "no" },
    { id: "global-italian", name: "Italiano", country: "it", language: "it" },
    { id: "global-portuguese", name: "Português", country: "pt", language: "pt" },
    { id: "global-romanian", name: "Română", country: "ro", language: "ro" },
    { id: "global-swedish", name: "Svenska", country: "se", language: "sv" },
    { id: "global-finnish", name: "Suomi", country: "fi", language: "fi" },
    { id: "global-turkish", name: "Türkçe", country: "tr", language: "tr" },
    { id: "global-ukrainian", name: "Українська", country: "ua", language: "uk" },
    { id: "global-vietnamese", name: "Tiếng Việt", country: "vn", language: "vi" },
    { id: "global-thai", name: "ภาษาไทย", country: "th", language: "th" },
];

try {
    let sort_order = 0;
    for (const chan of global_channels) {
        chan.sort_order = sort_order + 1000;
        sort_order += 1;
    }

    let primary_language = true;

    for (let language of navigator.languages) {
        language = language.toLowerCase().replace("-", "_");

        for (const chan of global_channels) {
            if (chan.language) {
                const chan_lang_list = typeof chan.language === "string" ? [chan.language] : chan.language;
                for (const chan_lang of chan_lang_list) {
                    if (chan_lang === language && !chan.navigator_language) {
                        chan.navigator_language = true;
                        if (primary_language) {
                            chan.primary_language = primary_language;
                        }
                        primary_language = false;
                        chan.sort_order = sort_order;
                        sort_order += 1;
                        break;
                    }
                }
            }
        }
    }

    if (primary_language === true) {
        // not found
        global_channels[0].primary_language = true; /* default to english as primary */
    }

    global_channels.sort((a, b) => a.sort_order - b.sort_order);
} catch (e) {
    console.error(e);
}

data.watch("user", (user) => {
    if (user.supporter && global_channels.filter((c) => c.id === "global-supporter").length === 0) {
        global_channels.splice(0, 0, {
            id: "global-supporter",
            name: _("Site Supporters"),
            country: "un",
        });
    }

    if (user.is_moderator && global_channels.filter((c) => c.id === "shadowban").length === 0) {
        global_channels.splice(0, 0, {
            id: "shadowban",
            country: "_Pirate",
            name: "Shadowban",
        });
    }
});

/*
data.watch("config.ogs", (settings) => {
    if (settings && settings.channels) {
        global_channels = settings.channels;
    }
});
*/

export function resolveChannelDisplayName(channel: string): string {
    if (channel === "shadowban") {
        return global_channels[channel];
    }
    if (channel.startsWith("global-")) {
        global_channels.forEach((element) => {
            if (channel === element.id) {
                return element.name;
            }
        });
    } else if (channel.startsWith("tournament-")) {
        const id: number = parseInt(channel.substring(11));
        tournament_channels.forEach((element) => {
            if (id === element.id) {
                return element.name;
            }
        });
    } else if (channel.startsWith("group-")) {
        const id: number = parseInt(channel.substring(6));
        group_channels.forEach((element) => {
            if (id === element.id) {
                return element.name;
            }
        });
    } else if (channel.startsWith("game-")) {
        return interpolate(_("Game {{number}}"), { number: channel.substring(5) }); // eslint-disable-line id-denylist
    } else if (channel.startsWith("review-")) {
        return interpolate(_("Review {{number}}"), { number: channel.substring(7) }); // eslint-disable-line id-denylist
    }
    return "<error>";
}

export let group_channels: GroupList = [];
export let tournament_channels: ActiveTournamentList = [];

function updateGroups(groups: GroupList) {
    group_channels = groups;
}
function updateTournaments(tournaments: ActiveTournamentList) {
    tournament_channels = tournaments;
}
data.watch(cached.groups, updateGroups);
data.watch(cached.active_tournaments, updateTournaments);

let user_id: number;
let name_match_regex = /^loading...$/;
data.watch("config.user", (user) => {
    const cleaned_username_regex = user.username.replace(/[\\^$*+.()|[\]{}]/g, "\\$&");
    name_match_regex = new RegExp(
        "\\b" +
            cleaned_username_regex +
            "\\b" +
            "|\\bplayer ?" +
            user.id +
            "\\b" +
            "|\\bhttps?:\\/\\/online-go\\.com\\/user\\/view\\/" +
            user.id +
            "\\b",
        "i",
    );
    user_id = user.id;
});

const rtl_channels = {
    "global-arabic": true,
    "global-hebrew": true,
};

let last_proxy_id = 0;

class ChatChannel extends TypedEventEmitter<Events> {
    channel: string;
    name: string;
    proxies: { [id: number]: ChatChannelProxy } = {};
    joining: boolean = false;
    chat_log: Array<ChatMessage> = [];
    chat_ids = {};
    has_unread = false;
    unread_ct = 0;
    mentioned = false;
    user_list = {};
    users_by_rank = [];
    users_by_name = [];
    user_count = 0;
    rtl_mode = false;
    last_seen_timestamp: number;
    send_tokens = 5;
    flood_protection: Timeout = null;
    topic: TopicMessage;

    constructor(channel: string, display_name: string) {
        super();
        this.channel = channel;
        this.name = display_name;
        this.rtl_mode = channel in rtl_channels;
        this.joining = true;
        setTimeout(
            () => (this.joining = false),
            10000,
        ); /* don't notify for name matches within 10s of joining a channel */
        comm_socket.on("connect", this._rejoin);
        this._rejoin();
        const last_seen = data.get("chat-manager.last-seen", {});
        if (channel in last_seen) {
            this.last_seen_timestamp = last_seen[channel];
        } else {
            this.last_seen_timestamp = 0;
        }
    }

    markAsRead() {
        const unread_delta = -this.unread_ct;
        const previous_mentioned = this.mentioned;
        this.unread_ct = 0;
        this.mentioned = false;
        const last_seen = data.get("chat-manager.last-seen", {});
        last_seen[this.channel] = this.last_seen_timestamp;
        data.set("chat-manager.last-seen", last_seen);
        try {
            this.emit("unread-count-changed", {
                channel: this.channel,
                unread_ct: this.unread_ct,
                unread_delta: unread_delta,
                mentioned: this.mentioned,
                previous_mentioned: previous_mentioned,
            });
        } catch (e) {
            console.error(e);
        }
    }

    _rejoin = () => {
        if (comm_socket.connected) {
            comm_socket.emit("chat/join", { channel: this.channel });
        }
    };
    _destroy() {
        if (comm_socket.connected) {
            comm_socket.emit("chat/part", { channel: this.channel });
        }
        comm_socket.off("connect", this._rejoin);
        this.removeAllListeners();
    }
    createProxy(): ChatChannelProxy {
        const proxy = new ChatChannelProxy(this);
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

    handleTopic(obj: TopicMessage): void {
        this.topic = obj;
        this.emit("topic", obj);
    }

    handleChat(obj: ChatMessage) {
        if (obj.message.i in this.chat_ids) {
            return;
        }
        this.chat_ids[obj.message.i] = true;
        this.chat_log.push(obj);

        const previous_mentioned = this.mentioned;
        let unread_delta = 0;

        try {
            if (typeof obj.message.m === "string") {
                if (!(getBlocks(obj.id).block_chat || obj.id === user_id)) {
                    // ignore messages from blocked users or oneself
                    if (name_match_regex.test(obj.message.m)) {
                        if (obj.message.t > this.last_seen_timestamp) {
                            // TODO remember chat read position
                            this.mentioned = true;
                            emitNotification(
                                "[" + this.name + "]: " + obj.username,
                                "[" + this.name + "] " + obj.username + ": " + obj.message.m,
                            );
                        } else {
                            //console.debug("Not sending name match notification since we just joined the channel ", obj.channel);
                        }
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }

        if (!(getBlocks(obj.id).block_chat || obj.id === user_id)) {
            // ignore messages from blocked users or oneself
            if (obj.message.t > this.last_seen_timestamp) {
                this.unread_ct++;
                unread_delta = 1;
                this.last_seen_timestamp = obj.message.t;
            }
        }

        try {
            if (unread_delta !== 0 || this.mentioned !== previous_mentioned) {
                this.emit("unread-count-changed", {
                    channel: this.channel,
                    unread_ct: this.unread_ct,
                    unread_delta: unread_delta,
                    mentioned: this.mentioned,
                    previous_mentioned: previous_mentioned,
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
            const entry = this.chat_log[idx];
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
        for (const user of users) {
            if (!(user.id in this.user_list)) {
                this.user_count++;
                this._insert_into_sorted_lists(user);
            }
            this.user_list[user.id] = user;
        }

        try {
            this.emit("join", users);
        } catch (e) {
            console.error(e);
        }
    }
    handlePart(user): void {
        if (user.id in this.user_list) {
            this.user_count--;
            this._remove_from_sorted_lists(user);
            delete this.user_list[user.id];
        }

        try {
            this.emit("part", user);
        } catch (e) {
            console.error(e);
        }
    }

    _insert_into_sorted_lists(new_user) {
        insert_into_sorted_list(this.users_by_name, (a, b) => a.username.localeCompare(b.username), new_user);

        insert_into_sorted_list(this.users_by_rank, users_by_rank, new_user);
    }

    _remove_from_sorted_lists(user) {
        this.users_by_name = this.users_by_name.filter((existing_user) => existing_user.id !== user.id);
        this.users_by_rank = this.users_by_rank.filter((existing_user) => existing_user.id !== user.id);
    }

    public send(text: string): void {
        if (text.length > 300) {
            for (const split_str of string_splitter(text)) {
                this.send(split_str);
            }
            return;
        }

        if (this.flood_protection) {
            return;
        }
        if (text.trim().length === 0) {
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

            this.systemMessage(
                interpolate(_("Anti-flood system engaged. You will be able to talk again in {{time}} seconds."), {
                    time: chillout_time,
                }),
                "flood",
            );
            const start = Date.now();
            this.flood_protection = setInterval(() => {
                this.clearSystemMessages("flood");
                const left = chillout_time * 1000 - (Date.now() - start);
                if (left > 0) {
                    this.systemMessage(
                        interpolate(
                            _("Anti-flood system engaged. You will be able to talk again in {{time}} seconds."),
                            { time: Math.round(left / 1000) },
                        ),
                        "flood",
                    );
                } else {
                    clearInterval(this.flood_protection);
                    this.flood_protection = null;
                }
            }, 1000);
            return;
        }
        --this.send_tokens;
        setTimeout(() => {
            this.send_tokens = Math.min(5, this.send_tokens + 1);
        }, 2000);

        const user = data.get("config.user");

        const _send_obj = {
            channel: this.channel,
            uuid: n2s(user.id) + "." + n2s(Date.now()),
            message: text,
        };

        comm_socket.send("chat/send", _send_obj);
        const obj: ChatMessage = {
            channel: _send_obj.channel,
            username: user.username,
            id: user.id,
            ranking: user.ranking,
            professional: user.professional,
            ui_class: user.ui_class,
            message: { i: _send_obj.uuid, t: Math.floor(Date.now() / 1000), m: text },
        };
        this.chat_log.push(obj);
        this.chat_ids[obj.message.i] = true;
        this.emit("chat", obj);
    }
    public setTopic(topic: string) {
        const user = data.get("user");

        const msg: TopicMessage = {
            channel: this.channel,
            username: user.username,
            id: user.id,
            ranking: user.ranking,
            professional: user.professional,
            ui_class: user.ui_class,
            country: user.country,
            topic: topic,
            timestamp: Date.now(),
        };
        comm_socket.send("chat/topic", msg);
        this.topic = msg;
    }

    public systemMessage(text: string, system_message_type: "flood"): void {
        const obj: ChatMessage = {
            channel: this.channel,
            username: "system",
            id: -1,
            ranking: 99,
            professional: false,
            ui_class: "",
            message: {
                i: n2s(Date.now()),
                t: Date.now() / 1000,
                m: text,
            },
            system: true,
            system_message_type: system_message_type,
        };

        this.chat_log.push(obj);
        this.emit("chat", obj);
    }

    public clearSystemMessages(system_message_type: "flood"): void {
        for (let i = 0; i < this.chat_log.length; ++i) {
            if (this.chat_log[i].system && system_message_type === this.chat_log[i].system_message_type) {
                this.chat_log.splice(i, 1);
                --i;
            }
        }
        this.emit("chat", null);
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

    const a_rank = Math.floor(bounded_rank(a));
    const b_rank = Math.floor(bounded_rank(b));

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
        this.channel.on("topic", this._onTopic);
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
    };
    _onTopic = (...args) => {
        this.emit.apply(this, ["topic"].concat(args));
    };
    _onJoin = (...args) => {
        this.emit.apply(this, ["join"].concat(args));
    };
    _onPart = (...args) => {
        this.emit.apply(this, ["part"].concat(args));
    };
    _onChatRemoved = (...args) => {
        this.emit.apply(this, ["chat-removed"].concat(args));
    };
    _onUnreadChanged = (...args) => {
        this.emit.apply(this, ["unread-count-changed"].concat(args));
    };
    _destroy() {
        this.channel.off("chat", this._onChat);
        this.channel.off("topic", this._onTopic);
        this.channel.off("join", this._onJoin);
        this.channel.off("part", this._onPart);
        this.channel.off("chat-removed", this._onChatRemoved);
        this.channel.off("unread-count-changed", this._onUnreadChanged);
        this.removeAllListeners();
        this.channel.removeProxy(this);
    }
}

class ChatManager {
    channels: { [channel: string]: ChatChannel } = {};

    constructor() {
        comm_socket.on("chat-message", this.onMessage);
        comm_socket.on("chat-topic", this.onTopic);
        comm_socket.on("chat-message-removed", this.onMessageRemoved);
        comm_socket.on("chat-join", this.onJoin);
        comm_socket.on("chat-part", this.onPart);
    }

    onTopic = (obj: TopicMessage) => {
        if (!(obj.channel in this.channels)) {
            return;
        }

        if (obj.id && obj.username) {
            player_cache.update(
                {
                    id: obj.id,
                    username: obj.username,
                    ui_class: obj.ui_class,
                    country: obj.country,
                    ranking: obj.ranking,
                    professional: obj.professional,
                },
                true,
            );
        }

        this.channels[obj.channel].handleTopic(obj);
    };
    onMessage = (obj: ChatMessage) => {
        if (!(obj.channel in this.channels)) {
            return;
        }

        if (!obj.system && obj.id && obj.username) {
            player_cache.update(
                {
                    id: obj.id,
                    username: obj.username,
                    ui_class: obj.ui_class,
                    country: obj.country,
                    ranking: obj.ranking,
                    professional: obj.professional,
                },
                true,
            );
        }

        this.channels[obj.channel].handleChat(obj);
    };
    onMessageRemoved = (obj) => {
        if (!(obj.channel in this.channels)) {
            return;
        }

        this.channels[obj.channel].handleChatRemoved(obj);
    };
    onJoin = (joins) => {
        for (let i = 0; i < joins.users.length; ++i) {
            player_cache.update(joins.users[i]);
        }

        if (!(joins.channel in this.channels)) {
            return;
        }

        this.channels[joins.channel].handleJoins(joins.users);
    };
    onPart = (part) => {
        if (!(part.channel in this.channels)) {
            return;
        }

        this.channels[part.channel].handlePart(part.user);
    };
    join(channel: string): ChatChannelProxy {
        const display_name = resolveChannelDisplayName(channel);
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

/* Channel information resolver */

export function cachedChannelInformation(channel: string): ChannelInformation | null {
    if (channel in channel_information_cache) {
        return channel_information_cache[channel];
    }
    return null;
}

export function updateCachedChannelInformation(channel: string, info: ChannelInformation): void {
    channel_information_cache[channel] = info;
}

export function resolveChannelInformation(channel: string): Promise<ChannelInformation> {
    if (channel in channel_information_cache) {
        return Promise.resolve(channel_information_cache[channel]);
    }

    if (channel in channel_information_resolvers) {
        return channel_information_resolvers[channel];
    }

    let resolver: Promise<ChannelInformation>;

    const ret: ChannelInformation = {
        id: channel,
        name: channel,
    };

    {
        const m = channel.match(/^group-([0-9]+)$/);
        if (m) {
            ret.group_id = parseInt(m[1]);
        }
    }

    {
        const m = channel.match(/^tournament-([0-9]+)$/);
        if (m) {
            ret.tournament_id = parseInt(m[1]);
        }
    }

    if (ret.group_id) {
        resolver = new Promise<ChannelInformation>((resolve, reject) => {
            get(`/termination-api/group/${ret.group_id}`)
                .then((res: any): ChannelInformation => {
                    ret.name = res.name;
                    ret.icon = res.icon;
                    ret.banner = res.banner;
                    updateCachedChannelInformation(channel, ret);
                    delete channel_information_resolvers[channel];
                    resolve(ret);
                    return ret;
                })
                .catch(reject);
        });
    } else if (ret.tournament_id) {
        updateCachedChannelInformation(channel, ret);
        resolver = Promise.resolve(ret);
    } else {
        updateCachedChannelInformation(channel, ret);
        resolver = Promise.resolve(ret);
    }

    return (channel_information_resolvers[channel] = resolver);
}

for (const chan of global_channels) {
    updateCachedChannelInformation(chan.id, chan);
}
data.watch(cached.active_tournaments, (tournaments: ActiveTournamentList) => {
    for (const tournament of tournaments) {
        updateCachedChannelInformation(`tournament-${tournament.id}`, {
            id: `tournament-${tournament.id}`,
            name: tournament.name,
            tournament_id: tournament.id,
        });
    }
});
