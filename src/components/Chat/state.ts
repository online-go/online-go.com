/*
 * Copyright (C)  Online-Go.com
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

import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { TypedEventEmitter } from "@/lib/TypedEventEmitter";

interface Events {
    subscription_changed: void;
}
const event_emitter = new TypedEventEmitter<Events>();

export let chat_subscriptions: { [channel: string]: { [option: string]: boolean } } = {};

data.watch("chat-indicator.chat-subscriptions", onChatSubscriptionUpdate);
function onChatSubscriptionUpdate(
    subs: { [channel: string]: { [option: string]: boolean } } | undefined,
) {
    if (subs) {
        chat_subscriptions = subs;
    }
    event_emitter.emit("subscription_changed");
}
let chat_subscribe_new_group_chat_messages = false;
preferences.watch("chat-subscribe-group-chat-unread", onChatSubscribeGroupMessageChange);
function onChatSubscribeGroupMessageChange(pref: boolean) {
    chat_subscribe_new_group_chat_messages = pref;
    event_emitter.emit("subscription_changed");
}
let chat_subscribe_new_group_chat_mentioned = false;
preferences.watch("chat-subscribe-group-mentions", onChatSubscribeGroupMentionsChange);
function onChatSubscribeGroupMentionsChange(pref: boolean) {
    chat_subscribe_new_group_chat_mentioned = pref;
    event_emitter.emit("subscription_changed");
}
let chat_subscribe_new_tournament_chat_messages = false;
preferences.watch("chat-subscribe-tournament-chat-unread", onChatSubscribeTournamentMessageChange);
function onChatSubscribeTournamentMessageChange(pref: boolean) {
    chat_subscribe_new_tournament_chat_messages = pref;
    event_emitter.emit("subscription_changed");
}
let chat_subscribe_new_tournament_chat_mentioned = false;
preferences.watch("chat-subscribe-tournament-mentions", onChatSubscribeTournamentMentionsChange);
function onChatSubscribeTournamentMentionsChange(pref: boolean) {
    chat_subscribe_new_tournament_chat_mentioned = pref;
    event_emitter.emit("subscription_changed");
}

export function getUnreadChatPreference(channel: string): boolean {
    if (channel in chat_subscriptions && "unread" in chat_subscriptions[channel]) {
        return chat_subscriptions[channel].unread;
    }
    if (channel.startsWith("group-")) {
        return chat_subscribe_new_group_chat_messages;
    }
    if (channel.startsWith("tournament-")) {
        return chat_subscribe_new_tournament_chat_messages;
    }
    return false;
}
export function getMentionedChatPreference(channel: string): boolean {
    if (channel in chat_subscriptions && "mentioned" in chat_subscriptions[channel]) {
        return chat_subscriptions[channel].mentioned;
    }
    if (channel.startsWith("group-")) {
        return chat_subscribe_new_group_chat_mentioned;
    }
    if (channel.startsWith("tournament-")) {
        return chat_subscribe_new_tournament_chat_mentioned;
    }
    return false;
}

export function watchChatSubscriptionChanged(
    cb: () => void,
    dont_call_immediately?: boolean,
): void {
    // Give a single place to subscribe to setting changes
    event_emitter.on("subscription_changed", cb);
    if (!dont_call_immediately) {
        cb();
    }
}
export function unwatchChatSubscriptionChanged(cb: () => void): void {
    event_emitter.off("subscription_changed", cb);
}
