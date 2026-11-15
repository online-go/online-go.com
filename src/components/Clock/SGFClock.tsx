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
import {
    clockTimeLeft,
    findClock,
    Goban,
    JGOFPlayerClock,
    JGOFTimeControlSystem,
    MoveTree,
    reviewTimeControl,
} from "goban";
import { pgettext } from "@/lib/translate";
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
        const onCurReviewMove = (move: MoveTree | undefined) => {
            if (move) {
                setCurMove(move);
            }
        };

        // Subscribe to both events — in review mode, navigation fires
        // cur_review_move instead of cur_move.
        goban.on("cur_move", onCurMove);
        goban.on("cur_review_move", onCurReviewMove);
        setCurMove(goban.engine.cur_review_move ?? goban.engine.cur_move);

        return () => {
            goban.off("cur_move", onCurMove);
            goban.off("cur_review_move", onCurReviewMove);
        };
    }, [goban]);

    // A clock set on the current review node changes the node in place.
    const [review_version, setReviewVersion] = React.useState(0);
    React.useEffect(() => {
        if (!goban) {
            return;
        }
        const onReviewUpdated = () => setReviewVersion((v) => v + 1);
        goban.on("review.updated", onReviewUpdated);
        return () => {
            goban.off("review.updated", onReviewUpdated);
        };
    }, [goban]);

    const stored_clock = React.useMemo(
        () => (curMove ? clockAtMove(goban, curMove, color) : null),
        [goban, curMove, color, review_version],
    );

    // A review's running clock, shown on its live move
    const live =
        curMove && goban && curMove.id === goban.engine.last_official_move?.id
            ? goban.getReviewClock(color)
            : null;
    const ticking = !!live?.running && live.on_move;
    const [, setTick] = React.useState(0);
    React.useEffect(() => {
        if (!ticking) {
            return;
        }
        const interval = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(interval);
    }, [ticking]);

    const player_clock = live?.clock ?? stored_clock;
    if (!curMove || !goban || !player_clock) {
        return null;
    }

    const system = clockTimeSystem(goban);
    const time_left = clockTimeLeft(player_clock);

    let clock_className = "Clock SGFClock " + color;
    if (player_clock.main_time <= 0) {
        clock_className += " in-overtime";
    }
    if (live && !live.running) {
        clock_className += " paused";
    }
    if (className) {
        clock_className += " " + className;
    }

    return (
        <span className={clock_className}>
            <span className="main-time boxed">
                {prettyTime(time_left)}
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
                        (
                        {player_clock.periods_left === 1
                            ? pgettext("Final byo-yomi period (Sudden Death)", "SD")
                            : `${player_clock.periods_left}`}
                        )
                    </span>
                </div>
            )}

            {system === "canadian" && player_clock.moves_left != null && (
                <span className="canadian-clock-container">
                    <span className="periods-delimiter">/</span>
                    <span className="period-moves boxed">{player_clock.moves_left}</span>
                </span>
            )}

            {/* A review of an OGS game stops its clock at a pause and at the end alike */}
            {live && !live.running && goban.isDemoBoard() && (
                <span className="paused-label">
                    {pgettext("Demo board clock is paused", "Paused")}
                </span>
            )}
        </span>
    );
}

/** The time system per-move clocks are read against: an uploaded SGF's own, else the game's */
export function clockTimeSystem(goban: Goban): JGOFTimeControlSystem | undefined {
    return reviewTimeControl(goban.engine)?.system;
}

/**
 * Whether to show per-move clocks rather than the live clock. Reviews and
 * demos always do, since their controller can set clocks on any node at any
 * time; SGFClock shows nothing until one is found. Games need time settings
 * and a clock recorded on their official line or at their end.
 */
export function hasMoveClocks(goban: Goban): boolean {
    if (goban.review_id) {
        return true;
    }
    if (!clockTimeSystem(goban)) {
        return false;
    }
    const last = goban.engine.last_official_move;
    return (
        !!goban.engine.config.final_clock ||
        !!findClock(last, "black") ||
        !!findClock(last, "white")
    );
}

/**
 * The clock to show for a color at a move. At the end of a finished game
 * this is what the clocks read when it ended, which charges the player on
 * move for the think the game ended on.
 */
function clockAtMove(
    goban: Goban,
    move: MoveTree,
    color: "black" | "white",
): JGOFPlayerClock | null {
    const final_clock = goban.engine.config.final_clock;
    if (
        final_clock &&
        goban.engine.phase === "finished" &&
        move.id === goban.engine.last_official_move.id
    ) {
        return final_clock[color];
    }
    return findClock(move, color) ?? null;
}
