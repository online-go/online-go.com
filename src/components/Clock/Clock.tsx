/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import { Goban, JGOFClock, JGOFPlayerClock, JGOFTimeControl, shortDurationString } from 'goban';
import {_, pgettext, interpolate, ngettext} from "translate";

type clock_color = 'black' | 'white' | 'stone-removal';

let ct = 0;


export function Clock({goban, color, className}:{goban:Goban, color:clock_color, className?:string}):JSX.Element {
    const [clock, setClock]:[JGOFClock, (x:JGOFClock) => void] = useState(null);

    useEffect(() => {
        if (goban) {
            goban.on('clock', update);
        }

        return () => { // cleanup
            if (goban) {
                goban.off('clock', update);
            }
        };
    });

    if (!clock || !goban) {
        return null;
    }

    const time_control:JGOFTimeControl = goban.engine.time_control;

    if (color === 'stone-removal') {
        console.log('stone removal', clock);
        return <span>TODO</span>;
    } else {
        let player_clock:JGOFPlayerClock = color === 'black' ? clock.black_clock : clock.white_clock;
        let player_id:number = color === 'black' ? goban.engine.black_player_id : goban.engine.white_player_id;

        let clock_className = 'Clock ' + color;
        if (clock.pause_state) {
            clock_className += ' paused';
        }
        if (player_clock.main_time <= 0) {
            clock_className += ' in-overtime';
        }
        if (className) {
            clock_className += ' ' + className;
        }

        return (
            <span className={clock_className}>
                {player_clock.main_time > 0 &&
                    <span className='main-time boxed'>{prettyTime(player_clock.main_time)}</span>
                }

                {time_control.system === 'byoyomi' &&
                    <React.Fragment>
                        {player_clock.main_time > 0 && <span> + </span>}
                        <span className={'period-time boxed' + (player_clock.periods_left <= 1 ? 'sudden-death' : '')}>
                            {prettyTime(player_clock.period_time_left)}
                        </span>
                        <span className={'byo-yomi-periods ' + (player_clock.periods_left <= 1 ? 'sudden-death' : '')}
                            > ({
                                player_clock.periods_left === 1
                                    ?  pgettext("Final byo-yomi period (Sudden Death)", "SD")
                                    : `${player_clock.periods_left}`
                            })</span>
                    </React.Fragment>
                }

                {time_control.system === 'canadian' &&
                    <React.Fragment>
                        {player_clock.main_time > 0 && <span> + </span>}
                        <span>
                            <span className='period-time boxed'>{prettyTime(player_clock.block_time_left)}</span>
                            /
                            <span className='periods boxed'>{player_clock.moves_left}</span>
                        </span>
                    </React.Fragment>
                }

                {clock.pause_state && <ClockPauseReason clock={clock} player_id={player_id} />}
            </span>
        );
    }


    throw new Error('Clock failed to render');

    function update(clock) {
        if (clock) {
            setClock(Object.assign({}, clock));
        }
    }
}

function ClockPauseReason({clock, player_id}:{clock:JGOFClock, player_id:number}):JSX.Element {
    let pause_text = _("Paused");
    let pause_state = clock.pause_state;
    //console.log(pause_state);

    if (pause_state.weekend) {
        pause_text = _("Weekend");
    }

    if (pause_state.server) {
        pause_text = _("Paused by Server");
    }

    if (pause_state.vacation && pause_state.vacation[player_id]) {
        pause_text = _("Vacation");
    }

    return <span className='pause-text'>{pause_text}</span>;
}

function prettyTime(ms:number):string {
    let seconds = Math.ceil((ms - 1) / 1000);
    let days = Math.floor(seconds / 86400); seconds -= days * 86400;
    let hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60); seconds -= minutes * 60;

    let ret = "";
    if (ms <= 0 || isNaN(ms)) {
        ret = "0.0";
    } else if (days > 1) {
        ret += (days + ' ' + ngettext("Day", "Days", days));
        if (hours > 0) {
            ret += ' ' + (hours + (hours ? ngettext("Hour", "Hours", hours) : ""));
        }
    } else if (hours || days === 1) {
        ret = days === 0
            ? interpolate(pgettext("Game clock: Hours and minutes", "%sh %sm"), [hours, minutes])
            : interpolate(pgettext("Game clock: hours", "%sh"), [hours + 24]);
    } else {
        ret = minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
        /*
        if (minutes === 0 && seconds <= 10) {
            if (seconds % 2 === 0) {
                cls += " low_time";
            }

            if (this.on_game_screen && player_id) {
                if (window["user"] && player_id === window["user"].id && window["user"].id === this.engine.playerToMove()) {
                    this.byoyomi_label = "" + seconds;
                    let last_byoyomi_label = this.byoyomi_label;
                    if (this.last_hover_square) {
                        this.__drawSquare(this.last_hover_square.x, this.last_hover_square.y);
                    }
                    setTimeout(() => {
                        if (this.byoyomi_label === last_byoyomi_label) {
                            this.byoyomi_label = null;
                            if (this.last_hover_square) {
                                this.__drawSquare(this.last_hover_square.x, this.last_hover_square.y);
                            }
                        }
                    }, 1100);
                }

                if (this.mode === "play") {
                    this.emit('audio-clock', {
                        seconds_left: seconds,
                        player_to_move: this.engine.playerToMove(),
                        clock_player: player_id,
                        time_control_system: timing_type,
                        in_overtime: in_overtime,
                    });
                }
            }
        }
        */
    }

    return ret;
}


/*

  <div id={`game-${color}-clock`} className={(color + " clock in-game-clock") + (this.state[`${color}_pause_text`] ? " paused" : "")}>
      <div className="main-time boxed"></div>
      {(this.goban.engine.time_control.time_control === "byoyomi" || null) &&
          <span className="byo-yomi-periods" />
      }
      {(this.goban.engine.time_control.time_control === "canadian" || null) &&
          <span> + <div className="period-time boxed"/> / <div className="periods boxed"/></span>
      }
      {(this.state[`${color}_pause_text`] || null) &&
          <div className="pause-text">{this.state[`${color}_pause_text`]}</div>
      }
  </div>

*/
