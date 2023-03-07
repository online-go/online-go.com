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

export class Glicko2Entry {
    rating: number;
    deviation: number;
    volatility: number;
    mu: number;
    phi: number;
    GLICKO2_SCALE = 173.7178;
    TAO: number;
    MAX_RD: number;
    MIN_RD: number;

    constructor(rating: number = 1500, deviation: number = 350, volatility: number = 0.06) {
        this.rating = rating;
        this.deviation = deviation;
        this.volatility = volatility;
        this.mu = (this.rating - 1500) / this.GLICKO2_SCALE;
        this.phi = this.deviation / this.GLICKO2_SCALE;
        //const TAO = 1.2
        this.TAO = 0.5;
        this.MAX_RD = 500.0;
        this.MIN_RD = 30.0;
    }

    GEstr() {
        return (
            this.rating.toFixed(2) +
            " +- " +
            this.deviation.toFixed(2) +
            "( " +
            this.volatility.toFixed(6) +
            "[" +
            (this.volatility * this.GLICKO2_SCALE).toFixed(4) +
            "]" +
            " )"
        );
    }

    copy(rating_adjustment: number = 0.0, rd_adjustment: number = 0.0) {
        const ret = new Glicko2Entry(
            this.rating + rating_adjustment,
            this.deviation + rd_adjustment,
            this.volatility,
        );
        return ret;
    }

    expand_deviation_because_no_games_played(n_periods: number = 1) {
        // Implementation as defined by:
        //  http://www.glicko.net/glicko/glicko2.pdf (note after step 8)

        for (let i = 0; i < n_periods; i++) {
            const phi_prime = Math.sqrt(this.phi ** 2 + this.volatility ** 2);
            this.deviation = Math.min(
                this.MAX_RD,
                Math.max(this.MIN_RD, this.GLICKO2_SCALE * phi_prime),
            );
            this.phi = this.deviation / this.GLICKO2_SCALE;
        }

        return this;
    }

    expected_win_probability(
        white: Glicko2Entry,
        handicap_adjustment: number,
        ignore_g: boolean = false,
    ) {
        // Implementation as defined by: http://www.glicko.net/glicko/glicko.pdf
        const q = 0.0057565;
        const g = function (rd: number, deviation: number, ig: boolean) {
            if (!ig) {
                return 1;
            } else {
                return 1 / Math.sqrt(1 + (3 * q ** 2 * deviation ** 2) / Math.PI ** 2);
            }
        };
        const E =
            1 /
            (1 +
                10 **
                    ((-g(
                        Math.sqrt(this.deviation ** 2 + white.deviation ** 2),
                        this.deviation,
                        ignore_g,
                    ) *
                        (this.rating + handicap_adjustment - white.rating)) /
                        400));
        return E;
    }

    glicko2_configure(tao: number, min_rd: number, max_rd: number) {
        this.TAO = tao;
        this.MIN_RD = min_rd;
        this.MAX_RD = max_rd;
    }
}

export function glicko2_update(player: Glicko2Entry, matches: [Glicko2Entry, number][]) {
    // Implementation as defined by: http://www.glicko.net/glicko/glicko2.pdf

    const EPSILON = 0.000001;
    const MIN_RATING = 100.0;
    const MAX_RATING = 6000.0;

    if (matches.length === 0) {
        return player.copy();
    }
    // step 1/2 implicitly done during Glicko2Entry construction

    // step 3 / 4, compute 'v' and delta
    let v_sum = 0.0;
    let delta_sum = 0.0;
    let v: number;
    for (let i = 0; i < matches.length; i++) {
        const m = matches[i];
        const p = m[0];
        const outcome = m[1];
        const g_phi_j = 1 / Math.sqrt(1 + (3 * p.phi ** 2) / Math.PI ** 2);
        const E = 1 / (1 + Math.exp(-g_phi_j * (player.mu - p.mu)));
        v_sum += g_phi_j ** 2 * E * (1 - E);
        delta_sum += g_phi_j * (outcome - E);
    }
    if (v_sum) {
        v = 1.0 / v_sum;
    } else {
        v = 9999;
    }

    const delta = v * delta_sum;

    // step 5
    const a = Math.log(player.volatility ** 2);

    function f(x: number) {
        const ex = Math.exp(x);
        return (
            (ex * (delta ** 2 - player.phi ** 2 - v - ex)) / (2 * (player.phi ** 2 + v + ex) ** 2) -
            (x - a) / player.TAO ** 2
        );
    }
    let A = a;
    let B: number;
    if (delta ** 2 > player.phi ** 2 + v) {
        B = Math.log(delta ** 2 - player.phi ** 2 - v);
    } else {
        let k = 1;
        let safety = 100;
        while (f(a - k * player.TAO) < 0 && safety > 0) {
            // pragma: no cover
            safety -= 1;
            k += 1;
        }
        B = a - k * player.TAO;
    }
    let fA = f(A);
    let fB = f(B);
    let safety = 100;

    while (Math.abs(B - A) > EPSILON && safety > 0) {
        const C = A + ((A - B) * fA) / (fB - fA);
        const fC = f(C);
        if (fC * fB <= 0) {
            A = B;
            fA = fB;
        } else {
            fA = fA / 2;
        }
        B = C;
        fB = fC;

        safety -= 1;
    }

    const new_volatility = Math.exp(A / 2);

    // step 6
    const phi_star = Math.sqrt(player.phi ** 2 + new_volatility ** 2);

    // step 7
    const phi_prime = 1 / Math.sqrt(1 / phi_star ** 2 + 1 / v);
    const mu_prime = player.mu + phi_prime ** 2 * delta_sum;

    // step 8
    const ret = new Glicko2Entry(
        /*rating=*/ Math.min(
            MAX_RATING,
            Math.max(MIN_RATING, player.GLICKO2_SCALE * mu_prime + 1500),
        ),
        /*deviation=*/ Math.min(
            player.MAX_RD,
            Math.max(player.MIN_RD, player.GLICKO2_SCALE * phi_prime),
        ),
        /*volatility=*/ Math.min(0.15, Math.max(0.01, new_volatility)),
    );
    return ret;
}
