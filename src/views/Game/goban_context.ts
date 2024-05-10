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
import { GobanRenderer } from "goban";

export const GobanContext = React.createContext<GobanRenderer | null>(null);

/**
 * A React hook that provides the goban.
 *
 * Throws if a goban is not set.
 */
export function useGoban(): GobanRenderer {
    const goban = React.useContext(GobanContext);

    if (goban === null) {
        throw TypeError("useContext: goban is null.");
    }
    if (!goban) {
        throw TypeError("GobanContext was not set.");
    }

    return goban;
}
