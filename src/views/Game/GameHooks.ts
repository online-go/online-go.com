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
import { Events as GobanEvents } from "goban";
import * as data from "data";

/**
 * Generates a custom react hook that can return a prop that is derived from a
 * goban object.  It trigger an update on any of the specified events, in
 * addition to the first time it is called and when the goban first loads.
 * @param deriveProp a function that takes in a Goban-like object and returns a value.
 * @param events a list of events that should trigger a recalculation of this value.
 * @returns a React Hook.
 */
export function generateGobanHook<T, G extends GobanCore | null>(
    deriveProp: (goban: G) => T,
    events: Array<keyof Omit<GobanEvents, "load">> = [],
): (goban: G) => T {
    return (goban: G) => {
        const [prop, setProp] = React.useState(deriveProp(goban));
        React.useEffect(() => {
            const syncProp = () => {
                setProp(deriveProp(goban));
            };
            syncProp();

            if (!goban) {
                return;
            }

            const events_with_load: Array<keyof GobanEvents> = ["load", ...events];
            for (const e of events_with_load) {
                goban.on(e, syncProp);
            }
            return () => {
                for (const e of events_with_load) {
                    goban.off(e, syncProp);
                }
            };
        }, [goban]);
        return prop;
    };
}

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
export const useUserIsParticipant = generateGobanHook((goban: GobanCore | null) => {
    const user = data.get("user");
    if (!goban || !user) {
        return false;
    }
    return goban.engine.isParticipant(user.id);
});

/** React hook that returns the current move number from goban */
export const useCurrentMoveNumber = generateGobanHook(
    (goban: GobanCore | null) => goban?.engine.cur_move?.move_number || -1,
    ["cur_move"],
);

/** React hook that returns the current player whose move it is.
 *
 * @returns the player ID of the player whose turn it is.
 */
export const usePlayerToMove = generateGobanHook(
    (goban: GobanCore | null) => goban?.engine.playerToMove() ?? 0,
    ["cur_move", "last_official_move"],
);
