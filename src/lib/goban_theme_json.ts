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

import { Goban, ShadowTheme } from "goban";
import * as preferences from "@/lib/preferences";
import { pgettext } from "@/lib/translate";
import {
    createGobanThemePreferenceDefaults,
    DEFAULT_BLACK_STONE_COLOR,
    DEFAULT_WHITE_STONE_COLOR,
} from "@/lib/goban_theme_defaults";

export const GOBAN_THEME_FORMAT = "online-go.com/goban-theme";
export const GOBAN_THEME_VERSION = 1;

interface CustomBoardTheme {
    backgroundColor: string;
    gridColor: string;
    labelColor: string;
    backgroundImageUrl: string | null;
    gridBackgroundImageUrls: {
        "9x9": string | null;
        "13x13": string | null;
        "19x19": string | null;
    };
}

interface CustomStoneTheme {
    color: string;
    markerColor: string | null;
    imageUrls: string[];
}

interface StoneThemeSelection {
    theme: string;
    custom: CustomStoneTheme;
}

interface ShadowThemeConfig {
    color: string;
    gradientTransform: string;
}

export interface GobanThemeConfigV1 {
    format: typeof GOBAN_THEME_FORMAT;
    version: typeof GOBAN_THEME_VERSION;
    board: {
        theme: string;
        custom: CustomBoardTheme;
    };
    stones: {
        scale: number;
        black: StoneThemeSelection;
        white: StoneThemeSelection;
    };
    shadows: {
        style: ShadowTheme;
        black: ShadowThemeConfig;
        white: ShadowThemeConfig;
    };
    fuzzyPlacement: boolean;
}

type JsonObject = Record<string, unknown>;

export class GobanThemeValidationError extends Error {
    constructor(
        public readonly path: string,
        message: string,
    ) {
        super(`${path}: ${message}`);
        this.name = "GobanThemeValidationError";
    }
}

function nullableString(value: string): string | null {
    return value.trim() ? value : null;
}

function customStoneColor(value: string, fallback: string): string {
    return value || fallback;
}

export function getGobanThemeConfig(): GobanThemeConfigV1 {
    const selected = preferences.getSelectedThemes();
    const grid_backgrounds = preferences.get("goban-theme-custom-board-grid-backgrounds");

    return {
        format: GOBAN_THEME_FORMAT,
        version: GOBAN_THEME_VERSION,
        board: {
            theme: selected.board,
            custom: {
                backgroundColor: preferences.get("goban-theme-custom-board-background"),
                gridColor: preferences.get("goban-theme-custom-board-line"),
                labelColor: preferences.get("goban-theme-custom-board-label"),
                backgroundImageUrl: nullableString(preferences.get("goban-theme-custom-board-url")),
                gridBackgroundImageUrls: {
                    "9x9": nullableString(grid_backgrounds["9"]),
                    "13x13": nullableString(grid_backgrounds["13"]),
                    "19x19": nullableString(grid_backgrounds["19"]),
                },
            },
        },
        stones: {
            scale: preferences.get("goban-theme-stone-scale"),
            black: {
                theme: selected.black,
                custom: {
                    color: customStoneColor(
                        preferences.get("goban-theme-custom-black-stone-color"),
                        DEFAULT_BLACK_STONE_COLOR,
                    ),
                    markerColor: nullableString(
                        preferences.get("goban-theme-custom-black-text-color"),
                    ),
                    imageUrls: [...preferences.get("goban-theme-custom-black-urls")],
                },
            },
            white: {
                theme: selected.white,
                custom: {
                    color: customStoneColor(
                        preferences.get("goban-theme-custom-white-stone-color"),
                        DEFAULT_WHITE_STONE_COLOR,
                    ),
                    markerColor: nullableString(
                        preferences.get("goban-theme-custom-white-text-color"),
                    ),
                    imageUrls: [...preferences.get("goban-theme-custom-white-urls")],
                },
            },
        },
        shadows: {
            style: preferences.get("goban-theme-stone-shadows"),
            black: {
                color: preferences.get("goban-theme-custom-black-shadow-color"),
                gradientTransform: preferences.get("goban-theme-custom-black-shadow-gradient"),
            },
            white: {
                color: preferences.get("goban-theme-custom-white-shadow-color"),
                gradientTransform: preferences.get("goban-theme-custom-white-shadow-gradient"),
            },
        },
        fuzzyPlacement: preferences.get("fuzzy-stone-placement"),
    };
}

