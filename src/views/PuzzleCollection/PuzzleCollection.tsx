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
import { _, pgettext } from 'translate';
import {ignore, errorAlerter, navigateTo, unitify } from "misc";
import { get, del, put, abort_requests_in_flight } from "requests";
import { SortablePuzzleList } from './SortablePuzzleList';
import { openACLModal } from 'ACLModal';


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
                    <dt>{_("Puzzle collection")}</dt>
                    <dd><input value={name} onChange={ev => setName(ev.target.value)} placeholder={_('Name')} /></dd>

                    <dt>
                        <label htmlFor='private'>{_("Private")}</label>
                    </dt>
                    <dd>
                        <input type='checkbox' id='private' checked={puzzle_is_private} onChange={ev => setPrivate(ev.target.checked)} />
                    </dd>
                    {puzzle_is_private &&
                        <dd>
                            <button className='success' onClick={() => openACLModal({puzzle_collection_id: collection_id})}>{pgettext("Control who can access the game or review", "Access settings")}</button>
                        </dd>
                    }
                </dl>

                <button className='btn reject' onClick={remove}>{_("Delete")}</button>
                <button className='btn primary' onClick={save}>{_("Save")}</button>

                <div className='center'>
                    <div style={{'textAlign': 'center', 'margin': '1rem'}}>
                        <button className='btn primary' onClick={() => navigateTo("/puzzle/new?collection_id=" + collection_id)}>{_("New puzzle")}</button>
                    </div>

                    <SortablePuzzleList collection={collection_id} />
                </div>
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
