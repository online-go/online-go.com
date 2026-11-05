/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { formatKibitzVariationDisplayNames } from "./kibitzVariationDisplayName";

const UNTITLED = "Untitled variation";

function labelsWith(
    variations: Array<{ id: string; title?: string; created_at: number }>,
    formatSharedTitle: (name: string, ordinal: number) => string,
): Map<string, string> {
    const displays = formatKibitzVariationDisplayNames(variations, {
        untitledLabel: UNTITLED,
        formatSharedTitle,
    });
    const labels = new Map<string, string>();
    for (const [id, display] of displays) {
        labels.set(
            id,
            display.ordinal == null
                ? display.name
                : formatSharedTitle(display.name, display.ordinal),
        );
    }
    return labels;
}

function names(
    variations: Array<{ id: string; title?: string; created_at: number }>,
): Map<string, string> {
    return labelsWith(variations, (name, ordinal) => `${name} (${ordinal})`);
}

test("a title that no other variation shares is unchanged, including surrounding spaces", () => {
    const displayNames = names([
        { id: "a", title: "Joseki", created_at: 2 },
        { id: "b", title: "  Ladder  ", created_at: 1 },
        { id: "c", title: undefined, created_at: 3 },
    ]);

    expect(displayNames.get("a")).toBe("Joseki");
    expect(displayNames.get("b")).toBe("  Ladder  ");
    expect(displayNames.get("c")).toBe(UNTITLED);
});

test("a single missing, empty, or whitespace title stays the untitled label or the original text", () => {
    expect(names([{ id: "missing", created_at: 1 }]).get("missing")).toBe(UNTITLED);
    expect(names([{ id: "empty", title: "", created_at: 1 }]).get("empty")).toBe(UNTITLED);
    // A unique whitespace title is truthy, so the list still shows it as stored.
    expect(names([{ id: "spaces", title: "   ", created_at: 1 }]).get("spaces")).toBe("   ");
});

test("shared titles are numbered from 1 in posting order, not input order", () => {
    const displayNames = names([
        { id: "later", title: "Ladder", created_at: 30 },
        { id: "earlier", title: " Ladder ", created_at: 10 },
        { id: "middle", title: "Ladder", created_at: 20 },
        { id: "other", title: "Joseki", created_at: 15 },
    ]);

    expect(displayNames.get("earlier")).toBe("Ladder (1)");
    expect(displayNames.get("middle")).toBe("Ladder (2)");
    expect(displayNames.get("later")).toBe("Ladder (3)");
    expect(displayNames.get("other")).toBe("Joseki");
});

test("equal created times break ties by id", () => {
    const displayNames = names([
        { id: "b", title: "Ladder", created_at: 10 },
        { id: "a", title: "Ladder", created_at: 10 },
    ]);

    expect(displayNames.get("a")).toBe("Ladder (1)");
    expect(displayNames.get("b")).toBe("Ladder (2)");
});

test("generated ordinals skip a label that another row already displays", () => {
    const displayNames = names([
        { id: "first", title: "Ladder", created_at: 1 },
        { id: "second", title: "Ladder", created_at: 2 },
        { id: "stored", title: "Ladder (1)", created_at: 3 },
    ]);

    expect(displayNames.get("first")).toBe("Ladder (2)");
    expect(displayNames.get("second")).toBe("Ladder (3)");
    expect(displayNames.get("stored")).toBe("Ladder (1)");
    expect(new Set(displayNames.values()).size).toBe(displayNames.size);
});

test("a padded stored title reserves the label the row will show", () => {
    const displayNames = names([
        { id: "first", title: "Ladder", created_at: 1 },
        { id: "second", title: "Ladder", created_at: 2 },
        { id: "stored", title: " Ladder (1) ", created_at: 3 },
    ]);

    expect(displayNames.get("first")).toBe("Ladder (2)");
    expect(displayNames.get("second")).toBe("Ladder (3)");
    expect(displayNames.get("stored")).toBe(" Ladder (1) ");
    expect(
        new Set([...displayNames.values()].map((label) => label.trim().replace(/\s+/g, " "))).size,
    ).toBe(displayNames.size);
});

