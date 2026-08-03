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

import { fromDatetimeLocalValue, toDatetimeLocalValue } from "./datetime_input";

/* The Date constructor's multi-argument form builds a local-time date, and the
 * helpers are local-only, so these expectations hold in any timezone. */

describe("toDatetimeLocalValue", () => {
    test("formats a local date as YYYY-MM-DDTHH:mm", () => {
        expect(toDatetimeLocalValue(new Date(2026, 7, 2, 15, 4))).toBe("2026-08-02T15:04");
    });

    test("zero-pads single digit month, day, hour and minute", () => {
        expect(toDatetimeLocalValue(new Date(2026, 0, 9, 3, 7))).toBe("2026-01-09T03:07");
    });

    test("drops seconds", () => {
        expect(toDatetimeLocalValue(new Date(2026, 7, 2, 15, 4, 59))).toBe("2026-08-02T15:04");
    });

    test("returns an empty string for an invalid date", () => {
        expect(toDatetimeLocalValue(new Date("not a date"))).toBe("");
    });
});

describe("fromDatetimeLocalValue", () => {
    test("parses the value as local wall-clock time", () => {
        expect(fromDatetimeLocalValue("2026-08-02T15:04")).toEqual(new Date(2026, 7, 2, 15, 4));
    });

    test("returns undefined for an empty field", () => {
        expect(fromDatetimeLocalValue("")).toBeUndefined();
    });

    test("returns undefined for a value that cannot be parsed", () => {
        expect(fromDatetimeLocalValue("not a date")).toBeUndefined();
    });

    test("round-trips a date truncated to the minute", () => {
        const original = new Date(2026, 7, 2, 15, 4);
        expect(fromDatetimeLocalValue(toDatetimeLocalValue(original))).toEqual(original);
    });
});
