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
import {Player, RegisteredPlayer, player_attributes} from "data/Player";
import {Rank} from "data/Rank";

const player_cache_debug_enabled = true;
let cache_by_id: {[id: number]: RegisteredPlayer} = {};
let cache_by_username: {[username: string]: RegisteredPlayer} = {};
let active_fetches: {[id: number]: Promise<any>} = {};
let incomplete_entries: {[id: number]: boolean} = {};
let nicknames: Array<string> = [];



// Look up functions in the player cache. If the user id is for a guest player,
// then simply create the guest player on the fly. Registered players only are
// stored in the cache.
function lookup(player_id: number): any {
    return lookup_by_id(player_id);
}

function lookup_by_id(player_id: number): Player | undefined {
    if (player_id <= 0) {
        return {type: "Guest", id: player_id};
    }
    else {
        return cache_by_id[player_id];
    }
}

function lookup_by_username(username: string): Player | undefined {
    let player: RegisteredPlayer = cache_by_username[username];
    if (player && player.username === username) {
        return player;
    }
}



// Fetch a player's details from the server.
function fetch(player_id: number, required_fields?: Array<string>): Promise<Player> {
    // If the player is a guest, then simply create the player on the fly and return
    // it. If the player is registered and in the cache, then return the cached copy.
    // If the player has a fetch pending, then return the pending fetch.
    if (player_id <= 0) {
        return Promise.resolve({type: "Guest", id: player_id});
    }
    if (player_id in cache_by_id && !incomplete_entries[player_id]) {
        return Promise.resolve(cache_by_id[player_id]);
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
function update(player: any, dont_overwrite?: boolean): Player {
    if (player.id <= 0) {
        return {type: "Guest", id: player.id};
    }
    else {
        // Translate the player's rank to the new system.
        let rank: Rank;
        if (player.ranking > 36 && (player.pro || player.professional)) {
            rank = {level: player.ranking - 36, type: "Pro"};
        }
        else if (player.ranking > 29) {
            rank = {level: player.ranking - 29, type: "Dan"};
        }
        else {
            rank = {level: 30 - player.ranking, type: "Kyu"};
        }
        if (isNaN(rank.level)) {
            rank = undefined;
        }

        // Translate the data to the Player type.
        let new_style_player: RegisteredPlayer = {
            type: "Registered",
            id: player.id || player.player_Id || player.playerId,
            username: player.username,
            icon: player['icon-url'] || player.icon,
            country: player.country,
            rank: rank,
            rating: player.rating,
            is: typeof player.ui_class !== "string" ? undefined : {
                admin: player.is_superuser || player.ui_class.indexOf("admin") !== -1,
                moderator: player.is_moderator || player.ui_class.indexOf("moderator") !== -1,
                professional: player.pro || player.professional || false,
                supporter: player.ui_class.indexOf("supporter") !== -1,
                provisional: player.ui_class.indexOf("provisional") !== -1,
                timeout: player.ui_class.indexOf("timeout") !== -1,
                bot: player.ui_class.indexOf("bot") !== -1
            }
        };
        if (new_style_player.is) {
            for (let attribute in new_style_player.is) {
                if (!new_style_player.is[attribute]) {
                    delete new_style_player.is[attribute];
                }
            }
        }

        // Add compatibility fields to the Player object.
        let compatibility: any = new_style_player;
        compatibility.ui_class = player_attributes(new_style_player).join(" ");
        compatibility.ranking = player.ranking;

        // Copy any new or changed information to the cache. Note that this will
        // update everybody's copy of the cached data. Note also that under some
        // circumstances, the server will send us incomplete data. If this has
        // happened, then we run with what we've got and immediately put in a
        // request for the rest of it. This is to ensure that the Player type is
        // (almost) always fully-populated and so usable wherever it is needed.
        let cached = cache_by_id[new_style_player.id] || {} as RegisteredPlayer;
        let incomplete = false;
        for (let name in new_style_player) {
            if (new_style_player[name] !== undefined) {
                cached[name] = new_style_player[name];
            }
            if (!(name in cached)) {
                incomplete = true;
            }
        }
        cache_by_id[new_style_player.id] = cached;

        if (cached.username) {
            if (!(cached.username in cache_by_username)) {
                nicknames.push(cached.username);
            }
            cache_by_username[cached.username] = cached;
        }

        if (incomplete) {
            incomplete_entries[new_style_player.id] = true;
            fetch(new_style_player.id);
        }
        else {
            delete incomplete_entries[new_style_player.id];
        }

        // If we've requested player cache debugging, then log the transaction to
        // the console.
        if (player_cache_debug_enabled) {
            let message = "Converted " + (incomplete ? "incomplete " : "") + "old-style player";
            console.log(message, player, incomplete ? new_style_player : cached);
        }

        return cached;
    }
}



export const player_cache = {
    lookup: lookup,
    lookup_by_id: lookup_by_id,
    lookup_by_username: lookup_by_username,
    fetch: fetch,
    update: update,
    nicknames: nicknames
};

export default player_cache;

if (player_cache_debug_enabled) {
    window['player_cache'] = Object.assign({}, player_cache, {
        cache_by_id: cache_by_id,
        cache_by_username: cache_by_username,
        active_fetches: active_fetches,
        incomplete_entries: incomplete_entries
    });

}
