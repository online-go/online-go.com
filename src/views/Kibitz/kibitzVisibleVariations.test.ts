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

import {
    EMPTY_VISIBLE_VARIATIONS,
    MAX_VISIBLE_VARIATIONS,
    withVisibleVariationIds,
} from "./kibitzVisibleVariations";

test("assigns the first free colour index to each new variation", () => {
    const state = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a", "b"]);
    expect(state.colors).toEqual({ a: 0, b: 1 });
});

test("a variation added later never takes an index already in use", () => {
    // Regression: a newly visible variation used to fall back to index 0 --
    // red -- while another variation already held red.
    const first = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a"]);
    const second = withVisibleVariationIds(first, ["a", "b"]);
    expect(second.colors.a).toBe(0);
    expect(second.colors.b).not.toBe(second.colors.a);
});

test("keeps the colours of variations that stay visible when one is removed", () => {
    const three = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a", "b", "c"]);
    const two = withVisibleVariationIds(three, ["a", "c"]);
    expect(two.colors.a).toBe(three.colors.a);
    expect(two.colors.c).toBe(three.colors.c);
    expect(two.colors.b).toBeUndefined();
});

test("returns the previous object when nothing changed", () => {
    const state = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a"]);
    expect(withVisibleVariationIds(state, ["a"])).toBe(state);
});

test("never assigns an index outside the colour list", () => {
    const ids = Array.from({ length: MAX_VISIBLE_VARIATIONS }, (_, i) => `v${i}`);
    const state = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ids);
    for (const id of ids) {
        expect(state.colors[id]).toBeGreaterThanOrEqual(0);
        expect(state.colors[id]).toBeLessThan(MAX_VISIBLE_VARIATIONS);
    }
});
