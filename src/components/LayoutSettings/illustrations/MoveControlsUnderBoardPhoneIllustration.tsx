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
import { PhoneCard } from "./PhoneCard";
import { PhoneFrame } from "./PhoneFrame";
import { PhoneScreenTop } from "./PhoneScreenTop";
import { PhoneTabBar } from "./PhoneTabBar";
import { SliderStrip } from "./SliderStrip";

/** Move controls on a phone, directly under the board. */
export function MoveControlsUnderBoardPhoneIllustration(): React.ReactElement {
    return (
        <PhoneFrame>
            <PhoneScreenTop />
            <SliderStrip x={30} y={58} width={40} height={6} />
            <PhoneCard y={66} />
            <PhoneTabBar y={74} />
        </PhoneFrame>
    );
}
