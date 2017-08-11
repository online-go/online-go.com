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
import {Batcher} from "batcher";
import * as player_cache from "player_cache";
import {RegisteredPlayer} from "data/Player";



// Record which users are online. This is in case the online
// status arrives before the player is fetched from the backend.
let online: {[id: number]: boolean} = {};



// Tell the module which players are to be observed.
export function observe_online(...ids: Array<number>) {
    ids.forEach(id => online[id] = (online[id] || false));
    subscribe_queue.soon(...ids);
}

let subscribe_queue = new Batcher<number>(ids => {
    comm_socket.send("user/monitor", ids);
    for (let id of ids) {
        player_cache.fetch(id)
        .then(player => {
            if (player instanceof RegisteredPlayer && !player.is.online !== !online[player.id]) {
                player.is.online = online[player.id];
                player_cache.update(player);
            }
        });
    }
});



// Handle the communication with the backend.
comm_socket.on("connect", () => {
    let keys = Object.keys(online);
    if (keys.length > 0) {
        comm_socket.send("user/monitor", keys);
    }
});

comm_socket.on("user/state", (states) => {
    for (let id in states) {
        online[id] = !!states[id];
        let player = player_cache.lookup(parseInt(id));
        if (player instanceof RegisteredPlayer && !player.is.online !== !online[id]) {
            player.is.online = online[id];
            player_cache.update(player);
        }
    }
});

comm_socket.on("disconnect", () => {
    for (let id in online) {
        online[id] = false;
        let player = player_cache.lookup(parseInt(id));
        if (player instanceof RegisteredPlayer && player.is.online) {
            player.is.online = false;
            player_cache.update(player);
        }
    }
});
