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

import { pgettext } from "@/lib/translate";

export type ViewMode = "portrait" | "wide" | "square";

/**
 * Where the board sits in the landscape layout.
 *
 * - `window`: the board is centered in the window; the sidebar sits in
 *   the space to its right.
 * - `container`: the board is centered in the space beside the sidebar.
 * - `group`: the board and the sidebar are centered together, as one
 *   block, with equal empty space on both sides.
 */
export type GobanViewBoardAlignment = "window" | "container" | "group";

export const GOBAN_VIEW_BOARD_ALIGNMENTS: readonly GobanViewBoardAlignment[] = [
    "window",
    "container",
    "group",
];

export interface BoardAlignmentOption {
    value: GobanViewBoardAlignment;
    label: string;
}

/** Translated labels for the board alignment preference, in display order. */
export function boardAlignmentOptions(): BoardAlignmentOption[] {
    return [
        {
            value: "window",
            label: pgettext("Board alignment on the game page", "Center in window"),
        },
        {
            value: "container",
            label: pgettext("Board alignment on the game page", "Center beside sidebar"),
        },
        {
            value: "group",
            label: pgettext("Board alignment on the game page", "Center with sidebar"),
        },
    ];
}

/** Root class for the alignment; unknown stored values fall back to `window`. */
export function boardAlignmentClass(alignment: GobanViewBoardAlignment): string {
    const valid = GOBAN_VIEW_BOARD_ALIGNMENTS.includes(alignment) ? alignment : "window";
    return `board-align-${valid}`;
}

export function goban_view_mode(bar_width?: number): ViewMode {
    if (!bar_width) {
        bar_width = 300;
    }

    const h = window.innerHeight || 1;
    const w = window.innerWidth || 1;
    const aspect_ratio = w / h;

    if ((aspect_ratio <= 0.8 || w < bar_width * 2) && w < 1280) {
        return "portrait";
    }

    return "wide";
}

export function goban_view_squashed(): boolean {
    /* This value needs to match the "dock-inline-height" found in Dock.css */
    return window.innerHeight <= 500;
}

export interface TabBarSlot {
    align: "left" | "center" | "right";
    priority?: number;
}

/**
 * Pick the tabs the tab bar can show in `available_width` pixels.
 *
 * Tabs without a `priority` are required and are always returned. Tabs with
 * a `priority` are optional: they are added highest priority first, for as
 * long as the three groups (left, center, right) still fit side by side.
 * Each group is `n` buttons of `button_width` with `gap` between them.
 *
 * When the bar cannot be measured (`button_width` is not positive) every
 * tab is returned, so an unmeasured bar never hides anything.
 *
 * The result keeps the order of `tabs`.
 */
export function selectVisibleTabs<T extends TabBarSlot>(
    tabs: T[],
    available_width: number,
    button_width: number,
    gap: number,
): T[] {
    if (button_width <= 0) {
        return tabs;
    }

    const visible = new Set<T>(tabs.filter((tab) => tab.priority === undefined));
    const optional = tabs
        .filter((tab) => tab.priority !== undefined)
        .sort((a, b) => b.priority! - a.priority!);

    const fits = (): boolean => {
        let width = 0;
        for (const align of ["left", "center", "right"] as const) {
            let count = 0;
            for (const tab of visible) {
                if (tab.align === align) {
                    count++;
                }
            }
            if (count > 0) {
                width += count * button_width + (count - 1) * gap;
            }
        }
        return width <= available_width;
    };

    for (const tab of optional) {
        visible.add(tab);
        if (!fits()) {
            visible.delete(tab);
            break;
        }
    }

    return tabs.filter((tab) => visible.has(tab));
}
