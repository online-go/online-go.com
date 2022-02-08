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

import { get } from "requests";
import { Batcher } from "batcher";
import { Publisher, Subscriber as RealSubscriber } from "pubsub";

import Debug from "debug";
const debug = new Debug("player_cache");

// The player cache's Subscriber is just like a vanilla Subscriber, but can
// subscribe to and unsubscribe from numerical ids or whole Players. The
// function to query which players we are watching is called "players", not
// "channels".
const publisher = new Publisher<{ [id: string]: PlayerCacheEntry }>();
export class Subscriber {
    private subscriber: RealSubscriber<{ [id: string]: PlayerCacheEntry }, string>;

    constructor(callback: (player: PlayerCacheEntry) => void) {
        this.subscriber = new publisher.Subscriber((id, player) => callback(player));
    }

    on(players: number | PlayerCacheEntry | Array<number | PlayerCacheEntry>): this {
        this.subscriber.on(this.to_strings(players));
        return this;
    }

    off(players: number | PlayerCacheEntry | Array<number | PlayerCacheEntry>): this {
        this.subscriber.off(this.to_strings(players));
        return this;
    }

    players(): Array<number> {
        return this.subscriber.channels().map((id) => parseInt(id));
    }

    private to_strings(
        players: number | PlayerCacheEntry | Array<number | PlayerCacheEntry>,
    ): Array<string> {
        const result: Array<string> = [];
        if (!(players instanceof Array)) {
            players = [players];
        }
        for (const player of players) {
            if (typeof player === "number") {
                result.push(player.toString());
            } else {
                result.push(player.id.toString());
            }
        }
        return result;
    }
}

export interface PlayerCacheEntry {
    id: number;
    country?: string;
    icon?: string;
    pro?: boolean;
    ranking?: number;
    rating?: number;
    ratings?: {
        overall: {
            rating: number;
            deviation: number;
            volatility: number;
            games_played?: number;
        };
    };
    ui_class?: string;
    username?: string;
}

interface FetchEntry {
    player_id: number;
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
    required_fields: Array<string>;
}

const cache: { [id: number]: PlayerCacheEntry } = {};
const cache_by_username: { [username: string]: PlayerCacheEntry } = {};
const active_fetches: { [id: number]: Promise<PlayerCacheEntry> } = {};
export const nicknames: Array<string> = [];

export function update(player: any, dont_overwrite?: boolean): PlayerCacheEntry {
    if (Array.isArray(player)) {
        for (const p of player) {
            update(p, dont_overwrite);
        }
        return;
    }

    const id = "user_id" in player ? player.user_id : player.id;
    if (!id) {
        if (player && player.anonymous) {
            return;
        }
        console.error("Invalid player object", player);
        return;
    }

    if (!(id in cache)) {
        cache[id] = { id: id };
    }
    for (const k in player) {
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
    if ("professional" in player) {
        cache[id]["pro"] = !!player.professional;
    }
    if ("pro" in player) {
        cache[id]["professional"] = !!player.pro;
    }

    publisher.publish(id.toString(), cache[id]);
    return cache[id];
}

/** Returns the PlayerCacheEntry if we have it loaded already, else null. Does
 *  not perform a fetch or anything heavy. */
export function lookup(player_id: number): PlayerCacheEntry | null {
    if (player_id in cache) {
        return cache[player_id];
    }

    return null;
}

/** Returns the PlayerCacheEntry if we have it loaded already, else null. Does
 *  not perform a fetch or anything heavy. */
export function lookup_by_username(username: string): PlayerCacheEntry | null {
    if (username in cache_by_username) {
        return cache_by_username[username];
    }

    return null;
}

export function fetch_by_username(
    username: string,
    required_fields?: Array<string>,
): Promise<PlayerCacheEntry> {
    const user = lookup_by_username(username);
    if (user) {
        return fetch(user.id, required_fields);
    } else {
        const res = get("players", { username: username }).then((res) => {
            if (res.results.length) {
                return fetch(res.results[0].id, required_fields);
            } else {
                console.error("Attempted to fetch invalid player name: ", username);
                cache_by_username[username] = {
                    id: null,
                    username: username,
                    ui_class: "provisional",
                    pro: false,
                };
                return Promise.reject("invalid player name");
            }
        });
        return res;
    }
}

export function fetch(
    player_id: number,
    required_fields?: Array<string>,
): Promise<PlayerCacheEntry> {
    if (!player_id) {
        console.error("Attempted to fetch invalid player id: ", player_id);
        return Promise.reject("invalid player id");
    }

    const missing_fields = [];

    if (player_id in cache) {
        let have_cached_copy = true;

        if (required_fields) {
            for (const f of required_fields) {
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

        debug.log(
            `Fetching ${player_id} for fields ${missing_fields.join(", ")}.`,
            cache[player_id],
        );
    } else {
        debug.log(`Fetching ${player_id} because no user information was in our cache.`);
    }

    if (player_id in active_fetches) {
        return active_fetches[player_id];
    }

    return (active_fetches[player_id] = new Promise((resolve, reject) => {
        fetch_player.soon({
            player_id: player_id,
            resolve: resolve,
            reject: reject,
            required_fields: required_fields,
        });
    }));
}

const fetch_player = new Batcher<FetchEntry>((fetch_queue) => {
    while (fetch_queue.length > 0) {
        const queue = fetch_queue.slice(0, 100);
        fetch_queue = fetch_queue.slice(100);

        debug.log(`Batch requesting player info for id ${queue.map((e) => e.player_id).join(",")}`);

        get("/termination-api/players", { ids: queue.map((e) => e.player_id).join(".") })
            .then((players) => {
                for (let idx = 0; idx < queue.length; ++idx) {
                    const player = players[idx];
                    const resolve = queue[idx].resolve;
                    const required_fields = queue[idx].required_fields;

                    if ("icon-url" in player) {
                        player.icon = player["icon-url"]; /* handle stupid inconsistency in API */
                    }

                    delete active_fetches[player.id];
                    update(player);
                    if (required_fields) {
                        for (const field of required_fields) {
                            if (!(field in cache[player.id])) {
                                debug.warn("Required field ", field, " was not resolved by fetch");
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
                if ("error" in err.responseJSON) {
                    if (/Player ([0-9]+) not found in cassandra/gi.test(err.responseJSON.error)) {
                        const err_player_id = Number(
                            /Player ([0-9]+) not found in cassandra/gi.exec(
                                err.responseJSON.error,
                            )[1],
                        );
                        // create a dummy entry for missing player
                        let idx = 0;
                        for (; idx < 100; idx++) {
                            if (queue[idx].player_id === err_player_id) {
                                break;
                            }
                        }
                        const reject = queue[idx].reject;
                        const player = {
                            id: err_player_id,
                            username: "?player" + err_player_id + "?",
                            ui_class: "provisional",
                            pro: false,
                        };
                        update(player);
                        debug.error(err);
                        reject(err);
                        return;
                    }
                }
                debug.error(err);
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
});
