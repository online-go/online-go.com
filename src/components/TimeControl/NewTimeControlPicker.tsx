/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _ } from "translate";

import { TimeControl, TimeControlTypes } from "./TimeControl";
import { time_options } from "./util";

type TimeControlSystem = TimeControlTypes.TimeControlSystem;
type TimeControlSpeed = TimeControlTypes.TimeControlSpeed;
type OnTimeControlChangeCallback = (tc: TimeControl) => void;

interface NewTimeControlPickerProperties {
    timeControl: TimeControl;
    onChange?: OnTimeControlChangeCallback;
    boardWidth?: number;
    boardHeight?: number;
}

export function NewTimeControlPicker(props: NewTimeControlPickerProperties): JSX.Element {
    // const update = (property: keyof TimeControl) => {
    //     const new = updateProperty(props.timeControl, p)
    // }
    const tc = props.timeControl;
    let selectors: JSX.Element;
    switch (tc.system) {
        case "fischer":
            selectors = (
                <>
                    <TimeControlPropertySelector<TimeControlTypes.Fischer, "initial_time">
                        tc={tc}
                        id={"challenge-initial-time"}
                        name={_("Initial Time")}
                        property={"initial_time"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                    <TimeControlPropertySelector<TimeControlTypes.Fischer, "time_increment">
                        tc={tc}
                        id={"challenge-inc-time"}
                        name={_("Time Increment")}
                        property={"time_increment"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                    <TimeControlPropertySelector<TimeControlTypes.Fischer, "max_time">
                        tc={tc}
                        id={"challenge-max-time"}
                        name={_("Max Time")}
                        property={"max_time"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                </>
            );
            break;
        case "simple":
            selectors = (
                <TimeControlPropertySelector
                    tc={tc}
                    id={"challenge-per-move-time"}
                    name={_("Time per Move")}
                    property={"per_move"}
                    valueGetter={(ev) => parseInt(ev.target.value)}
                    onChange={props.onChange}
                ></TimeControlPropertySelector>
            );
            break;
        case "canadian":
            selectors = (
                <>
                    <TimeControlPropertySelector
                        tc={tc}
                        id={"challenge-main-time-canadian"}
                        name={_("Main Time")}
                        property={"main_time"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                    <TimeControlPropertySelector
                        tc={tc}
                        id={"challenge-per-canadian-period-time"}
                        name={_("Time per Period")}
                        property={"period_time"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                    <div
                        id="challenge-canadian-stones-group"
                        className="form-group challenge-time-group"
                    >
                        <label
                            id="challenge-canadian-stones-label"
                            className=" control-label"
                            htmlFor="challenge-canadian-stones"
                        >
                            {_("Stones per Period")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="number"
                                    id="challenge-canadian-stones"
                                    min={
                                        default_time_options[tc.speed].canadian
                                            .stones_per_period_min
                                    }
                                    max={
                                        default_time_options[tc.speed].canadian
                                            .stones_per_period_max
                                    }
                                    className="challenge-dropdown form-control"
                                    value={tc.stones_per_period}
                                    onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                                        const new_tc = updateProperty(
                                            tc,
                                            "stones_per_period",
                                            parseInt(ev.target.value),
                                        );
                                        props.onChange(new_tc);
                                    }}
                                    onBlur={(sender) =>
                                        numericInputOnBlur(
                                            sender,
                                            tc.speed,
                                            tc.system,
                                            "stones_per_period",
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </>
            );
            break;
        case "byoyomi":
            selectors = (
                <>
                    <TimeControlPropertySelector
                        tc={tc}
                        id={"challenge-main-time-byoyomi"}
                        name={_("Main Time")}
                        property={"main_time"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                    <TimeControlPropertySelector
                        tc={tc}
                        id={"challenge-per-period-time"}
                        name={_("Main Time")}
                        property={"period_time"}
                        valueGetter={(ev) => parseInt(ev.target.value)}
                        onChange={props.onChange}
                    ></TimeControlPropertySelector>
                    <div id="challenge-periods-group" className="form-group challenge-time-group">
                        <label
                            id="challenge-periods-label"
                            className=" control-label"
                            htmlFor="challenge-periods"
                        >
                            {_("Periods")}
                        </label>
                        <div className="controls">
                            <div className="checkbox">
                                <input
                                    type="number"
                                    id="challenge-periods"
                                    min={default_time_options[tc.speed].byoyomi.periods_min}
                                    max={default_time_options[tc.speed].byoyomi.periods_max}
                                    className="challenge-dropdown form-control"
                                    value={tc.periods}
                                    onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                                        const new_tc = updateProperty(
                                            tc,
                                            "periods",
                                            parseInt(ev.target.value),
                                        );
                                        props.onChange(new_tc);
                                    }}
                                    onBlur={(sender) =>
                                        numericInputOnBlur(sender, tc.speed, tc.system, "periods")
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </>
            );
            break;
        case "absolute":
            <TimeControlPropertySelector
                tc={tc}
                id={"challenge-total-time-time"}
                name={_("Total Time")}
                property={"total_time"}
                valueGetter={(ev) => parseInt(ev.target.value)}
                onChange={props.onChange}
            ></TimeControlPropertySelector>;
            break;
    }
    return selectors;
}

interface TimeControlPropertySelectorProps<T extends TimeControl, U extends keyof T> {
    tc: T;
    id: string;
    name: string;
    property: U;
    valueGetter: (ev: React.ChangeEvent<HTMLSelectElement>) => T[U];
    onChange: OnTimeControlChangeCallback;
}

function TimeControlPropertySelector<T extends TimeControl, U extends keyof T>(
    props: TimeControlPropertySelectorProps<T, U>,
): JSX.Element {
    return (
        <div id={`${props.id}-group`} className="form-group challenge-time-group">
            <label id={`${props.id}-label`} className=" control-label" htmlFor={props.id}>
                {props.name}
            </label>
            <div className="controls">
                <div className="checkbox">
                    <select
                        id={props.id}
                        className="form-control time-spinner"
                        value={`${props.tc[props.property]}`}
                        onChange={(ev: React.ChangeEvent<HTMLSelectElement>) => {
                            const new_tc = updateProperty(
                                props.tc,
                                props.property,
                                props.valueGetter(ev),
                            );
                            props.onChange(new_tc);
                        }}
                    >
                        {time_options[props.tc.speed][props.tc.system][props.property].map(
                            (it, idx) => (
                                <option key={idx} value={it.time}>
                                    {it.label}
                                </option>
                            ),
                        )}
                    </select>
                </div>
            </div>
        </div>
    );
}

function updateProperty<T extends TimeControl, U extends keyof T>(
    timeControl: T,
    property: U,
    newValue: T[U],
): T {
    const copy: T = Object.assign({}, timeControl);
    copy[property] = newValue;
    return copy;
}

const default_time_options = {
    blitz: {
        system: "byoyomi",

        fischer: {
            initial_time: 30,
            time_increment: 10,
            max_time: 60,
            pause_on_weekends: false,
        },
        byoyomi: {
            main_time: 30,
            period_time: 5,
            periods: 5,
            periods_min: 1,
            periods_max: 300,
            pause_on_weekends: false,
        },
        canadian: {
            main_time: 30,
            period_time: 30,
            stones_per_period: 5,
            stones_per_period_min: 1,
            stones_per_period_max: 50,
            pause_on_weekends: false,
        },
        simple: {
            per_move: 5,
            pause_on_weekends: false,
        },
        absolute: {
            total_time: 300,
            pause_on_weekends: false,
        },
    },
    live: {
        system: "byoyomi",
        pause_on_weekends: false,
        fischer: {
            initial_time: 120,
            time_increment: 30,
            max_time: 300,
            pause_on_weekends: false,
        },
        byoyomi: {
            main_time: 10 * 60,
            period_time: 30,
            periods: 5,
            periods_min: 1,
            periods_max: 300,
            pause_on_weekends: false,
        },
        canadian: {
            main_time: 10 * 60,
            period_time: 180,
            stones_per_period: 10,
            stones_per_period_min: 1,
            stones_per_period_max: 50,
            pause_on_weekends: false,
        },
        simple: {
            per_move: 60,
            pause_on_weekends: false,
        },
        absolute: {
            total_time: 900,
            pause_on_weekends: false,
        },
    },
    correspondence: {
        system: "fischer",
        fischer: {
            initial_time: 3 * 86400,
            time_increment: 86400,
            max_time: 7 * 86400,
            pause_on_weekends: true,
        },
        byoyomi: {
            main_time: 7 * 86400,
            period_time: 1 * 86400,
            periods: 5,
            periods_min: 1,
            periods_max: 300,
            pause_on_weekends: true,
        },
        canadian: {
            main_time: 7 * 86400,
            period_time: 7 * 86400,
            stones_per_period: 10,
            stones_per_period_min: 1,
            stones_per_period_max: 50,
            pause_on_weekends: true,
        },
        simple: {
            per_move: 2 * 86400,
            pause_on_weekends: true,
        },
        absolute: {
            total_time: 28 * 86400,
            pause_on_weekends: true,
        },
        none: {
            pause_on_weekends: false,
        },
    },
};

// TODO: Guard against invalid combinations, such as
// { speed: "live", time_control_system: "none" }
// Currently, this causes a ts-strict implicit any error.
function numericInputOnBlur(
    sender: React.FocusEvent<HTMLInputElement, Element>,
    speed: TimeControlSpeed,
    time_control_system: TimeControlSystem,
    propertyName: string,
) {
    const num = sender.target.valueAsNumber;
    const min: number = default_time_options[speed][time_control_system][`${propertyName}_min`];
    const max: number = default_time_options[speed][time_control_system][`${propertyName}_max`];

    if (isNaN(num)) {
        sender.target.value = default_time_options[speed][time_control_system][`${propertyName}`];
    } else if (num < min || num > max) {
        sender.target.value = Math.min(Math.max(num, min), max).toString();
    }
}
