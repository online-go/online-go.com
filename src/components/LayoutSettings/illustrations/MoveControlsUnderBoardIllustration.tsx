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
import { SidePanel } from "./SidePanel";
import { SliderStrip } from "./SliderStrip";
import { WideFrame } from "./WideFrame";

/** Move controls directly under the board. */
export function MoveControlsUnderBoardIllustration(): React.ReactElement {
    return (
        <WideFrame>
            <IllustrationBoard x={14} y={10} size={70} />
            <SliderStrip x={14} y={83} width={70} height={9} />
            <SidePanel x={92} y={8} width={58} height={84} chat />
        </WideFrame>
    );
}
