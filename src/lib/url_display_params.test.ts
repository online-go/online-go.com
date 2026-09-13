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

import { sanitizeGameSearchParams, ALLOWED_GAME_URL_PARAMS } from "./url_display_params";

describe("sanitizeGameSearchParams", () => {
    it("keeps allowlisted params like `return`", () => {
        const input = new URLSearchParams("return=https://example.com/foo");
        const out = sanitizeGameSearchParams(input);
        expect(out.get("return")).toBe("https://example.com/foo");
    });

    it("strips a forced-theme / book-theme override attempt", () => {
        const input = new URLSearchParams("theme=book&return=https://example.com");
        const out = sanitizeGameSearchParams(input);
        expect(out.get("theme")).toBeNull();
        expect(out.get("return")).toBe("https://example.com");
    });

    it("strips a forced zen-mode override attempt", () => {
        const input = new URLSearchParams("zen=true");
        const out = sanitizeGameSearchParams(input);
        expect(out.get("zen")).toBeNull();
        expect(out.has("zen")).toBe(false);
    });

    it("strips arbitrary layout/coordinate override attempts", () => {
        const input = new URLSearchParams(
            "layout=compact&coords=kanji&hide_chat=1&hide_toolbar=1",
        );
        const out = sanitizeGameSearchParams(input);
        expect([...out.keys()]).toEqual([]);
    });

    it("only ever exposes the documented allowlist", () => {
        const input = new URLSearchParams(
            "theme=book&zen=true&layout=compact&return=https://example.com&extra=1",
        );
        const out = sanitizeGameSearchParams(input);
        for (const key of out.keys()) {
            expect(ALLOWED_GAME_URL_PARAMS.has(key)).toBe(true);
        }
        expect(out.get("return")).toBe("https://example.com");
    });
});
