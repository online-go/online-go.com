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

import { TimeControl, TimeControlTypes } from "./TimeControl";
import { classifyGameSpeed, getDefaultTimeControl, getInputRange, getTimeOptions } from "./util";
import * as data from "@/lib/data";
import { interpolate, pgettext } from "@/lib/translate";
import { computeAverageMoveTime } from "goban";

type TimeControlSystem = TimeControlTypes.TimeControlSystem;
type TimeControlSpeed = TimeControlTypes.TimeControlSpeed;

export function updateProperty<T extends TimeControl, U extends keyof T & string>(
    old: T,
    property: U,
    newValue: T[U],
    boardWidth: number,
    boardHeight: number,
): TimeControl {
    const copy: T = Object.assign({}, old);
    copy[property] = newValue;
    return validateSettings(copy, boardWidth, boardHeight);
}

export function updateSpeed(
    old: TimeControl,
    speed: TimeControlSpeed,
    boardWidth: number,
    boardHeight: number,
): TimeControl {
    return recallTimeControlSettings(speed, old.system, boardWidth, boardHeight);
}

export function updateSystem(
    old: TimeControl,
    system: TimeControlSystem,
    boardWidth: number,
    boardHeight: number,
): TimeControl {
    return recallTimeControlSettings(old.speed, system, boardWidth, boardHeight);
}

export function saveTimeControlSettings(tc: TimeControl) {
    const speed = tc.speed;
    const system = tc.system;
    data.set(`time_control.speed`, speed);
    data.set(`time_control.system`, system);
    data.set(`time_control.${speed}.${system}`, tc);
}

export function recallTimeControlSettings(
    speed: TimeControlSpeed,
    system: TimeControlSystem,
    boardWidth?: number,
    boardHeight?: number,
): TimeControl {
    if (system === "none" && speed !== "correspondence") {
        system = "byoyomi";
    }
    const fallback = getDefaultTimeControl(speed, system);
    let tc = data.get(`time_control.${speed}.${system}`, fallback);
    // The old time control picker occasionally wrote malformed entries, which unfortunately need to be
    // accounted for.
    if (tc.speed !== speed || tc.system !== system) {
        console.log(`Repairing time_control.${speed}.${system}`);
        data.remove(`time_control.${speed}.${system}`);
        tc = fallback;
    }
    return validateSettings(tc, boardWidth, boardHeight);
}

// This function mutates tc, but is only used within functions that have already created a copy or new
// TimeControl object
function validateSettings(
    tc: TimeControl,
    boardWidth?: number,
    boardHeight?: number,
    updateSpeed: boolean = false,
): TimeControl {
    switch (tc.system) {
        case "fischer":
            restrictSpinnerProperty(tc, "initial_time");
            restrictSpinnerProperty(tc, "time_increment");
            restrictSpinnerProperty(tc, "max_time");
            if (tc.max_time < tc.time_increment) {
                tc.max_time = tc.time_increment;
            }
            if (tc.max_time < tc.initial_time) {
                tc.max_time = tc.initial_time;
            }
            break;
        case "simple":
            restrictSpinnerProperty(tc, "per_move");
            break;
        case "canadian":
            restrictSpinnerProperty(tc, "main_time");
            restrictSpinnerProperty(tc, "period_time");
            restrictRangedInputProperty(tc, "stones_per_period");
            break;
        case "byoyomi":
            restrictSpinnerProperty(tc, "main_time");
            restrictSpinnerProperty(tc, "period_time");
            restrictRangedInputProperty(tc, "periods");
            break;
        case "absolute":
            restrictSpinnerProperty(tc, "total_time");
            break;
    }

    if (updateSpeed && boardWidth != null && boardHeight != null) {
        tc.speed = classifyGameSpeed(tc, boardWidth, boardHeight);
    }

    if (tc.speed !== "correspondence") {
        tc.pause_on_weekends = false;
    }
    if (typeof tc.pause_on_weekends !== "boolean") {
        tc.pause_on_weekends = false;
    }
    return tc;
}

export function getTimeControlSpeedWarning(
    tc: TimeControl,
    boardWidth: number,
    boardHeight: number,
): string | null {
    const actual = classifyGameSpeed(tc, boardWidth, boardHeight);
    const tpm = computeAverageMoveTime(tc, boardWidth, boardHeight);
    if (actual !== tc.speed) {
        return interpolate(
            pgettext(
                "",
                "The current settings will create a %s game instead of a %s game since the average time per move given the board size is ~%d seconds per move",
            ),
            [actual, tc.speed, tpm],
        );
    }
    return null;
}

// Ensures that the value of property is restricted to one of the valid choices shown in the time control picker
function restrictSpinnerProperty<T extends TimeControl, U extends keyof T & string>(
    tc: T,
    property: U,
) {
    const options = getTimeOptions(tc.speed, tc.system, property);
    if (options.findIndex((option) => option.time === tc[property]) === -1) {
        // This preserves the old behavior of picking a central value, but it might be better to pick the closest option to the invalid value
        // This hasn't been done yet because it is unclear whether restrictProperty is ever actually needed
        const replacement = options[Math.round(options.length / 2)].time;
        console.warn(
            `The value ${tc[property]} is not a valid option for '${property}' in the time control system '${tc.system}' with speed '${tc.speed}'. Using ${replacement} instead.`,
        );
        tc[property] = replacement as T[U];
    }
}

function restrictRangedInputProperty(tc: TimeControl, property: string) {
    const range = getInputRange(tc.speed, tc.system, property);
    const value = (tc as any)[property];
    if (range != null && typeof value == "number") {
        const [min, max] = range;
        (tc as any)[property] = Math.min(Math.max(min, value), max);
    } else {
        console.warn(`Trying to restrict an invalid property: ${property}.`);
    }
}
