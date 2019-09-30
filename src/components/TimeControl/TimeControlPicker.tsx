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
import * as data from "data";
import {_, pgettext, interpolate} from "translate";
import {TimeControl, TimeControlTypes} from "./TimeControl";
import {time_options, computeAverageMoveTime, makeTimeControlParameters} from "./util";
//import {errorAlerter} from 'misc';


interface TimeControlPickerProperties {
    value?: TimeControl;
    onChange?: (tc: TimeControl) => void;
}

export class TimeControlPicker extends React.PureComponent<TimeControlPickerProperties, any> {
    time_control: TimeControl;

    constructor(props) {
        super(props);

        let speed = data.get("time_control.speed", "correspondence");
        let system = data.get("time_control.system", "fischer");

        this.state = Object.assign(recallTimeControlSettings(speed, system), this.props.value || {});
        if (this.state.time_control) {
            (this.state as any).system = this.state.time_control;
        }
        this.state = Object.assign(this.state, makeTimeControlParameters(this.state));
        this.time_control = makeTimeControlParameters(this.state);
    }
    UNSAFE_componentWillReceiveProps(next_props: TimeControlPickerProperties) {
        let update: any = {};
        if (this.props.value !== next_props.value) {
            update = Object.assign(update, makeTimeControlParameters(next_props.value));
        }
        if (Object.keys(update).length) {
            this.time_control = makeTimeControlParameters(update);
            this.setState(update);
        }
    }
    syncTimeControl(update: any) { /* {  */
        let tc = Object.assign({}, this.state, update);

        let speed = tc.speed;
        let options = time_options[tc.speed];

        function goodChoice(arr) {
            return arr[Math.round(arr.length / 2)].time;
        }
        function findIndex(arr, time) {
            time = parseInt(time);
            for (let i = 0; i < arr.length; ++i) {
                if (arr[i].time === time) {
                    return i;
                }
            }
            return -1;
        }


        if (this.state.system === "fischer") {
            if (findIndex(options["fischer"]["initial_time"], tc.initial_time) === -1) {
                tc.initial_time = goodChoice(options["fischer"]["initial_time"]);
            }
            if (findIndex(options["fischer"]["time_increment"], tc.time_increment) === -1) {
                tc.time_increment = goodChoice(options["fischer"]["time_increment"]);
            }
            if (findIndex(options["fischer"]["max_time"], tc.max_time) === -1) {
                tc.max_time = goodChoice(options["fischer"]["max_time"]);
            }
        }
        if (this.state.system === "simple") {
            if (findIndex(options["simple"]["per_move"], tc.per_move) === -1) {
                tc.per_move = goodChoice(options["simple"]["per_move"]);
            }
        }
        if (this.state.system === "canadian") {
            if (findIndex(options["canadian"]["main_time"], tc.main_time) === -1) {
                tc.main_time = goodChoice(options["canadian"]["main_time"]);
            }
            if (findIndex(options["canadian"]["period_time"], tc.period_time) === -1) {
                console.log("Failed to find", tc.period_time, options["canadian"]["period_time"]);
                tc.period_time = goodChoice(options["canadian"]["period_time"]);
            }
        }
        if (this.state.system === "byoyomi") {
            if (findIndex(options["byoyomi"]["main_time"], tc.main_time) === -1) {
                tc.main_time = goodChoice(options["byoyomi"]["main_time"]);
            }
            if (findIndex(options["byoyomi"]["period_time"], tc.period_time) === -1) {
                console.log("Failed to find", tc.period_time, options["byoyomi"]["period_time"]);
                tc.period_time = goodChoice(options["byoyomi"]["period_time"]);
            }
        }
        if (this.state.system === "absolute") {
            if (findIndex(options["absolute"]["total_time"], tc.total_time) === -1) {
                tc.total_time = goodChoice(options["absolute"]["total_time"]);
            }
        }


        if (tc.time_increment > tc.max_time) {
            tc.max_time = tc.time_increment;
        }
        if (tc.initial_time > tc.max_time) {
            tc.max_time = tc.initial_time;
        }

        tc.time_per_move = computeAverageMoveTime(makeTimeControlParameters(tc));
        this.time_control = makeTimeControlParameters(tc);
        this.setState(tc);
        if (this.props.onChange) {
            this.props.onChange(this.time_control);
        }
    }

