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
import { _ } from "@/lib/translate";
import {
    DndContext,
    DragEndEvent,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import "./PuzzleLibrary.css";

interface PuzzleLibraryItem {
    id: number;
    name: string;
}

interface PuzzleLibraryProps {
    collection_id: number;
    collection_name: string;
    current_id?: number;
    items: PuzzleLibraryItem[];
    can_edit: boolean;
    onRenameCollection: (new_name: string) => void;
    onDeletePuzzle: (puzzle_id: number) => void;
    /** Move `moved_id` to sit immediately after `after_id`. `after_id === 0`
     *  moves the puzzle to the top of the list. */
    onReorderPuzzle: (moved_id: number, after_id: number) => void;
}

export function PuzzleLibrary({
    collection_id,
    collection_name,
    current_id,
    items,
    can_edit,
    onRenameCollection,
    onDeletePuzzle,
    onReorderPuzzle,
}: PuzzleLibraryProps): React.ReactElement {
    return (
        <div className="PuzzleLibrary">
            <LibraryHeader
                collection_name={collection_name}
                can_edit={can_edit}
                onRenameCollection={onRenameCollection}
            />
            <LibraryList
                items={items}
                current_id={current_id}
                can_edit={can_edit}
                onDeletePuzzle={onDeletePuzzle}
                onReorderPuzzle={onReorderPuzzle}
            />
            {can_edit && (
                <div className="PuzzleLibrary-footer">
                    <Link
                        to={`/puzzle/new?collection_id=${collection_id}`}
                        className="PuzzleLibrary-new-puzzle"
                    >
                        <i className="fa fa-plus" /> {_("New puzzle")}
                    </Link>
                </div>
            )}
        </div>
    );
}

function LibraryHeader({
    collection_name,
    can_edit,
    onRenameCollection,
}: {
    collection_name: string;
    can_edit: boolean;
    onRenameCollection: (new_name: string) => void;
}): React.ReactElement {
    const [editing, setEditing] = React.useState(false);
    const [draft, setDraft] = React.useState(collection_name);

    React.useEffect(() => {
        if (!editing) {
            setDraft(collection_name);
        }
    }, [collection_name, editing]);

    const commit = () => {
        const trimmed = draft.trim();
        if (trimmed && trimmed !== collection_name) {
            onRenameCollection(trimmed);
        }
        setEditing(false);
    };

    const cancel = () => {
        setDraft(collection_name);
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="PuzzleLibrary-title-row editing">
                <input
                    className="PuzzleLibrary-title-input"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            commit();
                        } else if (e.key === "Escape") {
                            cancel();
                        }
                    }}
                />
                <button
                    type="button"
                    className="PuzzleLibrary-title-btn"
                    title={_("Save")}
                    onClick={commit}
                >
                    <i className="fa fa-check" />
                </button>
                <button
                    type="button"
                    className="PuzzleLibrary-title-btn"
                    title={_("Cancel")}
                    onClick={cancel}
                >
                    <i className="fa fa-times" />
                </button>
            </div>
        );
    }

    return (
        <div className="PuzzleLibrary-title-row">
            <h3 className="PuzzleLibrary-title">{collection_name || _("Puzzle collection")}</h3>
            {can_edit && (
                <button
                    type="button"
                    className="PuzzleLibrary-title-btn"
                    title={_("Rename collection")}
                    onClick={() => setEditing(true)}
                >
                    <i className="fa fa-pencil" />
                </button>
            )}
        </div>
    );
}

function LibraryList({
    items,
    current_id,
    can_edit,
    onDeletePuzzle,
    onReorderPuzzle,
}: {
    items: PuzzleLibraryItem[];
    current_id?: number;
    can_edit: boolean;
    onDeletePuzzle: (puzzle_id: number) => void;
    onReorderPuzzle: (moved_id: number, after_id: number) => void;
}): React.ReactElement {
    // Slight activation threshold so clicks on the name link aren't swallowed
    // by drag gesture recognition.
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }
        const from = items.findIndex((i) => i.id === active.id);
        const to = items.findIndex((i) => i.id === over.id);
        if (from < 0 || to < 0) {
            return;
        }
        // Match the legacy SortablePuzzleList semantics: `after` is the id of
        // the puzzle that should end up immediately before the moved one in
        // the new order, which is computed from the old-index array.
        const after_idx = from < to ? to : to - 1;
        const after_id = after_idx >= 0 ? items[after_idx].id : 0;
        onReorderPuzzle(Number(active.id), after_id);
    };

    if (!can_edit) {
        return (
            <ul className="PuzzleLibrary-list">
                {items.map((item) => (
                    <PuzzleLibraryEntry
                        key={item.id}
                        item={item}
                        current_id={current_id}
                        can_edit={false}
                        onDelete={onDeletePuzzle}
                    />
                ))}
            </ul>
        );
    }

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={items} strategy={verticalListSortingStrategy}>
                <ul className="PuzzleLibrary-list">
                    {items.map((item) => (
                        <PuzzleLibraryEntry
                            key={item.id}
                            item={item}
                            current_id={current_id}
                            can_edit
                            onDelete={onDeletePuzzle}
                        />
                    ))}
                </ul>
            </SortableContext>
        </DndContext>
    );
}

function PuzzleLibraryEntry({
    item,
    current_id,
    can_edit,
    onDelete,
}: {
    item: PuzzleLibraryItem;
    current_id?: number;
    can_edit: boolean;
    onDelete: (puzzle_id: number) => void;
}): React.ReactElement {
    const sortable = useSortable({ id: item.id, disabled: !can_edit });
    const style: React.CSSProperties = can_edit
        ? {
              transform: CSS.Transform.toString(sortable.transform),
              transition: sortable.transition,
          }
        : {};
    const is_current = item.id === current_id;

    return (
        <li
            ref={can_edit ? sortable.setNodeRef : undefined}
            className={`PuzzleLibrary-entry${is_current ? " current" : ""}${
                can_edit ? " editable" : ""
            }`}
            style={style}
        >
            {can_edit && (
                <span
                    className="PuzzleLibrary-entry-handle"
                    title={_("Drag to reorder")}
                    {...sortable.attributes}
                    {...sortable.listeners}
                >
                    <i className="fa fa-bars" />
                </span>
            )}
            <Link to={`/puzzle/${item.id}`} className="PuzzleLibrary-entry-link">
                {item.name}
            </Link>
            {can_edit && (
                <button
                    type="button"
                    className="PuzzleLibrary-entry-delete"
                    title={_("Delete puzzle")}
                    onClick={() => onDelete(item.id)}
                >
                    <i className="fa fa-trash" />
                </button>
            )}
        </li>
    );
}
