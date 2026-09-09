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

import * as data from "@/lib/data";

export type KibitzPortraitPane =
    | "game-chat"
    | "room-chat"
    | "people"
    | "variations"
    | "rooms"
    | "analysis";

export const KIBITZ_PORTRAIT_PANES: readonly KibitzPortraitPane[] = [
    "game-chat",
    "room-chat",
    "people",
    "variations",
    "rooms",
    "analysis",
];

/** Where a reader starts, and where a pane that closes falls back to when
 *  there is nothing behind it. */
export const KIBITZ_DEFAULT_PORTRAIT_PANE: KibitzPortraitPane = "room-chat";

/** The analysis pane only has content while the centre shows a draft or a
 *  variation, so it is never restored on load — a reader who left while
 *  analyzing comes back to a pane that has something in it. */
const TRANSIENT_PANES: readonly KibitzPortraitPane[] = ["analysis"];

function isPane(value: unknown): value is KibitzPortraitPane {
    return KIBITZ_PORTRAIT_PANES.includes(value as KibitzPortraitPane);
}

function isRestorablePane(value: unknown): value is KibitzPortraitPane {
    return isPane(value) && !TRANSIENT_PANES.includes(value);
}

/** Which pane the portrait layout shows. Falls back to the landscape chat
 *  tab (`kibitz.chat_tab`) when no pane has been stored, and then to the
 *  default. */
export function readPortraitPane(): KibitzPortraitPane {
    const stored = data.get("kibitz.portrait_pane");
    if (isRestorablePane(stored)) {
        return stored;
    }

    const legacy = data.get("kibitz.chat_tab");
    if (legacy === "game" || legacy === "room") {
        const migrated: KibitzPortraitPane = legacy === "game" ? "game-chat" : "room-chat";
        data.set("kibitz.portrait_pane", migrated);
        return migrated;
    }

    return KIBITZ_DEFAULT_PORTRAIT_PANE;
}

export function writePortraitPane(pane: KibitzPortraitPane): void {
    if (TRANSIENT_PANES.includes(pane)) {
        return;
    }
    data.set("kibitz.portrait_pane", pane);
}
