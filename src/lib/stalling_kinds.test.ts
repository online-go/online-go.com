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

import { composeStallingNote, STALLING_KIND_OPTIONS } from "@/lib/stalling_kinds";

describe("composeStallingNote", () => {
    // The canonical line is written into reporter_note in English regardless of the
    // reporter's locale, so moderators and CMs always see consistent text. These
    // strings are read by humans in the reports center — a change to one is a real
    // behavior change, which is why each is pinned exactly.
    const cases: Array<[kind: string, line: string]> = [
        ["pointless_moves", "Stalling: repeatedly played moves that serve no purpose"],
        ["self_filling", "Stalling: infilling their own territory for no reason"],
        ["rejecting_score", "Stalling: repeatedly rejecting correct score"],
        ["autoscore_spam", "Stalling: clicking autoscore repeatedly"],
        ["undo_spam", "Stalling: spamming undo"],
        ["other", "Stalling: something else"],
    ];

    test.each(cases)("%s composes its canonical line", (kind, line) => {
        expect(composeStallingNote(kind as never, "")).toBe(line);
    });

    test("the reporter's free text follows the canonical line after a blank line", () => {
        expect(composeStallingNote("undo_spam", "They kept requesting undo of every move.")).toBe(
            "Stalling: spamming undo\n\nThey kept requesting undo of every move.",
        );
    });

    test("surrounding whitespace in the free text is trimmed away", () => {
        expect(composeStallingNote("undo_spam", "  details here \n")).toBe(
            "Stalling: spamming undo\n\ndetails here",
        );
    });

    test("whitespace-only free text yields just the canonical line", () => {
        expect(composeStallingNote("undo_spam", "   \n ")).toBe("Stalling: spamming undo");
    });

    test("every selectable option has a distinct kind and canonical line", () => {
        const kinds = STALLING_KIND_OPTIONS.map((o) => o.kind);
        const canonicals = STALLING_KIND_OPTIONS.map((o) => composeStallingNote(o.kind, ""));
        expect(new Set(kinds).size).toBe(kinds.length);
        expect(new Set(canonicals).size).toBe(canonicals.length);
        expect(kinds).toEqual(cases.map(([kind]) => kind));
    });
});