    setSpeedBracket = (bracket) => {
        this.syncTimeControl(Object.assign(
            { },
            recallTimeControlSettings(bracket, this.state.system),
            { speed: bracket, },
        ));
    }
    setTimeControlSystem = (time_control_system) => {
        this.syncTimeControl(Object.assign(
            {},
            recallTimeControlSettings(this.state.speed, time_control_system),
            { speed: this.state.speed },
        ));
    }
    update_speed_bracket        = (ev) => this.setSpeedBracket((ev.target as HTMLSelectElement).value);
    update_time_control_system  = (ev) => this.setTimeControlSystem((ev.target as HTMLSelectElement).value);
    update_initial_time         = (ev) => this.syncTimeControl({initial_time: parseInt(ev.target.value)});
    update_time_increment       = (ev) => this.syncTimeControl({time_increment: parseInt(ev.target.value)});
    update_max_time             = (ev) => this.syncTimeControl({max_time: parseInt(ev.target.value)});
    update_per_move             = (ev) => this.syncTimeControl({per_move: parseInt(ev.target.value)});
    update_main_time            = (ev) => this.syncTimeControl({main_time: parseInt(ev.target.value)});
    //update_main_time            = (ev)=>this.syncTimeControl({main_time: ev.target.value});
    update_period_time          = (ev) => this.syncTimeControl({period_time: parseInt(ev.target.value)});
    update_periods              = (ev) => this.syncTimeControl({periods: Math.max(1, Math.min(300, parseInt(ev.target.value)))});
    //update_period_time          = (ev)=>this.syncTimeControl({period_time: ev.target.value});
    update_stones_per_period    = (ev) => this.syncTimeControl({stones_per_period: parseInt(ev.target.value)});
    update_total_time           = (ev) => this.syncTimeControl({total_time: parseInt(ev.target.value)});
    update_pause_on_weekends    = (ev) => this.syncTimeControl({pause_on_weekends: ev.target.checked});

    saveSettings() {
        let speed = this.state.speed;
        let system = this.state.system;
        data.set(`time_control.speed`, speed);
        data.set(`time_control.system`, system);
        data.set(`time_control.${speed}.${system}`, makeTimeControlParameters(this.state));
    }

