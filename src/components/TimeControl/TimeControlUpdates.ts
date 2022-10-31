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

import { TimeControl, TimeControlTypes } from "./TimeControl";
import { getDefaultTimeControl } from "./util";
import * as data from "data";

type TimeControlSystem = TimeControlTypes.TimeControlSystem;
type TimeControlSpeed = TimeControlTypes.TimeControlSpeed;

export function updateProperty<T extends TimeControl, U extends keyof T & string>(
    old: T,
    property: U,
    newValue: T[U],
): T {
    const copy: T = Object.assign({}, old);
    copy[property] = newValue;
    return copy;
}

export function updateSpeed(old: TimeControl, speed: TimeControlSpeed): TimeControl {
    return recallTimeControlSettings(speed, old.system);
}

export function updateSystem(old: TimeControl, system: TimeControlSystem): TimeControl {
    return recallTimeControlSettings(old.speed, system);
}

function recallTimeControlSettings(
    speed: TimeControlSpeed,
    system: TimeControlSystem,
): TimeControl {
    const fallback = getDefaultTimeControl(speed, system);
    const tc = data.get(`time_control.${speed}.${system}`, fallback);
    return validateSettings(tc);
}

function validateSettings(tc: TimeControl): TimeControl {
    return tc;
}
