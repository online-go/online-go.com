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
import {Batcher} from "batcher";
import {Publisher, Subscriber as RealSubscriber} from "pubsub";
import {Player, GuestPlayer, RegisteredPlayer, is_player} from "data/Player";
import {from_server_player} from "compatibility/Player";



const player_cache_debug_enabled = false;
let cache_by_id: {[id: number]: RegisteredPlayer} = {};
let cache_by_username: {[username: string]: RegisteredPlayer} = {};
let active_fetches: {[id: number]: Promise<RegisteredPlayer>} = {};
export let nicknames: Array<string> = [];

// List all the keys of a RegisteredPlayer and all the attributes of RegisteredPlayer["is"]
const keys: Array<keyof RegisteredPlayer> = ["username", "icon", "country", "ranking", "ratings"];
const attributes: Array<keyof RegisteredPlayer["is"]> = ["admin", "moderator", "tournament_moderator", "validated", "professional", "supporter", "provisional", "timeout", "bot"];



// The player cache's Subscriber is just like a vanilla Subscriber, but can
// subscribe to and unsubscribe from numerical ids or whole Players. The
// function to query which players we are watching is called "players", not
// "channels".
let publisher = new Publisher<{[id: string]: RegisteredPlayer}>();

let publish = new Batcher<number>(ids => {
    let last_id: number | undefined;
    for (let id of ids.sort()) {
        if (id !== last_id) {
            last_id = id;
            publisher.publish(id.toString(), cache_by_id[id]);
        }
    }
});

export class Subscriber {
    private subscriber: RealSubscriber<{[id: string]: RegisteredPlayer}, string>;

    constructor(callback: (player: RegisteredPlayer) => void) {
        this.subscriber = new publisher.Subscriber((id, player) => callback(new RegisteredPlayer(player.id, player)));
    }

    on(players: number | Player | Array<number | Player>): this {
        this.subscriber.on(to_strings(players));
        return this;
    }

    off(players: number | Player | Array<number | Player>): this {
        this.subscriber.off(to_strings(players));
        return this;
    }

    to(players: Array<number | Player>): this {
        this.subscriber.off(this.subscriber.channels()).on(to_strings(players));
        return this;
    }

    players(): Array<number> {
        return this.subscriber.channels().map(id => parseInt(id));
    }
}

function to_strings(players: number | Player | Array<number | Player>): Array<string> {
    let result: Array<string> = [];
    if (!(players instanceof Array)) {
        players = [players];
    }
    for (let player of players) {
        player = typeof player === "number" ? player : player.id;
        result.push(player.toString());
        if (!(player in cache_by_id)) {
            fetch(player);
        }
    }
    return result;
}



// Look up a player in the cache by id. Any unknown parameters will have
// their default values substituted. If the player is not in the cache,
// then all of its parameters are unknown, and so all of them will have
// default values.
export function lookup(id: number): Player {
    if (isFinite(id) && id < 0) {
        return new GuestPlayer(id);
    }
    if (isFinite(id) && id >= 0) {
        return new RegisteredPlayer(id, cache_by_id[id]);
    }

    // The id is NaN or infinite.
    throw `player_cache.lookup: Player id is ${id}.`;
}

// Look up a player in the cache by username. We have to check that the
// username of the player we're returning really matches the username requested.
// This is because players can change their username at will. If there is no
// matching username in the cache, the we return undefined.
export function lookup_by_username(username: string): RegisteredPlayer | void {
    let player = cache_by_username[username];
    if (player.username === username) {
        return new RegisteredPlayer(player.id, player);
    }
}



// Update the entry in the player cache with some new information. For
// compatibility with untyped code, we don't assume that the player is in
// fact a RegisteredPlayer. If it isn't then it's a player from the server
// that needs converting.
export function update(player: Player): void {
    // Compatibility with untyped code.
    if (!is_player(player)) {
        player = from_server_player(player);
    }
    // End compatibility section.

    // Guest players aren't stored in the cache as they never change.
    if (!(player instanceof RegisteredPlayer)) {
        return;
    }

    // What is the currently cached player, and what is the updated player?
    let previous = new RegisteredPlayer(player.id, cache_by_id[player.id]);
    let next = new RegisteredPlayer(player.id, cache_by_id[player.id], player);

    // Has the cached player changed?
    if (!keys.some(key => previous[key] !== next[key]) && !attributes.some(attr => !previous.is[attr] !== !next.is[attr])) {
        return;
    }

    // Log the change and who to blame if it's wrong.
    if (player_cache_debug_enabled) {
        console.trace("Player cache updated", next);
    }

    // Update the cache and publish the new details.
    if (!(next.username in cache_by_username)) {
        nicknames.push(next.username);
    }
    cache_by_username[next.username] = next;
    cache_by_id[player.id] = next;
    publish.soon(player.id);
}



// Fetch a player's info from the termination server.
interface FetchEntry {
    player_id: number;
    resolve: (value: RegisteredPlayer) => void;
    reject: (reason?: any) => void;
}

export function fetch(player_id: number): Promise<Player> {
    // Note that Object.assign does not copy from an object's prototype,
    // nor does it baulk at undefined values if the player is not in the
    // cache at all.
    let cached: Partial<RegisteredPlayer> = Object.assign({}, cache_by_id[player_id]);

    // Satisfy the easy cases first: a guest player and a complete
    // cached RegisteredPlayer.
    if (player_id < 0) {
        return Promise.resolve(new GuestPlayer(player_id));
    }
    if (keys.every(key => key in cached) && attributes.every(attr => attr in cached.is)) {
        return Promise.resolve(new RegisteredPlayer(player_id, cache_by_id[player_id]));
    }

    // We can't satisfy the request from the cache. If there's a request in progress
    // then use it, otherwise we have to make a new request to the backend. Once the
    // player is retrieved from the backend, we pass a copy to the caller so they can
    // do whatever they like with it without messing up the cache.
    if (!(player_id in active_fetches)) {
        active_fetches[player_id] = new Promise((resolve, reject) => {
            fetch_player.soon({
                player_id: player_id,
                resolve: resolve,
                reject: reject,
            });
        });
    }
    return active_fetches[player_id].then(player => new RegisteredPlayer(player.id, player));
}

let fetch_player = new Batcher<FetchEntry>(fetch_queue => {
    while (fetch_queue.length > 0) {
        let queue = fetch_queue.slice(0, 100);
        fetch_queue = fetch_queue.slice(100);

        if (player_cache_debug_enabled) {
            console.log("Batch requesting player info for", queue.map(e => e.player_id).join(','));
        }

        get("/termination-api/players", queue.map(e => e.player_id))
        .then(players => {
            for (let player of players) {
                // If the fetch has missed out any properties of the player,
                // then treat it as though it had returned the default value.
                // Otherwise we could get an infinite sequence of fetches.
                for (let key of keys as Array<string>) {
                    player[key] = player[key]; // Maybe copy from the prototype.
                }
                for (let attr of attributes) {
                    player.is[attr] = !!player.is[attr]; // Might be undefined.
                }

                update(player);
                delete active_fetches[player.id];
            }
            for (let item of queue) {
                if (item.player_id in cache_by_id) {
                    item.resolve(cache_by_id[item.player_id]);
                }
                else {
                    item.reject(`Unable to load player ${item.player_id }.`);
                }
            }
        })
        .catch(err => {
            for (let item of queue) {
                delete active_fetches[item.player_id];
                item.reject(err);
            }
        });
    }
});
