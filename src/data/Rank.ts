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

// A player's ranking
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



// Calculate an amateur player's ranking from a rating (which is simply a number).
// On OGS, we use the European Go Federation's system.
export function make_amateur_rank(rating: number): AmateurRank {
    let kyu = Math.ceil((2100 - rating) / 100);
    let dan = Math.floor((rating - 2100) / 100) + 1;
    if (kyu >= 1) {
        return {level: kyu, type: "Kyu"};
    }
    if (dan >= 1) {
        return {level: dan, type: "Dan"};
    }
}

// A professional's ranking is assigned to them rahter than calculated.
export function make_professional_rank(dan: number): ProfessionalRank {
    return {level: dan, type: "Pro"};
}



// Increase or decrease amateur rankings
export function next_higher_rank(ranking: AmateurRank): AmateurRank {
    let level = ranking.level;
    if (ranking.level === 1 && ranking.type === "Kyu") {
        return {level: 1, type: "Dan"};
    }
    if (ranking.type === "Kyu") {
        return {level: level - 1, type: "Kyu"};
    }
    if (ranking.type === "Dan") {
        return {level: level + 1, type: "Dan"};
    }
}

export function next_lower_rank(ranking: AmateurRank): AmateurRank {
    let level = ranking.level;
    if (ranking.level === 1 && ranking.type === "Dan") {
        return {level: 1, type: "Kyu"};
    }
    if (ranking.type === "Kyu") {
        return {level: level + 1, type: "Kyu"};
    }
    if (ranking.type === "Dan") {
        return {level: level - 1, type: "Dan"};
    }
}



// Convert a ranking to a string
export function ranking_long_string(rank: Rank): string {
    return Math.floor (rank.level) + " " + rank.type;
}

export function ranking_short_string(rank: Rank): string {
    return Math.floor(rank.level) + rank.type[0].toLowerCase();
}



// Compare two rankings to find which is better.
export function compare_ranks(a: Rank, b: Rank): number {
    let ordering = ["Kyu", "Dan", "Pro"];
    let cmp = 0;
    cmp = cmp || ordering.indexOf(a.type) - ordering.indexOf(b.type);
    cmp = cmp || a.type === "Kyu" && (b.level - a.level);
    cmp = cmp || a.type === "Dan" && (a.level - b.level);
    cmp = cmp || a.type === "Pro" && (a.level - b.level);
    return cmp;
}
