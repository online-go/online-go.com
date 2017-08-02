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

export interface PlayerCacheEntry {
    id      : number;
    country?: string;
    icon?   : string;
    pro?    : boolean;
    ranking?: number;
    rating? : number;
    ratings?: {
                'overall': {
                    rating: number;
                    deviation: number;
                    volatility: number;
                    games_played: number;
                }
              };
    ui_class?: string;
    username?: string;
}

interface FetchEntry {
    player_id: number;
    resolve: (value?:any) => void;
    reject: (reason?:any) => void;
    required_fields: Array<string>;
}

const player_cache_debug_enabled = false;
let cache: {[id: number]: PlayerCacheEntry} = {};
let cache_by_username: {[username: string]: PlayerCacheEntry} = {};
let active_fetches: {[id: number]: Promise<PlayerCacheEntry>} = {};
let nicknames: Array<string> = [];
let fetcher = null;
let fetch_queue: Array<FetchEntry> = [];

let listeners = {};
let last_id = 0;

class Listener {
    player_id: number;
    id: number;
    cb: (player: any, player_id?: number) => void;
    remove_callbacks: Array<() => void>;

    constructor(player_id: number, cb: (user: any, player_id?: number) => void) {
        this.player_id = player_id;
        this.cb = cb;
        this.id = ++last_id;
        this.remove_callbacks = [];
    }

    onRemove(fn: () => void): void {
        this.remove_callbacks.push(fn);
    }

    remove() {
        delete listeners[this.player_id][this.id];
        for (let cb of this.remove_callbacks) {
            try {
                cb();
            } catch (e) {
                console.error(e);
            }
        }
    }
}

function update(player: any, dont_overwrite?: boolean): PlayerCacheEntry {
    if (Array.isArray(player)) {
        for (let p of player) {
            update(p, dont_overwrite);
        }
        return;
    }

    let id = "user_id" in player ? player.user_id : player.id;
    if (!(id in cache)) {
        cache[id] = {id:id};
    }
    for (let k in player) {
        if (dont_overwrite && k in cache[id]) {
            continue;
        }
        cache[id][k] = player[k];
    }
    if (cache[id].username && !(cache[id].username in cache_by_username)) {
        nicknames.push(cache[id]["username"]);
    }
    if (cache[id].username) {
        cache_by_username[cache[id].username] = cache[id];
    }

    /* these are synonymous but called different things throughout the back end, I am truly sorry. */
    if ('professional' in player) {
        cache[id]['pro'] = !!player.professional;
    }
    if ('pro' in player) {
        cache[id]['professional'] = !!player.pro;
    }

    if (id in listeners) {
        for (let l in listeners[id]) {
            listeners[id][l].cb(cache[id], id);
        }
    }

    return cache[id];
}

function lookup(player_id: number): PlayerCacheEntry {
    if (player_id in cache) {
        return cache[player_id];
    }

    return null;
}

function lookup_by_username(username: string): PlayerCacheEntry {
    if (username in cache_by_username) {
        return cache_by_username[username];
    }

    return null;
}

function watch(player_id: number, cb: (player: any, player_id?: number) => void): Listener {
    let listener = new Listener(player_id, cb);
    if (!(player_id in listeners)) {
        listeners[player_id] = {};
    }
    listeners[player_id][listener.id] = listener;

    let val = lookup(player_id);
    if (val) {
        cb(val, player_id);
    }

    return listener;
}

function fetch(player_id: number, required_fields?: Array<string>): Promise<PlayerCacheEntry> {
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
            console.error("Fetching ", player_id, " for fields ", missing_fields, " cached player data was ", JSON.parse(JSON.stringify(cache[player_id])));
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
        fetch_queue.push({
            player_id: player_id,
            resolve: resolve,
            reject: reject,
            required_fields: required_fields,
        });

        if (fetcher === null) {
            fetcher = setTimeout(() => {
                fetcher = null;
                while (fetch_queue.length > 0) {
                    let queue = fetch_queue.slice(0, 100);
                    fetch_queue = fetch_queue.slice(100);

                    if (player_cache_debug_enabled) {
                        console.log("Batch requesting player info for", queue.map(e => e.player_id).join(','));
                    }

                    get("/termination-api/players/%%", queue.map(e => e.player_id).join(','))
                    .then((players) => {
                        for (let idx = 0; idx < queue.length; ++idx) {
                            let player = players[idx];
                            let resolve = queue[idx].resolve;
                            let reject = queue[idx].reject;
                            let required_fields  = queue[idx].required_fields;

                            if ('icon-url' in player) {
                                player.icon = player['icon-url']; /* handle stupid inconsistency in API */
                            }

                            delete active_fetches[player.id];
                            update(player);
                            if (required_fields) {
                                for (let field of required_fields) {
                                    if (!(field in cache[player.id])) {
                                        console.warn("Required field ", field, " was not resolved by fetch");
                                        cache[player.id][field] = "[ERROR]";
                                    }
                                }
                            }
                            try {
                                resolve(cache[player.id]);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    })
                    .catch((err) => {
                        console.error(err);
                        for (let idx = 0; idx < queue.length; ++idx) {
                            delete active_fetches[queue[idx].player_id];
                            try {
                                queue[idx].reject(err);
                            } catch (e) {
                                console.error(e);
                            }
                        }
                    });
                }
            }, 1);
        }
    });
}


export const player_cache = {
    update: update,
    lookup: lookup,
    lookup_by_username: lookup_by_username,
    nicknames: nicknames,
    fetch: fetch,
    watch: watch,
    Listener: Listener,
};

export default player_cache;

window['player_cache'] = player_cache;
