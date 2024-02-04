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

import { pgettext } from "translate";

export type ReportType =
    | "all" // not a type, just useful for the enumeration
    // These need to match those defined in the IncidentReport model on the back end
    | "stalling"
    | "inappropriate_content"
    | "score_cheating"
    | "harassment"
    | "ai_use"
    | "sandbagging"
    | "escaping"
    | "appeal"
    | "other"
    | "warning" // for moderators only
    | "troll"; // system generated, for moderators only

// Must match back-end MODERATOR_POWER definition

export enum MODERATOR_POWERS {
    NONE = 0,
    HANDLE_SCORE_CHEAT = 0b001,
    HANDLE_ESCAPING = 0b010,
    HANDLE_STALLING = 0b100,
}

export const MOD_POWER_NEEDED: { [key in ReportType]: MODERATOR_POWERS } = {
    // Note: NONE means there is no CM power that allows this type
    all: MODERATOR_POWERS.NONE,
    stalling: MODERATOR_POWERS.HANDLE_STALLING,
    inappropriate_content: MODERATOR_POWERS.NONE,
    score_cheating: MODERATOR_POWERS.HANDLE_SCORE_CHEAT,
    harassment: MODERATOR_POWERS.NONE,
    ai_use: MODERATOR_POWERS.NONE,
    sandbagging: MODERATOR_POWERS.NONE,
    escaping: MODERATOR_POWERS.HANDLE_ESCAPING,
    appeal: MODERATOR_POWERS.NONE,
    other: MODERATOR_POWERS.NONE,
    warning: MODERATOR_POWERS.NONE,
    troll: MODERATOR_POWERS.NONE,
};

export const MOD_POWER_NAMES: { [key in MODERATOR_POWERS]: string } = {
    [MODERATOR_POWERS.NONE]: pgettext("... as in 'moderators powers: None'", "None"),
    [MODERATOR_POWERS.HANDLE_SCORE_CHEAT]: pgettext(
        "A label for a moderator power",
        "Handle Score Cheating Reports",
    ),
    [MODERATOR_POWERS.HANDLE_ESCAPING]: pgettext(
        "A label for a moderator power",
        "Handle Escaping Reports",
    ),
    [MODERATOR_POWERS.HANDLE_STALLING]: pgettext(
        "A label for a moderator power",
        "Handle Stalling Reports",
    ),
};
