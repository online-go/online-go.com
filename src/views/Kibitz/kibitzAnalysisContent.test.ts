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

import { hasKibitzAnalysisContent } from "./kibitzAnalysisContent";

describe("hasKibitzAnalysisContent", () => {
    test.each([
        ["aa", undefined, undefined, true],
        ["", { triangle: "aabb", A: "cc" }, undefined, true],
        ["", undefined, [{ color: "#000000", points: [1, 2, 3, 4] }], true],
        ["", undefined, undefined, false],
        ["", {}, [], false],
        ["", { triangle: "" }, undefined, false],
        ["", { triangle: "a" }, undefined, false],
        ["", { triangle: 42 }, undefined, false],
        ["", undefined, [{ color: "#000000", points: [1, NaN, 3, 4] }], false],
        ["", undefined, [{ color: "#000000", points: [1, 2, 3] }], false],
        [undefined, { triangle: "aa" }, undefined, false],
        [" ", { triangle: "aa" }, undefined, false],
    ])("validates moves %p, marks %p and pen drawings %p", (moves, marks, pen, expected) => {
        expect(hasKibitzAnalysisContent(moves, marks, pen)).toBe(expected);
    });
});
