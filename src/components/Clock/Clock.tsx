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
import { useEffect, useState } from "react";
import {
    Goban,
    JGOFClockWithTransmitting,
    JGOFPauseState,
    JGOFPlayerClock,
    JGOFTimeControl,
} from "goban";
import { _, pgettext, interpolate, ngettext } from "@/lib/translate";
import { TurnClock } from "@/components/TurnClock";
import "./Clock.css";

type clock_color = "black" | "white" | "stone-removal";

export function Clock({
    goban,
    color,
    className,
    compact,
    lineSummary,
    show_turn_clock,
}: {
    goban: Goban;
    color: clock_color;
    className?: string;
    compact?: boolean;
    lineSummary?: boolean;
    /** Draw the analog turn clock that marks the player to move. */
    show_turn_clock?: boolean;
}): React.ReactElement | null {
    const [clock, setClock] = useState<JGOFClockWithTransmitting | null>(null);

    useEffect(() => {
        if (goban) {
            goban.on("clock", update);
        }

        return () => {
            // cleanup
            if (goban) {
                goban.off("clock", update);
            }
        };
    }, [goban]);

    if (!clock || !goban || !goban?.engine?.time_control) {
        return null;
    }

    const time_control: JGOFTimeControl = goban?.engine?.time_control;

    if (!time_control) {
        return null;
    }

    if (color === "stone-removal") {
        return <span> ({prettyTime(clock.stone_removal_time_left || 0)})</span>;
    } else {
        const player_clock: JGOFPlayerClock =
            color === "black" ? clock.black_clock : clock.white_clock;
        const player_id: number =
            color === "black" ? goban.engine.players.black.id : goban.engine.players.white.id;

        if (clock.start_mode && clock.current_player === color) {
            return (
                <span
                    className={
                        clockClassName(
                            color,
                            player_clock,
                            time_control,
                            !!clock.pause_state,
                            className,
                        ) + " start-mode"
                    }
                >
                    {prettyTime(clock.start_time_left || 0)}
                    {/* The same wrapper the running clock uses, so the face
                     * keeps its usual place beside the digits. */}
                    {show_turn_clock && (
                        <div className="clock-status">
                            <TurnClock time_left={clock.start_time_left || 0} />
                        </div>
                    )}
                </span>
            );
        }

        return (
            <PlayerClockView
                color={color}
                player_clock={player_clock}
                time_control={time_control}
                className={className}
                compact={compact}
                lineSummary={lineSummary}
                show_turn_clock={show_turn_clock}
                pause_text={clock.pause_state && pauseText(clock.pause_state, player_id)}
            />
        );
    }

    function update(clock?: JGOFClockWithTransmitting | null) {
        if (clock) {
            setClock(Object.assign({}, clock));
        }
    }
}

/**
 * One player's clock. A game's clock and a review's clock both draw through
 * this, so the two look the same.
 */
