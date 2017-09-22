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

export type Ranking = number;

// Symbolically create ranks for players. Ranks are represented as a
// plain number, although the numbers map to kyu, dan and pro ranks.
export function kyu(level: number): Ranking {
    return 30 - Math.ceil(level);
}

export function dan(level: number): Ranking {
    return Math.floor(level) + 29;
}

export function pro(level: number): Ranking {
    return Math.floor(level) + 36;
}
