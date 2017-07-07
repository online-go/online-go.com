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

import {Player} from "data/Player";



// A chat channel allows users to broadcast messages to everyone on the channel.
// The channel is polymorphic in the message content type.
export interface ChatChannel<T> {   // A channel where users can chat.
    id: string;                         // The channel's unique id.
    name: string;                       // The channel's name as seen by the end-users.
    language: string;                   // The channel's language.
    users: {[id: number]: Player};      // The users that are currently chatting.
    messages: Array<ChatMessage<T>>;    // The messages that have been exchanged.
}

export interface ChatMessage<T> {   // A message that a user has sent to a chat channel.
    content: T;                         // The content of the message.
    sender: Player;                     // The sender's identity.
    timestamp: Date;                    // The time when the message was sent.
}



// Join and leave a chat channel, and count the users on the channel.
function join_chat(channel: ChatChannel<any>, users: Array<Player>) {
    for (let user of users) {
        channel.users[user.id] = user;
    }
}

function leave_chat(channel: ChatChannel<any>, users: Array<Player>) {
    for (let user of users) {
        delete channel.users[user.id];
    }
}

function count_users(channel: ChatChannel<any>) {
    let count = 0;
    for (let user in channel.users) {
        count++;
    }
    return count;
}



// Post a message to the channel.
function post_message<T>(channel: ChatChannel<T>, sender: Player, content: T): ChatMessage<T> {
    let message: ChatMessage<T> = {content: content, sender: sender, timestamp: new Date()};
    channel.messages.push(message);
    return message;
}
