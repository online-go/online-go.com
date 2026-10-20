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

import { lengthInUtf8Bytes, splitOnBytes } from "./misc";

const EMOJI = "\u{1F600}"; // 2 UTF-16 code units, 4 UTF-8 bytes
const HIGH = "\uD83D"; // lone high surrogate
const LOW = "\uDE00"; // lone low surrogate

function utf8Length(str: string): number {
    return Buffer.byteLength(str, "utf8");
}

describe("lengthInUtf8Bytes", () => {
    test("counts bytes like a UTF-8 encoder", () => {
        for (const str of ["", "abc", "é", "€", "囲碁", EMOJI, `a${EMOJI}b`]) {
            expect(lengthInUtf8Bytes(str)).toBe(utf8Length(str));
        }
    });

    test("counts a lone surrogate as a replacement character", () => {
        expect(lengthInUtf8Bytes(HIGH)).toBe(3);
        expect(lengthInUtf8Bytes(LOW)).toBe(3);
        expect(lengthInUtf8Bytes(`a${HIGH}`)).toBe(4);
        expect(lengthInUtf8Bytes(`${LOW}${HIGH}`)).toBe(6);
    });
});

describe("splitOnBytes", () => {
    test("keeps a short message whole", () => {
        expect(splitOnBytes("hello", 500)).toEqual(["hello", ""]);
        expect(splitOnBytes("", 500)).toEqual(["", ""]);
    });

    test("splits ASCII at the byte limit", () => {
        const msg = "a".repeat(510);
        expect(splitOnBytes(msg, 500)).toEqual(["a".repeat(500), "a".repeat(10)]);
    });

    test("splits multi-byte text on a character boundary", () => {
        const msg = "囲".repeat(200); // 3 bytes each
        const [head, tail] = splitOnBytes(msg, 500);
        expect(head).toBe("囲".repeat(166));
        expect(tail).toBe("囲".repeat(34));
    });

    test("does not cut a surrogate pair in half", () => {
        /* 499 ASCII bytes leave room for only part of the emoji. */
        const msg = "a".repeat(499) + EMOJI + "b";
        const [head, tail] = splitOnBytes(msg, 500);
        expect(head).toBe("a".repeat(499));
        expect(tail).toBe(EMOJI + "b");
    });

    test("does not throw on lone surrogates", () => {
        const msg = (HIGH + "x" + LOW).repeat(200);
        expect(() => splitOnBytes(msg, 500)).not.toThrow();
        const [head, tail] = splitOnBytes(msg, 500);
        expect(head + tail).toBe(msg);
        expect(lengthInUtf8Bytes(head)).toBeLessThanOrEqual(500);
    });

    test("splits a long emoji message into valid chunks", () => {
        let msg = (EMOJI + "a").repeat(300);
        const original = msg;
        const chunks: string[] = [];
        while (msg.length) {
            const [head, tail] = splitOnBytes(msg, 500);
            chunks.push(head);
            msg = tail;
        }
        expect(chunks.join("")).toBe(original);
        for (const chunk of chunks) {
            expect(utf8Length(chunk)).toBeLessThanOrEqual(500);
            expect(() => encodeURIComponent(chunk)).not.toThrow();
        }
    });

    test("always makes progress", () => {
        expect(splitOnBytes(EMOJI + EMOJI, 2)).toEqual([EMOJI, EMOJI]);
    });
});
