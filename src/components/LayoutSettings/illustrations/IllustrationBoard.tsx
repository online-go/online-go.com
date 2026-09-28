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

const LINES = 4;

/** A small go board with a 4x4 grid, one black stone and one white stone. */
export function IllustrationBoard({
    x,
    y,
    size,
}: {
    x: number;
    y: number;
    size: number;
}): React.ReactElement {
    const step = size / (LINES + 1);
    const at = (i: number) => (i + 1) * step;
    const lines = Array.from({ length: LINES }, (_, i) => at(i));
    const stone_r = step * 0.42;
    return (
        <g transform={`translate(${x} ${y})`}>
            <rect className="LayoutIllustration-board" width={size} height={size} rx={2} />
            {lines.map((p) => (
                <React.Fragment key={p}>
                    <line
                        className="LayoutIllustration-grid"
                        x1={at(0)}
                        x2={at(LINES - 1)}
                        y1={p}
                        y2={p}
                    />
                    <line
                        className="LayoutIllustration-grid"
                        y1={at(0)}
                        y2={at(LINES - 1)}
                        x1={p}
                        x2={p}
                    />
                </React.Fragment>
            ))}
            <circle className="LayoutIllustration-black-stone" cx={at(2)} cy={at(1)} r={stone_r} />
            <circle className="LayoutIllustration-white-stone" cx={at(1)} cy={at(2)} r={stone_r} />
        </g>
    );
}
