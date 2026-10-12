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

import { Goban } from "goban";
import * as data from "@/lib/data";
import * as preferences from "@/lib/preferences";
import { del } from "@/lib/requests";
import { errorLogger } from "@/lib/misc";
import { isLiveGame } from "@/components/TimeControl";

/**
 * Ends the user's vacation if this is a correspondence game that their
 * vacation has paused and the "auto-exit-vacation-on-move" preference is on.
 *
 * The client has no account-wide way of knowing the user is on vacation, so
 * we look for a `vacation-<player_id>` key in the game's pause control.
 * This means games with vacation disabled won't trigger this.
 *
 * Call this when the move is sent, not when the server acknowledges the move.
 * Auto-advance can navigate to the next board as soon as the move echo
 * arrives, which destroys the goban and its listeners, so we can't rely on an
 * acknowledgement listener.
 */
export function exitVacationIfPaused(goban: Goban): void {
    if (!preferences.get("auto-exit-vacation-on-move")) {
        return;
    }

    const user = data.get("user");
    const engine = goban.engine;
    if (
        user.anonymous ||
        isLiveGame(engine.time_control, engine.width, engine.height) ||
        !goban.pause_control?.[`vacation-${user.id}`]
    ) {
        return;
    }

    del("me/vacation").catch(errorLogger);
}