export function PlayerClockView({
    color,
    player_clock,
    time_control,
    className,
    compact,
    lineSummary,
    show_turn_clock,
    pause_text,
}: {
    color: "black" | "white";
    player_clock: JGOFPlayerClock;
    /** Undefined for a clock recorded with no time settings */
    time_control: JGOFTimeControl | undefined;
    className?: string;
    compact?: boolean;
    lineSummary?: boolean;
    /** Draw the analog turn clock that marks the player to move. */
    show_turn_clock?: boolean;
    /** Why the clock is paused; undefined while it is not paused */
    pause_text?: string;
}): React.ReactElement {
    const system = time_control?.system;

    // The main time for correspondence games can get pretty lengthy, for those
    // use use a smaller font
    const need_small_main_time_font = prettyTime(player_clock.main_time).length > 8;

    const show_pause = !compact && pause_text !== undefined;

    /* Overtime shows in place of main time once that runs out. A player with
     * neither left shows 0.0 rather than nothing. */
    const has_overtime =
        system === "canadian" || (system === "byoyomi" && (player_clock.periods_left || 0) >= 1);

    /* The time the player is actually burning down: the main time until
     * it runs out, then the overtime block of their time control. */
    let running_time_left = player_clock.main_time;
    if (running_time_left <= 0) {
        running_time_left =
            (system === "canadian"
                ? player_clock.block_time_left
                : player_clock.period_time_left) || 0;
    }

    return (
        <span
            className={clockClassName(
                color,
                player_clock,
                time_control,
                pause_text !== undefined,
                className,
            )}
        >
            {(player_clock.main_time > 0 || !has_overtime) && (
                <span className={"main-time boxed " + (need_small_main_time_font ? " small" : "")}>
                    {prettyTime(player_clock.main_time)}
                    {system === "absolute" && (
                        <>
                            <span className="absolute-time">+0</span>
                        </>
                    )}
                </span>
            )}

            {system === "byoyomi" && (
                <div className="byo-yomi-container">
                    {(!compact || player_clock.main_time <= 0) && (
                        <React.Fragment>
                            {player_clock.main_time > 0 &&
                                (player_clock.periods_left || 0) >= 1 && (
                                    <span className="periods-delimiter"> + </span>
                                )}
                            {(player_clock.periods_left || 0) >= 1 && (
                                <span
                                    className={
                                        "period-time boxed" +
                                        ((player_clock.periods_left || 0) <= 1
                                            ? "sudden-death"
                                            : "")
                                    }
                                >
                                    {prettyTime(player_clock.period_time_left || 0)}
                                </span>
                            )}
                        </React.Fragment>
                    )}
                    {(player_clock.periods_left || 0) >= 1 && (
                        <span
                            className={
                                "byo-yomi-periods " +
                                ((player_clock.periods_left || 0) <= 1 ? "sudden-death" : "")
                            }
                        >
                            (
                            {player_clock.periods_left === 1
                                ? pgettext("Final byo-yomi period (Sudden Death)", "SD")
                                : `${player_clock.periods_left}`}
                            )
                        </span>
                    )}
                </div>
            )}

            {system === "canadian" && (!compact || player_clock.main_time <= 0) && (
                <React.Fragment>
                    <span className="canadian-clock-container">
                        {player_clock.main_time > 0 && (
                            <span className="periods-delimiter"> + </span>
                        )}
                        <span className="period-time boxed">
                            {prettyTime(player_clock.block_time_left || 0)}
                        </span>
                        <span className="periods-delimiter">/</span>
                        <span className="period-moves boxed">{player_clock.moves_left}</span>
                    </span>
                </React.Fragment>
            )}

            {(show_pause || !lineSummary || show_turn_clock) && (
                <div className="clock-status">
                    {show_pause && <span className="pause-text">{pause_text}</span>}
                    {show_turn_clock && <TurnClock time_left={running_time_left} />}
                </div>
            )}
        </span>
    );
}

function clockClassName(
    color: "black" | "white",
    player_clock: JGOFPlayerClock,
    time_control: JGOFTimeControl | undefined,
    paused: boolean,
    className: string | undefined,
): string {
    let ret = "Clock " + color;
    if (paused) {
        ret += time_control?.speed === "correspondence" ? " paused-correspondence" : " paused";
    }
    if (player_clock.main_time <= 0) {
        ret += " in-overtime";
    }
    if (className) {
        ret += " " + className;
    }
    return ret;
}

/** What a paused clock says about why it is paused */
export function pauseText(pause_state: JGOFPauseState, player_id: number): string {
    let pause_text = _("Paused");

    if (pause_state.weekend) {
        pause_text = _("Weekend");
    }

    if (pause_state.server) {
        pause_text = _("Paused by Server");
    }

    if (pause_state.vacation && pause_state.vacation[player_id]) {
        pause_text = _("Vacation");
    }

    return pause_text;
}

// exported for testing
export function prettyTime(ms: number): string {
    let seconds = Math.ceil((ms - 1) / 1000);
    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    if (ms <= 0 || isNaN(ms)) {
        return "0.0";
    }
    if (days > 1) {
        return hours > 0
            ? interpolate(pgettext("Game clock: Days and hours", "%sd %sh"), [days, hours])
            : days + " " + ngettext("Day", "Days", days);
    }
    if (hours || days === 1) {
        return days === 0
            ? interpolate(pgettext("Game clock: Hours and minutes", "%sh %sm"), [hours, minutes])
            : interpolate(pgettext("Game clock: hours", "%sh"), [hours + 24]);
    }
    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}
