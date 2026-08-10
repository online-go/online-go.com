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
import { _ } from "@/lib/translate";
import * as data from "@/lib/data";
import { alert } from "@/lib/swal_config";

/**
 * Ask the opponent to undo the last official move. Does nothing when the
 * user is not a player, when there is no move to take back, or when an undo
 * for that move is already pending.
 */
export function requestUndo(goban: Goban, user_id: number): void {
    const engine = goban.engine;

    if (!engine.isParticipant(user_id)) {
        return;
    }

    const is_player_turn =
        user_id === engine.playerToMove() || user_id === engine.playerNotToMove();

    if (
        is_player_turn &&
        engine.getMoveNumber() > 0 &&
        engine.undo_requested !== engine.getMoveNumber()
    ) {
        goban.requestUndo();
    }
}

/**
 * Confirm, then cancel or resign the game. Early games are cancelled instead
 * of resigned; in casual rengo a player with team mates drops out of the team
 * rather than ending the game for everyone.
 */
export function cancelOrResignGame(goban: Goban, resign_mode: "cancel" | "resign"): void {
    const engine = goban.engine;
    let dropping_from_casual_rengo = false;

    if (engine.rengo && engine.rengo_casual_mode) {
        const team = engine.rengo_teams!.black.find((p) => p.id === data.get("user").id)
            ? "black"
            : "white";
        dropping_from_casual_rengo = engine.rengo_teams![team].length > 1;
    }

    const text =
        resign_mode === "cancel"
            ? _("Are you sure you wish to cancel this game?")
            : dropping_from_casual_rengo
              ? _("Are you sure you want to abandon your team?")
              : _("Are you sure you wish to resign this game?");
    const cb = resign_mode === "cancel" ? () => goban.cancelGame() : () => goban.resign();

    void alert
        .fire({
            text: text,
            confirmButtonText: _("Yes"),
            cancelButtonText: _("No"),
            showCancelButton: true,
            focusCancel: true,
        })
        .then(({ value: accept }) => {
            if (accept) {
                cb();
            }
        });
}
