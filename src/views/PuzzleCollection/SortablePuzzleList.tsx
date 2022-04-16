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
import { _ } from "translate";
import { errorAlerter, navigateTo } from "misc";
import { get, put } from "requests";
import { longRankString } from "rank_utils";
import { MiniGoban } from "MiniGoban";
import { SortableContainer, SortableElement } from "react-sortable-hoc";
import arrayMove from "array-move";
import { IdType } from "src/lib/types";

interface PuzzleEntryInterface {
    id: number;
    order: number;
    name: string;
    puzzle: any;
    has_solution: boolean;
    type: string;
    rank: number;
}

interface SortablePuzzleListProperties {
    collection: IdType;
}
interface SortablePuzzleListState {
    entries: Array<PuzzleEntryInterface>;
}

export class SortablePuzzleList extends React.Component<
    SortablePuzzleListProperties,
    SortablePuzzleListState
> {
    constructor(props: SortablePuzzleListProperties) {
        super(props);

        this.state = {
            entries: [],
        };
    }

    componentDidMount() {
        this.refresh();
    }

    refresh() {
        get(`puzzles/collections/${this.props.collection}/puzzles`)
            .then((lst) => {
                this.setState({ entries: lst });
            })
            .catch(errorAlerter);
    }

    onSortEnd = ({ oldIndex, newIndex }) => {
        if (oldIndex === newIndex) {
            return;
        }

        const after = oldIndex < newIndex ? newIndex : newIndex - 1;

        put(`puzzles/${this.state.entries[oldIndex].id}/order`, {
            after: newIndex ? this.state.entries[after].id : 0,
        })
            .then((asdf) => {
                console.log(asdf);
            })
            .catch(errorAlerter);

        this.setState(({ entries }) => ({
            entries: arrayMove(entries, oldIndex, newIndex),
        }));
    };

    render() {
        return (
            <SortablePuzzleListContainer entries={this.state.entries} onSortEnd={this.onSortEnd} />
        );
    }
}

const PuzzleEntry: any = SortableElement(({ puzzle }: { puzzle: PuzzleEntryInterface }) => (
    <li className="SortablePuzzleListEntry">
        <span className="minigoban">
            <MiniGoban
                noLink
                id={null}
                json={puzzle.puzzle}
                displayWidth={64}
                white={null}
                black={null}
            />
        </span>
        <span className="name">{puzzle.name}</span>
        <span className="difficulty">{longRankString(puzzle.rank)}</span>
        <button
            className="edit"
            onClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                navigateTo(`/puzzle/${puzzle.id}`, ev);
            }}
            onAuxClick={(ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                navigateTo(`/puzzle/${puzzle.id}`, ev);
            }}
        >
            {_("Edit")}
        </button>
    </li>
));

const SortablePuzzleListContainer: any = SortableContainer(
    ({ entries }: { entries: Array<PuzzleEntryInterface> }) => (
        <ul className="SortablePuzzleList">
            {entries.map((entry, index) => (
                <PuzzleEntry key={entry.id} index={index} puzzle={entry} />
            ))}
        </ul>
    ),
);
