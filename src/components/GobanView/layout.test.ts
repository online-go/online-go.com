/* Copyright (C) Online-Go.com */

import {
    classifyGameLayout,
    FULL_HORIZONTAL_REQUIREMENTS,
    legacyViewMode,
    ViewportGeometry,
} from "./layout";

const layout = (width: number, height: number): ViewportGeometry => ({ width, height });

describe("classifyGameLayout", () => {
    test.each([
        [390, 844, "stacked"],
        [430, 932, "stacked"],
        [844, 390, "compactHorizontal"],
        [932, 430, "compactHorizontal"],
        [1440, 900, "fullHorizontal"],
        [768, 1024, "stacked"],
        [1000, 600, "compactHorizontal"],
        [1440, 500, "compactHorizontal"],
    ])("classifies %sx%s as %s", (width, height, expected) => {
        expect(classifyGameLayout(layout(width, height))).toBe(expected);
    });

    test.each([
        [
            FULL_HORIZONTAL_REQUIREMENTS.leftAside +
                FULL_HORIZONTAL_REQUIREMENTS.rightSidebar +
                FULL_HORIZONTAL_REQUIREMENTS.interColumnGaps +
                FULL_HORIZONTAL_REQUIREMENTS.resizer +
                FULL_HORIZONTAL_REQUIREMENTS.minimumUsefulGoban -
                1,
            "compactHorizontal",
        ],
        [
            FULL_HORIZONTAL_REQUIREMENTS.leftAside +
                FULL_HORIZONTAL_REQUIREMENTS.rightSidebar +
                FULL_HORIZONTAL_REQUIREMENTS.interColumnGaps +
                FULL_HORIZONTAL_REQUIREMENTS.resizer +
                FULL_HORIZONTAL_REQUIREMENTS.minimumUsefulGoban,
            "fullHorizontal",
        ],
        [
            FULL_HORIZONTAL_REQUIREMENTS.leftAside +
                FULL_HORIZONTAL_REQUIREMENTS.rightSidebar +
                FULL_HORIZONTAL_REQUIREMENTS.interColumnGaps +
                FULL_HORIZONTAL_REQUIREMENTS.resizer +
                FULL_HORIZONTAL_REQUIREMENTS.minimumUsefulGoban +
                1,
            "fullHorizontal",
        ],
    ])("handles the full-horizontal width boundary", (width, expected) => {
        expect(classifyGameLayout(layout(width, 900))).toBe(expected);
    });

    test("is deterministic and does not depend on prior mode", () => {
        const viewport = layout(844, 390);
        expect(classifyGameLayout(viewport)).toBe(classifyGameLayout(viewport));
    });

    test.each([
        [390, 844, "stacked", "portrait"],
        [844, 390, "compactHorizontal", "wide"],
        [1440, 900, "fullHorizontal", "wide"],
    ])("projects %sx%s to the legacy controller mode", (width, height, mode, legacy) => {
        expect(classifyGameLayout(layout(width, height))).toBe(mode);
        expect(legacyViewMode(mode as "stacked" | "compactHorizontal" | "fullHorizontal")).toBe(
            legacy,
        );
    });

    test("rotation and geometry callbacks cannot retain a prior mode", () => {
        const sequence = [
            layout(390, 844),
            layout(844, 390),
            layout(390, 844),
            layout(844, 390),
            layout(390, 844),
        ];
        expect(sequence.map(classifyGameLayout)).toEqual([
            "stacked",
            "compactHorizontal",
            "stacked",
            "compactHorizontal",
            "stacked",
        ]);
        expect(classifyGameLayout(layout(844, 390))).toBe("compactHorizontal");
        expect(classifyGameLayout(layout(844, 390))).toBe("compactHorizontal");
    });
});
