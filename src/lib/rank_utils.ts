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

export const MaxRank: number = 36;

export function rankString(r) {
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
        return interpolate(pgettext("Kyu", "%sk"), [(30 - r)]);
    }
    return interpolate(pgettext("Dan", "%sd"), [((r - 30) + 1)]);
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
