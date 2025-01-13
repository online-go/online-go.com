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

interface TooltipProps {
    title?: string;
    text?: string;
    children: React.ReactNode;
    id?: string;
    position?: "top" | "bottom" | "left" | "right";
    tooltipRequired?: boolean;
}

export function Tooltip(props: TooltipProps): React.ReactElement {
    return (
        <div className={props.position ? `TooltipContainer ${props.position}` : "TooltipContainer"}>
            <div className={props.tooltipRequired ? "Tooltip" : "Tooltip disabled"}>
                {props.title && <p className={"title"}>{props.title}</p>}
                {props.text && <p className={"text"}>{props.text}</p>}
            </div>
            <div>{props.children}</div>
        </div>
    );
}
