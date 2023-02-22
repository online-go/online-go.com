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

export function test_table_1() {
    const a = new GorEntry(1800);
    a.gor_configure(0);
    console.assert(
        a.expected_win_probability(new GorEntry(1820)).toFixed(3) === "0.457",
        a.expected_win_probability(new GorEntry(1820)).toFixed(3) + " not equal 0.457",
    );
    console.assert(
        a.expected_win_probability(new GorEntry(1840)).toFixed(3) === "0.414",
        a.expected_win_probability(new GorEntry(1840)).toFixed(3) + "not equal 0.414",
    );
    console.assert(
        a.expected_win_probability(new GorEntry(1860)).toFixed(3) === "0.372",
        a.expected_win_probability(new GorEntry(1860)).toFixed(3) + "not equal 0.372",
    );
    console.assert(
        a.expected_win_probability(new GorEntry(1880)).toFixed(3) === "0.333",
        a.expected_win_probability(new GorEntry(1880)).toFixed(3) + "not equal 0.333",
    );
    //console.assert(false, "this is false test");
    //console.log("pass?");
}

export function test_example_3() {
    const ra = new GorEntry(2400);
    const rb = new GorEntry(2400);

    ra.gor_configure(0);
    rb.gor_configure(0);

    //console.log(ra.expected_win_probability(rb));

    const na = gor_update(ra, rb, 1);
    const nb = gor_update(rb, ra, 0);
    console.assert(na.rating.toFixed(1) === "2407.5", na.rating.toFixed(1) + " not equal 2407.5");
    console.assert(nb.rating.toFixed(1) === "2392.5", nb.rating.toFixed(1) + " not equal 2392.5");
    //console.log("pass?");
}

export function test_example_4() {
    const ra = new GorEntry(320);
    const rb = new GorEntry(400);

    ra.gor_configure(0);
    rb.gor_configure(0);

    const na = gor_update(ra, rb, 1);
    console.assert(na.rating.toFixed(0) === "383", na.rating.toFixed(0) + " not equal 383");

    const nb = gor_update(rb, ra, 0);
    console.assert(nb.rating.toFixed(0) === "340", nb.rating.toFixed(0) + " not equal 340");
    //console.log("pass?");
}

export function test_example_5() {
    const ra = new GorEntry(1850, 450, 0);
    const rb = new GorEntry(2400, undefined, 0);

    const nb = gor_update(rb, ra, 0);
    console.assert(nb.rating.toFixed(0) === "2389", nb.rating.toFixed(0) + " not equal to 2389");

    const na = gor_update(ra, rb, 1);
    console.assert(na.rating.toFixed(0) === "1875", na.rating.toFixed(0) + " not equal to 1875");
    //console.log("pass?");
}
