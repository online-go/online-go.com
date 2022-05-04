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
} from "./rank_utils";

// workaround for setGobanTranslations not found error
// This can probably be fixed by removing sideeffects from translate.ts
jest.mock("goban", () => ({
    setGobanTranslations: jest.fn(),
}));

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
