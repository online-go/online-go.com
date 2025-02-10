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
import { capitalize } from "@/lib/misc";
import { _ } from "@/lib/translate";

import { TimeControl, TimeControlTypes } from "./TimeControl";
import { updateProperty, updateSpeed, updateSystem } from "./TimeControlUpdates";
import { default_time_settings, getTimeOptions, timeControlSystemText } from "./util";

type TimeControlSystem = TimeControlTypes.TimeControlSystem;
type TimeControlSpeed = TimeControlTypes.TimeControlSpeed;

interface TimeControlPickerProperties {
    timeControl: TimeControl;
    onChange: (tc: TimeControl) => void;
    forceSystem: boolean;
    boardWidth: number;
    boardHeight: number;
}

const numeric = (ev: React.ChangeEvent<HTMLSelectElement>) => parseInt(ev.target.value);

export function TimeControlPicker(props: TimeControlPickerProperties): React.ReactElement {
    const tc = props.timeControl;

    const onChangeProperty = <T extends TimeControl, U extends keyof T & string>(
        tc: T,
        property: U,
        newValue: T[U],
    ) => {
        props.onChange(updateProperty(tc, property, newValue, props.boardWidth, props.boardHeight));
    };
    const onChangeSpeed = (speed: TimeControlSpeed) => {
        props.onChange(updateSpeed(tc, speed, props.boardWidth, props.boardHeight));
    };
    const onChangeSystem = (system: TimeControlSystem) => {
        props.onChange(updateSystem(tc, system, props.boardWidth, props.boardHeight));
    };
    const onChangePauseOnWeekends = (newValue: boolean) => {
        props.onChange(
            updateProperty(tc, "pause_on_weekends", newValue, props.boardWidth, props.boardHeight),
        );
    };

    const instantiate = <T extends TimeControl, U extends keyof T & string>(
        property: U,
        name: string,
        id: string,
        getter: (ev: React.ChangeEvent<HTMLSelectElement>) => T[U],
        tc: T,
    ) => {
        return (
            <TimeControlPropertySelector<T, U>
                key={id}
                tc={tc}
                id={id}
                name={name}
                property={property}
                valueGetter={getter}
                onChangeProperty={onChangeProperty}
            />
        );
    };

    let selectors: React.ReactElement[] = [];
    switch (tc.system) {
        case "fischer":
            selectors = [
                instantiate("initial_time", _("Initial Time"), "tc-initial-time", numeric, tc),
                instantiate("time_increment", _("Time Increment"), "tc-inc-time", numeric, tc),
                instantiate("max_time", _("Max Time"), "tc-max-time", numeric, tc),
            ];
            break;
        case "simple":
            selectors = [instantiate("per_move", _("Time per Move"), "tc-per-move", numeric, tc)];
            break;
        case "canadian":
            selectors = [
                instantiate("main_time", _("Main Time"), "tc-main-time-canadian", numeric, tc),
                instantiate(
                    "period_time",
                    _("Time per Period"),
                    "tc-per-period-canadian",
                    numeric,
                    tc,
                ),
                <TimeControlPropertyInput
                    tc={tc}
                    key={"tc-stones-per-period"}
                    id={"tc-stones-per-period"}
                    name={_("Stones per Period")}
                    property={"stones_per_period"}
                    min={default_time_settings[tc.speed].canadian.stones_per_period_min}
                    max={default_time_settings[tc.speed].canadian.stones_per_period_max}
                    default={default_time_settings[tc.speed].canadian.stones_per_period}
                    valueGetter={(ev) => parseInt(ev.target.value)}
                    onChangeProperty={onChangeProperty}
                />,
            ];
            break;
        case "byoyomi":
            selectors = [
                instantiate("main_time", _("Main Time"), "tc-main-time-byoyomi", numeric, tc),
                instantiate(
                    "period_time",
                    _("Time per Period"),
                    "tc-per-period-byoyomi",
                    numeric,
                    tc,
                ),
                <TimeControlPropertyInput
                    tc={tc}
                    key={"tc-periods-byoyomi"}
                    id={"tc-periods-byoyomi"}
                    name={_("Periods")}
                    property={"periods"}
                    min={default_time_settings[tc.speed].byoyomi.periods_min}
                    max={default_time_settings[tc.speed].byoyomi.periods_max}
                    default={default_time_settings[tc.speed].byoyomi.periods}
                    valueGetter={(ev) => parseInt(ev.target.value)}
                    onChangeProperty={onChangeProperty}
                />,
            ];
            break;
        case "absolute":
            selectors = [instantiate("total_time", _("Total Time"), "tc-total-time", numeric, tc)];
            break;
    }

    const valid_systems =
        tc.speed === "correspondence"
            ? TimeControlTypes.ALL_SYSTEMS
            : TimeControlTypes.ALL_SYSTEMS_EXCEPT_NONE;

    return (
        <div className="TimeControlPicker">
            <div className="form-group">
                <label className="control-label" htmlFor="challenge-speed">
                    {_("Game Speed")}
                </label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            id="challenge-speed"
                            value={tc.speed}
                            onChange={(ev) => onChangeSpeed(ev.target.value as TimeControlSpeed)}
                            className="challenge-dropdown form-control"
                            style={{ overflow: "hidden" }}
                        >
                            {TimeControlTypes.ALL_SPEEDS.map((speed) => (
                                <option value={speed} key={speed}>
                                    {_(capitalize(speed))}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="form-group">
                <label className="control-label" htmlFor="challenge-time-control">
                    {_("Time Control")}
                </label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            disabled={props.forceSystem}
                            value={tc.system}
                            onChange={(ev) => onChangeSystem(ev.target.value as TimeControlSystem)}
                            id="challenge-time-control"
                            className="challenge-dropdown form-control"
                        >
                            {valid_systems.map((system) => (
                                <option value={system} key={system}>
                                    {_(timeControlSystemText(system))}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            {selectors}
            {tc.speed === "correspondence" && tc.system !== "none" && (
                <div
                    id="challenge-pause-on-weekends-div"
                    className="form-group"
                    style={{ position: "relative" }}
                >
                    <label className="control-label" htmlFor="challenge-pause-on-weekends">
                        {_("Pause on Weekends")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <input
                                checked={tc.pause_on_weekends}
                                onChange={(ev) => onChangePauseOnWeekends(ev.target.checked)}
                                id="challenge-pause-on-weekends"
                                type="checkbox"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface TimeControlPropertySelectorProps<T extends TimeControl, U extends keyof T & string> {
    tc: T;
    id: string;
    name: string;
    property: U;
    valueGetter: (ev: React.ChangeEvent<HTMLSelectElement>) => T[U];
    onChangeProperty: (tc: T, property: U, newValue: T[U]) => void;
}

function TimeControlPropertySelector<T extends TimeControl, U extends keyof T & string>(
    props: TimeControlPropertySelectorProps<T, U>,
): React.ReactElement {
    return (
        <React.Fragment key={props.id}>
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
                                props.onChangeProperty(
                                    props.tc,
                                    props.property,
                                    props.valueGetter(ev),
                                );
                            }}
                        >
                            {getTimeOptions(props.tc.speed, props.tc.system, props.property).map(
                                (it) => (
                                    <option key={it.label} value={it.time}>
                                        {it.label}
                                    </option>
                                ),
                            )}
                        </select>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

interface TimeControlPropertyInputProps<T extends TimeControl, U extends keyof T & string> {
    tc: T;
    id: string;
    name: string;
    property: U;
    min: number;
    max: number;
    default: number;
    valueGetter: (ev: React.ChangeEvent<HTMLInputElement>) => T[U];
    onChangeProperty: (tc: T, property: U, newValue: T[U]) => void;
}

function TimeControlPropertyInput<T extends TimeControl, U extends keyof T & string>(
    props: TimeControlPropertyInputProps<T, U>,
): React.ReactElement {
    return (
        <div id={`${props.id}-group`} className="form-group challenge-time-group">
            <label id={`${props.id}-label`} className=" control-label" htmlFor={props.id}>
                {props.name}
            </label>
            <div className="controls">
                <div className="checkbox">
                    <input
                        type="number"
                        id={props.id}
                        min={props.min}
                        max={props.max}
                        className="challenge-dropdown form-control"
                        value={`${props.tc[props.property]}`}
                        onChange={(ev: React.ChangeEvent<HTMLInputElement>) => {
                            props.onChangeProperty(props.tc, props.property, props.valueGetter(ev));
                        }}
                        onBlur={(sender) =>
                            numericInputOnBlur(sender, props.min, props.max, props.default)
                        }
                    />
                </div>
            </div>
        </div>
    );
}

function numericInputOnBlur(
    sender: React.FocusEvent<HTMLInputElement, Element>,
    min: number,
    max: number,
    defaultVal: number,
) {
    const num = sender.target.valueAsNumber;

    if (isNaN(num)) {
        sender.target.value = defaultVal.toString();
    } else if (num < min || num > max) {
        sender.target.value = Math.min(Math.max(num, min), max).toString();
    }
}
