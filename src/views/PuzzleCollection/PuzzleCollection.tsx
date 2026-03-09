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
import { _, pgettext } from "@/lib/translate";
import { errorAlerter, navigateTo } from "@/lib/misc";
import { get, del, put, abort_requests_in_flight } from "@/lib/requests";
import { useUser } from "@/lib/hooks";
import { SortablePuzzleList } from "./SortablePuzzleList";
import { openACLModal } from "@/components/ACLModal";
import { alert } from "@/lib/swal_config";
import { useParams } from "react-router-dom";
import "./PuzzleCollection.css";

export function PuzzleCollection(): React.ReactElement | null {
    const { collection_id } = useParams();
    const user = useUser();

    const [collection, setCollection] = React.useState<rest_api.PuzzleCollection | null>(null);
    const [name, setName] = React.useState<string>();
    const [puzzle_is_private, setPrivate] = React.useState(false);
    const [color_transform_enabled, setColorTransformEnabled] = React.useState(false);
    const [position_transform_enabled, setPositionTransformEnabled] = React.useState(false);

    React.useEffect(() => {
        get(`puzzles/collections/${collection_id}`)
            .then((collection) => {
                setName(collection.name);
                setPrivate(collection["private"]);
                setColorTransformEnabled(collection["color_transform_enabled"]);
                setPositionTransformEnabled(collection["position_transform_enabled"]);
                setCollection(collection);
            })
            .catch(errorAlerter);

        return () => {
            abort_requests_in_flight(`/puzzles/collections/${collection_id}`);
        };
    }, [collection_id]);

    if (collection === null) {
        return null;
    }

    const can_edit_collection = !user.anonymous && collection.owner.id === user.id;

    return (
        <div className="page-width">
            <div id="PuzzleCollection">
                <dl className="horizontal">
                    <dt>{_("Puzzle collection")}</dt>
                    <dd>
                        <input
                            value={name}
                            onChange={(ev) => setName(ev.target.value)}
                            placeholder={_("Name")}
                            disabled={!can_edit_collection}
                        />
                    </dd>

                    {can_edit_collection && (
                        <React.Fragment>
                            <dt>
                                <label htmlFor="private">{_("Private")}</label>
                            </dt>
                            <dd>
                                <input
                                    type="checkbox"
                                    id="private"
                                    checked={puzzle_is_private}
                                    onChange={(ev) => setPrivate(ev.target.checked)}
                                />
                            </dd>

                            <dt>
                                <label htmlFor="color_transform_enabled">
                                    {pgettext(
                                        "For a puzzle, enable or disable the swapping of black/white colors",
                                        "Color transform enabled",
                                    )}
                                </label>
                            </dt>
                            <dd>
                                <input
                                    type="checkbox"
                                    id="color_transform_enabled"
                                    checked={color_transform_enabled}
                                    onChange={(ev) => setColorTransformEnabled(ev.target.checked)}
                                />
                            </dd>

                            <dt>
                                <label htmlFor="position_transform_enabled">
                                    {pgettext(
                                        "For a puzzle, enable or disable rotating and flipping of the board",
                                        "Position transform enabled",
                                    )}
                                </label>
                            </dt>
                            <dd>
                                <input
                                    type="checkbox"
                                    id="position_transform_enabled"
                                    checked={position_transform_enabled}
                                    onChange={(ev) =>
                                        setPositionTransformEnabled(ev.target.checked)
                                    }
                                />
                            </dd>

                            {puzzle_is_private && (
                                <React.Fragment>
                                    <dt></dt>
                                    <dd>
                                        <button
                                            className="success"
                                            onClick={() =>
                                                openACLModal({
                                                    puzzle_collection_id: collection_id,
                                                })
                                            }
                                        >
                                            {pgettext(
                                                "Control who can access the game or review",
                                                "Access settings",
                                            )}
                                        </button>
                                    </dd>
                                </React.Fragment>
                            )}
                        </React.Fragment>
                    )}
                </dl>

                {can_edit_collection && (
                    <div className="update">
                        <button className="reject" onClick={remove}>
                            {_("Delete")}
                        </button>
                        <button className="primary" onClick={save}>
                            {_("Save")}
                        </button>
                    </div>
                )}

                <div className="center">
                    {can_edit_collection && (
                        <div style={{ textAlign: "center", margin: "1rem" }}>
                            <button
                                className="btn primary"
                                onClick={() =>
                                    navigateTo("/puzzle/new?collection_id=" + collection_id)
                                }
                            >
                                {_("New puzzle")}
                            </button>
                        </div>
                    )}

                    {collection_id && (
                        <SortablePuzzleList
                            collection={collection_id}
                            canEdit={Boolean(can_edit_collection)}
                        />
                    )}
                </div>
            </div>
        </div>
    );

    function save() {
        put(`puzzles/collections/${collection_id}`, {
            name: name,
            private: puzzle_is_private,
            color_transform_enabled: color_transform_enabled,
            position_transform_enabled: position_transform_enabled,
        })
            .then(() => {
                void alert.fire("Changes saved");
            })
            .catch(errorAlerter);
    }

    function remove() {
        void alert
            .fire({
                text: _("Are you sure you wish to remove this puzzle collection?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    del(`puzzles/collections/${collection_id}`)
                        .then(() => {
                            window.location.pathname = "/puzzle-collections/" + user.id;
                        })
                        .catch(errorAlerter);
                }
            });
    }
}
