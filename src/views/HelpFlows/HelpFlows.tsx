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

import React from "react";

import { GuestUserIntroEXV6 } from "./GuestUserIntroEXV6";
import { GuestUserIntroOldNav } from "./GuestUserIntroOldNav";

/**
 * This component is just a handy wrapper for all the Help Flows
 * (technically they _can_ be instantiated direct into the HelpProvider, but this encapsulation is tidier!)
 */
export function HelpFlows(): JSX.Element {
    return (
        <>
            <GuestUserIntroEXV6 />

            <GuestUserIntroOldNav />
        </>
    );
}
