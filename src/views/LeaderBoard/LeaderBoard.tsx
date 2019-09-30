/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import { get} from "requests";
import {errorAlerter} from "misc";
import {Player} from "Player";
import {Card} from "material";

interface LeaderBoardProperties {
}

export class LeaderBoard extends React.PureComponent<LeaderBoardProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            leaderboards: []
        };
    }

    componentDidMount() {
        window.document.title = _("Leaderboards");
        get("leaderboards/")
        .then((leaderboards) => {
            this.setState({
                leaderboards: [
                    [
                        {
                            "name": _("Overall"),
                            "userlist": leaderboards.overall,
                        },
                        {
                            "name": _("Blitz"),
                            "userlist": leaderboards.blitz,
                        },
                        {
                            "name": _("Live"),
                            "userlist": leaderboards.live,
                        },
                        {
                            "name": _("Correspondence"),
                            "userlist": leaderboards.correspondence,
                        },
                    ],

                    [
                        {
                            "name": "19x19",
                            "userlist": leaderboards.overall_19,
                        },
                        {
                            "name": _("Blitz") + " 19x19",
                            "userlist": leaderboards.blitz_19,
                        },
                        {
                            "name": _("Live") + " 19x19",
                            "userlist": leaderboards.live_19,
                        },
                        {
                            "name": _("Correspondence") + " 19x19",
                            "userlist": leaderboards.correspondence_19,
                        },
                    ],

                    [
                        {
                            "name": "13x13",
                            "userlist": leaderboards.overall_13,
                        },
                        {
                            "name": _("Blitz") + " 13x13",
                            "userlist": leaderboards.blitz_13,
                        },
                        {
                            "name": _("Live") + " 13x13",
                            "userlist": leaderboards.live_13,
                        },
                        {
                            "name": _("Correspondence") + " 13x13",
                            "userlist": leaderboards.correspondence_13,
                        },
                    ],

                    [
                        {
                            "name": "9x9",
                            "userlist": leaderboards.overall_9,
                        },
                        {
                            "name": _("Blitz") + " 9x9",
                            "userlist": leaderboards.blitz_9,
                        },
                        {
                            "name": _("Live") + " 9x9",
                            "userlist": leaderboards.live_9,
                        },
                        {
                            "name": _("Correspondence") + " 9x9",
                            "userlist": leaderboards.correspondence_9,
                        },
                    ]

                ]
            });
        })
        .catch(errorAlerter);
    }

    render() {
        return (
            <div className="LeaderBoard page-width">
                <h2><span>{_("Site Wide")}</span> <i className="fa fa-list-ol"></i> {_("Leaderboards")} </h2>
                <Card>
                    {this.state.leaderboards.map((row, ridx) => (
                        <div key={ridx} className="row">
                            {row.map((cell, cidx) => (
                                <div key={`${ridx}x${cidx}`} className="col-sm-3">
                                    <h3>{cell.name}</h3>
                                    {cell.userlist.map((entry, eidx) => (
                                        <div key={`${ridx}x${cidx}x${eidx}`} className="entry">
                                            <span className="points">{points(entry.points)}</span> <Player flag user={entry}/>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    ))}
                </Card>
            </div>
        );
    }
}

function points(n) {
    n = parseFloat(n);
    if (n < 1) {
        return n.toPrecision(3);
    }
    return n.toPrecision(4);
}

