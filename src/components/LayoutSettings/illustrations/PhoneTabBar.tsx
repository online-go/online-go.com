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

/** The tab bar on the phone screen: a strip of four buttons. */
export function PhoneTabBar({
    y,
    accent = false,
}: {
    y: number;
    accent?: boolean;
}): React.ReactElement {
    return (
        <g>
            <rect
                className={accent ? "LayoutIllustration-accent-area" : "LayoutIllustration-panel"}
                x={30}
                y={y}
                width={40}
                height={8}
                rx={2}
            />
            {[0, 1, 2, 3].map((i) => (
                <rect
                    key={i}
                    className={accent ? "LayoutIllustration-accent" : "LayoutIllustration-button"}
                    x={34 + i * 9.5}
                    y={y + 2}
                    width={4}
                    height={4}
                    rx={1}
                />
            ))}
        </g>
    );
}
