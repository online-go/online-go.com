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

import {get} from "requests";
import {Publisher} from "pubsub";

const player_cache_debug_enabled = false;
let cache: {[id: number]: any} = {};
let cache_by_username: {[username: string]: any} = {};
let active_fetches: {[id: number]: Promise<any>} = {};
export let nicknames: Array<string> = [];



// Publish new player details as required.
type Player = any;
let publisher = new Publisher<{[player_id: string]: Player}>();
class PlayerCacheSubscription extends publisher.Subscription<string> {
    protected new_subscriber(channel: string): void {
        let id: number = +channel;
        if (id in cache) {
            this.callback(channel, cache[id]);
        }
        else {
            fetch(id, []);   // The fetch will publish the details.
        }
    }
}
export class Subscription {
    private subscribe: PlayerCacheSubscription;

    constructor(callback: (player: Player) => void) {
        this.subscribe = new PlayerCacheSubscription((channel, player) => callback(player));
    }

    to(players: Array<number | Player>) {
        let ids = players.map(
            (player) => typeof player === "number" ? player.toString() : player.id.toString()
        );
        this.subscribe.to(ids);
    }
}



export function update(player: any, dont_overwrite?: boolean): any {
    if (Array.isArray(player)) {
        for (let p of player) {
            update(p, dont_overwrite);
        }
        return;
    }

    let id = "user_id" in player ? player.user_id : player.id;
    if (!(id in cache)) {
        cache[id] = {};
    }
    let changed = false;
    for (let k in player) {
        if (dont_overwrite || cache[id][k] === player[k]) {
            continue;
        }
        changed = true;
        cache[id][k] = player[k];
    }
    if (cache[id].username && !(cache[id].username in cache_by_username)) {
        nicknames.push(cache[id]["username"]);
    }
    if (cache[id].username) {
        cache_by_username[cache[id].username] = cache[id];
    }

    if (changed) {
        publisher.publish(id.toString(), cache[id]);
    }
    return cache[id];
}

export function lookup(player_id: number): any {
    if (player_id in cache) {
        return cache[player_id];
    }

    return null;
}

export function lookup_by_username(username: string): any {
    if (username in cache_by_username) {
        return cache_by_username[username];
    }

    return null;
}

export function fetch(player_id: number, required_fields?: Array<string>): Promise<any> {
    if (!player_id) {
        console.error("Attempted to fetch invalid player id: ", player_id);
        return Promise.reject("invalid player id");
    }

    let missing_fields = [];

    if (player_id in cache) {
        let have_cached_copy = true;

        if (required_fields) {
            for (let f of required_fields) {
                if (!(f in cache[player_id])) {
                    missing_fields.push(f);
                    have_cached_copy = false;
                    break;
                }
            }
        }

        if (have_cached_copy) {
            return Promise.resolve(cache[player_id]);
        }

        if (player_cache_debug_enabled) {
            console.error("Fetching ", player_id, " for fields ", missing_fields);
        }
    } else {
        if (player_cache_debug_enabled) {
            console.error("Fetching ", player_id, " because no user information was in our cache");
        }
    }

    if (player_id in active_fetches) {
        return active_fetches[player_id];
    }

    return active_fetches[player_id] = new Promise((resolve, reject) => {
        get(`/termination-api/player/${player_id}`)
        .then((player) => {
            if ('icon-url' in player) {
                player.icon = player['icon-url']; /* handle stupid inconsistency in API */
            }
            delete active_fetches[player_id];
            update(player);
            if (required_fields) {
                for (let field of required_fields) {
                    if (!(field in cache[player.id])) {
                        console.warn("Required field ", field, " was not resolved by fetch");
                        cache[player.id][field] = "[ERROR]";
                    }
                }
            }
            resolve(cache[player.id]);
        })
        .catch((err) => {
            delete active_fetches[player_id];
            console.error(err);
            reject(err);
        });
    });
}

