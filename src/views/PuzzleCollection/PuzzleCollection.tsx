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
import { Link, Navigate, useParams } from "react-router-dom";
import { get, put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { _ } from "@/lib/translate";
import * as data from "@/lib/data";
import { PuzzleLibrary } from "@/views/Puzzle/PuzzleLibrary";
import "./PuzzleCollection.css";

/**
 * /puzzle-collection/:collection_id route. Collections no longer have a
 * dedicated edit page — collection management lives inside the Puzzle view's
 * library/settings panels — so when the collection has puzzles this just
 * resolves the starting puzzle and redirects; the `?view-collection=1` query
 * tells the Puzzle view to open the library panel on mount.
 *
 * An empty collection has no puzzle to land on, so we render the same
 * PuzzleLibrary list standalone (with no entries). Owners and moderators get
 * the library's usual rename control and "New puzzle" link, so a brand-new
 * collection is immediately manageable.
 */
export function PuzzleCollection(): React.ReactElement | null {
    const { collection_id } = useParams<{ collection_id: string }>();
    const [target, setTarget] = React.useState<string | null>(null);
    const [collection, setCollection] = React.useState<rest_api.PuzzleCollection | null>(null);

    React.useEffect(() => {
        setTarget(null);
        setCollection(null);
        get(`puzzles/collections/${collection_id}`)
            .then((fetched: rest_api.PuzzleCollection) => {
                if (fetched?.starting_puzzle?.id) {
                    setTarget(`/puzzle/${fetched.starting_puzzle.id}?view-collection=1`);
                } else {
                    window.document.title = fetched.name;
                    setCollection(fetched);
                }
            })
            .catch(errorAlerter);
    }, [collection_id]);

    const renameCollection = React.useCallback((new_name: string) => {
        setCollection((current) => {
            if (!current) {
                return current;
            }
            const prev_name = current.name;
            // Optimistic update; server PUT fails → revert.
            put(`puzzles/collections/${current.id}`, { name: new_name }).catch((err) => {
                setCollection((latest) => (latest ? { ...latest, name: prev_name } : latest));
                errorAlerter(err);
            });
            window.document.title = new_name;
            return { ...current, name: new_name };
        });
    }, []);

    if (target) {
        return <Navigate to={target} replace />;
    }

    if (!collection) {
        return null;
    }

    const user = data.get("user");
    const can_edit = collection.owner.id === user.id || !!user?.is_moderator;

    return (
        <div className="PuzzleCollection">
            <div className="PuzzleCollection-panel">
                <PuzzleLibrary
                    collection_id={collection.id}
                    collection_name={collection.name}
                    items={[]}
                    can_edit={can_edit}
                    // Unreachable with no items; PuzzleLibrary requires them.
                    onDeletePuzzle={() => undefined}
                    onReorderPuzzle={() => undefined}
                    onRenameCollection={renameCollection}
                />
                <Link className="PuzzleCollection-browse" to="/puzzles/">
                    {_("Browse puzzles")}
                </Link>
            </div>
        </div>
    );
}
