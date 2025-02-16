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

import * as React from "react";
import { _ } from "@/lib/translate";
import { post } from "@/lib/requests";
import { alert } from "@/lib/swal_config";
import { GobanEngineConfig } from "goban";
import { errorAlerter } from "@/lib/misc";
import { toast } from "@/lib/toast";

import { pgettext } from "@/lib/translate";

// Must match back-end MODERATOR_POWER definition
export enum MODERATOR_POWERS {
    NONE = 0,
    HANDLE_SCORE_CHEAT = 0b001,
    HANDLE_ESCAPING = 0b010,
    HANDLE_STALLING = 0b100,
    SUSPEND = 0b1000,
    ASSESS_AI_REPORTS = 0b10000,
}

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
    [MODERATOR_POWERS.SUSPEND]: pgettext("A label for a moderator power", "Vote for Suspension"),
    [MODERATOR_POWERS.ASSESS_AI_REPORTS]: pgettext(
        "A label for a moderator power",
        "Assess AI Reports",
    ),
};

export function doAnnul(
    engine: GobanEngineConfig,
    tf: boolean,
    onGameAnnulled: ((tf: boolean) => void) | null = null,
    init_prompt: string = "",
): void {
    let moderation_note: string | null = null;
    do {
        moderation_note = tf
            ? prompt(_("ANNULMENT - Moderator note:"), init_prompt)
            : prompt(_("Un-annulment - Moderator note:"), init_prompt);
        if (moderation_note == null) {
            return;
        }
        moderation_note = moderation_note
            .trim()
            .replace(/(black)\b/gi, `player ${engine.players?.black.id}`)
            .replace(/(white)\b/gi, `player ${engine.players?.white.id}`);
    } while (moderation_note === "");

    const annul_request: rest_api.moderation.AnnulList = {
        games: [engine.game_id as number],
        annul: tf,
        moderation_note: moderation_note,
    };

    post("moderation/annul", annul_request)
        .then((result: rest_api.moderation.AnnulResult) => {
            console.log("annul result", result);
            if (!result["failed"].length) {
                if (tf) {
                    toast(<div>Game has been annulled</div>, 2000);
                } else {
                    toast(<div>Game ranking has been restored</div>, 2000);
                }
                onGameAnnulled?.(tf);
            } else {
                void alert.fire({ text: _("Something went wrong, no action taken!") });
            }
        })
        .catch(errorAlerter);
}