export function serializeGobanTheme(): string {
    return JSON.stringify(getGobanThemeConfig(), null, 2);
}

function objectAt(value: unknown, path: string): JsonObject {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new GobanThemeValidationError(
            path,
            pgettext("Goban theme JSON validation error", "must be an object"),
        );
    }
    return value as JsonObject;
}

function exactKeys(object: JsonObject, keys: readonly string[], path: string): void {
    const expected = new Set(keys);
    for (const key of Object.keys(object)) {
        if (!expected.has(key)) {
            throw new GobanThemeValidationError(
                `${path}.${key}`,
                pgettext("Goban theme JSON validation error", "is not supported"),
            );
        }
    }
    for (const key of keys) {
        if (!(key in object)) {
            throw new GobanThemeValidationError(
                `${path}.${key}`,
                pgettext("Goban theme JSON validation error", "is required"),
            );
        }
    }
}

function stringAt(value: unknown, path: string): string {
    if (typeof value !== "string") {
        throw new GobanThemeValidationError(
            path,
            pgettext("Goban theme JSON validation error", "must be a string"),
        );
    }
    return value;
}

function nonemptyStringAt(value: unknown, path: string): string {
    const result = stringAt(value, path);
    if (!result.trim()) {
        throw new GobanThemeValidationError(
            path,
            pgettext("Goban theme JSON validation error", "must not be empty"),
        );
    }
    return result;
}

function nullableStringAt(value: unknown, path: string): string | null {
    if (value === null) {
        return null;
    }
    const result = stringAt(value, path).trim();
    return result || null;
}

function colorAt(value: unknown, path: string): string {
    const result = stringAt(value, path);
    if (!/^#[0-9a-f]{6}$/i.test(result)) {
        throw new GobanThemeValidationError(
            path,
            pgettext("Goban theme JSON validation error", "must be a six-digit hex color"),
        );
    }
    return result;
}

function nullableColorAt(value: unknown, path: string): string | null {
    if (value === null) {
        return null;
    }
    return colorAt(value, path);
}

function themeAt(value: unknown, color: "board" | "black" | "white", path: string): string {
    const theme = nonemptyStringAt(value, path);
    if (!Object.prototype.hasOwnProperty.call(Goban.THEMES[color], theme)) {
        throw new GobanThemeValidationError(
            path,
            pgettext("Goban theme JSON validation error", "is not an available theme"),
        );
    }
    return theme;
}

function stringArrayAt(value: unknown, path: string): string[] {
    if (!Array.isArray(value)) {
        throw new GobanThemeValidationError(
            path,
            pgettext("Goban theme JSON validation error", "must be an array"),
        );
    }
    return Array.from(
        new Set(value.map((entry, index) => nonemptyStringAt(entry, `${path}[${index}]`).trim())),
    );
}

function customStoneAt(value: unknown, path: string): CustomStoneTheme {
    const object = objectAt(value, path);
    exactKeys(object, ["color", "markerColor", "imageUrls"], path);
    return {
        color: colorAt(object.color, `${path}.color`),
        markerColor: nullableColorAt(object.markerColor, `${path}.markerColor`),
        imageUrls: stringArrayAt(object.imageUrls, `${path}.imageUrls`),
    };
}

function stoneAt(value: unknown, color: "black" | "white", path: string): StoneThemeSelection {
    const object = objectAt(value, path);
    exactKeys(object, ["theme", "custom"], path);
    return {
        theme: themeAt(object.theme, color, `${path}.theme`),
        custom: customStoneAt(object.custom, `${path}.custom`),
    };
}

function shadowAt(value: unknown, path: string): ShadowThemeConfig {
    const object = objectAt(value, path);
    exactKeys(object, ["color", "gradientTransform"], path);
    return {
        color: colorAt(object.color, `${path}.color`),
        gradientTransform: stringAt(object.gradientTransform, `${path}.gradientTransform`),
    };
}

