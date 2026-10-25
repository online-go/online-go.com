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
import "./LayoutIllustrations.css";

/**
 * The game side panel: two player cards at the top and, when `chat` is
 * set, a few neutral chat lines under them. `children` draw on top.
 */
export function SidePanel({
    x,
    y,
    width,
    height,
    chat = false,
    children,
}: {
    x: number;
    y: number;
    width: number;
    height: number;
    chat?: boolean;
    children?: React.ReactNode;
}): React.ReactElement {
    return (
        <g>
            <rect
                className="LayoutIllustration-panel"
                x={x}
                y={y}
                width={width}
                height={height}
                rx={3}
            />
            <rect
                className="LayoutIllustration-card"
                x={x + 4}
                y={y + 4}
                width={width - 8}
                height={10}
                rx={2}
            />
            <rect
                className="LayoutIllustration-card"
                x={x + 4}
                y={y + 17}
                width={width - 8}
                height={10}
                rx={2}
            />
            {chat && <ChatLines x={x + 6} y={y + 36} width={width - 12} count={3} />}
            {children}
        </g>
    );
}
