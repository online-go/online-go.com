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

import { Glicko2Entry, glicko2_update } from "./glicko2";

test("glicko2", () => {
    let player = new Glicko2Entry(1500, 200, 0.06);
    player.glicko2_configure(0.5, 10, 500);

    const a = new Glicko2Entry(1400, 30, 0.06);
    a.glicko2_configure(0.5, 10, 500);

    const b = new Glicko2Entry(1550, 100, 0.06);
    b.glicko2_configure(0.5, 10, 500);

    const c = new Glicko2Entry(1700, 300, 0.06);
    c.glicko2_configure(0.5, 10, 500);

    player = glicko2_update(player, [
        [a, 1],
        [b, 0],
        [c, 0],
    ]);

    expect(player.rating).toBeCloseTo(1464.1, 1);
    expect(player.deviation).toBeCloseTo(151.5, 1);
});

test("str", () => {
    const player = new Glicko2Entry(1500, 200, 0.06);
    expect(typeof player.GEstr()).toBe("string");
});

test("expansion", () => {
    const player = new Glicko2Entry(1500, 200, 0.06);
    player.expand_deviation_because_no_games_played(1);
    expect(player.deviation).toBeCloseTo(200.3, 1);
});

test("copy", () => {
    const player = new Glicko2Entry(1500, 200, 0.06);
    const copy = player.copy();
    expect(copy.rating).toBe(player.rating);
    expect(copy.deviation).toBe(player.deviation);
    expect(copy.volatility).toBe(player.volatility);
    expect(copy.mu).toBe(player.mu);
    expect(copy.phi).toBe(player.phi);
});

test("expected_win_probability", () => {
    const player = new Glicko2Entry(1500, 200, 0.06);
    expect(player.expected_win_probability(player, 0)).toBe(0.5);
});

test("nop", () => {
    const player = new Glicko2Entry(1500, 200, 0.06);
    const p = glicko2_update(player, []);
    expect(p.rating).toBe(player.rating);
});

test("exercise", () => {
    const player = new Glicko2Entry(1500, 200, 0.06);
    glicko2_update(player, [
        [new Glicko2Entry(100, 100), 0],
        [new Glicko2Entry(30000, 10000), 1],
        [new Glicko2Entry(1500, 100), 1],
        [new Glicko2Entry(1500, 100), 0],
    ]);
});
