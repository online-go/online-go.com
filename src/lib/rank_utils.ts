/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { _, interpolate, pgettext } from "translate";

export interface IRankInfo {
    rank: number;
    label: string;
}

class Rating {
    unset: boolean;
    rating: number;
    deviation: number;
    volatility: number;
    provisional: boolean;
    rank: number;
    rank_label: string;
    partial_rank: number;
    partial_rank_label: string;
    rank_deviation_labels: Array<string>;
    rank_deviation: number;
    professional: boolean;
    bounded_rank: number;
    bounded_rank_label: string;
    partial_bounded_rank: number;
    partial_bounded_rank_label: string;
}

export const MinRank = 5;
export const MaxRank = 38;
export const PROVISIONAL_RATING_CUTOFF = 160;

const MIN_RATING = 100;
const MAX_RATING = 6000;
const A = 525;
const C = 23.15;

interface CompactRatingType {
    rating: number;
    deviation: number;
    volatility: number;
}
interface RatingsType {
    overall: CompactRatingType;
}

interface UserType {
    ranking?: number;
    rank?: number;
    pro?: boolean;
    professional?: boolean;
    ratings?: RatingsType;
}
type UserOrRank = UserType | number;

/** Returns the Glicko2 rating corresponding to OGS rank. */
export function rank_to_rating(rank: number) {
    return A * Math.exp(rank / C);
}

/** Returns the OGS rank corresponding to the Glicko2 rating */
export function rating_to_rank(rating: number) {
    return Math.log(Math.min(MAX_RATING, Math.max(MIN_RATING, rating)) / A) * C;
}

/** Calculates OGS rank deviation from the Glicko2 rating and deviation */
export function rank_deviation(rating: number, deviation: number) {
    // Suggestion: use the uncertainty propagation formula for log transforms:
    // https://en.wikipedia.org/wiki/Propagation_of_uncertainty#Example_formulae
    //     - bpj
    return rating_to_rank(rating + deviation) - rating_to_rank(rating);
}

function get_handicap_adjustment(rating: number, handicap: number): number {
    return rank_to_rating(rating_to_rank(rating) + handicap) - rating;
}
function overall_rank(user_or_rank: UserOrRank): number {
    let rank = null;
    if (typeof user_or_rank === "number") {
        rank = user_or_rank;
    } else {
        rank = getUserRating(user_or_rank, "overall", 0).rank;
    }
    return rank;
}

/** Returns true if user is below 25k */
export function is_novice(user_or_rank: UserOrRank): boolean {
    return overall_rank(user_or_rank) < MinRank;
}
/** Returns true if user is below 25k or above 9d */
export function is_rank_bounded(user_or_rank: UserOrRank): boolean {
    const rank = overall_rank(user_or_rank);
    return rank < MinRank || rank > MaxRank;
}
/** Returns rank clamped to the bounds [25k, 9d] */
export function bounded_rank(user_or_rank: UserOrRank): number {
    const rank = overall_rank(user_or_rank);
    return Math.min(MaxRank, Math.max(MinRank, rank));
}

/**
 * Returns true if the user's rank deviation is too large.
 *
 * This determines whether rank shows up as [?] around OGS
 */
export function is_provisional(user: { ratings?: RatingsType }): boolean {
    const ratings = user.ratings || {};

    const rating = ratings["overall"] || {
        rating: 1500,
        deviation: 350,
        volatility: 0.06,
    };

    return rating.deviation >= PROVISIONAL_RATING_CUTOFF;
}

/**
 * Computes ratings data for a user for a given size and speed.
 */
