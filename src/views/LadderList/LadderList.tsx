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
import { _, interpolate } from "@/lib/translate";
import { Link } from "react-router-dom";
import { post, get } from "@/lib/requests";
import { LadderComponent } from "@/components/LadderComponent";
import { Card } from "@/components/material";
import { errorAlerter } from "@/lib/misc";
import { useUser } from "@/lib/hooks";

/* Ensure these get picked up in our translations */
_("Site 19x19 Ladder");
_("Site 13x13 Ladder");
_("Site 9x9 Ladder");

interface LadderEntry {
    id: number;
    board_size: number;
    name: string;
    player_rank: number;
    size: number;
    group?: {
        id: number;
        icon: string;
        name: string;
    };
}

export function LadderList(): React.ReactElement {
    const [ladders, setLadders] = React.useState<Array<LadderEntry>>([]);
    const [joinedLadders, setJoinedLadders] = React.useState<Array<LadderEntry>>([]);
    const user = useUser();

    React.useEffect(() => {
        window.document.title = "Ladders";
        fetchLadders();
    }, []);

    function fetchLadders() {
        get("ladders")
            .then((res) => {
                setLadders(res.results);
            })
            .catch(errorAlerter);

        if (!user.anonymous) {
            get("me/ladders", { page_size: 100 })
                .then((res) => {
                    console.log(res.results);
                    setJoinedLadders(res.results);
                })
                .catch(errorAlerter);
        }
    }

    const join = (ladder_id: number) => {
        post(`ladders/${ladder_id}/players`, {})
            .then(() => {
                fetchLadders();
            })
            .catch(errorAlerter);
    };

    return (
        <div className="page-width">
            <div className="page-nav">
                <h2 style={{ marginLeft: "1rem" }}>
                    <i className="fa fa-list-ol"></i> {_("Ladders")}
                </h2>
                <div>
                    {ladders.map((ladder, idx) => (
                        <Link key={idx} to={`/ladder/${ladder.id}`}>
                            {_(ladder.board_size + "x" + ladder.board_size)}
                        </Link>
                    ))}
                </div>
            </div>
            <div className="LadderList">
                {ladders.map((ladder, idx) => (
                    <Card key={idx}>
                        <h2>{_(ladder.name)}</h2>
                        {(ladder.player_rank < 0 || null) && (
                            <button
                                className="primary sm"
                                disabled={user.anonymous}
                                onClick={() => join(ladder.id)}
                            >
                                {_("Join")}
                            </button>
                        )}
                        <Link className="btn primary sm" to={`/ladder/${ladder.id}`}>
                            {_("Full View") /* translators: View details of the selected ladder */}
                        </Link>

                        <h4>
                            {interpolate(_("{{ladder_size}} players"), {
                                ladder_size: ladder.size,
                            })}
                        </h4>

                        <LadderComponent ladderId={ladder.id} />
                    </Card>
                ))}
            </div>
            {joinedLadders.length > 0 && (
                <div className="MyLadders">
                    <h2 style={{ marginLeft: "1rem" }}>
                        <i className="fa fa-list-ol"></i> {_("My Ladders")}
                    </h2>
                    {joinedLadders.map((ladder, idx) => (
                        <div className="MyLadders-row" key={idx}>
                            <span className="player-rank">#{ladder.player_rank}</span>
                            {ladder.group?.icon ? (
                                <img
                                    className="group-icon"
                                    src={ladder.group.icon}
                                    title={ladder.group.name}
                                    alt={ladder.group.name}
                                />
                            ) : (
                                <i className="fa fa-list-ol"></i>
                            )}
                            <Link to={`/ladder/${ladder.id}`}>{ladder.name}</Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
