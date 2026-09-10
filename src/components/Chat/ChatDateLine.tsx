/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License
 * as published by the Free Software Foundation, either version 3 of the
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
import { moment } from "@/lib/translate";

interface ChatDateLineProps {
    /** Unix seconds of the line this date introduces. */
    timestamp?: number;
    /** Unix seconds of the line before it, where there is one. */
    previousTimestamp?: number;
    /** False for the first line of a log, which opens with its own date. */
    hasPreviousLine: boolean;
}

function day(seconds: number): string {
    return moment(new Date(seconds * 1000)).format("YYYY-MM-DD");
}

/**
 * The day a run of chat lines belongs to. It renders nothing while the line
 * it introduces falls on the same day as the line before it, so a log carries
 * one of these per day rather than one per line.
 */
export function ChatDateLine({
    timestamp,
    previousTimestamp,
    hasPreviousLine,
}: ChatDateLineProps): React.ReactElement | null {
    if (!timestamp) {
        return null;
    }

    if (hasPreviousLine && (!previousTimestamp || day(timestamp) === day(previousTimestamp))) {
        return null;
    }

    return <div className="date">{moment(new Date(timestamp * 1000)).format("LL")}</div>;
}
