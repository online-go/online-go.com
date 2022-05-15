/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { GobanCore } from "goban";
import { game_control } from "./game_control";
import * as data from "data";

/** React hook that returns true if an undo was requested on the current move */
export function useShowUndoRequested(goban: GobanCore): boolean {
    const [show_undo_requested, setShowUndoRequested] = React.useState(
        goban.engine.undo_requested === goban.engine.last_official_move.move_number &&
            goban.engine.undo_requested === goban.engine.cur_move.move_number,
    );
    React.useEffect(() => {
        const syncShowUndoRequested = () => {
            if (game_control.in_pushed_analysis) {
                return;
            }

            setShowUndoRequested(
                goban.engine.undo_requested === goban.engine.last_official_move.move_number &&
                    goban.engine.undo_requested === goban.engine.cur_move.move_number,
            );
        };
        syncShowUndoRequested();

        goban.on("load", syncShowUndoRequested);
        goban.on("undo_requested", syncShowUndoRequested);
        goban.on("last_official_move", syncShowUndoRequested);
        goban.on("cur_move", syncShowUndoRequested);
    }, [goban, game_control.in_pushed_analysis]);

    return show_undo_requested;
}

/** React hook that returns true if user is a participant in this game */
export function useUserIsParticipant(goban?: GobanCore) {
    const [user_is_participant, setUserIsParticipant] = React.useState(false);
    React.useEffect(() => {
        if (!goban) {
            return;
        }

        setUserIsParticipant(goban.engine.isParticipant(data.get("user").id));
        goban.on("load", () =>
            setUserIsParticipant(goban.engine.isParticipant(data.get("user").id)),
        );
    }, [goban]);
    return user_is_participant;
}

/** React hook that returns the current move number from goban */
export function useCurrentMoveNumber(goban: GobanCore): number {
    const [cur_move_number, setCurMoveNumber] = React.useState(
        goban.engine.cur_move?.move_number || -1,
    );
    React.useEffect(() => {
        goban.on("load", () => setCurMoveNumber(goban.engine.cur_move?.move_number || -1));
        goban.on("cur_move", (move) => setCurMoveNumber(move.move_number));
    }, [goban]);
    return cur_move_number;
}

/** React hook that returns the current player whose move it is.
 *
 * @returns the player ID of the player whose turn it is.
 */
export function usePlayerToMove(goban?: GobanCore): number {
    const [player_to_move, set_player_to_move] = React.useState<number>();
    React.useEffect(() => {
        if (!goban) {
            set_player_to_move(0);
            return;
        }
        const sync_move_info = () => {
            set_player_to_move(goban.engine.playerToMove());
        };
        sync_move_info();
        goban.on("load", sync_move_info);
        goban.on("cur_move", sync_move_info);
        goban.on("last_official_move", sync_move_info);
    }, [goban]);

    return player_to_move;
}
