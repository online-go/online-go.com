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
import { splitDroppedRengo } from "game_utils";
import { _ } from "translate";
import { GameList } from "GameList";

interface UserType {
    id: number;
    username: string;
}

interface ActiveDroppedGameListProps {
    games: any[];
    user: UserType;
    noActiveGamesView?: JSX.Element;
}

export function ActiveDroppedGameList(props: ActiveDroppedGameListProps): JSX.Element {
    const { activeGames, droppedGames } = splitDroppedRengo(props.games, props.user.id);
    const hasActiveGames: boolean = activeGames.length !== 0;
    const hasDroppedGames: boolean = droppedGames.length !== 0;
    return (
        <>
            {hasActiveGames && (
                <div className="active-games">
                    <h2>
                        {_("Active Games")} ({activeGames.length})
                    </h2>
                    <GameList list={activeGames} player={props.user} />
                </div>
            )}
            {((!hasActiveGames && props.noActiveGamesView) || null) && props.noActiveGamesView}
            {hasDroppedGames && (
                <div className="dropped-games">
                    <h2>
                        {_("Dropped Games")} ({droppedGames.length})
                    </h2>
                    <GameList list={droppedGames} player={props.user} forceList={true} />
                </div>
            )}
        </>
    );
}
