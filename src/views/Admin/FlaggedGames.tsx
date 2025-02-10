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
import { Link } from "react-router-dom";
import { get } from "@/lib/requests";
import { Player } from "@/components/Player";
//import moment from "moment";

export function FlaggedGames(): React.ReactElement {
    const [flagged_games, setFlaggedGames] = React.useState<any[]>([]);

    React.useEffect(() => {
        get("admin/flaggedGames")
            .then((data) => {
                console.log(data);
                setFlaggedGames(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, []);

    return (
        <div id="FlaggedGames">
            <h1>Flagged Games</h1>
            <table className="table table-striped">
                <thead>
                    <tr>
                        <th>Game ID</th>
                        <th>Player</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {flagged_games.map((game) => (
                        <tr key={game.game_id}>
                            <td>
                                <Link to={`/game/${game.game_id}`}>#{game.game_id}</Link>
                            </td>
                            <td>
                                {Object.keys(game.flags).map((_player_id) => {
                                    const player_id = parseInt(_player_id);

                                    return (
                                        <div key={player_id}>
                                            <Player user={{ id: player_id }} />
                                            <span className="flags">
                                                {Object.keys(game.flags[player_id]).map(
                                                    (name, idx) => (
                                                        <span key={idx}>
                                                            {name}: {game.flags[player_id][name]}
                                                        </span>
                                                    ),
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </td>
                            <td>{game.flagged}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
