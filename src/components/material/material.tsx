/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { Link } from "react-router-dom";

export const Card = (props) => (
    <div {...props} className={"Card " + (props.className || "")}>
        {props.children}
    </div>
);

export const CardLink = (props) => (
    <Link {...props} className={"Card " + (props.className || "")}>
        {props.children}
    </Link>
);

export const FabCheck = (props) => (
    <div {...props} className="fab primary raiser">
        <svg
            viewBox="0 0 24 24"
            height="100%"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none", display: "block" }}
        >
            <g>
                <polygon points="9,16.2 4.8,12 3.4,13.4 9,19 21,7 19.6,5.6 "></polygon>
            </g>
        </svg>
    </div>
);

export const FabX = (props) => (
    <div {...props} className="fab reject raiser">
        <svg
            viewBox="0 0 24 24"
            height="100%"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none", display: "block" }}
        >
            <g>
                <polygon points="19,6.4 17.6,5 12,10.6 6.4,5 5,6.4 10.6,12 5,17.6 6.4,19 12,13.4 17.6,19 19,17.6 13.4,12"></polygon>
            </g>
        </svg>
    </div>
);

export const FabAdd = (props) => (
    <div {...props} className="fab info raiser">
        <svg
            viewBox="0 0 24 24"
            height="100%"
            width="100%"
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none", display: "block" }}
        >
            <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z" />
        </svg>
    </div>
);

export default {
    Card: Card,
    CardLink: CardLink,
    FabX: FabX,
    FabCheck: FabCheck,
    FabAdd: FabAdd,
};
