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

// A player's rank
export interface Rank {
    level: number;
    type: "Kyu" | "Dan" | "Pro";
}

export interface AmateurRank extends Rank {
    type: "Kyu" | "Dan";
}

export interface ProfessionalRank extends Rank {
    type: "Pro";
}



// Run-time type checks for ranks.
export function is_amateur(rank: Rank): rank is AmateurRank {
    return rank.type === "Kyu" || rank.type === "Dan";
}

export function is_professional(rank: Rank): rank is ProfessionalRank {
    return rank.type === "Pro";
}



// Utility functions to create ranks.
export function kyu(level: number): AmateurRank {
    return validate_rank({level: level, type: "Kyu"});
}

export function dan(level: number): AmateurRank {
    return validate_rank({level: level, type: "Dan"});
}

export function pro(level: number): ProfessionalRank {
    return validate_rank({level: level, type: "Pro"});
}



// Convert a rank to a string
export function rank_long_string(rank: Rank): string {
    rank = validate_rank(rank);
    return rank.level + " " + rank.type;
}

export function rank_short_string(rank: Rank): string {
    rank = validate_rank(rank);
    return rank.level + rank.type[0].toLowerCase();
}



// Rank arithmetic: add and compare.
export function add_rank(rank: AmateurRank, amount: number): AmateurRank;
export function add_rank(rank: ProfessionalRank, amount: number): ProfessionalRank;
export function add_rank(rank: Rank, amount: number): Rank;
export function add_rank(rank: Rank, amount: number): Rank {
    rank = validate_rank(rank);
    amount = Math.floor(amount);

    if (rank.type === "Kyu") {
        rank.level -= amount;
    }
    else {
        rank.level += amount;
    }

    return validate_rank(rank);
}

export function compare_ranks(a: Rank, b: Rank): number {
    a = validate_rank(a);
    b = validate_rank(b);

    let ordering = ["Kyu", "Dan", "Pro"];
    let cmp = ordering.indexOf(a.type) - ordering.indexOf(b.type);
    if (a.type === "Kyu" && b.type === "Kyu") {
        cmp = cmp || (b.level - a.level);
    }
    else {
        cmp = cmp || (a.level - b.level);
    }
    return Math.sign(cmp);
}



// Rank validation. Ranks have integer levels, have level at least 1, and
// have a set maximum level that depends on the type.
let maximum_level: {readonly [type: string]: number} = {
    "Kyu": 30,
    "Dan": 7,
    "Pro": 9,
};
let adjust_type: {readonly [type: string]: (level: number) => Rank} = {
    "Kyu": (level) => ({level: 1 - level, type: "Dan"}),
    "Dan": (level) => ({level: 1 - level, type: "Kyu"}),
    "Pro": (level) => ({level: 1,         type: "Pro"})
};
function validate_rank(rank: AmateurRank): AmateurRank;
function validate_rank(rank: ProfessionalRank): ProfessionalRank;
function validate_rank(rank: Rank): Rank;
function validate_rank(rank: Rank): Rank {
    let level: number = rank.level;
    level = Math.floor(level);
    level = Math.min(level, maximum_level[rank.type]);
    if (level < 1) {
        return adjust_type[rank.type](level);
    }
    else {
        return {level: level, type: rank.type};
    }
}
