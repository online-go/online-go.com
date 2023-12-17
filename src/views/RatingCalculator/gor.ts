/*
 * Copyright (C)  Online-Go.com
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

export function RATING_TO_RANK(rating: number) {
    return rating / 100 + 9;
}

export class GorEntry {
    rating: number;
    handicap: number;
    EPSILON: number;

    constructor(rating: number = 1200.0, handicap: number = 0.0, EPSILON: number = 0.016) {
        this.rating = rating;
        this.handicap = handicap;
        this.EPSILON = EPSILON;
    }

    expected_win_probability(opponent: GorEntry) {
        const D = opponent.rating + opponent.handicap - (this.rating + this.handicap);
        const a = compute_a(
            Math.min(this.rating + this.handicap, opponent.rating + opponent.handicap),
        ); // this.rating)
        //console.log(`D = ${D}  a = ${a}`)
        return 1 / (Math.exp(D / a) + 1) - this.EPSILON / 2;
    }

    with_handicap(handicap: number = 0.0) {
        const ret = new GorEntry(this.rating, handicap, this.EPSILON);
        return ret;
    }

    GorStr() {
        return this.rating.toFixed(2);
    }

    gor_configure(epsilon: number) {
        this.EPSILON = epsilon;
    }
}

export function compute_a(gor: number) {
    const ret = Math.max(70, 205 - (RATING_TO_RANK(gor) - 9) * 5);
    return ret;
}

export function compute_con(rank: number) {
    const con_list = [
        [10, 116],
        [11, 110],
        [12, 105],
        [13, 100],
        [14, 95],
        [15, 90],
        [16, 85],
        [17, 80],
        [18, 75],
        [19, 70],
        [20, 65],
        [21, 60],
        [22, 55],
        [23, 51],
        [24, 47],
        [25, 43],
        [26, 39],
        [27, 35],
        [28, 31],
        [29, 27],
        [30, 24],
        [31, 21],
        [32, 18],
        [33, 15],
        [34, 13],
        [35, 11],
        [36, 10],
    ];
    let last_con = 116;

    for (let j = 0; j < con_list.length; j++) {
        //(r, con)
        const r = con_list[j][0];
        const con = con_list[j][1];
        if (rank <= r) {
            return (r - rank) * last_con + (1 - (r - rank)) * con;
        }
        last_con = con;
        //console.log(last_con);
    }
    return 10;
}

export function gor_update(player: GorEntry, opponent: GorEntry, outcome: number) {
    const K = compute_con(RATING_TO_RANK(player.rating));
    //console.log(`K = ${K}`)
    const expected = player.expected_win_probability(opponent);
    return new GorEntry(player.rating + K * (outcome - expected), undefined, player.EPSILON);
}
