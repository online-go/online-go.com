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

/** The move controls: an accent strip with a slider track and a dot. */
export function SliderStrip({
    x,
    y,
    width,
    height,
}: {
    x: number;
    y: number;
    width: number;
    height: number;
}): React.ReactElement {
    const cy = y + height / 2;
    const inset = Math.min(5, width * 0.12);
    return (
        <g>
            <rect
                className="LayoutIllustration-accent-area"
                x={x}
                y={y}
                width={width}
                height={height}
                rx={2}
            />
            <line
                className="LayoutIllustration-accent-line"
                x1={x + inset}
                x2={x + width - inset}
                y1={cy}
                y2={cy}
            />
            <circle
                className="LayoutIllustration-accent"
                cx={x + width * 0.68}
                cy={cy}
                r={Math.min(3, height * 0.36)}
            />
        </g>
    );
}
