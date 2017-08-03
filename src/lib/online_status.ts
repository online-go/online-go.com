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

import {comm_socket} from "sockets";
import {TypedEventEmitter} from "TypedEventEmitter";

interface Events {
    "users-online-updated": never;
}

let listeners: {[id: number]: Array<any>} = {};
let state = {};
let event_emitter = new TypedEventEmitter<Events>();

comm_socket.on("connect", () => {
    let list = [];
    for (let id in state) {
        list.push(id);
    }
    if (list.length) {
        comm_socket.send("user/monitor", list);
    }
});

comm_socket.on("user/state", (states) => {
    let i;
    for (let id in states) {
        state[id] = states[id];
        for (i = 0; i < listeners[id].length; ++i) {
            listeners[id][i](id, state[id]);
        }
    }
    event_emitter.emit("users-online-updated");
});

comm_socket.on("disconnect", () => {
    for (let id in state) {
        state[id] = false;
        for (let i = 0; i < listeners[id].length; ++i) {
            listeners[id][i](id, state[id]);
        }
    }
    event_emitter.emit("users-online-updated");
});

let subscribe_queue = null;
function subscribe(player_id, cb) {
    if (player_id in state) {
        cb(player_id, state[player_id]);
        listeners[player_id].push(cb);
        return;
    }

    if (subscribe_queue == null) {
        subscribe_queue = [];
        setTimeout(() => {
            comm_socket.send("user/monitor", subscribe_queue);
            subscribe_queue = null;
        }, 1);
    }

    state[player_id] = false;
    listeners[player_id] = [cb];
    subscribe_queue.push(player_id);
}

function unsubscribe(player_id, cb) {
    if (player_id in listeners) {
        for (let i = 0; i < listeners[player_id].length; ++i) {
            if (listeners[player_id] === cb) {
                listeners[player_id].splice(i, 1);
                return;
            }
        }
    }
}

function is_player_online(player_id) {
    if (player_id in state) {
        return state[player_id];
    }
    return false;
}


export default {
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    is_player_online: is_player_online,
    event_emitter: event_emitter,
};
