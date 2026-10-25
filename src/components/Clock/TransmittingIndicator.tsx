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
import "./TransmittingIndicator.css";

/**
 * A wifi icon on the avatar of the player the turn is passing to, while the
 * move that passes it is still on its way to them. It renders nothing the
 * rest of the time. The parent's CSS places it on the avatar.
 *
 * It shows in two steps, both on the player who moves next:
 *
 * 1. The local user has sent a move and the server has not acknowledged it
 *    yet (`submitting-move`). The icon goes on the opponent, because the
 *    move is on its way to them.
 * 2. After the server's new clock arrives, goban estimates how long the
 *    move takes to reach the player to move. This is their latency minus
 *    the viewer's (`*_move_transmitting`), and goban holds their clock back
 *    by the same amount. The viewer's own latency is subtracted, so the
 *    icon never shows on the viewer's own avatar in this step.
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
    const own_move_on_its_way_to_them = submitting_move && player_id !== data.get("user").id;

    if (!(transmitting > 0 || own_move_on_its_way_to_them)) {
        return null;
    }

    return (
        <span className="TransmittingIndicator" title={transmitting.toFixed(0)}>
            <i className="fa fa-wifi" />
        </span>
    );
}
