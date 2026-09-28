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
import { CenterGuide } from "./CenterGuide";
import { IllustrationBoard } from "./IllustrationBoard";
import { SidePanel } from "./SidePanel";
import { WideFrame } from "./WideFrame";

/** The board centered in the whole window, with the side panel to its right. */
export function BoardAlignWindowIllustration(): React.ReactElement {
    return (
        <WideFrame>
            <CenterGuide x1={6} x2={154} y={7} bottom={95} />
            <IllustrationBoard x={49} y={16} size={62} />
            <SidePanel x={115} y={16} width={39} height={76} />
        </WideFrame>
    );
}
