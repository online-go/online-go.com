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

export function test_glicko2() {
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

    console.assert(
        player.rating.toFixed(1) === "1464.1",
        player.rating.toFixed(1) + " not equal 1464.1",
    );
    console.assert(
        player.deviation.toFixed(1) === "151.5",
        player.rating.toFixed(1) + " not equal 151.5",
    );
    //console.log("pass?");
}

export function test_str() {
    const player = new Glicko2Entry(1500, 200, 0.06);
    console.assert(typeof player.GEstr() === "string", "GE string is not a string");
    //console.log("pass?");
}

export function test_expansion() {
    const player = new Glicko2Entry(1500, 200, 0.06);
    player.expand_deviation_because_no_games_played(1);
    console.assert(
        player.deviation.toFixed(1) === "200.3",
        player.deviation.toFixed(1) + " not equal 200.3",
    );
    //console.log("pass?");
}

export function test_copy() {
    const player = new Glicko2Entry(1500, 200, 0.06);
    const copy = player.copy();
    console.assert(copy.rating === player.rating, copy.rating + " not equal " + player.rating);
    console.assert(
        copy.deviation === player.deviation,
        copy.deviation + " not equal " + player.deviation,
    );
    console.assert(
        copy.volatility === player.volatility,
        copy.volatility + " not equal " + player.volatility,
    );
    console.assert(copy.mu === player.mu, copy.mu + " not equal " + player.mu);
    console.assert(copy.phi === player.phi, copy.phi + " not equal " + player.phi);
    //console.log("pass?");
}

export function test_expected_win_probability() {
    const player = new Glicko2Entry(1500, 200, 0.06);
    console.assert(
        player.expected_win_probability(player, 0) === 0.5,
        player.expected_win_probability(player, 0) + " not equal 0.5",
    );
    //console.log("pass?");
}

export function test_nop() {
    const player = new Glicko2Entry(1500, 200, 0.06);
    const p = glicko2_update(player, []);
    console.assert(p.rating === player.rating, p.rating + " is not equal " + player.rating);
    //console.log("pass?");
}

export function test_exercise() {
    const player = new Glicko2Entry(1500, 200, 0.06);
    glicko2_update(player, [
        [new Glicko2Entry(100, 100), 0],
        [new Glicko2Entry(30000, 10000), 1],
        [new Glicko2Entry(1500, 100), 1],
        [new Glicko2Entry(1500, 100), 0],
    ]);
    //console.log("pass?");
}
