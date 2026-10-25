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
import { ChatLines } from "./ChatLines";
import { PhoneCard } from "./PhoneCard";
import { PhoneFrame } from "./PhoneFrame";
import { PhoneScreenTop } from "./PhoneScreenTop";

/** The phone layout that scrolls as one column past the bottom of the screen. */
export function ScrollsIllustration(): React.ReactElement {
    return (
        <PhoneFrame>
            <PhoneScreenTop />
            <PhoneCard y={59} />
            <PhoneCard y={66} />
            <ChatLines x={32} y={75} width={34} count={2} spacing={5} />
            <g className="LayoutIllustration-overflow">
                <rect
                    className="LayoutIllustration-panel"
                    x={30.5}
                    y={88.5}
                    width={39}
                    height={4}
                    rx={1.5}
                />
                {[0, 1, 2].map((i) => (
                    <rect
                        key={i}
                        className="LayoutIllustration-button"
                        x={31 + i * 7}
                        y={95}
                        width={4}
                        height={4}
                        rx={1}
                    />
                ))}
            </g>
            <line className="LayoutIllustration-accent-line" x1={81} x2={81} y1={5} y2={97} />
            <path className="LayoutIllustration-accent-line" d="M77.5 93.5 L81 97 L84.5 93.5" />
        </PhoneFrame>
    );
}
