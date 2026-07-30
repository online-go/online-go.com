/*
 * Copyright (C)  Online-Go.com
 */

import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import {
    getGobanThemeConfig,
    importGobanTheme,
    parseGobanTheme,
    resetShareableGobanTheme,
    serializeGobanTheme,
} from "@/lib/goban_theme_json";
import {
    createGobanThemePreferenceDefaults,
    defaultGobanLabelColor,
} from "@/lib/goban_theme_defaults";

const TEST_USER = {
    anonymous: true,
    id: 0,
    username: "anonymous",
} as rest_api.UserConfig;

describe("goban theme JSON", () => {
    beforeEach(() => {
        data.set("user", TEST_USER);
        resetShareableGobanTheme();
        preferences.set("goban-theme-board", "Kaya");
        preferences.set("goban-theme-black", "Slate");
        preferences.set("goban-theme-white", "Shell");
    });

    test("uses centralized and independently allocated theme defaults", () => {
        const first = createGobanThemePreferenceDefaults();
        const second = createGobanThemePreferenceDefaults();

        expect(first["goban-theme-custom-board-label"]).toBe(
            defaultGobanLabelColor(first["goban-theme-custom-board-line"]),
        );
        expect(first["goban-theme-custom-board-grid-backgrounds"]).not.toBe(
            second["goban-theme-custom-board-grid-backgrounds"],
        );
        expect(first["goban-theme-custom-black-urls"]).not.toBe(
            second["goban-theme-custom-black-urls"],
        );
    });

    test("round trips the selected themes and complete custom configuration", () => {
        preferences.set("goban-theme-board", "Custom");
        preferences.set("goban-theme-black", "Custom");
        preferences.set("goban-theme-white", "Custom");
        preferences.set("goban-theme-stone-shadows", "custom");
        preferences.set("goban-theme-custom-board-line", "#123456");
        preferences.set("goban-theme-custom-board-label", "#abcdef");
        preferences.set("goban-theme-custom-board-grid-backgrounds", {
            "9": "https://example.com/9.png",
            "13": "",
            "19": "https://example.com/19.png",
        });
        preferences.set("goban-theme-custom-black-urls", [
            "https://example.com/black-1.png",
            "https://example.com/black-2.png",
        ]);
        preferences.set("goban-theme-stone-scale", 1.2);
        preferences.set("fuzzy-stone-placement", true);

        const exported = getGobanThemeConfig();
        const parsed = parseGobanTheme(JSON.stringify(exported));

        expect(parsed).toEqual(exported);
        expect(parsed.board.theme).toBe("Custom");
        expect(parsed.board.custom?.gridColor).toBe("#123456");
        expect(parsed.board.custom?.gridBackgroundImageUrls["13x13"]).toBeNull();
        expect(parsed.stones.black.custom?.imageUrls).toHaveLength(2);
        expect(parsed.shadows.black).toBeDefined();
        expect(parsed.stones.scale).toBe(1.2);
        expect(parsed.fuzzyPlacement).toBe(true);
    });

    test("omits inactive custom settings and resets them to defaults on import", () => {
        preferences.set("goban-theme-custom-board-line", "#884400");
        preferences.set("goban-theme-custom-black-stone-color", "#112233");
        preferences.set("goban-theme-custom-black-shadow-color", "#223344");
        const theme = getGobanThemeConfig();

        expect(theme.board).toEqual({ theme: "Kaya" });
        expect(theme.stones.black).toEqual({ theme: "Slate" });
        expect(theme.shadows).toEqual({ style: "default" });

        importGobanTheme(JSON.stringify(theme));

        const defaults = createGobanThemePreferenceDefaults();
        expect(preferences.get("goban-theme-custom-board-line")).toBe(
            defaults["goban-theme-custom-board-line"],
        );
        expect(preferences.get("goban-theme-custom-black-stone-color")).toBe(
            defaults["goban-theme-custom-black-stone-color"],
        );
        expect(preferences.get("goban-theme-custom-black-shadow-color")).toBe(
            defaults["goban-theme-custom-black-shadow-color"],
        );
    });

    test("does not change excluded personal theme preferences", () => {
        preferences.set("label-positioning", "bottom-right");
        preferences.set("last-move-opacity", 0.4);
        preferences.set("stone-font-scale", 0.8);

        importGobanTheme(serializeGobanTheme());

        expect(preferences.get("label-positioning")).toBe("bottom-right");
        expect(preferences.get("last-move-opacity")).toBe(0.4);
        expect(preferences.get("stone-font-scale")).toBe(0.8);
    });

    test("rejects invalid documents before writing any preferences", () => {
        preferences.set("goban-theme-board", "Custom");
        const theme = getGobanThemeConfig();
        const invalid = {
            ...theme,
            board: {
                ...theme.board,
                custom: {
                    ...theme.board.custom!,
                    gridColor: "not-a-color",
                },
            },
        };
        preferences.set("goban-theme-custom-board-line", "#010203");

        expect(() => importGobanTheme(JSON.stringify(invalid))).toThrow("$.board.custom.gridColor");
        expect(preferences.get("goban-theme-custom-board-line")).toBe("#010203");
    });

    test("rejects custom settings for an inactive built-in theme", () => {
        const theme = getGobanThemeConfig();
        const invalid = {
            ...theme,
            board: {
                theme: "Kaya",
                custom: {
                    backgroundColor: "#dcb35c",
                    gridColor: "#000000",
                    labelColor: "#bfbfbf",
                    backgroundImageUrl: null,
                    gridBackgroundImageUrls: {
                        "9x9": null,
                        "13x13": null,
                        "19x19": null,
                    },
                },
            },
        };

        expect(() => parseGobanTheme(JSON.stringify(invalid))).toThrow("$.board.custom");
    });

    test("rejects unknown fields and newer versions", () => {
        const theme = getGobanThemeConfig();

        expect(() => parseGobanTheme(JSON.stringify({ ...theme, unexpected: true }))).toThrow(
            "$.unexpected",
        );
        expect(() => parseGobanTheme(JSON.stringify({ ...theme, version: 2 }))).toThrow(
            "newer version of OGS",
        );
    });
});