export function getUserRating(
    user: UserType,
    speed: "overall" | "blitz" | "live" | "correspondence" = "overall",
    size: 0 | 9 | 13 | 19 = 0,
) {
    const ret = new Rating();
    const ratings = user.ratings || {};
    ret.professional = user.pro || user.professional;

    let key: string = speed;
    if (size > 0) {
        if (speed !== "overall") {
            key += `-${size}x${size}`;
        } else {
            key = `${size}x${size}`;
        }
    }

    let rating = {
        rating: 1500,
        deviation: 350,
        volatility: 0.06,
    };
    ret.unset = true;
    if (key in ratings) {
        ret.unset = false;
        rating = ratings[key];
    }

    ret.rating = rating.rating;
    ret.deviation = rating.deviation;
    ret.provisional = rating.deviation >= PROVISIONAL_RATING_CUTOFF;
    ret.volatility = rating.volatility;
    ret.rank = Math.floor(rating_to_rank(ret.rating));
    ret.rank_deviation = rating_to_rank(ret.rating + ret.deviation) - rating_to_rank(ret.rating);
    ret.partial_rank = rating_to_rank(ret.rating);
    ret.rank_label = rankString(ret.rank, false);
    ret.partial_rank_label = rankString(ret.partial_rank, true);
    ret.rank_deviation_labels = [
        rankString(rating_to_rank(ret.rating - ret.deviation), true),
        rankString(rating_to_rank(ret.rating + ret.deviation), true),
    ];
    ret.bounded_rank = Math.max(MinRank, Math.min(MaxRank, ret.rank));
    ret.bounded_rank_label = rankString(ret.bounded_rank);
    ret.partial_bounded_rank = Math.max(MinRank, Math.min(MaxRank, ret.partial_rank));
    ret.partial_bounded_rank_label = rankString(ret.partial_bounded_rank, true);
    if (ret.rank > MaxRank + 1) {
        ret.bounded_rank_label += "+";
        ret.partial_bounded_rank_label += "+";
    }

    if (ret.professional) {
        ret.rank_label = rankString(user);
        ret.bounded_rank_label = rankString(user);
        ret.partial_rank_label = ret.rank_label;
        ret.rank_deviation_labels = ["", ""];
    }

    return ret;
}

/** Like rankString, but clamped to the range [25k, 9d] */
export function boundedRankString(r: UserOrRank, with_tenths?: boolean) {
    return rankString(bounded_rank(r), with_tenths);
}

/**
 * Returns a concise, localized string representing a user's kyu/dan rank
 *
 * @param r If a user type, the users overall rating will be pulled off the user.
 *          If a number, it will be treated as the OGS rank.
 * @param with_tenths If true, 1 decimal of precision will be added to the output.
 * @returns a string representing the rank (e.g. "7.1k", "4d", "9p")
 */
export function rankString(r: UserOrRank, with_tenths?: boolean): string {
    let provisional = false;

    if (typeof r === "object") {
        provisional = is_provisional(r);

        const ranking = "ranking" in r ? r.ranking : r.rank;
        if (r.pro || r.professional) {
            if (ranking > 900) {
                return interpolate(pgettext("Pro", "%sp"), [ranking - 1000 - 36]);
            } else {
                return interpolate(pgettext("Pro", "%sp"), [ranking - 36]);
            }
        }
        if ("ratings" in r) {
            r = overall_rank(r);
        } else {
            provisional = false;
            r = ranking;
        }
    }
    if (r > 900) {
        return interpolate(pgettext("Pro", "%sp"), [r - 1000 - 36]);
    }

    if (r < -900) {
        provisional = true;
    }
    if (provisional) {
        return "?";
    }

    if (r < 30) {
        if (with_tenths) {
            (r as any) = (Math.ceil((30 - r) * 10) / 10).toFixed(1);
        } else {
            r = Math.ceil(30 - r);
        }
        return interpolate(pgettext("Kyu", "%sk"), [r]);
    }

    if (with_tenths) {
        (r as any) = (Math.floor((r - 29) * 10) / 10).toFixed(1);
    } else {
        r = Math.floor(r - 29);
    }
    return interpolate(pgettext("Dan", "%sd"), [r]);
}

/**
 * Returns a localized string representing a user's kyu/dan rank
 *
 * @param r If a user type, the users overall rating will be pulled off the user.
 *          If a number, it will be treated as the OGS rank.
 * @returns a string representing the rank (e.g. "7.1 Kyu", "4.36 Dan", "9 Pro")
 */
