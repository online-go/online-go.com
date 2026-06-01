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

import * as preferences from "@/lib/preferences";

describe("last-move crosshair preferences", () => {
    test("defaults are disabled, blue, thickness 0.1", () => {
        expect(preferences.get("accessibility.last-move-crosshair")).toBe(false);
        expect(preferences.get("accessibility.last-move-crosshair-color")).toBe("#1e6bff");
        expect(preferences.get("accessibility.last-move-crosshair-thickness")).toBe(0.1);
    });
});
