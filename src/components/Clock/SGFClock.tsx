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
    findClock,
    Goban,
    JGOFPlayerClock,
    JGOFTimeControl,
    JGOFTimeControlSystem,
    MoveTree,
    reviewTimeControl,
} from "goban";
import { pauseText, PlayerClockView } from "./Clock";

interface SGFClockProps {
    goban: Goban;
    color: "black" | "white";
    className?: string;
    compact?: boolean;
    lineSummary?: boolean;
    /** Draw the analog turn clock while the review's clock has this player on move */
    show_turn_clock?: boolean;
}

/**
 * A player's clock at the move being viewed: a review's running clock on its
 * live move, else the clock recorded on or before the move. It looks the same
 * as the game clock.
 */
export function SGFClock({
    goban,
    color,
    className,
    compact,
    lineSummary,
    show_turn_clock,
}: SGFClockProps): React.ReactElement | null {
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
        // A load replaces the engine and all of its moves. A new review's
        // log can load without moving to a move afterwards.
        const onLoad = () => {
            setCurMove(goban.engine.cur_review_move ?? goban.engine.cur_move);
        };

        // Subscribe to both events — in review mode, navigation fires
        // cur_review_move instead of cur_move.
        goban.on("cur_move", onCurMove);
        goban.on("cur_review_move", onCurReviewMove);
        goban.on("load", onLoad);
        onLoad();

        return () => {
            goban.off("cur_move", onCurMove);
            goban.off("cur_review_move", onCurReviewMove);
            goban.off("load", onLoad);
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

    const time_control = reviewTimeControl(goban.engine);
    // As in a game, the player on move has the turn while the clock runs or
    // is paused, but not in stone removal or once the game is over
    const their_turn =
        !!live?.on_move &&
        (live.running || (!!live.pause_state && !live.pause_state.stone_removal));

    return (
        <PlayerClockView
            color={color}
            player_clock={withOvertime(player_clock, time_control)}
            time_control={time_control}
            className={"SGFClock" + (className ? " " + className : "")}
            compact={compact}
            lineSummary={lineSummary}
            show_turn_clock={show_turn_clock && their_turn}
            pause_text={
                live?.pause_state &&
                pauseText(live.pause_state, goban.engine.players[color]?.id ?? 0)
            }
        />
    );
}

/**
 * A recorded clock still in main time leaves out the overtime to come, which
 * a game clock shows beside the main time: the byo-yomi periods, or the
 * canadian block.
 */
function withOvertime(clock: JGOFPlayerClock, tc: JGOFTimeControl | undefined): JGOFPlayerClock {
    switch (tc?.system) {
        case "byoyomi":
            return { periods_left: tc.periods, period_time_left: tc.period_time * 1000, ...clock };
        case "canadian":
            return {
                moves_left: tc.stones_per_period,
                block_time_left: tc.period_time * 1000,
                ...clock,
            };
        default:
            return clock;
    }
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
