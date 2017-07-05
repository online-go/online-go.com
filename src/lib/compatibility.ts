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

import {Rank, kyu, dan, pro} from "data/Rank";

// Given a thing that might be a number, a new-style Rank, an object
// containing a new-style Rank or an object containing a number that
// represents a ranking, attempt to work out what the equivalent
// new-style Rank is.
export function find_rank(thing: any): Rank | void {
    const types = { "Kyu": true, "Dan": true, "Pro": true };
    if (typeof thing === "object") {
        if (typeof thing.rank === "object" && thing.rank.type in types && typeof thing.rank.level === "number") {
            return thing.rank;
        }
        else if (thing.type in types && typeof thing.level === "number") {
            return thing;
        }
        else if (!isNaN(+thing.ranking)) {
            thing = thing.ranking;
        }
        else if (!isNaN(+thing.rank)) {
            thing = thing.rank;
        }
    }
    thing = +thing;
    if (!isNaN(thing)) {
        if (thing > 1036) {
            return pro(thing - 1036);
        }
        else if (thing > 36) {
            return pro(thing - 36);
        }
        else if (thing > 29) {
            return dan(thing - 29);
        }
        else {
            return kyu(30 - thing);
        }
    }
}
