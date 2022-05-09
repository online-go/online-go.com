/*
 * Copyright (C) 2022  Benjamin P. Jones
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

import {
    rank_to_rating,
    rating_to_rank,
    rank_deviation,
    is_novice,
    is_rank_bounded,
    bounded_rank,
    is_provisional,
    getUserRating,
    rankString,
    longRankString,
    rankList,
    proRankList,
    amateurRanks,
    allRanks,
    humble_rating,
    effective_outcome,
} from "./rank_utils";

test("rank_to_rating", () => {
    // 30k
    expect(rank_to_rating(0)).toBeCloseTo(525);
    // rank == C
    expect(rank_to_rating(23.15)).toBeCloseTo(Math.E * 525);
    // 1d
    expect(rank_to_rating(30)).toBeCloseTo(1918.492);
});

test("rating_to_rank", () => {
    // 30k
    expect(rating_to_rank(525)).toBeCloseTo(0);
    // rank == C
    expect(rating_to_rank(Math.E * 525)).toBeCloseTo(23.15);
    // ~2d
    expect(rating_to_rank(2000)).toBeCloseTo(30.963);
});

test("rank_deviation", () => {
    // default rank/deviation
    expect(rank_deviation(1500, 350)).toBeCloseTo(4.855);
});

test("is_novice", () => {
    // 30k
    expect(is_novice(0)).toBe(true);
    // 20k
    expect(is_novice(10)).toBe(false);
});

test("is_rank_bounded", () => {
    // 30k
    expect(is_rank_bounded(0)).toBe(true);
    // 1d
    expect(is_rank_bounded(30)).toBe(false);
    // 11d
    expect(is_rank_bounded(40)).toBe(true);
});

test("bounded_rank", () => {
    // 30k
    expect(bounded_rank(0)).toBe(5);
    // 1d
    expect(bounded_rank(30)).toBe(30);
    // 11d
    expect(bounded_rank(40)).toBe(38);
});

test("is_provisional", () => {
    const makeUserWithDeviation = (deviation: number) => {
        return {
            ratings: {
                overall: {
                    rating: 1500,
                    deviation: deviation,
                    volatility: 0.06,
                },
            },
        };
    };
    const new_user = makeUserWithDeviation(350);
    const seasoned_user = makeUserWithDeviation(62);
    const user_without_ratings = {};

    expect(is_provisional(new_user)).toBe(true);
    expect(is_provisional(seasoned_user)).toBe(false);
    expect(is_provisional(user_without_ratings)).toBe(true);
});

test("is_provisional", () => {
    const makeUserWithDeviation = (deviation: number) => {
        return {
            ratings: {
                overall: {
                    rating: 1500,
                    deviation: deviation,
                    volatility: 0.06,
                },
            },
        };
    };
    const new_user = makeUserWithDeviation(350);
    const seasoned_user = makeUserWithDeviation(62);
    const user_without_ratings = {};

    expect(is_provisional(new_user)).toBe(true);
    expect(is_provisional(seasoned_user)).toBe(false);
    expect(is_provisional(user_without_ratings)).toBe(true);
});

test("getUserRating", () => {
    const user = {
        pro: false,
        ratings: {
            overall: {
                rating: 1465,
                deviation: 62,
                volatility: 0.0625,
            },
            "correspondence-19x19": {
                rating: 1480,
                deviation: 64,
                volatility: 0.0625,
            },
        },
    };

    // Overall
    expect(getUserRating(user)).toEqual(
        expect.objectContaining({
            bounded_rank: 23,
            bounded_rank_label: "7k",
            deviation: 62,
            partial_bounded_rank_label: "6.3k",
            partial_rank_label: "6.3k",
            professional: undefined,
            provisional: false,
            rank: 23,
            rank_deviation_labels: ["7.3k", "5.3k"],
            rank_label: "7k",
            rating: 1465,
            unset: false,
            volatility: 0.0625,
        }),
    );

    // With size and speed specified
    expect(getUserRating(user, "correspondence", 19)).toEqual(
        expect.objectContaining({
            bounded_rank: 23,
            bounded_rank_label: "7k",
            deviation: 64,
            partial_bounded_rank_label: "6.1k",
            partial_rank_label: "6.1k",
            professional: undefined,
            provisional: false,
            rank: 23,
            rank_deviation_labels: ["7.1k", "5.1k"],
            rank_label: "7k",
            rating: 1480,
            unset: false,
            volatility: 0.0625,
        }),
    );

    // With a size/speed that does not exist on the user's rating
    expect(getUserRating(user, "blitz", 9)).toEqual(
        expect.objectContaining({
            bounded_rank: 24,
            bounded_rank_label: "6k",
            deviation: 350,
            partial_bounded_rank_label: "5.7k",
            partial_rank_label: "5.7k",
            professional: undefined,
            provisional: true,
            rank: 24,
            rank_deviation_labels: ["11.9k", "0.9k"],
            rank_label: "6k",
            rating: 1500,
            unset: true,
            volatility: 0.06,
        }),
    );
});

test("rankString", () => {
    const user = {
        pro: false,
        ranking: 23.7,
        ratings: {
            overall: {
                rating: 1465,
                deviation: 62,
                volatility: 0.0625,
            },
        },
    };

    const provisional_user = {
        pro: false,
        ranking: 24.303382182144386,
        ratings: {
            overall: {
                rating: 1500,
                deviation: 350,
                volatility: 0.06,
            },
        },
    };

    const pro = {
        pro: true,
        ranking: 45,
    };

    // User passed in
    expect(rankString(user)).toBe("7k");
    expect(rankString(user, true)).toBe("7.0k"); // bug? I would expect this to be "6.3k"
    expect(rankString(provisional_user)).toBe("?");

    // Professional user
    expect(rankString(pro)).toBe("9p");
    // Pro rank
    expect(rankString(1039)).toBe("3p");

    // Rank passed in
    expect(rankString(32.5)).toBe("3d");
    expect(rankString(32.5, true)).toBe("3.5d");
});

test("longRankString", () => {
    const user = {
        pro: false,
        ranking: 23.7,
        ratings: {
            overall: {
                rating: 1465,
                deviation: 62,
                volatility: 0.0625,
            },
        },
    };

    const provisional_user = {
        pro: false,
        ranking: 24.303382182144386,
        ratings: {
            overall: {
                rating: 1500,
                deviation: 350,
                volatility: 0.06,
            },
        },
    };

    const pro = {
        pro: true,
        ranking: 45,
    };

    // User passed in
    expect(longRankString(user)).toBe("7 Kyu");
    expect(longRankString(provisional_user)).toBe("?");

    // Professional user
    expect(longRankString(pro)).toBe("9 Pro");

    // Pro rank
    expect(longRankString(1039)).toBe("3 Pro");

    // Rank passed in
    expect(longRankString(32.5)).toBe("3.5 Dan");
});

test("rankList", () => {
    expect(rankList(27, 31)).toEqual([
        { rank: 27, label: "3 Kyu" },
        { rank: 28, label: "2 Kyu" },
        { rank: 29, label: "1 Kyu" },
        { rank: 30, label: "1 Dan" },
        { rank: 31, label: "2 Dan" },
    ]);
    expect(rankList().length).toEqual(39 /* 30 kyus + 9 dans */);
    expect(rankList(27, 31, true)).toEqual([
        { rank: 27, label: "3 Kyu" },
        { rank: 28, label: "2 Kyu" },
        { rank: 29, label: "1 Kyu" },
        { rank: 30, label: "1 Dan" },
        { rank: 31, label: "2 Dan+" },
    ]);
});

