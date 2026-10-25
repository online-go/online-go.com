/* Copyright (C) Online-Go.com */

import * as fs from "fs";
import * as path from "path";
import {
    classifyGameLayout,
    clampLeftAsideWidth,
    FULL_HORIZONTAL_REQUIREMENTS,
    getGameLayoutSnapshot,
    GobanViewBoardAlignment,
    gobanViewLayoutClasses,
    GobanViewLayoutInput,
    LAYOUT_GEOMETRY as G,
    leftAsideAllowed,
    legacyViewMode,
    normalizeActionButtonsPosition,
    normalizeBoardAlignment,
    resolveGobanViewLayout,
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

    test("the full-horizontal threshold stays at 1016px", () => {
        expect(classifyGameLayout(layout(1015, 900))).toBe("compactHorizontal");
        expect(classifyGameLayout(layout(1016, 900))).toBe("fullHorizontal");
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

function input(overrides: {
    mode?: GobanViewLayoutInput["mode"];
    rootWidth?: number;
    prefs?: Partial<GobanViewLayoutInput["prefs"]>;
    offered?: Partial<GobanViewLayoutInput["offered"]>;
}): GobanViewLayoutInput {
    return {
        mode: overrides.mode ?? "fullHorizontal",
        rootWidth: overrides.rootWidth ?? 2560,
        prefs: {
            actionButtons: "dock",
            mobileScroll: false,
            moveControls: "docked",
            sidebarWidth: null,
            leftAsideWidth: null,
            boardAlignment: "container",
            ...overrides.prefs,
        },
        offered: {
            board: true,
            leftAside: false,
            actionDock: true,
            portraitSplit: false,
            playerBars: false,
            sidebarContentBefore: false,
            moveControls: true,
            ...overrides.offered,
        },
    };
}

/** Width at which the board keeps exactly the minimum useful size beside
 *  the sidebar and the collapsed dock. The +0.001 clears float rounding
 *  noise in the edgeMargin (4.8) arithmetic at this exact boundary. */
const exactDockWidth =
    G.sidebarGap +
    G.defaultSidebar +
    G.dockCollapsed +
    G.edgeMargin +
    FULL_HORIZONTAL_REQUIREMENTS.minimumUsefulGoban +
    0.001;

describe("resolveGobanViewLayout", () => {
    test("stacked and compact layouts never show side columns", () => {
        for (const mode of ["stacked", "compactHorizontal"] as const) {
            const layout = resolveGobanViewLayout(input({ mode, offered: { leftAside: true } }));
            expect(layout.leftAside).toBe(false);
            expect(layout.actionDock).toBe(false);
        }
    });

    test("a slot the view does not offer never shows", () => {
        const layout = resolveGobanViewLayout(input({ offered: { actionDock: false } }));
        expect(layout.actionDock).toBe(false);
        expect(layout.leftAside).toBe(false);
    });

    test("dock shows the dock while the board keeps the minimum useful size", () => {
        expect(resolveGobanViewLayout(input({ rootWidth: exactDockWidth })).actionDock).toBe(true);
        expect(resolveGobanViewLayout(input({ rootWidth: exactDockWidth - 1 })).actionDock).toBe(
            false,
        );
    });

    test("bar never shows the dock", () => {
        expect(resolveGobanViewLayout(input({ prefs: { actionButtons: "bar" } })).actionDock).toBe(
            false,
        );
    });

    test("the left aside takes width from the dock test, and the dock drops first", () => {
        const layout = resolveGobanViewLayout(
            input({ rootWidth: exactDockWidth, offered: { leftAside: true } }),
        );
        expect(layout.leftAside).toBe(true);
        expect(layout.actionDock).toBe(false);
    });

    test("the left aside never drops in fullHorizontal, even with a huge stored width", () => {
        const layout = resolveGobanViewLayout(
            input({
                rootWidth: 1100,
                offered: { leftAside: true },
                prefs: { leftAsideWidth: 5000 },
            }),
        );
        expect(layout.leftAside).toBe(true);
        expect(layout.leftAsideWidth).toBe(G.defaultLeftAside);
    });

    test("a huge stored width leaves the board pane at least 24rem", () => {
        const layout = resolveGobanViewLayout(
            input({
                rootWidth: 1600,
                offered: { leftAside: true },
                prefs: { leftAsideWidth: 5000 },
            }),
        );
        expect(layout.leftAsideWidth).toBeGreaterThan(G.defaultLeftAside);
        const board =
            1600 -
            (layout.leftAsideWidth! + G.sidebarGap + G.edgeMargin) -
            (G.sidebarGap + G.defaultSidebar + G.edgeMargin);
        expect(board).toBeGreaterThanOrEqual(24 * 16);
    });

    test("mobile scroll applies only when stacked and not split", () => {
        expect(
            resolveGobanViewLayout(input({ mode: "stacked", prefs: { mobileScroll: true } }))
                .mobileScroll,
        ).toBe(true);
        expect(
            resolveGobanViewLayout(
                input({
                    mode: "stacked",
                    prefs: { mobileScroll: true },
                    offered: { portraitSplit: true },
                }),
            ).mobileScroll,
        ).toBe(false);
        expect(
            resolveGobanViewLayout(input({ mode: "fullHorizontal", prefs: { mobileScroll: true } }))
                .mobileScroll,
        ).toBe(false);
    });

    test("mobile scroll forces the move controls under the board", () => {
        const layout = resolveGobanViewLayout(
            input({ mode: "stacked", prefs: { mobileScroll: true, moveControls: "docked" } }),
        );
        expect(layout.moveControls).toBe("under-board");
    });
});

describe("clampLeftAsideWidth", () => {
    test("null stays null", () => {
        expect(clampLeftAsideWidth(null, 2000, null)).toBeNull();
    });

    test("a width that fits is kept", () => {
        expect(clampLeftAsideWidth(500, 2560, null)).toBe(500);
    });

    test("keeps a 24rem board pane beside the aside and the sidebar", () => {
        const width = clampLeftAsideWidth(5000, 1600, null)!;
        const board =
            1600 -
            (width + G.sidebarGap + G.edgeMargin) -
            (G.sidebarGap + G.defaultSidebar + G.edgeMargin);
        expect(board).toBeGreaterThanOrEqual(24 * 16);
        expect(board).toBeLessThan(24 * 16 + 1);
    });

    test("never goes below the default width", () => {
        expect(clampLeftAsideWidth(500, 900, null)).toBe(G.defaultLeftAside);
    });
});

describe("normalizeActionButtonsPosition", () => {
    test.each([
        ["dock", "dock"],
        ["bar", "bar"],
        ["unknown", "bar"],
        [undefined, "bar"],
        [null, "bar"],
    ])("%s reads as %s", (stored, expected) => {
        expect(normalizeActionButtonsPosition(stored)).toBe(expected);
    });
});

describe("normalizeBoardAlignment", () => {
    test.each([
        ["window", "window"],
        ["container", "container"],
        ["group", "group"],
        ["bogus", "container"],
        [undefined, "container"],
        [null, "container"],
    ])("%s reads as %s", (stored, expected) => {
        expect(normalizeBoardAlignment(stored)).toBe(expected);
    });
});

describe("leftAsideAllowed", () => {
    test.each([
        ["stacked", false],
        ["compactHorizontal", false],
        ["fullHorizontal", true],
    ] as const)("%s allows the left aside: %s", (mode, expected) => {
        expect(leftAsideAllowed(mode)).toBe(expected);
        expect(
            resolveGobanViewLayout(input({ mode, offered: { leftAside: true } })).leftAside,
        ).toBe(expected);
    });
});

describe("the board stage", () => {
    test.each(["window", "container", "group"] as const)(
        "the board alignment %s is resolved in landscape",
        (alignment) => {
            for (const mode of ["compactHorizontal", "fullHorizontal"] as const) {
                expect(
                    resolveGobanViewLayout(input({ mode, prefs: { boardAlignment: alignment } }))
                        .boardAlignment,
                ).toBe(alignment);
            }
        },
    );

    test("an unknown stored alignment resolves to container", () => {
        const layout = resolveGobanViewLayout(
            input({ prefs: { boardAlignment: "bogus" as GobanViewBoardAlignment } }),
        );
        expect(layout.boardAlignment).toBe("container");
    });

    test("there is no board alignment when stacked", () => {
        expect(
            resolveGobanViewLayout(input({ mode: "stacked", prefs: { boardAlignment: "window" } }))
                .boardAlignment,
        ).toBeNull();
    });

    test("player bars show beside a board, except in compactHorizontal", () => {
        const bars = (mode: GobanViewLayoutInput["mode"], board = true) =>
            resolveGobanViewLayout(input({ mode, offered: { playerBars: true, board } }))
                .playerBars;
        expect(bars("fullHorizontal")).toBe(true);
        expect(bars("stacked")).toBe(true);
        expect(bars("compactHorizontal")).toBe(false);
        expect(bars("fullHorizontal", false)).toBe(false);
        expect(resolveGobanViewLayout(input({ offered: { playerBars: false } })).playerBars).toBe(
            false,
        );
    });

    test("the move controls get their row under the board only for the built-in strip and a board", () => {
        const underBoard = (
            prefs: Partial<GobanViewLayoutInput["prefs"]>,
            offered: Partial<GobanViewLayoutInput["offered"]> = {},
            mode: GobanViewLayoutInput["mode"] = "fullHorizontal",
        ) => resolveGobanViewLayout(input({ mode, prefs, offered })).moveControlsUnderBoard;
        expect(underBoard({ moveControls: "under-board" })).toBe(true);
        expect(underBoard({ moveControls: "docked" })).toBe(false);
        expect(underBoard({ moveControls: "under-board" }, { moveControls: false })).toBe(false);
        expect(underBoard({ moveControls: "under-board" }, { board: false })).toBe(false);
        expect(underBoard({ moveControls: "docked", mobileScroll: true }, {}, "stacked")).toBe(
            true,
        );
    });

    test("sidebarContentBefore shows only in compactHorizontal, when offered", () => {
        const shown = (mode: GobanViewLayoutInput["mode"], offered = true) =>
            resolveGobanViewLayout(input({ mode, offered: { sidebarContentBefore: offered } }))
                .sidebarContentBefore;
        expect(shown("compactHorizontal")).toBe(true);
        expect(shown("compactHorizontal", false)).toBe(false);
        expect(shown("fullHorizontal")).toBe(false);
        expect(shown("stacked")).toBe(false);
    });

    test("the action list shows only in mobile scroll with an offered dock", () => {
        const list = (actionDock: boolean) =>
            resolveGobanViewLayout(
                input({ mode: "stacked", prefs: { mobileScroll: true }, offered: { actionDock } }),
            ).actionList;
        expect(list(true)).toBe(true);
        expect(list(false)).toBe(false);
        expect(resolveGobanViewLayout(input({ mode: "stacked" })).actionList).toBe(false);
    });

    test("the portrait split applies only when stacked", () => {
        const split = (mode: GobanViewLayoutInput["mode"]) =>
            resolveGobanViewLayout(input({ mode, offered: { portraitSplit: true } })).portraitSplit;
        expect(split("stacked")).toBe(true);
        expect(split("compactHorizontal")).toBe(false);
        expect(split("fullHorizontal")).toBe(false);
    });
});

describe("gobanViewLayoutClasses", () => {
    test("landscape classes come from the resolved layout", () => {
        const layout = resolveGobanViewLayout(
            input({
                rootWidth: 2560,
                prefs: { boardAlignment: "window", moveControls: "under-board" },
                offered: { leftAside: true, playerBars: true },
            }),
        );
        expect(gobanViewLayoutClasses(layout)).toEqual([
            "wide",
            "board-align-window",
            "has-left-aside",
            "has-action-dock",
            "has-player-bars",
            "has-move-controls-under-board",
        ]);
    });

    test("compactHorizontal is marked", () => {
        const layout = resolveGobanViewLayout(input({ mode: "compactHorizontal" }));
        expect(gobanViewLayoutClasses(layout)).toEqual([
            "wide",
            "compactHorizontal",
            "board-align-container",
        ]);
    });

    test("portrait has no board alignment", () => {
        const layout = resolveGobanViewLayout(
            input({
                mode: "stacked",
                prefs: { mobileScroll: true, boardAlignment: "group" },
            }),
        );
        expect(gobanViewLayoutClasses(layout)).toEqual([
            "portrait",
            "has-move-controls-under-board",
            "has-mobile-scroll",
            "has-action-list",
        ]);
    });

    test("the portrait split is marked", () => {
        const layout = resolveGobanViewLayout(
            input({ mode: "stacked", offered: { portraitSplit: true } }),
        );
        expect(gobanViewLayoutClasses(layout)).toContain("has-portrait-split");
    });
});

/** The text of the first top-level `selector { ... }` block of a stylesheet,
 *  with its comments and every nested block (media queries, nested rules)
 *  left out, so only the block's own declarations remain. */
function rootDeclarations(css: string, selector: string): string {
    const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const start = text.search(new RegExp(`(^|\\n)${selector.replace(".", "\\.")}\\s*\\{`));
    if (start < 0) {
        throw new Error(`${selector} has no top-level block`);
    }
    let depth = 0;
    let own = "";
    for (let i = text.indexOf("{", start); i < text.length; i++) {
        const char = text[i];
        if (char === "{") {
            depth++;
        } else if (char === "}") {
            depth--;
            if (depth === 0) {
                return own;
            }
        } else if (depth === 1) {
            own += char;
        }
    }
    throw new Error(`${selector} block is not closed`);
}

/** Reads a custom property's default: its declaration in the stylesheet's
 *  root block, not an override in a nested rule or a media query. */
function cssVar(file: string, selector: string, name: string): string {
    const css = fs.readFileSync(path.join(__dirname, file), "utf8");
    const match = rootDeclarations(css, selector).match(
        new RegExp(`(?:^|[;\\s])${name}:\\s*([^;]+);`),
    );
    if (!match) {
        throw new Error(`${name} is not declared in the ${selector} block of ${file}`);
    }
    return match[1].trim();
}

function px(value: string): number {
    if (value.endsWith("rem")) {
        return parseFloat(value) * 16;
    }
    if (value.endsWith("px")) {
        return parseFloat(value);
    }
    throw new Error(`${value} is not a rem or px length`);
}

describe("LAYOUT_GEOMETRY is the stylesheets' geometry", () => {
    const variables = "../../global_styl/01_variables.css";

    test("reads the root declaration, not a media-query override", () => {
        expect(cssVar(variables, ":root", "--navbar-height")).toBe("3rem");
    });

    test.each([
        ["sidebarGap", "GobanView.css", ".GobanView", "--goban-view-sidebar-gap"],
        ["edgeMargin", "GobanView.css", ".GobanView", "--goban-view-edge-margin"],
        ["defaultSidebar", variables, ":root", "--goban-view-sidebar-width"],
        ["defaultLeftAside", variables, ":root", "--goban-view-left-aside-width"],
        ["dockCollapsed", variables, ":root", "--dock-collapsed-width"],
    ] as const)("%s matches %s %s %s", (key, file, selector, name) => {
        expect(px(cssVar(file, selector, name))).toBeCloseTo(G[key]);
    });
});
