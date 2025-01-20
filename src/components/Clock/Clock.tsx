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
import { Goban, JGOFClockWithTransmitting, JGOFPlayerClock, JGOFTimeControl } from "goban";
import { _, pgettext, interpolate, ngettext } from "@/lib/translate";

type clock_color = "black" | "white" | "stone-removal";

export function Clock({
    goban,
    color,
    className,
    compact,
    lineSummary,
}: {
    goban: Goban;
    color: clock_color;
    className?: string;
    compact?: boolean;
    lineSummary?: boolean;
}): React.ReactElement | null {
    const [clock, setClock] = useState<JGOFClockWithTransmitting | null>(null);
    const [submitting_move, _setSubmittingMove] = useState<boolean>(false);

    useEffect(() => {
        function setSubmittingMove(submitting: boolean) {
            _setSubmittingMove(submitting);
        }

        if (goban) {
            goban.on("clock", update);
            goban.on("submitting-move", setSubmittingMove);
        }

        return () => {
            // cleanup
            if (goban) {
                goban.off("clock", update);
                goban.off("submitting-move", setSubmittingMove);
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
        const transmitting: number =
            color === "black" ? clock.black_move_transmitting : clock.white_move_transmitting;

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
            return (
                <span className={clock_className}>{prettyTime(clock.start_time_left || 0)}</span>
            );
        }

        // The main time for correspondence games can get pretty lengthy, for those
        // use use a smaller font
        const need_small_main_time_font = prettyTime(player_clock.main_time).length > 8;

        const show_pause = !compact && clock.pause_state;

        return (
            <span className={clock_className}>
                {player_clock.main_time > 0 && (
                    <span
                        className={"main-time boxed " + (need_small_main_time_font ? " small" : "")}
                    >
                        {prettyTime(player_clock.main_time)}
                        {time_control.system === "absolute" && (
                            <>
                                <span className="absolute-time">+0</span>
                            </>
                        )}
                    </span>
                )}

                {time_control.system === "byoyomi" && (
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

                {time_control.system === "canadian" &&
                    (!compact || player_clock.main_time <= 0) && (
                        <React.Fragment>
                            <span className="canadian-clock-container">
                                {player_clock.main_time > 0 && (
                                    <span className="periods-delimiter"> + </span>
                                )}
                                <span className="period-time boxed">
                                    {prettyTime(player_clock.block_time_left || 0)}
                                </span>
                                <span className="periods-delimiter">/</span>
                                <span className="period-moves boxed">
                                    {player_clock.moves_left}
                                </span>
                            </span>
                        </React.Fragment>
                    )}

                {(show_pause || !lineSummary) && (
                    <div className="pause-and-transmit">
                        {!lineSummary &&
                            ((submitting_move && player_id !== data.get("user").id) ||
                            transmitting > 0 ? (
                                <span
                                    className="transmitting fa fa-wifi"
                                    title={transmitting.toFixed(0)}
                                />
                            ) : (
                                <span className="transmitting" />
                            ))}
                        {show_pause && <ClockPauseReason clock={clock} player_id={player_id} />}
                    </div>
                )}
            </span>
        );
    }

    function update(clock?: JGOFClockWithTransmitting | null) {
        if (clock) {
            setClock(Object.assign({}, clock));
        }
    }
}

function ClockPauseReason({
    clock,
    player_id,
}: {
    clock: JGOFClockWithTransmitting;
    player_id: number;
}): React.ReactElement {
    let pause_text = _("Paused");
    const pause_state = clock.pause_state;

    if (pause_state) {
        if (pause_state.weekend) {
            pause_text = _("Weekend");
        }

        if (pause_state.server) {
            pause_text = _("Paused by Server");
        }

        if (pause_state.vacation && pause_state.vacation[player_id]) {
            pause_text = _("Vacation");
        }
    }

    return <span className="pause-text">{pause_text}</span>;
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