test("proRankList", () => {
    const pro_list = proRankList(false);
    const big_ranks = proRankList();

    expect(pro_list.length).toEqual(9);
    expect(pro_list[0]).toEqual({ rank: 37, label: "1 Pro" });
    expect(pro_list[8]).toEqual({ rank: 45, label: "9 Pro" });

    expect(big_ranks.length).toEqual(9);
    expect(big_ranks[0]).toEqual({ rank: 1037, label: "1 Pro" });
    expect(big_ranks[8]).toEqual({ rank: 1045, label: "9 Pro" });
});

test("amateurRanks", () => {
    const amateur_ranks = amateurRanks();

    expect(amateur_ranks.length).toEqual(34);
    expect(amateur_ranks[0].label).toBe("25 Kyu");
    expect(amateur_ranks[33].label).toBe("9 Dan+");
});

test("allRanks", () => {
    const all_ranks = allRanks();

    expect(all_ranks.length).toEqual(48);
    expect(all_ranks[0].label).toBe("30 Kyu");
    expect(all_ranks[30].label).toBe("1 Dan");
    expect(all_ranks[47].label).toBe("9 Pro");
});

test("humble_rating", () => {
    expect(humble_rating(1500, 350)).toBe(1150);
});

test("effective_outcome", () => {
    const rating_1d = rank_to_rating(30);
    const rating_3k = rank_to_rating(27);

    expect(effective_outcome(rating_3k, rating_1d, 1)).toEqual(
        expect.objectContaining({
            black_effective_stronger: false,
            black_real_stronger: false,
            white_effective_stronger: true,
            white_real_stronger: true,
        }),
    );

    expect(effective_outcome(rating_3k, rating_1d, 8)).toEqual(
        expect.objectContaining({
            black_effective_stronger: true,
            black_real_stronger: false,
            white_effective_stronger: false,
            white_real_stronger: true,
        }),
    );
});
