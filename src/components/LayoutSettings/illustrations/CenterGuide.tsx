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
import "./LayoutIllustrations.css";

/**
 * Shows what the board is centered on: a bracket that spans from `x1` to
 * `x2` at height `y`, and a dashed line down from the middle of the
 * bracket to `bottom`. Draw it before the board and the side panel, so
 * that the line shows only where nothing covers it.
 */
export function CenterGuide({
    x1,
    x2,
    y,
    bottom,
}: {
    x1: number;
    x2: number;
    y: number;
    bottom: number;
}): React.ReactElement {
    const center = (x1 + x2) / 2;
    const tick = 4;
    return (
        <g>
            <path
                className="LayoutIllustration-guide"
                d={`M ${x1} ${y + tick} V ${y - tick} M ${x1} ${y} H ${x2} M ${x2} ${y - tick} V ${y + tick}`}
            />
            <line
                className="LayoutIllustration-guide dashed"
                x1={center}
                x2={center}
                y1={y}
                y2={bottom}
            />
        </g>
    );
}
