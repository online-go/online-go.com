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
import { GameList } from "@/components/GameList";
import { PlayerCacheEntry } from "@/lib/player_cache";

interface UserType {
    id: number;
    username: string;
}

interface ActiveDroppedGameListProps {
    games: any[];
    user: UserType;
    noActiveGamesView?: React.ReactElement;
}

export function ActiveDroppedGameList(props: ActiveDroppedGameListProps): React.ReactElement {
    const { activeGames, droppedGames } = splitDroppedRengo(props.games, props.user.id);
    const hasActiveGames: boolean = activeGames.length !== 0;
    const hasDroppedGames: boolean = droppedGames.length !== 0;

    const [collapsed, setCollapsed] = React.useState(false);
    const collapseIcon = collapsed ? "fa fa-angle-down" : "fa fa-angle-up";

    return (
        <>
            {hasActiveGames && (
                <div className="active-games">
                    <h2>
                        {_("Active Games")} ({activeGames.length})
                    </h2>
                    <GameList
                        list={activeGames}
                        player={props.user}
                        lineSummaryMode={"opponent-only"}
                    />
                </div>
            )}
            {((!hasActiveGames && props.noActiveGamesView) || null) && props.noActiveGamesView}
            {hasDroppedGames && (
                <div className="dropped-games">
                    <div className="dropped-games-header">
                        <h2>
                            {_("Dropped Games")} ({droppedGames.length})
                        </h2>
                        <i className={collapseIcon} onClick={() => setCollapsed(!collapsed)}></i>
                    </div>
                    {!collapsed && (
                        <GameList
                            list={droppedGames}
                            player={props.user}
                            forceList={true}
                            lineSummaryMode={"dropped-rengo"}
                        />
                    )}
                </div>
            )}
        </>
    );
}

function splitDroppedRengo(games: any[], playerId: number) {
    const active: any[] = [];
    const dropped: any[] = [];
    const isPlayer = (player: PlayerCacheEntry) => player.id === playerId;
    const isActivePlayer = (game: any) => {
        if (game.json?.rengo === true) {
            return (
                game.json.rengo_teams.black.some(isPlayer) ||
                game.json.rengo_teams.white.some(isPlayer)
            );
        }
        return game.black.id === playerId || game.white.id === playerId;
    };
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
