/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {_, pgettext, interpolate} from "translate";
import {Link} from "react-router";
import {post, get} from "requests";
import {LadderComponent} from "LadderComponent";
import {Card} from "material";
import {errorAlerter} from "misc";
import {AdUnit} from "AdUnit";

/* Ensure these get picked up in our translations */
_("Site 19x19 Ladder");
_("Site 13x13 Ladder");
_("Site 9x9 Ladder");

interface LadderListProperties {
}

export class LadderList extends React.PureComponent<LadderListProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            ladders: []
        };
    }

    componentWillMount() {
        this.resolve();
    }

    resolve() {
        get("ladders", 0)
        .then((res) => {
            this.setState({ladders: res.results});
        })
        .catch(errorAlerter);
    }

    join(ladder_id: number) {
        post("ladders/%%/players", ladder_id, {})
        .then(() => {
            this.resolve();
        })
        .catch(errorAlerter);
    }

    render() {
        return (
        <div>
            <AdUnit unit="cdm-zone-01" nag/>
            <div className="LadderList">
                {this.state.ladders.map((ladder, idx) => (
                    <Card key={idx}>
                        <h2>{_(ladder.name)}</h2>
                        {(ladder.player_rank < 0 || null) &&
                            <button className="primary sm" onClick={this.join.bind(this, ladder.id)}>{_("Join")}</button>
                        }
                        <Link className="btn primary sm" to={`/ladder/${ladder.id}`}>{_("Full View") /* translators: View details of the selected ladder */}</Link>

                        <h4>{interpolate(_("{{ladder_size}} players"), {"ladder_size": ladder.size})}</h4>

                        <LadderComponent
                            pageSize={10}
                            ladderId={ladder.id}
                            hidePageControls={true}
                            dontStartOnPlayersPage={true}
                            />
                    </Card>
                ))}
            </div>
        </div>
        );
    }
}