test("internal whitespace in a stored title reserves the collapsed label", () => {
    const displayNames = names([
        { id: "first", title: "Ladder", created_at: 1 },
        { id: "second", title: "Ladder", created_at: 2 },
        { id: "stored", title: "Ladder  (1)", created_at: 3 },
    ]);

    expect(displayNames.get("first")).toBe("Ladder (2)");
    expect(displayNames.get("second")).toBe("Ladder (3)");
    expect(displayNames.get("stored")).toBe("Ladder  (1)");
});

test("an ordinal in the middle of the sequence is skipped when that label is already used", () => {
    const displayNames = names([
        { id: "first", title: "Ladder", created_at: 1 },
        { id: "second", title: "Ladder", created_at: 2 },
        { id: "stored", title: "Ladder (2)", created_at: 3 },
    ]);

    expect(displayNames.get("first")).toBe("Ladder (1)");
    expect(displayNames.get("second")).toBe("Ladder (3)");
    expect(displayNames.get("stored")).toBe("Ladder (2)");
    expect(new Set(displayNames.values()).size).toBe(displayNames.size);
});

test("titles that collapse to the same words share one ordinal sequence", () => {
    const displayNames = names([
        { id: "a1", title: "Ladder A", created_at: 1 },
        { id: "b1", title: "Ladder  A", created_at: 2 },
        { id: "a2", title: "Ladder A", created_at: 3 },
        { id: "b2", title: "Ladder  A", created_at: 4 },
    ]);

    expect(displayNames.get("a1")).toBe("Ladder A (1)");
    expect(displayNames.get("b1")).toBe("Ladder A (2)");
    expect(displayNames.get("a2")).toBe("Ladder A (3)");
    expect(displayNames.get("b2")).toBe("Ladder A (4)");
    expect(new Set(displayNames.values()).size).toBe(4);
});

test("a generated label is reserved so a later group cannot reuse it", () => {
    const displayNames = labelsWith(
        [
            { id: "a1", title: "Alpha", created_at: 1 },
            { id: "a2", title: "Alpha", created_at: 2 },
            { id: "b1", title: "Beta", created_at: 3 },
            { id: "b2", title: "Beta", created_at: 4 },
        ],
        (_name, ordinal) => `#${ordinal}`,
    );

    expect(displayNames.get("a1")).toBe("#1");
    expect(displayNames.get("a2")).toBe("#2");
    expect(displayNames.get("b1")).toBe("#3");
    expect(displayNames.get("b2")).toBe("#4");
    expect(new Set(displayNames.values()).size).toBe(4);
});

test("an ordinal is skipped when the rendered suffix matches a stored title", () => {
    const displayNames = labelsWith(
        [
            { id: "first", title: "Ladder", created_at: 1 },
            { id: "second", title: "Ladder", created_at: 2 },
            { id: "stored", title: "Ladder #1", created_at: 3 },
        ],
        (name, ordinal) => `${name} #${ordinal}`,
    );

    expect(displayNames.get("first")).toBe("Ladder #2");
    expect(displayNames.get("second")).toBe("Ladder #3");
    expect(displayNames.get("stored")).toBe("Ladder #1");
});

test("case differences stay distinct, and blank titles share the untitled name", () => {
    const displayNames = names([
        { id: "lower", title: "ladder", created_at: 1 },
        { id: "upper", title: "Ladder", created_at: 2 },
        { id: "blank", title: "   ", created_at: 3 },
        { id: "missing", created_at: 4 },
    ]);

    expect(displayNames.get("lower")).toBe("ladder");
    expect(displayNames.get("upper")).toBe("Ladder");
    expect(displayNames.get("blank")).toBe("Untitled variation (1)");
    expect(displayNames.get("missing")).toBe("Untitled variation (2)");
});
