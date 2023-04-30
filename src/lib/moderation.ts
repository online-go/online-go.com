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

import { _ } from "translate";
import { post } from "requests";
import { alert } from "swal_config";
import { GoEngineConfig } from "goban";
import { errorAlerter } from "misc";

export function doAnnul(
    engine: GoEngineConfig,
    tf: boolean,
    onGameAnnulled: (tf: boolean) => void = null,
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
            .replace(/(black)\b/gi, `player ${engine.players.black.id}`)
            .replace(/(white)\b/gi, `player ${engine.players.white.id}`);
    } while (moderation_note === "");

    const annul_request: rest_api.moderation.MassAnnulList = {
        games: [engine.game_id as number],
        annul: tf,
        moderation_note: moderation_note,
    };

    post("moderation/mass_annul", annul_request)
        .then((result: rest_api.moderation.MassAnnulResult) => {
            console.log("annul result", result);
            if (!result["failed"].length) {
                if (tf) {
                    void alert.fire({ text: _("Game has been annulled") });
                } else {
                    void alert.fire({ text: _("Game ranking has been restored") });
                }
                onGameAnnulled && onGameAnnulled(tf);
            } else {
                void alert.fire({ text: _("Something went wrong, no action taken!") });
            }
        })
        .catch(errorAlerter);
}
