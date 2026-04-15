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
import { Goban, JGOFPlayerClock, JGOFTimeControl, MoveTree } from "goban";
import { prettyTime } from "./Clock";
import "./SGFClock.css";

interface SGFClockProps {
    goban: Goban;
    color: "black" | "white";
    className?: string;
}

export function SGFClock({ goban, color, className }: SGFClockProps): React.ReactElement | null {
    const [curMove, setCurMove] = React.useState<MoveTree | null>(goban?.engine?.cur_move ?? null);

    React.useEffect(() => {
        if (!goban) {
            return;
        }

        const onCurMove = (move: MoveTree) => {
            setCurMove(move);
        };

        goban.engine.on("cur_move", onCurMove);
        setCurMove(goban.engine.cur_move);

        return () => {
            goban.engine.off("cur_move", onCurMove);
        };
    }, [goban]);

    if (!curMove || !goban) {
        return null;
    }

    const time_settings: JGOFTimeControl | undefined = goban.engine.sgf_time_settings;

    const player_clock = findClockForColor(curMove, color);

    if (!player_clock) {
        return null;
    }

    const in_overtime =
        player_clock.main_time <= 0 ||
        player_clock.periods_left != null ||
        player_clock.moves_left != null;

    let clock_className = "Clock SGFClock " + color;
    if (in_overtime) {
        clock_className += " in-overtime";
    }
    if (className) {
        clock_className += " " + className;
    }

    const system = time_settings?.system;

    return (
        <span className={clock_className}>
            <span className="main-time boxed">
                {prettyTime(player_clock.main_time)}
                {system === "absolute" && <span className="absolute-time">+0</span>}
            </span>

            {system === "byoyomi" && player_clock.periods_left != null && (
                <div className="byo-yomi-container">
                    <span
                        className={
                            "byo-yomi-periods " +
                            (player_clock.periods_left <= 1 ? "sudden-death" : "")
                        }
                    >
                        ({player_clock.periods_left})
                    </span>
                </div>
            )}

            {system === "canadian" && player_clock.moves_left != null && (
                <span className="canadian-clock-container">
                    <span className="periods-delimiter">/</span>
                    <span className="period-moves boxed">{player_clock.moves_left}</span>
                </span>
            )}
        </span>
    );
}

/**
 * Walk backward through the move tree to find the most recent clock value
 * for the given color. BL/WL can both appear on the same node, so each
 * color has its own field (black_clock / white_clock).
 */
function findClockForColor(
    move: MoveTree | null,
    color: "black" | "white",
): JGOFPlayerClock | null {
    const field = color === "black" ? "black_clock" : "white_clock";
    let current: MoveTree | null = move;

    while (current) {
        if (current[field]) {
            return current[field];
        }
        current = current.parent;
    }

    return null;
}
