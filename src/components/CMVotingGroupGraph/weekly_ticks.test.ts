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

import { MAX_WEEKLY_TICKS, weeklyTickInterval } from "./weekly_ticks";

// How many labels the axis ends up with for a period, given the interval chosen
function tickCount(period: number): number {
    const interval = weeklyTickInterval(period);
    const every = interval === "every week" ? 1 : Number(/^every (\d+) weeks$/.exec(interval)![1]);
    return Math.ceil(period / 7 / every);
}

describe("weeklyTickInterval", () => {
    test("labels every week over a two month period", () => {
        expect(weeklyTickInterval(60)).toBe("every week");
    });

    test("labels every second week over a four month period", () => {
        expect(weeklyTickInterval(120)).toBe("every 2 weeks");
    });

    test("keeps the axis within its label budget however long the period", () => {
        for (const period of [7, 30, 60, 90, 120, 365, 730]) {
            expect(tickCount(period)).toBeLessThanOrEqual(MAX_WEEKLY_TICKS);
        }
    });

    test("never asks for less than every week", () => {
        expect(weeklyTickInterval(1)).toBe("every week");
    });
});
