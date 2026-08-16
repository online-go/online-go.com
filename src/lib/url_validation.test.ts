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

import { is_valid_url, valid_next_url } from "./url_validation";

describe("valid_next_url", () => {
    test("accepts a bare root path", () => {
        expect(valid_next_url("/")).toBe("/");
    });

    test("accepts an internal relative path", () => {
        expect(valid_next_url("/game/12345")).toBe("/game/12345");
    });

    test("accepts an internal path with query and hash", () => {
        expect(valid_next_url("/group/42?tab=players#schedule")).toBe(
            "/group/42?tab=players#schedule",
        );
    });

    test("accepts a same-origin absolute url, normalized to a path", () => {
        expect(valid_next_url(window.location.origin + "/welcome")).toBe("/welcome");
    });

    test("rejects a javascript url", () => {
        expect(valid_next_url("javascript:alert(1)")).toBeNull();
    });

    test("rejects a javascript url with leading whitespace", () => {
        expect(valid_next_url("  javascript:alert(1)")).toBeNull();
    });

    test("rejects a data url", () => {
        expect(valid_next_url("data:text/html,<script>alert(1)</script>")).toBeNull();
    });

    test("rejects an off-site url", () => {
        expect(valid_next_url("https://evil.example/phish")).toBeNull();
    });

    test("rejects a protocol-relative url", () => {
        expect(valid_next_url("//evil.example/phish")).toBeNull();
    });

    test("rejects a protocol-relative url using backslashes", () => {
        expect(valid_next_url("/\\evil.example/phish")).toBeNull();
    });

    test("rejects an embedded-tab protocol-relative url (control chars are stripped by the browser)", () => {
        expect(valid_next_url("/\t/evil.example/phish")).toBeNull();
        expect(valid_next_url("/\n/evil.example/phish")).toBeNull();
        expect(valid_next_url("/\r/evil.example/phish")).toBeNull();
    });

    test("strips harmless internal control characters on a safe path", () => {
        expect(valid_next_url("/game/\t12345")).toBe("/game/12345");
    });

    test("rejects null, empty and whitespace-only input", () => {
        expect(valid_next_url(null)).toBeNull();
        expect(valid_next_url("")).toBeNull();
        expect(valid_next_url("   ")).toBeNull();
    });
});

describe("is_valid_url", () => {
    test("accepts http and https urls", () => {
        expect(is_valid_url("https://example.com")).toBe(true);
        expect(is_valid_url("http://example.com")).toBe(true);
    });

    test("rejects javascript and data urls", () => {
        expect(is_valid_url("javascript:alert(1)")).toBe(false);
        expect(is_valid_url("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    test("rejects empty and non-string input", () => {
        expect(is_valid_url("")).toBe(false);
        expect(is_valid_url(undefined as unknown as string)).toBe(false);
    });
});
