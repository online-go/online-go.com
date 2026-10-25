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
import { IllustrationBoard } from "./IllustrationBoard";
import { SidePanel } from "./SidePanel";
import { WideFrame } from "./WideFrame";

/** The game chat in its own column to the left of the board. */
export function ChatColumnIllustration(): React.ReactElement {
    return (
        <WideFrame>
            <rect
                className="LayoutIllustration-accent-area"
                x={6}
                y={8}
                width={34}
                height={84}
                rx={2}
            />
            <ChatLines x={11} y={16} width={24} count={10} accent />
            <IllustrationBoard x={45} y={18} size={64} />
            <SidePanel x={114} y={8} width={38} height={84} />
        </WideFrame>
    );
}
