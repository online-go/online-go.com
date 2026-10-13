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
import { Goban } from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { del } from "@/lib/requests";
import { errorLogger } from "@/lib/misc";
import { toast } from "@/lib/toast";
import { pgettext } from "@/lib/translate";
import { isLiveGame } from "@/components/TimeControl";

const TOAST_DURATION_MS = 5000;

let exit_in_flight = false;

/**
 * Ends the user's vacation if they have just made a move in a correspondence
 * game that their vacation has paused, and the "auto-exit-vacation-on-move"
 * preference is on.
 *
 * Call this when the server's echo of a move arrives ("move-made"). The echo
 * means the server has accepted the move, so a rejected move does not end the
 * vacation. The checks run synchronously, before auto-advance can navigate
 * away and destroy the goban.
 *
 * The client has no account-wide way of knowing the user is on vacation, so
 * we look for a `vacation-<player_id>` key in the game's pause control.
 * This means games with vacation disabled won't trigger this.
 *
 * Only one request is sent at a time, because other games can still show the
 * vacation pause until the server's clock updates arrive.
 *
 * This never throws, so an error here cannot interfere with move handling.
 */
export function exitVacationIfPaused(goban: Goban): void {
    try {
        if (exit_in_flight || !preferences.get("auto-exit-vacation-on-move")) {
            return;
        }

        const user = data.get("user");
        const engine = goban.engine;
        if (
            user.anonymous ||
            engine.playerNotToMove() !== user.id ||
            isLiveGame(engine.time_control, engine.width, engine.height) ||
            !goban.pause_control?.[`vacation-${user.id}`]
        ) {
            return;
        }

        exit_in_flight = true;
        del("me/vacation")
            .then(() => {
                toast(
                    <div>
                        {pgettext(
                            "Toast shown when making a move automatically ends the player's vacation",
                            "Your vacation has ended because you made a move.",
                        )}
                    </div>,
                    TOAST_DURATION_MS,
                );
            })
            .catch(errorLogger)
            .finally(() => {
                exit_in_flight = false;
            });
    } catch (e) {
        exit_in_flight = false;
        errorLogger(e);
    }
}
