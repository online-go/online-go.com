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
import {get} from "requests";
import {Publisher} from "pubsub";
import {Player, RegisteredPlayer, player_attributes} from "data/Player";
import {Rank, make_professional_rank, make_amateur_rank} from "data/Rank";



const player_cache_debug_enabled = false;

let cache_by_id: {[player_id: number]: RegisteredPlayer} = {};
let cache_by_username: {[player_username: string]: RegisteredPlayer} = {};
export let nicknames: Array<string> = [];

let active_fetches: {[player_id: number]: Promise<Player>} = {};

let new_player_ids: Array<number> | void;
let players_online: {[player_id: number]: boolean} = {};


let publisher = new Publisher<number, Player>((player) => {
    return typeof player === "number" ? player.toString() : player.id.toString();
});
export class Subscription extends publisher.Subscription { }


// Perform updates of the player.is.online attribute as instructed by
// the comm socket. When we initially connect, we need to tell the server
// which players we're interested in. When we lose the connection, all
// players go offline. Otherwise, we update the players as required.
comm_socket.on("connect", () => {
    let players = [];
    for (let player_id in cache_by_id) {
        players.push(player_id);
    }
    if (players.length) {
        comm_socket.send("user/monitor", players);
    }
});
comm_socket.on("user/state", (states) => {
    for (let player_id in states) {
        let player = cache_by_id[player_id];
        if (player) {
            players_online[player_id] = !!states[player_id];
            if (!states[player_id] !== !player.is.online) {
                if (states[player_id]) {
                    player.is.online = true;
                }
                else {
                    delete player.is.online;
                }
                publisher.publish(cache_by_id[player_id]);
            }
        }
    }
});
comm_socket.on("disconnect", () => {
    players_online = {};
    for (let player_id in cache_by_id) {
        if (cache_by_id[player_id].is.online) {
            delete cache_by_id[player_id].is.online;
            publisher.publish(cache_by_id[player_id]);
        }
    }
});

// The first time a new player id is encountered, we make a note of it
// so we can batch up requests to be kept informed of the player's
// online status.
function connect_online(player_id: number) {
    if (!new_player_ids) {
        new_player_ids = [];
        setTimeout(() => {
            comm_socket.send("user/monitor", new_player_ids);
            new_player_ids = undefined;
        });
    }
    new_player_ids.push(player_id);
}



// Look up functions in the player cache. If the user id is for a guest player,
// then simply create the guest player on the fly. Registered players only are
// stored in the cache.
export function lookup(player_id: number): any {
    return lookup_by_id(player_id);
}

export function lookup_by_id(player_id: number): Player | void {
    if (player_id <= 0) {
        return {type: "Guest", id: player_id};
    }
    else {
        return cache_by_id[player_id];
    }
}

export function lookup_by_username(player_username: string): Player | void {
    let player: RegisteredPlayer = cache_by_username[player_username];
    if (player && player.username === player_username) {
        return player;
    }
}



// Fetch a player's details from the server.
export function fetch(player_id: number): Promise<Player> {
    // If the player is a guest, then simply create the player on the fly and return
    // it. If the player is registered and in the cache, then return the cached copy.
    // If the player has a fetch pending, then return the pending fetch.
    if (player_id <= 0) {
        return Promise.resolve<Player>({type: "Guest", id: player_id});
    }
    if (player_id in cache_by_id) {
        return Promise.resolve<Player>(cache_by_id[player_id]);
    }
    if (player_id in active_fetches) {
        return active_fetches[player_id];
    }

    // We can't return the player details stright away, so fetch them from the server.
    return active_fetches[player_id] = new Promise((resolve, reject) => {
        get(`/termination-api/player/${player_id}`)
        .then((player) => {
            delete active_fetches[player_id];
            resolve(update(player));
        })
        .catch((err) => {
            delete active_fetches[player_id];
            reject(err);
        });
    });
}

