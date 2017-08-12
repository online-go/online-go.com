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

import {Player, GuestPlayer, RegisteredPlayer, is_guest, is_registered, Rating, player_attributes} from "data/Player";
import {Ranking} from "data/Ranking";
import {getUserRating} from "rank_utils";


// Convert a Player from a string in the browser's localStorage.
export function deserialise_player(data: string): Player {
    let player = JSON.parse(data);
    if (!isFinite(player.id)) {
        throw "Couldn't deserialise a player.";
    }
    if (player.id < 0) {
        return new GuestPlayer(player.id);
    }
    if (player.id >= 0) {
        return new RegisteredPlayer(player.id, player_properties(player));
    }
}

export function deserialise_friends(data: string): Array<RegisteredPlayer> {
    let friends = JSON.parse(data);
    if (!Array.isArray(friends)) {
        throw "Couldn't deserialise friends list.";
    }
    return friends.map(friend => {
        if (typeof friend !== "object" || typeof friend.id !== "number") {
            throw "Couldn't deserialise friends list.";
        }
        return new RegisteredPlayer(friend.id, player_properties(friend));
    });
}

// Given an object, choose only the properties that occur in a RegisteredPlayer.
function player_properties(player: any): Partial<RegisteredPlayer> {
    const properties = ["username", "icon", "country", "ranking", "rating", "is"];
    let result: Partial<RegisteredPlayer> = {};
    for (let property of properties) {
        if (Object.hasOwnProperty.call(player, property)) {
            result[property] = player[property];
        }
    }
    return result;
}



// Convert Players to and from the format used by the backend.
export function to_server_player(player: RegisteredPlayer): any {
    let old_player: any = {};

    // NUIFE = Not used in front end.
    // Add a /* NUIFE */ comment to each attribute when its last
    // usage has been removed from the front end code.
    old_player.id = old_player.player_id = player.id;
    old_player.username = player.username;
    old_player.icon = old_player["icon-url"] /* NUIFE */ = player.icon;
    old_player.country = player.country;
    old_player.ui_class /* NUIFE */ = player_attributes(player).join(" ");
    old_player.is_superuser = player.is.admin;
    old_player.is_moderator = player.is.moderator;
    old_player.tournament_moderator = player.is.tournament_moderator;
    old_player.email_validated /* NUIFE */ = player.is.validated;
    old_player.is_bot = player.is.bot;
    old_player.anonymous /* NUIFE */ = false;
    old_player.supporter = player.is.supporter;
    old_player.ranking = old_player.rank = player.ranking;
    old_player.ratings = player.ratings;

    return old_player;
}

export function from_server_player(player: any): Player {
    // Calculate the player's id.
    let id: number = (player.id || player.player_id) - 0;
    if (!isFinite(id)) {
        throw "Couldn't translate server data to a player.";
    }

    // Transfer properties into the Player object. If any property is unavailable,
    // then we use the cached value.
    let result = player_cache.lookup(id);
    if (result instanceof RegisteredPlayer) {
        let username: string = player.username;
        if (typeof username === "string" && username !== "") {
            result.username = username;
        }

        let country: string = player.country;
        if (typeof country === "string" && country !== "") {
            result.country = country;
        }

        let icon: string = player.icon || player["icon-url"];
        if (typeof icon === "string" && icon !== "") {
            result.icon = icon;
        }

        let ranking: Ranking = (player.rank || player.ranking) - 0;
        if (isFinite(ranking)) {
            result.ranking = ranking;
        }

        if (typeof player.ratings === "object" && typeof player.ratings.overall === "object") {
            result.ratings = player.ratings;
            if (!player.pro && !player.professional) {
                result.ranking = getUserRating(player, 'overall', 0).partial_bounded_rank;
            }
        }

        // Calculate the attributes. Some of these are passed in attributes
        // of the player object, whereas others are passed in the ui_class
        // string.
        if ("is_superuser" in player) {
            result.is.admin = !!player.is_superuser;
        }
        if ("is_moderator" in player) {
            result.is.moderator = !!player.is_moderator;
        }
        if ("is_tournament_moderator" in player) {
            result.is.tournament_moderator = !!player.is_tournament_moderator;
        }
        if ("is_bot" in player) {
            result.is.bot = !!player.is_bot;
        }
        if ("email_validated" in player) {
            result.is.validated = !!player.email_validated;
        }
        if ("pro" in player || "professional" in player) {
            result.is.professional = !!(player.pro || player.professional);
        }
        if ("supporter" in player) {
            result.is.supporter = !!player.supporter;
        }
        if ("ui_class" in player) {
            let ui_class_names: Array<keyof RegisteredPlayer["is"]> = ["admin", "moderator", "supporter", "provisional", "timeout", "bot"];
            for (let ui_class_name of ui_class_names) {
                result.is[ui_class_name] = player.ui_class.indexOf(ui_class_name) !== -1;
            }
        }
    }

    return result;
}

export function to_server_player_ids(ids: Array<number>): string {
    return "ids=" + ids.map(id => id.toString()).join(".");
}

export function from_server_players(players: Array<any>): Array<RegisteredPlayer> {
    return players.map(from_server_player).filter(is_registered);
}

export function from_server_friends(result: {friends: Array<any>}): Array<RegisteredPlayer> {
    return result.friends.map(from_server_player).filter(is_registered);
}



// Warning: circular imports. player_cache <-> compatibility/Player
// The circular import will disappear once player_cache.update no
// longer needs to check for backwards compatibility with old-
// style Players.
import * as player_cache from "player_cache";
