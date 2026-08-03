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

import {
    blendWithInverseColor,
    CustomBoardGridBackgrounds,
    emptyCustomBoardGridBackgrounds,
    ShadowTheme,
} from "goban";

export interface GobanThemePreferenceDefaults {
    "fuzzy-stone-placement": boolean;
    "goban-theme-black": string | null;
    "goban-theme-board": string | null;
    "goban-theme-white": string | null;
    "goban-theme-stone-scale": number;
    "goban-theme-stone-shadows": ShadowTheme;
    "goban-theme-custom-black-shadow-color": string;
    "goban-theme-custom-black-shadow-gradient": string;
    "goban-theme-custom-white-shadow-color": string;
    "goban-theme-custom-white-shadow-gradient": string;
    "goban-theme-custom-board-background": string;
    "goban-theme-custom-board-url": string;
    "goban-theme-custom-board-grid-backgrounds": CustomBoardGridBackgrounds;
    "goban-theme-custom-board-line": string;
    "goban-theme-custom-board-label": string;
    "goban-theme-custom-black-stone-color": string;
    "goban-theme-custom-black-text-color": string;
    "goban-theme-custom-black-urls": string[];
    "goban-theme-custom-white-stone-color": string;
    "goban-theme-custom-white-text-color": string;
    "goban-theme-custom-white-urls": string[];
}

export const DEFAULT_GOBAN_BOARD_COLOR = "#DCB35C";
export const DEFAULT_GOBAN_GRID_COLOR = "#000000";
export const DEFAULT_BLACK_STONE_COLOR = "#000000";
export const DEFAULT_WHITE_STONE_COLOR = "#ffffff";
export const DEFAULT_SHADOW_COLOR = "#000000";
export const DEFAULT_SHADOW_GRADIENT = "rotate(45) scale(1.10 1.0) translate(0.05 -0.50)";

export function defaultGobanLabelColor(grid_color: string): string {
    return blendWithInverseColor(grid_color, 0.75);
}

/**
 * The current reset contract for shareable goban theme preferences.
 *
 * Keep this separate from portable-theme migrations: persisted preference migrations
 * deal with private storage keys, while portable migrations deal with a public JSON
 * contract. A future portable schema version may snapshot these values when it adds a
 * field, but both the current UI and a newly-created preference store use this function.
 */
export function createGobanThemePreferenceDefaults(): GobanThemePreferenceDefaults {
    return {
        "fuzzy-stone-placement": false,
        "goban-theme-black": null,
        "goban-theme-board": null,
        "goban-theme-white": null,
        "goban-theme-stone-scale": 1.0,
        "goban-theme-stone-shadows": "default",
        "goban-theme-custom-black-shadow-color": DEFAULT_SHADOW_COLOR,
        "goban-theme-custom-black-shadow-gradient": DEFAULT_SHADOW_GRADIENT,
        "goban-theme-custom-white-shadow-color": DEFAULT_SHADOW_COLOR,
        "goban-theme-custom-white-shadow-gradient": DEFAULT_SHADOW_GRADIENT,
        "goban-theme-custom-board-background": DEFAULT_GOBAN_BOARD_COLOR,
        "goban-theme-custom-board-url": "",
        "goban-theme-custom-board-grid-backgrounds": {
            ...emptyCustomBoardGridBackgrounds,
        },
        "goban-theme-custom-board-line": DEFAULT_GOBAN_GRID_COLOR,
        "goban-theme-custom-board-label": defaultGobanLabelColor(DEFAULT_GOBAN_GRID_COLOR),
        "goban-theme-custom-black-stone-color": DEFAULT_BLACK_STONE_COLOR,
        "goban-theme-custom-black-text-color": "",
        "goban-theme-custom-black-urls": [],
        "goban-theme-custom-white-stone-color": DEFAULT_WHITE_STONE_COLOR,
        "goban-theme-custom-white-text-color": "",
        "goban-theme-custom-white-urls": [],
    };
}
