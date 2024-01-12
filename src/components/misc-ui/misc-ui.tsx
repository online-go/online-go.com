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

/* This is intended to create text embedded in a horizontal line like
 *   --- my text ---
 * It relies on css for 'left' and 'right' being as expected in context, caveat emptor. */

export const LineText = (props: JSX.IntrinsicElements["div"]) => (
    <div {...props} className={"LineText " + (props.className || "")}>
        <span className="left" />
        <span className="contents">{props.children}</span>
        <span className="right" />
    </div>
);

export const SearchInput = (props: JSX.IntrinsicElements["input"]) => (
    <div className={"SearchInput " + (props.className || "")}>
        <i className="fa fa-search"></i>
        <input type="search" className={props.className || ""} {...props} />
    </div>
);

export const Ribbon = (props: JSX.IntrinsicElements["div"]) => (
    <div className="Ribbon-container">
        <div {...props} className={"Ribbon " + (props.className || "")}>
            {props.children}
        </div>
    </div>
);
