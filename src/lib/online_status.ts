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

import { socket } from "@/lib/sockets";
import { TypedEventEmitter } from "@/lib/TypedEventEmitter";
import { Batcher } from "@/lib/batcher";

interface Events {
    "users-online-updated": never;
}

const listeners: { [id: number]: Array<any> } = {};
const state: { [player_id: number]: boolean } = {};
const event_emitter = new TypedEventEmitter<Events>();

socket.on("connect", () => {
    const list: number[] = [];
    for (const id in state) {
        list.push(parseInt(id));
    }
    if (list.length) {
        socket.send("user/monitor", { user_ids: list });
    }
});

socket.on("user/state", (states) => {
    for (const id in states) {
        state[id] = states[id];
        for (let i = 0; i < listeners[id].length; ++i) {
            listeners[id][i](id, state[id]);
        }
    }
    event_emitter.emit("users-online-updated");
});

socket.on("disconnect", () => {
    for (const id in state) {
        state[id] = false;
        for (let i = 0; i < listeners[id].length; ++i) {
            listeners[id][i](id, state[id]);
        }
    }
    event_emitter.emit("users-online-updated");
});

const subscribe_queue = new Batcher<number>((ids) => {
    socket.send("user/monitor", { user_ids: ids });
});

type callback = (player_id: number, online: boolean) => void;

function subscribe(player_id: number, cb: callback) {
    if (player_id in state) {
        cb(player_id, state[player_id]);
        listeners[player_id].push(cb);
        return;
    }

    state[player_id] = false;
    listeners[player_id] = [cb];
    subscribe_queue.soon(player_id);
}

function unsubscribe(player_id: number, cb: callback) {
    if (player_id in listeners) {
        for (let i = 0; i < listeners[player_id].length; ++i) {
            if (listeners[player_id][i] === cb) {
                listeners[player_id].splice(i, 1);
                return;
            }
        }
    }
}

function is_player_online(player_id: number) {
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
