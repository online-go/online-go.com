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

import { getMovePathToRestore } from "./KibitzBoard";

describe("getMovePathToRestore", () => {
    it("uses the original source path when the current restore path is blank and the source is preferred", () => {
        expect(getMovePathToRestore("", "aa", true)).toBe("aa");
    });

    it("keeps a blank current path when it is authoritative", () => {
        expect(getMovePathToRestore("", "aa", false)).toBe("");
    });

    it("falls back to the current path when there is no source path to restore", () => {
        expect(getMovePathToRestore("bb", undefined, true)).toBe("bb");
    });
});
