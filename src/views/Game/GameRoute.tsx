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
import { useParams } from "react-router-dom";
import { Game } from "./Game";

/**
 * Route element for games, reviews and demos. It keys Game by the game or
 * review id, so a change to a different game mounts a new Game. Without
 * this, React reuses the old Game and its children keep their state
 * (inputs, timers, loaded game data) on the new game.
 */
export function GameRoute(): React.ReactElement {
    const { game_id, review_id } = useParams<"game_id" | "review_id">();
    return <Game key={game_id ? `game-${game_id}` : `review-${review_id}`} />;
}
