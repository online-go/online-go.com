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

import type {
    ActionButtonsPosition,
    GobanViewBoardAlignment,
    MoveControlsPosition,
} from "@/components/GobanView/layout";
import { pgettext } from "@/lib/translate";

/* The titles and the choices of the layout settings. The pickers and the
 * Settings page use these, so each label is written once. */

export function actionButtonsTitle(): string {
    return pgettext("Setting for where the game action buttons go", "Action buttons");
}

/** Choices for where the game action buttons go, in display order. */
export function actionButtonsOptions(): { value: ActionButtonsPosition; label: string }[] {
    return [
        {
            value: "bar",
            label: pgettext(
                "Action buttons position: a row of icons at the bottom of the game side panel",
                "Bottom of the side panel",
            ),
        },
        {
            value: "dock",
            label: pgettext(
                "Action buttons position: a column of labelled buttons at the right side of the game page",
                "Right side",
            ),
        },
    ];
}

export function moveControlsTitle(): string {
    return pgettext("Setting for where the move controls go", "Move controls");
}

/** Choices for where the move controls go, in display order. */
export function moveControlsOptions(): { value: MoveControlsPosition; label: string }[] {
    return [
        {
            value: "under-board",
            label: pgettext("Move controls position: directly under the board", "Under the board"),
        },
        {
            value: "docked",
            label: pgettext(
                "Move controls position: in the side panel or the bottom bar",
                "Docked",
            ),
        },
    ];
}

export function boardAlignmentTitle(): string {
    return pgettext("Board alignment on the game page", "Board alignment");
}

/** Choices for the board alignment, in display order. */
export function boardAlignmentOptions(): { value: GobanViewBoardAlignment; label: string }[] {
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

export function chatColumnTitle(): string {
    return pgettext("Setting that puts the game chat in a left column", "Chat column");
}

/** Choices for where the game chat goes on the Game page, in display order. */
export function chatColumnOptions(): { value: boolean; label: string }[] {
    return [
        {
            value: true,
            label: pgettext(
                "Chat column setting: the game chat is in its own column left of the board",
                "Left column",
            ),
        },
        {
            value: false,
            label: pgettext(
                "Chat column setting: the game chat is in the side panel",
                "In the side panel",
            ),
        },
    ];
}

export function scrollingLayoutTitle(): string {
    return pgettext(
        "Setting for a board page layout that scrolls as one column",
        "Scrolling layout",
    );
}

/** Choices for the phone layout of the board pages, in display order. */
export function mobileScrollOptions(): { value: boolean; label: string }[] {
    return [
        {
            value: false,
            label: pgettext(
                "Scrolling layout setting: the board page fits the phone screen, with a tab bar",
                "Fits the screen",
            ),
        },
        {
            value: true,
            label: pgettext(
                "Scrolling layout setting: the board page scrolls as one column",
                "Scrolls",
            ),
        },
    ];
}
