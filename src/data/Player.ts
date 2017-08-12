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
import {Ranking, kyu} from "data/Ranking";


// Basic player type. If a player isn't registered then they have minimal
// access rights as a guest. Note that it is insufficient to use === to
// compare Players for equality; you must compare the unique id numbers.
export type Player = GuestPlayer | RegisteredPlayer;

// A player that has no OGS credentials, and limited access.
// Guests cannot play games (but can watch) and cannot participate
// in OGS's social life.
export class GuestPlayer {
    readonly username: string;      // The player's username: Guest
    readonly icon: string;          // The URL of the player's icon
    readonly country: string;       // The player's country of origin: anywhere.
    readonly is: Readonly<Attributes>;  // A guest player can have no attributes.

    constructor(public readonly id: number) {
        if (!(isFinite(id) && id < 0)) {
            throw `We require GuestPlayer.id < 0 but it was ${id}.`;
        }
    }
}

// A player that has registered with OGS with a username and password.
// This interface contains the player details that are used pervasively
// throughout the site. The player's rating and rank are calculated according
// to the Glicko2 system.
export class RegisteredPlayer {
    readonly id: number;            // The player's unique id.
    username: string;               // The player's chosen username.
    icon: string;                   // The URL of the player's chosen icon.
    country: string;                // The player's country of origin.
    ranking: Ranking;               // The player's overall ranking.
    ratings: Rating;                // The player's overall rating.
    is: Attributes;                 // The player's attributes.

    constructor(id: number, ...based_on: Array<Partial<RegisteredPlayer> | void>) {
        if (!(isFinite(id) && id >= 0)) {
            throw `We require RegisteredPlayer.id >= 0 but it was ${id}.`;
        }

        // Note that we can't say constructor(readonly public id: number).
        // This is because the id would then be set at the beginning of
        // the constructor, and might get overwritten.
        Object.assign(this, ...based_on);
        this.id = id;
        this.is = Object.assign({}, ...based_on.map(base => base && base.is));
    }
}

// A player's attributes.
interface Attributes {
    online?: boolean;               // Is the player currently logged into OGS?
    admin?: boolean;                // Can the player alter everything in the system?
    moderator?: boolean;            // Can the player enforce discipline?
    tournament_moderator?: boolean; // Can the player organise tournaments?
    validated?: boolean;            // Has the player validated their e-mail address?
    professional?: boolean;         // Does the player have a professional diploma?
    supporter?: boolean;            // Does the player support OGS financially?
    provisional?: boolean;          // Has the player only recently joined OGS?
    timeout?: boolean;              // Has the player recently timed out of a game?
    bot?: boolean;                  // Is the player an artificial intelligence?
}

// A player's rating according to the Glicko2 system.
// See http://www.glicko.net/glicko.html for details.
// TODO: Move this to somewhere more appropriate.
export interface Rating {
    readonly overall: {
        readonly rating: number;
        readonly deviation: number;
        readonly volatility: number;
        readonly games_played: number;
    };
}



// Default values for any properties that are left unspecified when the Player
// is created. Note that we can't define these on the class itself as that would
// cause the constructor to assign the values to the object being created.
// Instead, we want to use the prototype to assign default values. This is so
// that the player cache can detect that the value is inherited from the prototype
// chain so that it can fill in the blanks if necessary.
Object.assign(GuestPlayer.prototype, {
    id: -1,
    username: _("Guest"),
    icon: "https://b0c2ddc39d13e1c0ddad-93a52a5bc9e7cc06050c1a999beb3694.ssl.cf1.rackcdn.com/" +
          "cd7218bace4ccdafba9ebf381cd98fe5-128.png",
    country: "un",
    is: {},
});

Object.assign(RegisteredPlayer.prototype, {
    id: 0,
    username: "...",
    icon: "https://b0c2ddc39d13e1c0ddad-93a52a5bc9e7cc06050c1a999beb3694.ssl.cf1.rackcdn.com/" +
          "0229bfd574b2d85a95ce119c8550c6f5-128.png",
    country: "un",
    rank: kyu(12),
    ratings: {overall: {rating: 1500, deviation: 350, volatility: 0.06, games_played: 0}},
    is: {},
});



// Run-time type checks for players. Although Players are defined
// as classes and we could use isinstance, sometimes it is
// convenient to use these as functions.
export function is_player(player: any): player is Player {
    return player instanceof GuestPlayer || player instanceof RegisteredPlayer;
}

export function is_guest(player: any): player is GuestPlayer {
    return player instanceof GuestPlayer;
}

export function is_registered(player: any): player is RegisteredPlayer {
    return player instanceof RegisteredPlayer;
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
    // Sort players by overall ranking. If they are of equal ranking, then
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
        cmp = cmp || a.ranking - b.ranking;
        cmp = cmp || a.username.localeCompare(b.username);
        cmp = cmp || a.id - b.id;
        return cmp;
    }
}

export function by_country(a: Player, b: Player): number {
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



// What are the player's attributes?
export function player_attributes(player: Player): Array<string> {
    let attributes: Array<string> = [];
    for (let attribute in player.is) {
        if (player.is[attribute]) {
            attributes.push(attribute);
        }
    }
    return attributes;
}
