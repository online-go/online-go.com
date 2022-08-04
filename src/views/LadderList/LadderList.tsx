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
import { _, interpolate } from "translate";
import { Link } from "react-router-dom";
import { post, get } from "requests";
import { LadderComponent } from "LadderComponent";
import { Card } from "material";
import { errorAlerter } from "misc";
import { useUser } from "hooks";

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
}

export function LadderList(): JSX.Element {
    const [ladders, setLadders] = React.useState<Array<LadderEntry>>([]);
    const user = useUser();

    React.useEffect(() => {
        window.document.title = "Ladders";
        resolve();
    }, []);

    function resolve() {
        get("ladders")
            .then((res) => {
                setLadders(res.results);
            })
            .catch(errorAlerter);
    }

    const join = (ladder_id: number) => {
        post("ladders/%%/players", ladder_id, {})
            .then(() => {
                this.resolve();
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
        </div>
    );
}
