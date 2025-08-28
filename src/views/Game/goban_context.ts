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
import { GobanController } from "../../lib/GobanController";

export const GobanControllerContext = React.createContext<GobanController | null>(null);

/**
 * A React hook that provides the GameController (which contains our goban).
 * Always returns a non-null type but may throw at runtime.
 * Use this for components that certainly have a goban controller in context.
 */
export function useGobanController(): GobanController {
    const controller = React.useContext(GobanControllerContext);

    if (controller === null) {
        throw TypeError("useContext: controller is null.");
    }
    if (!controller) {
        throw TypeError("GobanControllerContext was not set.");
    }

    return controller;
}

/**
 * A React hook that provides the GameController (which contains our goban).
 * Returns null if no context provider is available.
 * Use this where we don't know if the component has a goban controller in context
 * (and handles that properly)
 */
export function useGobanControllerSafe(): GobanController | null {
    const controller = React.useContext(GobanControllerContext);
    return controller;
}
