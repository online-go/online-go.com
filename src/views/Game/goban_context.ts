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

export const GameControllerContext = React.createContext<GobanController | null>(null);

/**
 * A React hook that provides the GameController (which contains our goban).
 */
export function useGameController(): GobanController {
    const game_controller = React.useContext(GameControllerContext);

    if (game_controller === null) {
        throw TypeError("useContext: game_controller is null.");
    }
    if (!game_controller) {
        throw TypeError("GameControllerContext was not set.");
    }

    return game_controller;
}
