/* Copyright (C) Online-Go.com */

import {
    classifyGameLayout,
    FULL_HORIZONTAL_REQUIREMENTS,
    getGameLayoutSnapshot,
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
        [390, 450, "stacked"],
        [599, 700, "stacked"],
        [600, 700, "compactHorizontal"],
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

describe("layout snapshot while an on-screen keyboard is open", () => {
    let input: HTMLTextAreaElement;

    function resize(width: number, height: number): void {
        Object.defineProperty(window, "innerWidth", { value: width, configurable: true });
        Object.defineProperty(window, "innerHeight", { value: height, configurable: true });
        window.dispatchEvent(new Event("resize"));
    }

    function state(): [string, boolean, boolean] {
        const s = getGameLayoutSnapshot();
        return [s.mode, s.squashed, s.keyboardOpen];
    }

    beforeEach(() => {
        input = document.createElement("textarea");
        document.body.appendChild(input);
        getGameLayoutSnapshot();
    });

    afterEach(() => {
        input.blur();
        input.remove();
        resize(1440, 900);
    });

    test("keeps the portrait tablet layout until the keyboard has closed", () => {
        resize(768, 1024);
        input.focus();
        resize(768, 650);
        expect(state()).toEqual(["stacked", false, true]);
        resize(768, 700);
        expect(state()).toEqual(["stacked", false, true]);
        resize(768, 600);
        expect(state()).toEqual(["stacked", false, true]);
        resize(768, 1024);
        expect(state()).toEqual(["stacked", false, false]);
    });

    test("keeps the phone layout unsquashed while the keyboard is open", () => {
        resize(390, 844);
        input.focus();
        resize(390, 450);
        expect(state()).toEqual(["stacked", false, true]);
        resize(390, 844);
        expect(state()).toEqual(["stacked", false, false]);
    });

    test("does not hold the layout when no text input has focus", () => {
        resize(768, 1024);
        resize(768, 650);
        expect(state()).toEqual(["compactHorizontal", false, false]);
    });

    test("releases the layout when the input loses focus", () => {
        resize(768, 1024);
        input.focus();
        resize(768, 650);
        input.blur();
        resize(768, 650);
        expect(state()).toEqual(["compactHorizontal", false, false]);
    });

    test("releases the layout when the width changes", () => {
        resize(768, 1024);
        input.focus();
        resize(768, 650);
        resize(1024, 700);
        expect(state()).toEqual(["fullHorizontal", false, false]);
    });

    test("does not report a keyboard for a resize that keeps the height", () => {
        resize(768, 1024);
        input.focus();
        resize(768, 1024);
        expect(state()).toEqual(["stacked", false, false]);
    });
});
