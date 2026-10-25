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

const WIDTHS = [1, 0.7, 0.85, 0.55, 0.9, 0.65];

/** Lines of chat text, `spacing` apart, starting at `y`. */
export function ChatLines({
    x,
    y,
    width,
    count,
    spacing = 7,
    accent = false,
}: {
    x: number;
    y: number;
    width: number;
    count: number;
    spacing?: number;
    accent?: boolean;
}): React.ReactElement {
    const className = accent ? "LayoutIllustration-accent-line" : "LayoutIllustration-line";
    return (
        <g>
            {Array.from({ length: count }, (_, i) => (
                <line
                    key={i}
                    className={className}
                    x1={x}
                    x2={x + width * WIDTHS[i % WIDTHS.length]}
                    y1={y + i * spacing}
                    y2={y + i * spacing}
                />
            ))}
        </g>
    );
}
