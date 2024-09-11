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
import { errorAlerter, navigateTo } from "@/lib/misc";
import { get, put } from "@/lib/requests";
import { longRankString } from "@/lib/rank_utils";
import { MiniGoban } from "@/components/MiniGoban";
import {
    DndContext,
    DragEndEvent,
    useSensors,
    MouseSensor,
    useSensor,
    TouchSensor,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { IdType } from "@/lib/types";

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

    handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over == null) {
            return;
        }

        if (active.id === over.id) {
            return;
        }

        const oldIndex = this.state.entries.findIndex((entry) => active.id === entry.id);
        const newIndex = this.state.entries.findIndex((entry) => over.id === entry.id);

        const after = oldIndex < newIndex ? newIndex : newIndex - 1;

        put(`puzzles/${this.state.entries[oldIndex].id}/order`, {
            after: newIndex ? this.state.entries[after].id : 0,
        }).catch(errorAlerter);

        this.setState(({ entries }) => {
            return { entries: arrayMove(entries, oldIndex, newIndex) };
        });
    };

    render() {
        return (
            <SortablePuzzleListContainer
                entries={this.state.entries}
                onDragEnd={this.handleDragEnd}
            />
        );
    }
}

function PuzzleEntry({ puzzle }: { puzzle: PuzzleEntryInterface }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
        id: puzzle.id,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            className="SortablePuzzleListEntry"
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={style}
        >
            <span className="minigoban">
                <MiniGoban
                    noLink
                    game_id={undefined}
                    json={puzzle.puzzle}
                    displayWidth={64}
                    white={undefined}
                    black={undefined}
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
    );
}

function SortablePuzzleListContainer({
    entries,
    onDragEnd,
}: {
    entries: Array<PuzzleEntryInterface>;
    onDragEnd: (event: DragEndEvent) => void;
}) {
    const sensors = useSensors(
        // Without this activation constraint, the "Edit" button doesn't work
        // because dnd swallows click events.
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor),
    );
    return (
        <DndContext onDragEnd={onDragEnd} sensors={sensors}>
            <SortableContext items={entries} strategy={verticalListSortingStrategy}>
                <ul className="SortablePuzzleList">
                    {entries.map((entry) => (
                        <PuzzleEntry key={entry.id} puzzle={entry} />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}
