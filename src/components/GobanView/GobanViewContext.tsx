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
import { GobanController } from "@/lib/GobanController";

/* GobanController context -- shared by all components that need the controller */
export const GobanControllerContext = React.createContext<GobanController | null>(null);

export function useGobanController(): GobanController {
    const controller = React.useContext(GobanControllerContext);

    if (!controller) {
        throw TypeError("GobanControllerContext was not set.");
    }

    return controller;
}

export function useGobanControllerOrNull(): GobanController | null {
    const controller = React.useContext(GobanControllerContext);
    return controller;
}

/* Internal GobanView tab state context. Consumed only by TabBar. */
export interface GobanViewTabState {
    toggleVisibility: Record<string, boolean>;
    activeTakeover: string | null;
    setToggle: (id: string, visible: boolean) => void;
    setActiveTakeover: (id: string | null) => void;
}

export const GobanViewStateContext = React.createContext<GobanViewTabState | null>(null);
