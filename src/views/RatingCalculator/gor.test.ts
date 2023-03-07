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

import { GorEntry, gor_update } from "./gor";

test("table 1", () => {
    const a = new GorEntry(1800);
    a.gor_configure(0);
    expect(a.expected_win_probability(new GorEntry(1820))).toBeCloseTo(0.457, 3);
    expect(a.expected_win_probability(new GorEntry(1840))).toBeCloseTo(0.414, 3);
    expect(a.expected_win_probability(new GorEntry(1860))).toBeCloseTo(0.372, 3);
    expect(a.expected_win_probability(new GorEntry(1880))).toBeCloseTo(0.333, 3);
});

test("example 3", () => {
    const ra = new GorEntry(2400);
    const rb = new GorEntry(2400);

    ra.gor_configure(0);
    rb.gor_configure(0);

    const na = gor_update(ra, rb, 1);
    const nb = gor_update(rb, ra, 0);
    expect(na.rating).toBeCloseTo(2407.5, 2);
    expect(nb.rating).toBeCloseTo(2392.5, 2);
});

test("example 4", () => {
    const ra = new GorEntry(320);
    const rb = new GorEntry(400);

    ra.gor_configure(0);
    rb.gor_configure(0);

    const na = gor_update(ra, rb, 1);
    expect(na.rating).toBeCloseTo(383, 0);

    const nb = gor_update(rb, ra, 0);
    expect(nb.rating).toBeCloseTo(340, 0);
});

test("example 5", () => {
    const ra = new GorEntry(1850, 450, 0);
    const rb = new GorEntry(2400, undefined, 0);

    const nb = gor_update(rb, ra, 0);
    expect(nb.rating).toBeCloseTo(2389, 0);

    const na = gor_update(ra, rb, 1);
    expect(na.rating).toBeCloseTo(1875, 0);
});
