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
import { usePreference } from "@/lib/preferences";
import { pgettext } from "@/lib/translate";
import "./TurnClock.css";

const ONE_HOUR = 60 * 60 * 1000;

const CENTER = 12;

/** Where the hand points at each step: up, right, down, then left. */
const HAND_TIPS = [
    { x: 12, y: 7 },
    { x: 17, y: 12 },
    { x: 12, y: 17 },
    { x: 7, y: 12 },
];

/** The hand rests pointing straight up while it is not moving. */
const RESTING_STEP = 0;

interface TurnClockProps {
    /** Time left on the running clock, in milliseconds. */
    time_left: number;
}

/**
 * A small clock face marking the player to move. Its single hand steps a
 * quarter turn clockwise each second. It is only an indicator that the clock
 * is running: the digital clock beside it carries the time.
 */
export function TurnClock({ time_left }: TurnClockProps): React.ReactElement {
    const [animate] = usePreference("animate-turn-clock");

    /* Under an hour the seconds are worth watching, above it they are not,
     * so the hand rests. */
    const moving = animate && time_left < ONE_HOUR;
    const seconds = Math.max(0, Math.ceil(time_left / 1000));
    /* The clock counts down, so negate the step to keep the hand turning
     * clockwise. */
    const step = moving ? (4 - (seconds % 4)) % 4 : RESTING_STEP;
    const tip = HAND_TIPS[step];

    return (
        <svg
            className="TurnClock"
            viewBox="0 0 24 24"
            role="img"
            aria-label={pgettext("Indicator on the player whose turn it is", "Their turn")}
        >
            <circle cx={CENTER} cy={CENTER} r="10" />
            <line x1={CENTER} y1={CENTER} x2={tip.x} y2={tip.y} />
        </svg>
    );
}
