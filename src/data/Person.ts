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
import {Ranking, compare_rankings} from "Ranking";

// Basic player types.
export type Player = GuestPlayer | RegisteredPlayer;
export type PlayerLookup = { [id: number]: Player; };

// A player that has no OGS credentials, and limited access.
// Guests cannot play games (but can watch) and cannot participate
// in OGS's social life.
export interface GuestPlayer {
    readonly type: "Guest";
    readonly id: number;    // The player's unique id number.
}

// A player that has registered with OGS with a unique username and password.
// This interface contains the player details that are used pervasively
// throughout the site. Further information can optionally be recorded in the
// player's profile.
export interface RegisteredPlayer {
    readonly type: "Registered";
    readonly id: number;    // The player's unique id number.
    username: string;       // The player's chosen username.
    icon: string;           // The URL of the player's chosen icon.
    country: string;        // The player's country of origin.
    ranking: Ranking;       // The player's overall ranking.
    is: {                   // The player's attributes
        superuser?: boolean;    // Can the player alter everything in the system?
        moderator?: boolean;    // Can the player enforce discipline?
        professional?: boolean; // Does the player have a professional diploma?
        supporter?: boolean;    // Does the player support OGS financially?
        provisional?: boolean;  // Has the player only recently joined OGS?
        timeout?: boolean;      // Has the player recently timed out of a game?
        online?: boolean;       // Is the player currently logged on to the site?
        robot?: boolean;        // Is the player an artificial intelligence?
        on_vacation?: boolean;  // Is the player pausing all his or her games?
    };
}



// Run-time type checks for players.
export function is_guest(player: Player): player is GuestPlayer {
    return player.type === "Guest";
}

export function is_registered(player: Player): player is RegisteredPlayer {
    return player.type === "Registered";
}



// What is the player's name?
export function player_name(player: Player): string {
    if (is_guest(player)) {
        return _("Guest");
    }
    if (is_registered(player)) {
        return player.username;
    }
}



// Compare players so that they sort into order. Guests sort last. In
// the event that two players sort equal, we then sort by id. This
// ensures that we get a consistent sort order in all cases.
//
// Typical usage:
//     players.sort(by_username);
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
export function by_username(a: Player, b: Player): number {
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

export function by_ranking(a: Player, b: Player): number {
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
        cmp = cmp || compare_rankings(a.ranking, b.ranking);
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
