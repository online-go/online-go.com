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

import { effective_bottom_inset, update_safe_area_variables } from "./safe_area";

describe("effective_bottom_inset", () => {
    test("drops an inset the viewport already stops above", () => {
        /* Measured on Chrome/Android: the reported inset is exactly the gap
         * between the bottom of the viewport and the bottom of the screen, so
         * the gesture bar is already accounted for. */
        expect(effective_bottom_inset(36, 36)).toBe(0);
    });

    test("keeps an inset the viewport genuinely extends under", () => {
        /* Edge-to-edge: the viewport reaches the bottom of the screen, so the
         * home indicator really does overlap page content. */
        expect(effective_bottom_inset(34, 0)).toBe(34);
    });

    test("keeps the inset when the gap cannot be attributed to it", () => {
        /* iOS Safari does not report a usable window.screenY, so the computed
         * gap includes the browser chrome and will not match the inset. The
         * padding has to survive that. */
        expect(effective_bottom_inset(34, 107)).toBe(34);
    });

    test("tolerates subpixel rounding between the two measurements", () => {
        expect(effective_bottom_inset(36, 39)).toBe(0);
        expect(effective_bottom_inset(36, 33)).toBe(0);
    });

    test("does not drop an inset over a gap that merely resembles it", () => {
        expect(effective_bottom_inset(36, 45)).toBe(36);
    });

    test("reports no inset when the browser reports none", () => {
        expect(effective_bottom_inset(0, 0)).toBe(0);
        expect(effective_bottom_inset(0, 36)).toBe(0);
    });

    test("survives unmeasurable screen metrics", () => {
        expect(effective_bottom_inset(34, NaN)).toBe(34);
    });
});

describe("update_safe_area_variables", () => {
    afterEach(() => {
        document.documentElement.style.removeProperty("--safe-area-inset-bottom");
    });

    test("sets the variable when the document has a body", () => {
        update_safe_area_variables();
        expect(document.documentElement.style.getPropertyValue("--safe-area-inset-bottom")).toBe(
            "0px",
        );
    });

    test("measures without a body", () => {
        /* A resize event can arrive while document.body is null. */
        const body = document.body;
        body.remove();
        try {
            expect(document.body).toBeNull();
            expect(() => update_safe_area_variables()).not.toThrow();
            expect(
                document.documentElement.style.getPropertyValue("--safe-area-inset-bottom"),
            ).toBe("0px");
            expect(document.documentElement.childElementCount).toBe(1);
        } finally {
            document.documentElement.appendChild(body);
        }
    });
});
