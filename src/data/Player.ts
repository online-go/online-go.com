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

import {_} from "translate";
import {Rank, subtract_rank} from "Rank";

// Basic player type. All players have a unique id number.
export type Player = GuestPlayer | RegisteredPlayer;

// A player that has no OGS credentials, and limited access.
// Guests cannot play games (but can watch) and cannot participate
// in OGS's social life.
export interface GuestPlayer {
    type: "Guest";
    id: number;             // A unique number identifying each individual player.
    is: Attributes<never>;  // A guest player can have no attributes.
}

// A player that has registered with OGS with a username and password.
// This interface contains the player details that are used pervasively
// throughout the site. The player's rating and rank are calculated according
// to the European Go Federation's system.
export interface RegisteredPlayer {
    type: "Registered";
    id: number;             // A unique number identifying each individual player.
    username: string;       // The player's chosen username.
    icon: string;           // The URL of the player's chosen icon.
    country: string;        // The player's country of origin.
    rank: Rank;             // The player's overall rank.
    rating: number;         // The player's overall rating.
    is: Attributes<boolean>; // The player's attributes.
}

interface Attributes<T> {
    online?: T;             // Is the player currently logged into OGS?
    admin?: T;              // Can the player alter everything in the system?
    moderator?: T;          // Can the player enforce discipline?
    tournament_moderator?: T; // Can the player organise tournaments?
    validated?: T;          // Has the player validated their e-mail address?
    professional?: T;       // Does the player have a professional diploma?
    supporter?: T;          // Does the player support OGS financially?
    provisional?: T;        // Has the player only recently joined OGS?
    timeout?: T;            // Has the player recently timed out of a game?
    bot?: T;                // Is the player an artificial intelligence?
}



// Run-time type checks for players.
export function is_guest(player: Player): player is GuestPlayer {
    return player.type === "Guest";
}

export function is_registered(player: Player): player is RegisteredPlayer {
    return player.type === "Registered";
}



// Compare players so that they sort into order. Guests sort last. In
// the event that two players sort equal, we then sort by id. This
// ensures that we get a consistent sort order in all cases.
//
// Typical usage:
//     players.sort(by_name);
//     etc...
//
// Although slightly less efficient, we carry out all four type checks.
// This is because it makes the code more obviously correct, and
// correctness is more valuable than raw speed. The final pair of
// type checks (to ensure a and b are both registered players) is
// absolutely essential to reassure the type-checker that we know what
// we're doing in the body of the if-statement. Finally, if we do pass
// junk into the function (which the typechecker can't always prevent),
// we'll definitely get an exception or an undefined return value,
// rather than a silent bug.
//
// My style (setting cmp to 0 and then ||-ing the first condition) might
// seem a little odd to some. In my experience, it's extremely easy
// to rearrange the conditions and forget that the first one is written
// differently. It saves developer time in the long run to do it this way.
export function by_name(a: Player, b: Player): number {
    // Sort players alphabetically by username, respecting the current
    // locale setting. If they sort equal, then compare by id.
    if (is_guest(a) && is_registered(b)) {
        return 1;
    }
    if (is_registered(a) && is_guest(b)) {
        return -1;
    }
    if (is_guest(a) && is_guest(b)) {
        return a.id - b.id;
    }
    if (is_registered(a) && is_registered(b)) {
        let cmp = 0;
        cmp = cmp || a.username.localeCompare(b.username);
        cmp = cmp || a.id - b.id;
        return cmp;
    }
}

export function by_rank(a: Player, b: Player): number {
    // Sort players by overall rating. If they are of equal rating, then
    // sort alphabetically by username. If they still compare equal then
    // sort by id.
    if (is_guest(a) && is_registered(b)) {
        return 1;
    }
    if (is_registered(a) && is_guest(b)) {
        return -1;
    }
    if (is_guest(a) && is_guest(b)) {
        return a.id - b.id;
    }
    if (is_registered(a) && is_registered(b)) {
        let cmp = 0;
        cmp = cmp || subtract_rank(a.rank, b.rank);
        cmp = cmp || a.username.localeCompare(b.username);
        cmp = cmp || a.id - b.id;
        return cmp;
    }
}

export function by_nationality(a: Player, b: Player): number {
    // Sort players by nationality so that players of the same nationality
    // are grouped together. If they have the same nationality then sort by
    // username. If they still compare equal then sort by id.
    if (is_guest(a) && is_registered(b)) {
        return 1;
    }
    if (is_registered(a) && is_guest(b)) {
        return -1;
    }
    if (is_guest(a) && is_guest(b)) {
        return a.id - b.id;
    }
    if (is_registered(a) && is_registered(b)) {
        let cmp = 0;
        cmp = cmp || a.country.localeCompare(b.country);
        cmp = cmp || a.username.localeCompare(b.username);
        cmp = cmp || a.id - b.id;
        return cmp;
    }
}



// What is the player's name? What are the player's attributes?
export function player_name(player: Player): string {
    if (is_guest(player)) {
        return _("Guest");
    }
    if (is_registered(player)) {
        return player.username;
    }
}

export function player_attributes(player: Player): Array<string> {
    let attributes: Array<string> = [];
    if (is_registered(player)) {
        for (let attribute in player.is) {
            if (player.is[attribute]) {
                attributes.push(attribute);
            }
        }
    }
    return attributes;
}
