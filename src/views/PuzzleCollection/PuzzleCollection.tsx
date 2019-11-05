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
import * as data from "data";
import * as moment from "moment";
import { _ } from 'translate';
import {ignore, errorAlerter, navigateTo, unitify } from "misc";
import { get, del, put, abort_requests_in_flight } from "requests";
import { PaginatedTable } from "PaginatedTable";
import { longRankString, rankString } from "rank_utils";
import { StarRating } from "StarRating";
import { Player } from "Player";
import { MiniGoban } from "MiniGoban";

declare var swal;

export function PuzzleCollection({match:{params:{collection_id}}}:{match:{params:{collection_id:number}}}):JSX.Element {
    let [collection, setCollection] = React.useState(null);
    let [name, setName] = React.useState(null);
    let [puzzle_is_private, setPrivate] = React.useState(false);

    React.useEffect(() => {
        get(`puzzles/collections/${collection_id}`)
        .then((collection) => {
            setName(collection.name);
            setPrivate(collection['private']);
            setCollection(collection);
            console.log(collection);
        })
        .catch(errorAlerter);

        return () => {
            abort_requests_in_flight(`/puzzles/collections/${collection_id}`);
        };
    }, [collection_id]);

    if (collection === null) {
        return null;
    }

    return (
        <div className="page-width">
            <div id='PuzzleCollection'>
                <dl>
                    <dt>{_("Puzzle name")}</dt>
                    <dd><input value={name} onChange={ev => setName(ev.target.value)} placeholder={_('Name')} /></dd>

                    <dt>
                        <label htmlFor='private'>{_("Private")}</label>
                    </dt>
                    <dd>
                        <input type='checkbox' id='private' checked={puzzle_is_private} onChange={ev => setPrivate(ev.target.checked)} />
                    </dd>
                </dl>
                <button className='btn reject' onClick={remove}>{_("Delete")}</button>
                <button className='btn primary' onClick={save}>{_("Save")}</button>


                <div style={{'textAlign': 'center', 'margin': '1rem'}}>
                    <button className='btn primary' onClick={() => navigateTo("/puzzle/new?collection_id=" + collection_id)}>{_("New puzzle")}</button>
                </div>

                <PaginatedTable
                    className=""
                    source={`puzzles/full`}
                    orderBy={[
                        "id",
                    ]}
                    filter={{
                        "collection": collection_id,
                    }}
                    groom={
                        (arr) => {
                            for (let e of arr) {
                                e.rank_string = longRankString(e.rank);
                            }
                            return arr;
                        }
                    }
                    onRowClick={(row, ev) => navigateTo(`/puzzle/${row.id}`, ev)}
                    columns={[
                        {header: "",  className: () => "icon",
                         render: (X) => (
                            <MiniGoban noLink id={null} json={X.puzzle} displayWidth={64} white={null} black={null} />
                         )
                        },

                        {header: _("Name"), className: () => "", orderBy: ["-name"], render: (X) => X.name},

                        {header: _("Difficulty"), className: () => "difficulty center", orderBy: ["rank"],
                         render: (X) => ( <span>{X.rank_string}</span>)
                        },

                        {header: _("Rating"), className: () => "rating", orderBy: ["-rating", "-rating_count"], render: (X) =>
                            <span><StarRating value={X.rating}/> <span className="rating-count">({unitify(X.rating_count)})</span></span>
                        },
                        {header: _("Views"), className: () => "view-count right", orderBy: ["-view_count"], render: (X) => unitify(X.view_count)},
                        {header: _("Solved"), className: () => "solved-count right", orderBy: ["-solved_count"], render: (X) => unitify(X.solved_count)},
                        {header: _("Created"), className: () => "date center", render: (X) => moment(new Date(X.created)).format("l"), orderBy: ["-created"]},
                    ]}
                />


            </div>
        </div>
    );


    function save() {
        put(`puzzles/collections/${collection_id}`, {
            'name': name,
            'private': puzzle_is_private,
        })
        .then(() => {
            swal("Changes saved").then(ignore).catch(ignore);
        })
        .catch(errorAlerter);
    }

    function remove() {
        swal({text: _("Are you sure you wish to remove this puzzle collection?"), showCancelButton: true})
        .then(() => {
            del(`puzzles/collections/${collection_id}`)
            .then(() => {
                window.location.pathname = '/puzzle-collections/' + data.get('user').id;
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
}
