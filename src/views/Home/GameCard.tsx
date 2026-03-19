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
import { MiniGoban, MiniGobanProps } from "@/components/MiniGoban";
import "./GameCard.css";

interface GameCardProps extends MiniGobanProps {
    cardTitle: React.ReactNode;
    children?: React.ReactNode;
}

export function GameCard({
    cardTitle,
    children,
    ...miniGobanProps
}: GameCardProps): React.ReactElement {
    return (
        <div className="GameCard">
            <div className="GameCard-title-bar">{cardTitle}</div>
            <div className="GameCard-board">
                <MiniGoban {...miniGobanProps} />
            </div>
            {children && <div className="GameCard-footer">{children}</div>}
        </div>
    );
}
