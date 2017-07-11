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

import {Rank, kyu, dan, pro, is_amateur, is_professional, subtract_rank, rank_short_string, rank_long_string} from "data/Rank";



// Basic rank-conversion functions.
export function from_old_style_rank(ranking: number, professional?: boolean): Rank {
    if (professional) {
        return pro(ranking - 36);
    }
    else if (ranking > 29) {
        return dan(ranking - 29);
    }
    else {
        return kyu(30 - ranking);
    }
}

export function to_old_style_rank(rank: Rank): number {
    if (is_amateur(rank)) {
        return subtract_rank(rank, kyu(30));
    }
    if (is_professional(rank)) {
        return subtract_rank(rank, pro(1)) + 37;
    }
}



// Given a thing that might be a number, a new-style Rank, an object
// containing a new-style Rank or an object containing a number that
// represents a ranking, attempt to work out what the equivalent
// new-style Rank is.
export function find_rank(thing: any): Rank | void {
    const types = { "Kyu": true, "Dan": true, "Pro": true };
    let professional = false;
    if (typeof thing === "object") {
        if (typeof thing.rank === "object" && thing.rank.type in types && typeof thing.rank.level === "number") {
            return thing.rank;
        }
        else if (thing.type in types && typeof thing.level === "number") {
            return thing;
        }
        else if (!isNaN(+thing.ranking)) {
            professional = thing.pro || thing.professional;
            thing = thing.ranking;
        }
        else if (!isNaN(+thing.rank)) {
            professional = thing.pro || thing.professional;
            thing = thing.rank;
        }
    }
    thing = +thing;
    if (!isNaN(thing)) {
        return from_old_style_rank(thing, professional);
    }
}

export function find_rank_short_string(thing: any): string {
    let rank = find_rank(thing);
    return rank ? rank_short_string(rank) : "?";
}

export function find_rank_long_string(thing: any): string {
    let rank = find_rank(thing);
    return rank ? rank_long_string(rank) : "?";
}