    render() {
        let speed = this.state.speed;

        return (
        <div className="TimeControlPicker">
            {
                <div className="form-group">
                  <label className="control-label" htmlFor="challenge-speed">{_("Game Speed")}</label>
                  <div className="controls">
                      <div className="checkbox">
                          <select id="challenge-speed" value={speed} onChange={this.update_speed_bracket}
                                className="challenge-dropdown form-control" style={{overflow: "hidden"}}>
                            <option value="blitz">{_("Blitz")}</option>
                            <option value="live">{_("Live")}</option>
                            <option value="correspondence">{_("Correspondence")}</option>
                          </select>
                      </div>
                  </div>
                </div>
            }


            <div className="form-group">
                <label className="control-label" htmlFor="challenge-time-control">{_("Time Control")}</label>
                <div className="controls">
                    <div className="checkbox">
                        <select value={this.state.system} onChange={this.update_time_control_system}
                            id="challenge-time-control" className="challenge-dropdown form-control">
                            <option value="fischer">{_("Fischer")}</option>
                            <option value="simple">{_("Simple")}</option>
                            <option value="byoyomi">{_("Byo-Yomi")}</option>
                            <option value="canadian">{_("Canadian")}</option>
                            <option value="absolute">{_("Absolute")}</option>
                            {(speed === "correspondence" || null) && <option value="none">{_("None")}</option>}
                        </select>
                    </div>
                </div>
            </div>



            {(this.state.system === "fischer" || null) &&
                <div id="challenge-initial-time-group" className="form-group challenge-time-group">
                    <label id="challenge-initial-time-label" className=" control-label" htmlFor="challenge-initial-time">{_("Initial Time")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-initial-time" className="form-control time-spinner"
                                value={this.state.initial_time} onChange={this.update_initial_time}>

                                {time_options[speed]["fischer"]["initial_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            {(this.state.system === "fischer" || null) &&
                <div  id="challenge-inc-time-group" className="form-group challenge-time-group">
                    <label id="challenge-inc-time-label" className=" control-label" htmlFor="challenge-inc-time">{_("Time Increment")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-inc-time" className="form-control"
                                value={this.state.time_increment} onChange={this.update_time_increment}>
                                {time_options[speed]["fischer"]["time_increment"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            {(this.state.system === "fischer" || null) &&
                <div  id="challenge-max-time-group" className="form-group challenge-time-group">
                    <label className=" control-label" htmlFor="challenge-max-time">{_("Max Time")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-max-time" className="form-control"
                                value={this.state.max_time} onChange={this.update_max_time}>
                                {time_options[speed]["fischer"]["max_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }

            {(this.state.system === "simple" || null) &&
                <div id="challenge-per-move-time-group" className="form-group challenge-time-group">
                    <label id="challenge-per-move-time-label" className=" control-label" htmlFor="challenge-per-move-time">{_("Time per Move")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-per-move-time" className="form-control"
                                value={this.state.per_move} onChange={this.update_per_move}>
                                {time_options[speed]["simple"]["per_move"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }

            {(this.state.system === "canadian" || null) &&
                <div className="form-group challenge-time-group">
                    <label id="challenge-main-time-label" className=" control-label" htmlFor="challenge-main-time">{_("Main Time")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-main-time" className="form-control"
                                value={this.state.main_time} onChange={this.update_main_time}>
                                {time_options[speed]["canadian"]["main_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            {(this.state.system === "byoyomi"  || null) &&
                <div className="form-group challenge-time-group">
                    <label id="challenge-main-time-label" className=" control-label" htmlFor="challenge-main-time">{_("Main Time")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-main-time" className="form-control"
                                value={this.state.main_time} onChange={this.update_main_time}>
                                {time_options[speed]["byoyomi"]["main_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            {(this.state.system === "byoyomi" || null) &&
                <div  id="challenge-per-period-time-group" className="form-group challenge-time-group">
                    <label id="challenge-per-period-time-label" className=" control-label" htmlFor="challenge-per-period-time">{_("Time per Period")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-per-period-time" className="form-control"
                                value={this.state.period_time} onChange={this.update_period_time}>
                                {time_options[speed]["byoyomi"]["period_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            {(this.state.system === "byoyomi" || null) &&
                <div  id="challenge-periods-group" className="form-group challenge-time-group">
                    <label id="challenge-periods-label" className=" control-label" htmlFor="challenge-periods">{_("Periods")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <input type="number" id="challenge-periods" min="1" max="300" className="challenge-dropdown form-control"
                                value={this.state.periods} onChange={this.update_periods}/>
                        </div>
                    </div>
                </div>
            }

            {(this.state.system === "canadian" || null) &&
                <div id="challenge-per-canadian-period-time-group" className="form-group challenge-time-group">
                    <label id="challenge-per-canadian-period-time-label" className=" control-label" htmlFor="challenge-per-canadian-period-time">{_("Time per Period")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-per-canadian-period-time" className="form-control"
                                value={this.state.period_time} onChange={this.update_period_time}>
                                {time_options[speed]["canadian"]["period_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }
            {(this.state.system === "canadian" || null) &&
                <div id="challenge-canadian-stones-group" className="form-group challenge-time-group">
                    <label id="challenge-canadian-stones-label" className=" control-label" htmlFor="challenge-canadian-stones">{_("Stones per Period")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <input type="number" id="challenge-canadian-stones" min="1" max="50" className="challenge-dropdown form-control"
                                value={this.state.stones_per_period} onChange={this.update_stones_per_period}/>
                        </div>
                    </div>
                </div>
            }

            {(this.state.system === "absolute" || null) &&
                <div id="challenge-total-time-group" className="form-group challenge-time-group">
                    <label id="challenge-total-time-label" className=" control-label" htmlFor="challenge-total-time">{_("Total Time")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <select id="challenge-total-time" className="form-control"
                                value={this.state.total_time} onChange={this.update_total_time}>
                                {time_options[speed]["absolute"]["total_time"].map((it, idx) => (
                                    <option key={idx} value={it.time}>{it.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            }

            {(this.state.speed === "correspondence" && this.state.system !== "none" || null) &&
                <div id="challenge-pause-on-weekends-div" className="form-group" style={{position: "relative"}}>
                    <label className="control-label" htmlFor="challenge-pause-on-weekends">{_("Pause on Weekends")}</label>
                    <div className="controls">
                        <div className="checkbox">
                            <input checked={this.state.pause_on_weekends} onChange={this.update_pause_on_weekends} id="challenge-pause-on-weekends" type="checkbox"/>
                        </div>
                    </div>
                </div>
            }

        </div>
        );
    }
}


const default_time_options = {
    "blitz": {
        "system"                : "byoyomi",

        "fischer": {
            "initial_time"      : 30,
            "time_increment"    : 10,
            "max_time"          : 60,
            "pause_on_weekends" : false,
        },
        "byoyomi": {
            "main_time"         : 30,
            "period_time"       : 5,
            "periods"           : 5,
            "pause_on_weekends" : false,
        },
        "canadian": {
            "main_time"         : 30,
            "period_time"       : 30,
            "stones_per_period" : 5,
            "pause_on_weekends" : false,
        },
        "simple": {
            "per_move"          : 5,
            "pause_on_weekends" : false,
        },
        "absolute": {
            "total_time"        : 300,
            "pause_on_weekends" : false,
        },
    },
    "live": {
        "system"                : "byoyomi",
        "pause_on_weekends"     : false,
        "fischer": {
            "initial_time"      : 120,
            "time_increment"    : 30,
            "max_time"          : 300,
            "pause_on_weekends" : false,
        },
        "byoyomi": {
            "main_time"         : 10 * 60,
            "period_time"       : 30,
            "periods"           : 5,
            "pause_on_weekends" : false,
        },
        "canadian": {
            "main_time"         : 10 * 60,
            "period_time"       : 180,
            "stones_per_period" : 10,
            "pause_on_weekends" : false,
        },
        "simple": {
            "per_move"          : 60,
            "pause_on_weekends" : false,
        },
        "absolute": {
            "total_time"        : 900,
            "pause_on_weekends" : false,
        },
    },
    "correspondence": {
        "system"                : "fischer",
        "fischer": {
            "initial_time"      : 3 * 86400,
            "time_increment"    : 86400,
            "max_time"          : 7 * 86400,
            "pause_on_weekends" : true,
        },
        "byoyomi": {
            "main_time"         : 7 * 86400,
            "period_time"       : 1 * 86400,
            "periods"           : 5,
            "pause_on_weekends" : true,
        },
        "canadian": {
            "main_time"         : 7 * 86400,
            "period_time"       : 7 * 86400,
            "stones_per_period" : 10,
            "pause_on_weekends" : true,
        },
        "simple": {
            "per_move"          : 2 * 86400,
            "pause_on_weekends" : true,
        },
        "absolute": {
            "total_time"        : 28 * 86400,
            "pause_on_weekends" : true,
        },
        "none": {
            "pause_on_weekends" : false,
        },
    }
};
function recallTimeControlSettings(speed, time_control_system) {
    if (speed !== "blitz" && speed !== "live" && speed !== "correspondence") {
        throw new Error(`Invalid speed: ${speed}`);
    }

    return makeTimeControlParameters(Object.assign(
        {pause_on_weekends: default_time_options[speed].pause_on_wekends},
        default_time_options[speed][time_control_system],
        data.get(`time_control.${speed}.${time_control_system}`, {}),
        {speed: speed},
        {system: time_control_system},
    ));
}
