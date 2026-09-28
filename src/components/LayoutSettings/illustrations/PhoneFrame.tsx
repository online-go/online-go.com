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
 * A phone in a 100 x 100 view box. The screen is x 30 to 70 and y 9 to
 * 82. Content drawn below y 85 shows outside the phone.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <svg
            className="LayoutIllustration phone"
            viewBox="0 0 100 100"
            aria-hidden="true"
            focusable="false"
        >
            {children}
            <rect className="LayoutIllustration-frame" x={27} y={3} width={46} height={82} rx={5} />
            <line className="LayoutIllustration-speaker" x1={46} x2={54} y1={6} y2={6} />
        </svg>
    );
}