// By fair means or foul, we have obtained a player's details from the server. We now need
// to convert the player details to fit into a Player type, and cache the result. For
// compatibility, we add some extra fields that do not exist in the Player type. Untyped
// parts of the code can still use these, but you will get an error if you try to use them
// on type Player. This ensures that the Player type is used correctly in typed code.
//
// The cached value of player.is is replaced with a new object if and only if the contents
// of player.is has changed. Therefore, we can do a bulk comparison of player.is using
// the === operator. No need to loop over its contents to look for changes. Note that
// player1.is === player2.is is true if and only if player1 === player2.
export function update(player: any, dont_overwrite?: boolean): Player {
    // Work out which player we're referring to.
    let player_id = player.id || player.player_id || player.user_id || 0;

    if (player_id <= 0) {
        return {type: "Guest", id: player.id};
    }
    else {
        // Fetch the player from the cache.
        let cached = cache_by_id[player_id] || {is: {}} as RegisteredPlayer;

        // Ensure that the rating is in a suitable form for the new system.
        let rating: number;
        rating = +player.rating;
        if (isNaN(rating)) {
            rating = cached.rating;
        }

        // Translate the player's rank to the new system.
        let rank: Rank;
        if (player.rank) {
            rank = player.rank;
        }
        else if (player.ranking > 36 && (player.pro || player.professional)) {
            rank = make_professional_rank(player.ranking - 36);
        }
        else if (rating !== undefined) {
            rank = make_amateur_rank(rating);
        }
        else if (player.ranking !== undefined) {
            if (player.ranking > 29) {
                rank = {level: player.ranking - 29, type: "Dan"};
            }
            else {
                rank = {level: 30 - player.ranking, type: "Kyu"};
            }
        }
        else {
            rank = cached.rank;
        }
        if (rank && cached.rank && rank.level === cached.rank.level && rank.type === cached.rank.type) {
            rank = cached.rank;
        }

        // Prepare the player's attributes.
        let is: RegisteredPlayer["is"];
        if (player.is) {
            is = player.is;
        }
        else if (player.ui_class !== undefined) {
            // Prepare the attributes object.
            is = {
                online: players_online[player_id],
                admin: player.is_superuser || player.ui_class.indexOf("admin") !== -1,
                moderator: player.is_moderator || player.ui_class.indexOf("moderator") !== -1,
                professional: (player.pro || player.professional) && player.ranking > 36,
                supporter: player.ui_class.indexOf("supporter") !== -1,
                provisional: player.ui_class.indexOf("provisional") !== -1,
                timeout: player.ui_class.indexOf("timeout") !== -1,
                bot: player.ui_class.indexOf("bot") !== -1
            };

            // Only keep attributes that are applicable.
            for (let attribute in is) {
                if (is[attribute]) {
                    is[attribute] = true;
                }
                else {
                    delete is[attribute];
                }
            }

            // If the object is the same as the cached version, then replace it with
            // the cached version. This enables us to compare all of the attributes
            // at once using the === operator.
            let same = true;
            for (let attribute in is) {
                same = same && cached.is[attribute];
            }
            for (let attribute in cached.is) {
                same = same && is[attribute];
            }
            if (same) {
                is = cached.is;
            }
        }
        else {
            is = cached.is;
        }

        // Translate the data to the Player type.
        let new_style_player: RegisteredPlayer = {
            type: "Registered",
            id: player_id,
            username: player.username || cached.username,
            icon: player.icon || player['icon-url'] || cached.icon,
            country: player.country || cached.country,
            rank: rank,
            rating: rating,
            is: is
        };

        // Add compatibility fields to the Player object. These fields are
        // inaccessible when the object is accessed as an instance of Player,
        // but are accessible when it is accessed as an instance of any.
        let compatibility: any = new_style_player;
        compatibility.ui_class = player_attributes(new_style_player).join(" ");
        compatibility.player_id = compatibility.user_id = new_style_player.id;
        compatibility["icon-url"] = new_style_player.icon;
        compatibility.is_superuser = !!new_style_player.is.admin;
        compatibility.is_moderator = !!new_style_player.is.moderator;
        if (rank && rank.type === "Pro") {
            compatibility.ranking = rank.level + 36;
        }
        if (rank && rank.type === "Dan") {
            compatibility.ranking = rank.level + 29;
        }
        if (rank && rank.type === "Kyu") {
            compatibility.ranking = 30 - rank.level;
        }

        // If the data we're fed might be inconsistent with the current state
        // of the player in question, then the caller will set dont_overwrite
        // to be true. In this case, just return the new_style_player, as it
        // will contain all the information the caller needs.
        if (dont_overwrite) {
            if (player_cache_debug_enabled) {
                console.log("Converted old-style player without caching the result", player, new_style_player);
            }
            return new_style_player;
        }

        // Copy any new or changed information to the cache. Note that this will
        // update everybody's copy of the cached data. The data is cached both by
        // username and by id. Along the way, we take note of whether any
        // information is changed in the cache.
        let changed = false;
        for (let name in new_style_player) {
            if (cached[name] !== new_style_player[name]) {
                changed = true;
            }
            cached[name] = new_style_player[name];
        }

        let was_cached = new_style_player.id in cache_by_id;
        cache_by_id[new_style_player.id] = cached;

        if (cached.username) {
            if (!(cached.username in cache_by_username)) {
                nicknames.push(cached.username);
            }
            cache_by_username[cached.username] = cached;
        }

        // If the cached information has changed, then inform everyone who is
        // subscribed to the player.
        if (changed) {
            publisher.publish(cached);
        }

        // If the player is new to us, then request to be kept informed
        // of their online status.
        if (!was_cached) {
            connect_online(cached.id);
        }

        // If we've requested player cache debugging, then log the transaction to
        // the console.
        if (player_cache_debug_enabled) {
            let message: Array<string> = [];
            message.push("Converted");
            if (changed) {
                message.push("changed");
            }
            message.push("old-style player");
            console.log(message.join(" "), player, cached);
        }

        return cached;
    }
}

if (player_cache_debug_enabled) {
    window['player_cache'] = {
        cache_by_id: cache_by_id,
        cache_by_username: cache_by_username,
        nicknames: nicknames,

        active_fetches: active_fetches,

        lookup: lookup,
        lookup_by_id: lookup_by_id,
        lookup_by_username: lookup_by_username,

        fetch: fetch,
        update: update
    };
}
