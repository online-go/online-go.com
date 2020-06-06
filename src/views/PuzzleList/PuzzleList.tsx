/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {PaginatedTable} from "PaginatedTable";
import {Player} from "Player";
import {MiniGoban} from "MiniGoban";
import {SearchInput} from "misc-ui";
import {StarRating} from "StarRating";
import {longRankString, rankString} from "rank_utils";
import {navigateTo, unitify} from "misc";
import * as data from "data";
import * as moment from "moment";

interface PuzzleListProperties {
}


export class PuzzleList extends React.PureComponent<PuzzleListProperties, any> {
    refs: {
        table
    };

    constructor(props) {
        super(props);
        this.state = { };
    }
    componentDidMount() {
        window.document.title = _("Puzzles");
    }

    render() {
        let user = data.get("user");

        return (
            <div className="page-width">
                <div className="PuzzleList container">
                    <div className="puzzle-list-container" style={{clear:'both'}}>

                        <div className="page-nav">

                            <h2><i className="fa fa-puzzle-piece"></i> {_("Puzzles")}</h2>

                            <div>
                                {((!user.anonymous) || null) &&
                                    <Link to={`/puzzle-collections/${user.id}`}>{_("My puzzles")}</Link>
                                }

                                <SearchInput
                                    placeholder={_("Search")}
                                    onChange={(event) => {
                                        this.refs.table.filter.name__icontains = (event.target as HTMLInputElement).value.trim();
                                        this.refs.table.filter_updated();
                                    }}
                                />
                            </div>
                        </div>

                        <PaginatedTable
                            className=""
                            ref="table"
                            source={`puzzles/collections/`}
                            orderBy={[
                                "-rating",
                                "-rating_count"
                            ]}
                            filter={{
                                "puzzle_count__gt": "0",
                                "name__istartswith": ""
                            }}
                            groom={
                                (arr) => {
                                    for (let e of arr) {
                                        e.min_rank_string = longRankString(e.min_rank);
                                        e.max_rank_string = longRankString(e.max_rank);
                                        e.min_rank_short = rankString(e.min_rank);
                                        e.max_rank_short = rankString(e.max_rank);
                                    }
                                    return arr;
                                }
                            }
                            onRowClick={(row, ev) => {
                                const id = data.get(`puzzle.collection.${row.id}.last-visited`, row.starting_puzzle.id);
                                navigateTo(`/puzzle/${id}`, ev);
                            }}
                            columns={[
                                {header: "",  className: () => "icon",
                                 render: (X) => (
                                    <MiniGoban noLink id={null} json={X.starting_puzzle} displayWidth={64} white={null} black={null} />
                                 )
                                },

                                {header: _("Collection"),  className: () => "name", orderBy: ["name"],
                                 render: (X) => (
                                    <div>
                                        <div>{X.name}</div>
                                        <Player user={X.owner}/>
                                    </div>
                                 )
                                },

                                {header: _("Difficulty"),  className: () => "difficulty center", orderBy: ["min_rank", "max_rank"],
                                 render: (X) => (
                                     X.min_rank_string === X.max_rank_string
                                         ? <span>{X.min_rank_string}</span>
                                         : <span>{X.min_rank_short}-{X.max_rank_short}</span>
                                 )
                                },

                                {header: _("Puzzles"),  className: () => "puzzle-count center", render: (X) => X.puzzle_count, orderBy: ["-puzzle_count"]},
                                {header: _("Rating"),  className: () => "rating", orderBy: ["-rating", "-rating_count"], render: (X) =>
                                    <span><StarRating value={X.rating}/> <span className="rating-count">({unitify(X.rating_count)})</span></span>
                                },
                                {header: _("Views"),  className: () => "view-count right", orderBy: ["-view_count"], render: (X) => unitify(X.view_count)},
                                {header: _("Solved"),  className: () => "solved-count right", orderBy: ["-solved_count"], render: (X) => unitify(X.solved_count)},
                                {header: _("Created"),  className: () => "date center", render: (X) => moment(new Date(X.created)).format("l"), orderBy: ["-created"]},
                            ]}
                        />

                    </div>
                </div>
            </div>
        );
    }
}
