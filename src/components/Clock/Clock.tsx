/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import { Goban, JGOFClock, JGOFPlayerClock, JGOFTimeControl, shortDurationString } from "goban";
import { _, pgettext, interpolate, ngettext } from "translate";

type clock_color = "black" | "white" | "stone-removal";

const ct = 0;

export function Clock({
    goban,
    color,
    className,
    compact,
}: {
    goban: Goban;
    color: clock_color;
    className?: string;
    compact?: boolean;
}): JSX.Element {
    const [clock, setClock]: [JGOFClock, (x: JGOFClock) => void] = useState(null);

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
    });

    if (!clock || !goban) {
        return null;
    }

    const time_control: JGOFTimeControl = goban.engine.time_control;

    if (color === "stone-removal") {
        return <span> ({prettyTime(clock.stone_removal_time_left)})</span>;
    } else {
        const player_clock: JGOFPlayerClock =
            color === "black" ? clock.black_clock : clock.white_clock;
        const player_id: number =
            color === "black" ? goban.engine.players.black.id : goban.engine.players.white.id;

        let clock_className = "Clock " + color;
        if (clock.pause_state) {
            if (time_control.speed === "correspondence") {
                clock_className += " paused-correspondence";
            } else {
                clock_className += " paused";
            }
        }
        if (player_clock.main_time <= 0) {
            clock_className += " in-overtime";
        }
        if (className) {
            clock_className += " " + className;
        }

        if (clock.start_mode && clock.current_player === color) {
            clock_className += " start-mode";
            return <span className={clock_className}>{prettyTime(clock.start_time_left)}</span>;
        }

        return (
            <span className={clock_className}>
                {player_clock.main_time > 0 && (
                    <span className="main-time boxed">{prettyTime(player_clock.main_time)}</span>
                )}

                {time_control.system === "byoyomi" && (
                    <div className="byo-yomi-container">
                        {(!compact || player_clock.main_time <= 0) && (
                            <React.Fragment>
                                {player_clock.main_time > 0 && (
                                    <span className="periods-delimiter"> + </span>
                                )}
                                <span
                                    className={
                                        "period-time boxed" +
                                        (player_clock.periods_left <= 1 ? "sudden-death" : "")
                                    }
                                >
                                    {prettyTime(player_clock.period_time_left)}
                                </span>
                            </React.Fragment>
                        )}
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

                {time_control.system === "canadian" && (!compact || player_clock.main_time <= 0) && (
                    <React.Fragment>
                        <span className="canadian-clock-container">
                            {player_clock.main_time > 0 && (
                                <span className="periods-delimiter"> + </span>
                            )}
                            <span className="period-time boxed">
                                {prettyTime(player_clock.block_time_left)}
                            </span>
                            <span className="periods-delimiter">/</span>
                            <span className="period-moves boxed">{player_clock.moves_left}</span>
                        </span>
                    </React.Fragment>
                )}

                {!compact && clock.pause_state && (
                    <ClockPauseReason clock={clock} player_id={player_id} />
                )}
            </span>
        );
    }

    throw new Error("Clock failed to render");

    function update(clock: JGOFClock) {
        if (clock) {
            setClock(Object.assign({}, clock));
        }
    }
}

function ClockPauseReason({
    clock,
    player_id,
}: {
    clock: JGOFClock;
    player_id: number;
}): JSX.Element {
    let pause_text = _("Paused");
    const pause_state = clock.pause_state;

    if (pause_state.weekend) {
        pause_text = _("Weekend");
    }

    if (pause_state.server) {
        pause_text = _("Paused by Server");
    }

    if (pause_state.vacation && pause_state.vacation[player_id]) {
        pause_text = _("Vacation");
    }

    return <span className="pause-text">{pause_text}</span>;
}

function prettyTime(ms: number): string {
    //return shortDurationString(Math.round(ms / 1000));

    let seconds = Math.ceil((ms - 1) / 1000);
    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let ret = "";
    if (ms <= 0 || isNaN(ms)) {
        ret = "0.0";
    } else if (days > 1) {
        ret += days + " " + ngettext("Day", "Days", days);
        if (hours > 0) {
            ret += " " + (hours + (hours ? " " + ngettext("Hour", "Hours", hours) : ""));
        }
    } else if (hours || days === 1) {
        ret =
            days === 0
                ? interpolate(pgettext("Game clock: Hours and minutes", "%sh %sm"), [
                      hours,
                      minutes,
                  ])
                : interpolate(pgettext("Game clock: hours", "%sh"), [hours + 24]);
    } else {
        ret = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }

    return ret;
}
