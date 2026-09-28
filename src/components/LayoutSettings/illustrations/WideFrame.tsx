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

/** A 16:10 desktop screen. Children draw in a 160 x 100 view box. */
export function WideFrame({ children }: { children: React.ReactNode }): React.ReactElement {
    return (
        <svg
            className="LayoutIllustration wide"
            viewBox="0 0 160 100"
            aria-hidden="true"
            focusable="false"
        >
            {children}
            <rect className="LayoutIllustration-frame" x={1} y={1} width={158} height={98} rx={3} />
        </svg>
    );
}
