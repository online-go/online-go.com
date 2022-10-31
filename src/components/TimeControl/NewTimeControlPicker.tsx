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
import { updateProperty, updateSpeed, updateSystem } from "./TimeControlUpdates";
import { default_time_settings, getDefaultTimeControl, getTimeOptions } from "./util";

type TimeControlSystem = TimeControlTypes.TimeControlSystem;
type TimeControlSpeed = TimeControlTypes.TimeControlSpeed;

interface NewTimeControlPickerProperties {
    timeControl: TimeControl;
    onChange: (tc: TimeControl) => void;
    forceSystem?: TimeControlSystem;
    boardWidth?: number;
    boardHeight?: number;
}

const numeric = (ev: React.ChangeEvent<HTMLSelectElement>) => parseInt(ev.target.value);

export function NewTimeControlPicker(props: NewTimeControlPickerProperties): JSX.Element {
    const tc = props.timeControl;

    const onChangeProperty = <T extends TimeControl, U extends keyof T & string>(
        tc: T,
        property: U,
        newValue: T[U],
    ) => {
        props.onChange(updateProperty(tc, property, newValue));
    };
    const onChangeSpeed = (speed: TimeControlSpeed) => {
        props.onChange(updateSpeed(tc, speed));
    };
    const onChangeSystem = (system: TimeControlSystem) => {
        props.onChange(updateSystem(tc, system));
    };
    const onChangePauseOnWeekends = (newValue: boolean) => {
        props.onChange(updateProperty(tc, "pause_on_weekends", newValue));
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
                tc={tc}
                id={id}
                name={name}
                property={property}
                valueGetter={getter}
                onChangeProperty={onChangeProperty}
            ></TimeControlPropertySelector>
        );
    };

    if (props.forceSystem) {
        onChangeSystem(props.forceSystem);
    }

    let selectors: JSX.Element[] = [];
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
                    id={"tc-stones-per-period"}
                    name={_("Stones per Period")}
                    property={"stones_per_period"}
                    min={default_time_settings[tc.speed].canadian.stones_per_period_min}
                    max={default_time_settings[tc.speed].canadian.stones_per_period_max}
                    valueGetter={(ev) => parseInt(ev.target.value)}
                    onChangeProperty={onChangeProperty}
                ></TimeControlPropertyInput>,
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
                    id={"tc-periods-byoyomi"}
                    name={_("Periods")}
                    property={"periods"}
                    min={default_time_settings[tc.speed].byoyomi.periods_min}
                    max={default_time_settings[tc.speed].byoyomi.periods_max}
                    valueGetter={(ev) => parseInt(ev.target.value)}
                    onChangeProperty={onChangeProperty}
                ></TimeControlPropertyInput>,
            ];
            break;
        case "absolute":
            selectors = [instantiate("total_time", _("Total Time"), "tc-total-time", numeric, tc)];
            break;
    }

    return (
        <div className="TimeControlPicker">
            {
                <div className="form-group">
                    <label className="control-label" htmlFor="challenge-speed">
                        {_("Game Speed")}
                    </label>
                    <div className="controls">
                        <div className="checkbox">
                            <select
                                id="challenge-speed"
                                value={tc.speed}
                                onChange={(ev) =>
                                    onChangeSpeed(ev.target.value as TimeControlSpeed)
                                }
                                className="challenge-dropdown form-control"
                                style={{ overflow: "hidden" }}
                            >
                                <option value="blitz">{_("Blitz")}</option>
                                <option value="live">{_("Live")}</option>
                                <option value="correspondence">{_("Correspondence")}</option>
                            </select>
                        </div>
                    </div>
                </div>
            }

            <div className="form-group">
                <label className="control-label" htmlFor="challenge-time-control">
                    {_("Time Control")}
                </label>
                <div className="controls">
                    <div className="checkbox">
                        <select
                            disabled={!!props.forceSystem}
                            value={tc.system}
                            onChange={(ev) => onChangeSystem(ev.target.value as TimeControlSystem)}
                            id="challenge-time-control"
                            className="challenge-dropdown form-control"
                        >
                            <option value="fischer">{_("Fischer")}</option>
                            <option value="simple">{_("Simple")}</option>
                            <option value="byoyomi">{_("Byo-Yomi")}</option>
                            <option value="canadian">{_("Canadian")}</option>
                            <option value="absolute">{_("Absolute")}</option>
                            {(tc.speed === "correspondence" || null) && (
                                <option value="none">{_("None")}</option>
                            )}
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
                            props.onChangeProperty(props.tc, props.property, props.valueGetter(ev));
                        }}
                    >
                        {getTimeOptions(props.tc.speed, props.tc.system, props.property).map(
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

interface TimeControlPropertyInputProps<T extends TimeControl, U extends keyof T & string> {
    tc: T;
    id: string;
    name: string;
    property: U;
    min: number;
    max: number;
    valueGetter: (ev: React.ChangeEvent<HTMLInputElement>) => T[U];
    onChangeProperty: (tc: T, property: U, newValue: T[U]) => void;
}

function TimeControlPropertyInput<T extends TimeControl, U extends keyof T & string>(
    props: TimeControlPropertyInputProps<T, U>,
): JSX.Element {
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
                            numericInputOnBlur(
                                sender,
                                props.tc.speed,
                                props.tc.system,
                                props.property,
                            )
                        }
                    />
                </div>
            </div>
        </div>
    );
}

function numericInputOnBlur(
    sender: React.FocusEvent<HTMLInputElement, Element>,
    speed: TimeControlSpeed,
    system: TimeControlSystem,
    propertyName: string,
) {
    const num = sender.target.valueAsNumber;
    const min: number = getDefaultTimeControl(speed, system)[`${propertyName}_min`];
    const max: number = getDefaultTimeControl(speed, system)[`${propertyName}_max`];

    if (isNaN(num)) {
        sender.target.value = getDefaultTimeControl(speed, system)[propertyName];
    } else if (num < min || num > max) {
        sender.target.value = Math.min(Math.max(num, min), max).toString();
    }
}
