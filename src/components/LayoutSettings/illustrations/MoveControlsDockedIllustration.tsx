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

/** Move controls at the bottom of the side panel. */
export function MoveControlsDockedIllustration(): React.ReactElement {
    return (
        <WideFrame>
            <IllustrationBoard x={14} y={10} size={70} />
            <SidePanel x={92} y={8} width={58} height={84} chat>
                <SliderStrip x={96} y={78} width={50} height={10} />
            </SidePanel>
        </WideFrame>
    );
}
