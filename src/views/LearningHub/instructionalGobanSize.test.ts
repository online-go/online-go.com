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
    instructionalGobanDisplayWidth,
    visibleIntersectionSpan,
    type InstructionalGobanSizeInput,
} from "./instructionalGobanSize";

/** 12pt body font => #em10 (10em) is 160px, matching index.html. */
const EM10 = 160;
const ROOT = 16;
/** Section list (21rem) + lesson text (16rem), from LearningHub.css. */
const DESKTOP_COLUMNS = (17 + 4 + 15 + 1) * ROOT;

function size(
    overrides: Partial<InstructionalGobanSizeInput> &
        Pick<InstructionalGobanSizeInput, "visibleSpan">,
): number {
    return instructionalGobanDisplayWidth({
        em10Width: EM10,
        viewportWidth: 1366,
        viewportHeight: 683,
        // 3.3rem below the navbar + LearningPage padding-top 4rem.
        verticalChrome: (3.3 + 4) * ROOT,
        rootFontSize: ROOT,
        ...overrides,
    });
}

describe("visibleIntersectionSpan", () => {
    test("a full board uses its width", () => {
        expect(visibleIntersectionSpan({ width: 19, height: 19 })).toBe(19);
    });

    test("a corner crop is the visible side, not the nominal 19", () => {
        // The usual Learn to Play Go corner: bounds { top: 10, left: 0, bottom: 18, right: 8 }.
        expect(
            visibleIntersectionSpan({
                width: 19,
                height: 19,
                bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            }),
        ).toBe(9);
    });

    test("missing config is a 9x9", () => {
        expect(visibleIntersectionSpan()).toBe(9);
    });
});

describe("instructionalGobanDisplayWidth", () => {
    test("9x9 keeps the historical 20em cap", () => {
        expect(size({ visibleSpan: 9 })).toBe(EM10 * 2);
    });

    test("a 19x19 cropped down to 9 intersections does not grow", () => {
        const span = visibleIntersectionSpan({
            width: 19,
            height: 19,
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
        });
        expect(size({ visibleSpan: span })).toBe(EM10 * 2);
    });

    test("the reported 1366x683 full 19x19 is larger and still fits the row", () => {
        const width = size({ visibleSpan: 19 });
        // Old code always returned 320, so stones were floor(320/19) = 16px.
        expect(width).toBe(683 - (3.3 + 4) * ROOT);
        expect(width).toBeGreaterThan(EM10 * 2);
        expect(Math.floor(width / 19)).toBeGreaterThan(Math.floor((EM10 * 2) / 19));
        expect(DESKTOP_COLUMNS + width).toBeLessThanOrEqual(1366);
    });

    test("a tall 768px window still keeps the 19x19 beside the text", () => {
        const width = size({ visibleSpan: 19, viewportHeight: 768 });
        expect(width).toBeGreaterThan(EM10 * 2);
        expect(DESKTOP_COLUMNS + width).toBeLessThanOrEqual(1366);
    });

    test("19x19 on a large monitor matches 9x9 stone size", () => {
        const width = size({
            visibleSpan: 19,
            viewportWidth: 1920,
            viewportHeight: 1080,
        });
        expect(width).toBeCloseTo((EM10 * 2 * 19) / 9, 5);
        expect(Math.floor(width / 19)).toBe(Math.floor((EM10 * 2) / 9));
    });

    test("a 1024px window grows the board only up to the leftover column", () => {
        const width = size({ visibleSpan: 19, viewportWidth: 1024, viewportHeight: 768 });
        const beside = 1024 - DESKTOP_COLUMNS;
        expect(width).toBeGreaterThan(EM10 * 2);
        expect(width).toBeLessThanOrEqual(beside);
        expect(DESKTOP_COLUMNS + width).toBeLessThanOrEqual(1024);
    });

    test("a medium window does not shrink the board below the old size", () => {
        const width = size({ visibleSpan: 19, viewportWidth: 800, viewportHeight: 768 });
        expect(width).toBe(EM10 * 2);
    });

    test("a narrow phone does not grow past the viewport", () => {
        const width = size({
            visibleSpan: 19,
            viewportWidth: 390,
            viewportHeight: 700,
        });
        expect(width).toBeLessThanOrEqual(390 - 50);
        expect(width).toBeGreaterThan(0);
    });

    test("an explicit displayWidth is left alone", () => {
        expect(
            size({
                visibleSpan: 19,
                explicitDisplayWidth: 64,
            }),
        ).toBe(64);
    });
});