function migratePortableTheme(value: unknown): unknown {
    const root = objectAt(value, "$");
    if (root.format !== GOBAN_THEME_FORMAT) {
        throw new GobanThemeValidationError(
            "$.format",
            pgettext("Goban theme JSON validation error", "has an unsupported format identifier"),
        );
    }
    if (typeof root.version !== "number" || !Number.isInteger(root.version)) {
        throw new GobanThemeValidationError(
            "$.version",
            pgettext("Goban theme JSON validation error", "must be an integer"),
        );
    }
    if (root.version > GOBAN_THEME_VERSION) {
        throw new GobanThemeValidationError(
            "$.version",
            pgettext("Goban theme JSON validation error", "was created by a newer version of OGS"),
        );
    }
    if (root.version < 1) {
        throw new GobanThemeValidationError(
            "$.version",
            pgettext("Goban theme JSON validation error", "is not supported"),
        );
    }

    /*
     * Add sequential, pure migrations here as the public format evolves. Portable
     * migrations must not call preferences.migrate(): that function changes OGS's
     * private persisted-key layout, while this function preserves forum-posted JSON.
     */
    return root;
}

export function parseGobanTheme(json: string): GobanThemeConfigV1 {
    let parsed: unknown;
    try {
        parsed = JSON.parse(json) as unknown;
    } catch {
        throw new GobanThemeValidationError(
            "$",
            pgettext("Goban theme JSON validation error", "is not valid JSON"),
        );
    }

    const migrated = objectAt(migratePortableTheme(parsed), "$");
    exactKeys(migrated, ["format", "version", "board", "stones", "shadows", "fuzzyPlacement"], "$");

    const board = objectAt(migrated.board, "$.board");
    exactKeys(board, ["theme", "custom"], "$.board");
    const custom_board = objectAt(board.custom, "$.board.custom");
    exactKeys(
        custom_board,
        [
            "backgroundColor",
            "gridColor",
            "labelColor",
            "backgroundImageUrl",
            "gridBackgroundImageUrls",
        ],
        "$.board.custom",
    );
    const grid_backgrounds = objectAt(
        custom_board.gridBackgroundImageUrls,
        "$.board.custom.gridBackgroundImageUrls",
    );
    exactKeys(
        grid_backgrounds,
        ["9x9", "13x13", "19x19"],
        "$.board.custom.gridBackgroundImageUrls",
    );

    const stones = objectAt(migrated.stones, "$.stones");
    exactKeys(stones, ["scale", "black", "white"], "$.stones");
    if (
        typeof stones.scale !== "number" ||
        !Number.isFinite(stones.scale) ||
        stones.scale < 0.5 ||
        stones.scale > 1.5
    ) {
        throw new GobanThemeValidationError(
            "$.stones.scale",
            pgettext("Goban theme JSON validation error", "must be a number from 0.5 to 1.5"),
        );
    }

    const shadows = objectAt(migrated.shadows, "$.shadows");
    exactKeys(shadows, ["style", "black", "white"], "$.shadows");
    const shadow_styles: readonly ShadowTheme[] = [
        "none",
        "low",
        "mid",
        "high",
        "custom",
        "default",
        "anime",
    ];
    if (
        typeof shadows.style !== "string" ||
        !shadow_styles.includes(shadows.style as ShadowTheme)
    ) {
        throw new GobanThemeValidationError(
            "$.shadows.style",
            pgettext("Goban theme JSON validation error", "is not a supported shadow style"),
        );
    }
    if (typeof migrated.fuzzyPlacement !== "boolean") {
        throw new GobanThemeValidationError(
            "$.fuzzyPlacement",
            pgettext("Goban theme JSON validation error", "must be a boolean"),
        );
    }

    return {
        format: GOBAN_THEME_FORMAT,
        version: GOBAN_THEME_VERSION,
        board: {
            theme: themeAt(board.theme, "board", "$.board.theme"),
            custom: {
                backgroundColor: colorAt(
                    custom_board.backgroundColor,
                    "$.board.custom.backgroundColor",
                ),
                gridColor: colorAt(custom_board.gridColor, "$.board.custom.gridColor"),
                labelColor: colorAt(custom_board.labelColor, "$.board.custom.labelColor"),
                backgroundImageUrl: nullableStringAt(
                    custom_board.backgroundImageUrl,
                    "$.board.custom.backgroundImageUrl",
                ),
                gridBackgroundImageUrls: {
                    "9x9": nullableStringAt(
                        grid_backgrounds["9x9"],
                        "$.board.custom.gridBackgroundImageUrls.9x9",
                    ),
                    "13x13": nullableStringAt(
                        grid_backgrounds["13x13"],
                        "$.board.custom.gridBackgroundImageUrls.13x13",
                    ),
                    "19x19": nullableStringAt(
                        grid_backgrounds["19x19"],
                        "$.board.custom.gridBackgroundImageUrls.19x19",
                    ),
                },
            },
        },
        stones: {
            scale: stones.scale,
            black: stoneAt(stones.black, "black", "$.stones.black"),
            white: stoneAt(stones.white, "white", "$.stones.white"),
        },
        shadows: {
            style: shadows.style as ShadowTheme,
            black: shadowAt(shadows.black, "$.shadows.black"),
            white: shadowAt(shadows.white, "$.shadows.white"),
        },
        fuzzyPlacement: migrated.fuzzyPlacement,
    };
}

