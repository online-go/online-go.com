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

export function splitDroppedRengo(games: any[], playerId: number) {
    const active = [];
    const dropped = [];
    const isPlayer = (player) => player.id === playerId;
    const isActivePlayer = (game) =>
        game.black.id === playerId ||
        game.white.id === playerId ||
        game.json?.rengo_teams.black.some(isPlayer) ||
        game.json?.rengo_teams.white.some(isPlayer);
    games.forEach((game) => {
        if (isActivePlayer(game)) {
            active.push(game);
        } else {
            dropped.push(game);
        }
    });
    return {
        activeGames: active,
        droppedGames: dropped,
    };
}
