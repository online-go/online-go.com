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
import { IllustrationBoard } from "./IllustrationBoard";
import "./LayoutIllustrations.css";

/** The top of the phone screen: the player bar and the full-width board. */
export function PhoneScreenTop(): React.ReactElement {
    return (
        <g>
            <rect
                className="LayoutIllustration-panel"
                x={30}
                y={9}
                width={40}
                height={5}
                rx={1.5}
            />
            <IllustrationBoard x={30} y={16} size={40} />
        </g>
    );
}