export function applyGobanTheme(theme: GobanThemeConfigV1): void {
    preferences.set("goban-theme-board", theme.board.theme);
    preferences.set("goban-theme-custom-board-background", theme.board.custom.backgroundColor);
    preferences.set("goban-theme-custom-board-line", theme.board.custom.gridColor);
    preferences.set("goban-theme-custom-board-label", theme.board.custom.labelColor);
    preferences.set("goban-theme-custom-board-url", theme.board.custom.backgroundImageUrl ?? "");
    preferences.set("goban-theme-custom-board-grid-backgrounds", {
        "9": theme.board.custom.gridBackgroundImageUrls["9x9"] ?? "",
        "13": theme.board.custom.gridBackgroundImageUrls["13x13"] ?? "",
        "19": theme.board.custom.gridBackgroundImageUrls["19x19"] ?? "",
    });
    preferences.set("goban-theme-black", theme.stones.black.theme);
    preferences.set("goban-theme-custom-black-stone-color", theme.stones.black.custom.color);
    preferences.set(
        "goban-theme-custom-black-text-color",
        theme.stones.black.custom.markerColor ?? "",
    );
    preferences.set("goban-theme-custom-black-urls", [...theme.stones.black.custom.imageUrls]);
    preferences.set("goban-theme-white", theme.stones.white.theme);
    preferences.set("goban-theme-custom-white-stone-color", theme.stones.white.custom.color);
    preferences.set(
        "goban-theme-custom-white-text-color",
        theme.stones.white.custom.markerColor ?? "",
    );
    preferences.set("goban-theme-custom-white-urls", [...theme.stones.white.custom.imageUrls]);
    preferences.set("goban-theme-stone-scale", theme.stones.scale);
    preferences.set("goban-theme-stone-shadows", theme.shadows.style);
    preferences.set("goban-theme-custom-black-shadow-color", theme.shadows.black.color);
    preferences.set(
        "goban-theme-custom-black-shadow-gradient",
        theme.shadows.black.gradientTransform,
    );
    preferences.set("goban-theme-custom-white-shadow-color", theme.shadows.white.color);
    preferences.set(
        "goban-theme-custom-white-shadow-gradient",
        theme.shadows.white.gradientTransform,
    );
    preferences.set("fuzzy-stone-placement", theme.fuzzyPlacement);
}

export function importGobanTheme(json: string): GobanThemeConfigV1 {
    const theme = parseGobanTheme(json);
    applyGobanTheme(theme);
    return theme;
}

export function resetShareableGobanTheme(): void {
    const defaults = createGobanThemePreferenceDefaults();
    for (const key of Object.keys(defaults) as Array<keyof typeof defaults>) {
        preferences.set(key, defaults[key]);
    }
}
