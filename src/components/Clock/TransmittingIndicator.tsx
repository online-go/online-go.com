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
import * as data from "@/lib/data";
import { useEffect, useState } from "react";
import { Goban, JGOFClockWithTransmitting } from "goban";

/**
 * The wifi icon that shows while a player's move is on its way to the
 * server. It renders nothing the rest of the time, so the parent places it
 * (the game page floats it on the corner of the player's avatar).
 */
export function TransmittingIndicator({
    goban,
    color,
}: {
    goban: Goban;
    color: "black" | "white";
}): React.ReactElement | null {
    const [transmitting, setTransmitting] = useState<number>(0);
    const [submitting_move, setSubmittingMove] = useState<boolean>(false);

    useEffect(() => {
        function update(clock?: JGOFClockWithTransmitting | null) {
            if (clock) {
                setTransmitting(
                    color === "black"
                        ? clock.black_move_transmitting
                        : clock.white_move_transmitting,
                );
            }
        }

        goban.on("clock", update);
        goban.on("submitting-move", setSubmittingMove);
        return () => {
            goban.off("clock", update);
            goban.off("submitting-move", setSubmittingMove);
        };
    }, [goban, color]);

    const player_id =
        color === "black" ? goban.engine.players.black.id : goban.engine.players.white.id;

    if (!(transmitting > 0 || (submitting_move && player_id !== data.get("user").id))) {
        return null;
    }

    return <span className="TransmittingIndicator fa fa-wifi" title={transmitting.toFixed(0)} />;
}
