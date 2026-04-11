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
import { _ } from "@/lib/translate";
import { Link } from "react-router-dom";
import "./Hamburger.css";

export function Hamburger(props: { open: boolean; onClick: () => void }): React.ReactElement {
    return (
        <div className="hamburger-container">
            <button
                className="hamburger"
                aria-expanded={props.open}
                aria-label={_("Menu")}
                onClick={props.onClick}
            >
                <span className="hamburger__in"></span>
            </button>
            <Link
                to="/"
                aria-label={_("Home")}
                className={`hamburger__logo ${props.open ? "hamburger__logo--hidden" : ""}`}
            >
                <span className="ogs-nav-logo" />
            </Link>
        </div>
    );
}