export function longRankString(r: UserOrRank) {
    let provisional = false;

    if (typeof r === "object") {
        provisional = is_provisional(r);

        const ranking = "ranking" in r ? r.ranking : r.rank;
        if (r.pro || r.professional) {
            return interpolate(_("%s Pro"), [ranking - 36]);
        }
        if ("ratings" in r) {
            r = overall_rank(r);
        } else {
            r = ranking;
        }
    }
    if (r > 900) {
        return interpolate(_("%s Pro"), [r - 1000 - 36]);
    }

    if (r < -900) {
        provisional = true;
    }
    if (provisional) {
        return "?";
    }

    if (r < 30) {
        return interpolate(_("%s Kyu"), [30 - r]);
    }
    return interpolate(_("%s Dan"), [r - 30 + 1]);
}

/**
 * Returns a list of OGS ranks and labels in the range [minRank, maxRank]
 * @param minRank the first rank in the list
 * @param maxRank the last rank in the list
 * @param usePlusOnLast if true, the last entry will have a plus (e.g. "1d+")
 */
export function rankList(
    minRank: number = 0,
    maxRank: number = MaxRank,
    usePlusOnLast: boolean = false,
): Array<IRankInfo> {
    const result = [];
    for (let i = minRank; i <= maxRank; ++i) {
        let label = longRankString(i);
        if (usePlusOnLast && i === maxRank) {
            label += "+";
        }
        result.push({
            rank: i,
            label: label,
        });
    }
    return result;
}

/**
 * Returns a list of all possible pro ranks and their labels.
 * @param bigranknums if true, ranks will start at 1037
 */
export function proRankList(bigranknums: boolean = true): Array<IRankInfo> {
    const result = [];
    for (let i = 37; i <= 45; ++i) {
        result.push({
            rank: i + (bigranknums ? 1000 : 0),
            label: longRankString(i + 1000),
        });
    }
    return result;
}

/** Returns all ranks with labels in the range [25k, 9d] */
export function amateurRanks() {
    return rankList(MinRank, MaxRank, true);
}
/** Returns all available ranks on OGS */
export function allRanks() {
    return rankList().concat(proRankList());
}

/* For new players we pretend their rating is lower than it actually is for the purposes of
 * matchmaking and the like. See:
 *  https://forums.online-go.com/t/i-think-the-13k-default-rank-is-doing-harm/13480/192
 * for the history surounding that.
 */
export function humble_rating(rating: number, deviation: number): number {
    return (
        rating -
        ((Math.min(350, Math.max(PROVISIONAL_RATING_CUTOFF, deviation)) -
            PROVISIONAL_RATING_CUTOFF) /
            (350 - PROVISIONAL_RATING_CUTOFF)) *
            deviation
    );
}

export interface EffectiveOutcome {
    black_real_rating: number;
    white_real_rating: number;
    black_real_stronger: boolean;
    white_real_stronger: boolean;
    handicap: number;
    black_effective_rating: number;
    white_effective_rating: number;
    black_effective_stronger: boolean;
    white_effective_stronger: boolean;
}

/**
 * @returns a ratings object containing ratings adjusted for the handicap.
 */
export function effective_outcome(
    black_rating: number,
    white_rating: number,
    handicap: number,
): EffectiveOutcome {
    const black_effective_rating: number =
        black_rating + get_handicap_adjustment(black_rating, handicap);
    const white_effective_rating: number = white_rating;
    return {
        black_real_rating: black_rating,
        white_real_rating: white_rating,
        handicap: handicap,
        black_effective_rating: black_effective_rating,
        white_effective_rating: white_effective_rating,
        black_real_stronger: black_rating > white_rating,
        black_effective_stronger: black_effective_rating > white_effective_rating,
        white_real_stronger: white_rating >= black_rating,
        white_effective_stronger: white_effective_rating >= black_effective_rating,
    };
}
