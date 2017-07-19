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

import {_, interpolate, pgettext} from "translate";

interface IRankInfo {
    rank: number;
    label: string;
}

class Rating {
    unset:boolean;
    rating:number;
    deviation:number;
    volatility:number;
    rank:number;
    rank_label:string;
    partial_rank:number;
    partial_rank_label:string;
    rank_deviation_labels:Array<string>;
    rank_deviation:number;
}

export const MaxRank: number = 39;


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

export function getUserRating(user:any, speed:'overall' | 'blitz' | 'live' | 'correspondence', size: 0 | 9 | 13 | 19) {
    let ret = new Rating();
    let ratings = user.ratings || {};

    let key = speed;
    if (size > 0) {
        key += `-${size}x${size}`;
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
    return ret;
}


export function rankString(r, with_tenths?:boolean) {
    if (typeof(r) === "object") {
        let ranking = "ranking" in r ? r.ranking : r.rank;
        if (r.pro || r.professional) {
            return interpolate(pgettext("Pro", "%sp"), [((ranking - 36))]);
        }
        r = ranking;
    }
    if (r > 900) {
        return interpolate(pgettext("Pro", "%sp"), [(((r - 1000) - 36))]);
    }
    if (r < -900) {
        return "?";
    }

    if (r < 30) {
        return interpolate(pgettext("Kyu", "%sk"), [(30 - r).toFixed(with_tenths ? 1 : 0)]);
    }
    return interpolate(pgettext("Dan", "%sd"), [((r - 30) + 1).toFixed(with_tenths ? 1 : 0)]);
}

export function longRankString(r) {
    if (typeof(r) === "object") {
        if (r.pro) {
            return interpolate(_("%s Pro"), [((r.ranking - 36))]);
        }
        r = r.ranking;
    }
    if (r > 900) {
        return interpolate(_("%s Pro"), [(((r - 1000) - 36))]);
    }

    if (r < -900) {
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

export function proRankList(): Array<IRankInfo> {
    let result = [];
    for (let i = 37; i <= 45; ++i) {
        result.push ({
            rank: i + 1000,
            label: longRankString(i + 1000)
        });
    }
    return result;
}

export function amateurRanks() { return rankList(0, MaxRank, true); }
export function allRanks() { return rankList().concat( proRankList()); }
