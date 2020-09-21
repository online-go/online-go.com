/*
 * Copyright (C) 2012-2020  Online-Go.com
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

import {_, interpolate, pgettext} from "translate";
import { Interface } from "readline";

export interface IRankInfo {
    rank: number;
    label: string;
}

class Rating {
    unset:boolean;
    rating:number;
    deviation:number;
    volatility:number;
    provisional:boolean;
    rank:number;
    rank_label:string;
    partial_rank:number;
    partial_rank_label:string;
    rank_deviation_labels:Array<string>;
    rank_deviation:number;
    professional:boolean;
    bounded_rank:number;
    bounded_rank_label:string;
    partial_bounded_rank:number;
    partial_bounded_rank_label:string;
}

export const MinRank: number = 5;
export const MaxRank: number = 38;
export const PROVISIONAL_RATING_CUTOFF = 160;


const MIN_RATING = 100;
const MAX_RATING = 6000;

export function rank_to_rating(rank:number) {
    return 850 * Math.exp(0.032 * rank);
}

export function rating_to_rank(rating:number) {
    return Math.log(Math.min(MAX_RATING, Math.max(MIN_RATING, rating)) / 850.0) / 0.032;
}

export function get_handicap_adjustment(rating:number, handicap:number):number {
    return rank_to_rating(rating_to_rank(rating) + handicap) - rating;
}
function overall_rank(user_or_rank:any):number {
    let rank = null;
    if (typeof(user_or_rank) === 'number') {
        rank = user_or_rank;
    } else {
        rank = getUserRating(user_or_rank, 'overall', 0).rank;
    }
    return rank;
}
export function is_novice(user_or_rank:any):boolean {
    return overall_rank(user_or_rank) < MinRank;
}
export function is_rank_bounded(user_or_rank:any):boolean {
    let rank = overall_rank(user_or_rank);
    return rank < MinRank || rank > MaxRank;
}
export function bounded_rank(user_or_rank:any):number {
    let rank = overall_rank(user_or_rank);
    return Math.min(MaxRank, Math.max(MinRank, rank));
}
export function is_provisional(user:any):boolean {
    let ratings = user.ratings || {};

    let rating = ratings['overall'] || {
        rating: 1500,
        deviation: 350,
        volatility: 0.06,
    };

    return rating.deviation >= PROVISIONAL_RATING_CUTOFF;
}


export function getUserRating(user:any, speed:'overall' | 'blitz' | 'live' | 'correspondence' = 'overall', size: 0 | 9 | 13 | 19 = 0) {
    let ret = new Rating();
    let ratings = user.ratings || {};
    ret.professional = user.pro || user.professional;

    let key:string = speed;
    if (size > 0) {
        if (speed !== 'overall') {
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
    if (ret.rank > (MaxRank + 1)) {
        ret.bounded_rank_label += '+';
        ret.partial_bounded_rank_label += '+';
    }

    if (ret.professional) {
        ret.rank_label = rankString(user);
        ret.bounded_rank_label = rankString(user);
        ret.partial_rank_label = ret.rank_label;
        ret.rank_deviation_labels = ['', ''];
    }

    return ret;
}


export function boundedRankString(r, with_tenths?:boolean) {
    return rankString(bounded_rank(r), with_tenths);
}

export function rankString(r, with_tenths?:boolean) {
    let provisional = false;

    if (typeof(r) === "object") {
        provisional = is_provisional(r);

        let ranking = "ranking" in r ? r.ranking : r.rank;
        if (r.pro || r.professional) {
            return interpolate(pgettext("Pro", "%sp"), [((ranking - 36))]);
        }
        if ('ratings' in r) {
            r = overall_rank(r);
        } else {
            provisional = false;
            r = ranking;
        }
    }
    if (r > 900) {
        return interpolate(pgettext("Pro", "%sp"), [(((r - 1000) - 36))]);
    }

    if (r < -900) {
        provisional = true;
    }
    if (provisional) {
        return "?";
    }

    if (r < 30) {
        if (with_tenths) {
            r = (Math.ceil((30 - r) * 10) / 10).toFixed(1);
        } else {
            r = Math.ceil(30 - r);
        }
        return interpolate(pgettext("Kyu", "%sk"), [r]);
    }

    if (with_tenths) {
        r = (Math.floor((r - 29) * 10) / 10).toFixed(1);
    } else {
        r = Math.floor(r - 29);
    }
    return interpolate(pgettext("Dan", "%sd"), [r]);
}

export function longRankString(r) {
    let provisional = false;

    if (typeof(r) === "object") {
        provisional = is_provisional(r);

        let ranking = "ranking" in r ? r.ranking : r.rank;
        if (r.pro || r.professional) {
            return interpolate(_("%s Pro"), [((ranking - 36))]);
        }
        if ('ratings' in r) {
            r = overall_rank(r);
        } else {
            r = ranking;
        }
    }
    if (r > 900) {
        return interpolate(_("%s Pro"), [(((r - 1000) - 36))]);
    }

    if (r < -900) {
        provisional = true;
    }
    if (provisional) {
        return "?";
    }

    if (r < 30) {
        return interpolate(_("%s Kyu"), [(30 - r)]);
    }
    return interpolate(_("%s Dan"), [((r - 30) + 1)]);
}


export function rankList(minRank: number = 0, maxRank: number = MaxRank, usePlusOnLast: boolean = false): Array<IRankInfo> {
    let result = [];
    for (let i = minRank; i <= maxRank; ++i) {
        let label = longRankString(i);
        if (usePlusOnLast && i === maxRank) { label += "+"; }
        result.push ({
            rank: i,
            label: label
        });
    }
    return result;
}

export function proRankList(bigranknums:boolean = true): Array<IRankInfo> {
    let result = [];
    for (let i = 37; i <= 45; ++i) {
        result.push ({
            rank: i + (bigranknums ? 1000 : 0),
            label: longRankString(i + 1000)
        });
    }
    return result;
}

export function amateurRanks() { return rankList(MinRank, MaxRank, true); }
export function allRanks() { return rankList().concat( proRankList()); }

/* For new players we pretend their rating is lower than it actually is for the purposes of
 * matchmaking and the like. See:
 *  https://forums.online-go.com/t/i-think-the-13k-default-rank-is-doing-harm/13480/192
 * for the history surounding that.
*/
export function humble_rating(rating:number, deviation:number):number {
    return rating - ((Math.min(350, Math.max(PROVISIONAL_RATING_CUTOFF, deviation)) - PROVISIONAL_RATING_CUTOFF) / (350 - PROVISIONAL_RATING_CUTOFF)) * deviation;
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

export function effective_outcome(black_rating: number, white_rating: number, handicap: number):EffectiveOutcome {
    //let res: EffectiveOutcome = new EffectiveOutcome;
    let black_effective_rating: number = black_rating + get_handicap_adjustment(black_rating, handicap);
    let white_effective_rating: number = white_rating;
    return {
        black_real_rating: black_rating,
        white_real_rating: white_rating,
        handicap: handicap,
        black_effective_rating: black_effective_rating,
        white_effective_rating: white_effective_rating,
        black_real_stronger: black_rating > white_rating,
        black_effective_stronger: black_effective_rating > white_effective_rating,
        white_real_stronger: white_rating >= black_rating,
        white_effective_stronger: white_effective_rating >= black_effective_rating
    };
}

