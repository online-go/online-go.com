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
import * as data from "@/lib/data";
import { _, interpolate } from "@/lib/translate";
import { Link } from "react-router-dom";
import { RouteComponentProps, rr6ClassShim } from "@/lib/ogs-rr6-shims";
import { browserHistory } from "@/lib/ogsHistory";
import { abort_requests_in_flight, post, get } from "@/lib/requests";
import { errorAlerter, ignore, getOutcomeTranslation } from "@/lib/misc";
import { Player } from "@/components/Player";
import { Card } from "@/components/material";
import Dropzone from "react-dropzone";
import { DropzoneRef } from "react-dropzone";
import moment from "moment";
import { IdType } from "@/lib/types";
import { openSGFPasteModal } from "@/components/SGFPasteModal";
import * as preferences from "@/lib/preferences";
import { PlayerCacheEntry } from "@/lib/player_cache";
// import { createGameRecord } from "@/components/ChallengeModal";

type LibraryPlayerProperties = RouteComponentProps<{
    player_id: string;
    collection_id: string;
}>;

type SortOrder = "name" | "game_date" | "date_added";
type Column = { title: string; sortable: boolean; order?: SortOrder; ownerOnly?: boolean };

interface Collection {
    id: number;
    name: string;
    private: string;
    parent_id: number;
    parent?: Collection;
    collections: Collection[];
    games: Entry[];
    game_ct?: number;
}

interface LibraryPlayerState {
    player_id: IdType;
    collection_id: string;
    collections?: { [id: string]: Collection };
    games_checked: {};
    new_collection_name: string;
    new_collection_private: boolean;
    sort_order: SortOrder;
    sort_descending: boolean;
}

interface Entry {
    entry_id: number;
    game_id: number;
    name: string;
    started: string;
    created: string;
    black: PlayerCacheEntry;
    white: PlayerCacheEntry;
    outcome: string;
    white_lost: boolean;
    black_lost: boolean;
}

class _LibraryPlayer extends React.PureComponent<LibraryPlayerProperties, LibraryPlayerState> {
    dropzone?: DropzoneRef;

    constructor(props: LibraryPlayerProperties) {
        super(props);

        this.state = {
            player_id: parseInt(this.props.match.params.player_id),
            collection_id: this.props.match.params.collection_id || "0",
            collections: undefined,
            games_checked: {},
            new_collection_name: "",
            new_collection_private: false,
            sort_order: preferences.get("sgf.sort-order") as SortOrder,
            sort_descending: preferences.get("sgf.sort-descending"),
        };
    }

    sortOrders: { [id in SortOrder]: any } = {
        name: (a: Entry, b: Entry) => a.name.localeCompare(b.name),
        game_date: (a: Entry, b: Entry) => Date.parse(a.started) - Date.parse(b.started),
        date_added: (a: Entry, b: Entry) => Date.parse(a.created) - Date.parse(b.created),
    };

    columns: Column[] = [
        { title: "", sortable: false, ownerOnly: true }, // checkbox column
        { title: _("Game Date"), sortable: true, order: "game_date" },
        { title: _("Name"), sortable: true, order: "name" },
        { title: _("Black"), sortable: false },
        { title: _("White"), sortable: false },
        { title: _("Result"), sortable: false },
        { title: _("Date Added"), sortable: true, order: "date_added" },
    ];

    componentDidMount() {
        this.refresh(this.state.player_id).then(ignore).catch(ignore);
    }
    componentDidUpdate(prev_props: LibraryPlayerProperties) {
        let updated = false;
        const update: any = {};

        if (this.props.match.params.player_id !== prev_props.match.params.player_id) {
            this.refresh(parseInt(this.props.match.params.player_id)).then(ignore).catch(ignore);
            update.player_id = parseInt(this.props.match.params.player_id);
            update.games_checked = {};
            updated = true;
        }

        if (this.props.match.params.collection_id !== prev_props.match.params.collection_id) {
            if (this.props.match.params.collection_id) {
                update.collection_id = parseInt(this.props.match.params.collection_id);
            } else {
                update.collection_id = "0";
            }
            update.games_checked = {};
            updated = true;
        }

        if (updated) {
            this.setState(update);
        }
    }
    componentWillUnmount() {
        abort_requests_in_flight("library/");
    }
    refresh(player_id: IdType) {
        const promise = get(`library/${player_id}`);

        promise
            .then((library) => {
                const collections: { [id: number]: Collection } = {};

                const root: Collection = {
                    id: 0,
                    name: "",
                    private: "",
                    parent_id: 0,
                    parent: undefined,
                    collections: [],
                    games: [],
                };

                collections[0] = root;

                for (const c of library.collections) {
                    const collection = {
                        id: c[0],
                        name: c[1],
                        private: c[2],
                        parent_id: c[3] || 0,
                        collections: [],
                        games: [],
                    };
                    collections[collection.id] = collection;
                }

                for (const id in collections) {
                    if (id === "0") {
                        continue;
                    }

                    collections[id].parent = collections[collections[id].parent_id];
                    collections[id].parent?.collections.push(collections[id]);
                }

                for (const g of library.games) {
                    const game = {
                        entry_id: g[0],
                        game_id: g[1],
                        collection_id: g[2],
                        collection: collections[g[2] || 0],
                        created: g[3],
                        started: g[4],
                        ended: g[5],
                        name: g[6].trim() || "#" + g[1],
                        starred: g[7],
                        notes: g[8],

                        black: {
                            id: g[9],
                            username: g[10],
                            ranking: g[11],
                            professional: g[12],
                        },
                        white: {
                            id: g[13],
                            username: g[14],
                            ranking: g[15],
                            professional: g[16],
                        },
                        black_lost: g[17],
                        white_lost: g[18],
                        outcome: g[19],
                        source: g[20],
                    };

                    if (game.source === "record") {
                        delete game.black.id;
                        delete game.white.id;
                    }

                    game.collection.games.push(game);
                }

                for (const collection_id in collections) {
                    const collection = collections[collection_id];
                    collection.collections.sort((a, b) => a.name.localeCompare(b.name));
                }

                const ct = (collection: Collection) => {
                    let acc = 0;
                    for (const c of collection.collections) {
                        acc += ct(c);
                    }
                    acc += collection.games.length;
                    collection.game_ct = acc;
                    return acc;
                };
                ct(collections[0]);

                this.setState({ collections: collections });
            })
            .catch(errorAlerter);

        return promise;
    }

    setSortOrder = (order?: SortOrder) => {
        if (!order) {
            return;
        }

        if (this.state.sort_order === order) {
            this.toggleSortDirection();
        } else {
            this.setState({ sort_order: order });
            preferences.set("sgf.sort-order", order);
        }
    };

    getSortableClass = (order?: SortOrder) => {
        if (this.state.sort_order === order) {
            return "sortable " + (this.state.sort_descending ? "sorted-desc" : "sorted-asc");
        }
        return "sortable";
    };

    toggleSortDirection = () => {
        const descending = !this.state.sort_descending;
        this.setState({ sort_descending: descending });
        preferences.set("sgf.sort-descending", descending);
    };

    applyCurrentSort = (games: Entry[]) => {
        const sort = this.sortOrders[this.state.sort_order];
        games.sort(sort);
        if (this.state.sort_descending) {
            games.reverse();
        }
    };

    uploadSGFs = (files: File[]) => {
        if (parseInt(this.props.match.params.player_id) === data.get("user").id) {
            files = files.filter((file) => /.sgf$/i.test(file.name));
            Promise.all(files.map((file) => post(`me/games/sgf/${this.state.collection_id}`, file)))
                .then(() => {
                    this.refresh(this.props.match.params.player_id).then(ignore).catch(ignore);
                })
                .catch(errorAlerter);
        } else {
            console.log("Not uploading selected files since we're not on our own library page");
        }
    };

    uploadSGFText = (text: string, filename: string) => {
        if (parseInt(this.props.match.params.player_id) === data.get("user").id) {
            const file = new File([text], filename, {
                type: "application/x-go-sgf",
                lastModified: new Date().getTime(),
            });
            post(`me/games/sgf/${this.state.collection_id}`, file)
                .then(() => {
                    this.refresh(this.props.match.params.player_id).then(ignore).catch(ignore);
                })
                .catch(errorAlerter);
        } else {
            console.log("Not uploading selected files since we're not on our own library page");
        }
    };

    setCollection(collection_id: number) {
        browserHistory.push(`/library/${this.state.player_id}/${collection_id}`);
    }
    setCheckedGame(entry_id: number, event: React.ChangeEvent<HTMLInputElement>) {
        const new_games_checked = Object.assign({}, this.state.games_checked);
        if (event.target.checked) {
            (new_games_checked as any)[entry_id] = true;
        } else {
            delete (new_games_checked as any)[entry_id];
        }

        this.setState({
            games_checked: new_games_checked,
        });
    }
    setNewCollectionName = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ new_collection_name: ev.target.value });
    };
    setNewCollectionPrivate = (ev: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({ new_collection_private: ev.target.checked });
    };
    createCollection = () => {
        post(`library/${this.state.player_id}/collections`, {
            parent_id: this.state.collection_id,
            name: this.state.new_collection_name,
            private: this.state.new_collection_private ? 1 : 0,
        })
            .then(() => this.refresh(this.state.player_id))
            .catch(errorAlerter);

        this.setState({
            new_collection_name: "",
        });
    };
    deleteCollection = () => {
        const parent = this.state.collections![this.state.collection_id].parent;

        post(`library/${this.state.player_id}`, {
            delete_collections: [this.state.collection_id],
        })
            .then(() => {
                this.refresh(this.state.player_id)
                    .then(() => {
                        if (parent) {
                            this.setCollection(parent.id);
                        }
                    })
                    .catch(ignore);
            })
            .catch(errorAlerter);
    };
    deleteGames = () => {
        post(`library/${this.state.player_id}`, {
            delete_entries: Object.keys(this.state.games_checked),
        })
            .then(() => {
                this.refresh(this.state.player_id).then(ignore).catch(ignore);
            })
            .catch(errorAlerter);
        this.setState({ games_checked: {} });
    };
    toggleAllGamesChecked = () => {
        const collection = this.state.collections![this.state.collection_id];
        let all_games_checked = true;
        for (const g of collection.games) {
            if (!(g.entry_id in this.state.games_checked)) {
                all_games_checked = false;
                break;
            }
        }
        if (all_games_checked) {
            this.setState({ games_checked: {} });
        } else {
            const new_checked: any = {};
            for (const g of collection.games) {
                new_checked[g.entry_id] = true;
            }
            this.setState({ games_checked: new_checked });
        }
    };

    renderColumnHeaders(owner: boolean) {
        return (
            <div className="sort-header">
                {this.columns
                    .filter((col) => owner || !col.ownerOnly)
                    .map((column) => (
                        <span
                            key={column.title}
                            className={
                                column.sortable ? this.getSortableClass(column.order) : undefined
                            }
                            onClick={
                                column.sortable ? () => this.setSortOrder(column.order) : undefined
                            }
                        >
                            {column.title}
                        </span>
                    ))}
            </div>
        );
    }

    render() {
        const owner = this.state.player_id === data.get("user").id || null;
        if (this.state.collections == null) {
            return <div className="LibraryPlayer" />;
        }

        const bread_crumbs: any[] = [];
        const collection = this.state.collections[this.state.collection_id];
        if (!collection) {
            if (this.state.collection_id !== "0") {
                requestAnimationFrame(() => {
                    this.setState({ collection_id: "0" });
                });
            }
            return null;
        }

        this.applyCurrentSort(collection.games);

        if (!collection) {
            return (
                <div className="LibraryPlayer">
                    <h1>{_("This library collection doesn't exist or is private")}</h1>
                </div>
            );
        }

        let cur = collection;
        do {
            bread_crumbs.unshift(cur);
            if (cur.parent) {
                cur = cur.parent;
            } else {
                break;
            }
        } while (cur);

        let all_games_checked = true;
        for (const g of collection.games) {
            if (!(g.entry_id in this.state.games_checked)) {
                all_games_checked = false;
                break;
            }
        }

        const hasGames: boolean = collection.games.length > 0;
        const hasCollections: boolean = collection.collections.length > 0;

        return (
            <div className="LibraryPlayer container">
                <div className="space-between">
                    <div className="breadcrumbs">
                        {bread_crumbs.map((collection, idx) => (
                            <span
                                className="breadcrumb"
                                onClick={this.setCollection.bind(this, collection.id)}
                                key={idx}
                            >
                                {collection.name}/
                            </span>
                        ))}
                    </div>
                    {owner && (
                        <div className="new-collection flex center-vertically">
                            {Object.keys(this.state.games_checked).length === 0 && (
                                <div className="name-checkbox">
                                    <input
                                        type="text"
                                        value={this.state.new_collection_name}
                                        onChange={this.setNewCollectionName}
                                        placeholder={_("New collection name")}
                                    />
                                    <div className="row">
                                        <input
                                            type="checkbox"
                                            id="private"
                                            checked={this.state.new_collection_private}
                                            onChange={this.setNewCollectionPrivate}
                                        />
                                        <label htmlFor="private">
                                            <i className="fa fa-lock"></i>
                                            {_("Private collection")}
                                        </label>
                                    </div>
                                </div>
                            )}
                            {Object.keys(this.state.games_checked).length === 0 && (
                                <button
                                    className="primary"
                                    disabled={this.state.new_collection_name.trim() === ""}
                                    onClick={this.createCollection}
                                >
                                    {_("Create collection")}
                                </button>
                            )}
                            {Object.keys(this.state.games_checked).length > 0 && (
                                <button className="reject" onClick={this.deleteGames}>
                                    {_("Delete selected SGFs")}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <Dropzone
                    ref={(r) => {
                        if (r) {
                            this.dropzone = r;
                        }
                    }}
                    accept=".sgf"
                    onDrop={this.uploadSGFs}
                    multiple={true}
                    noClick
                >
                    {({ getRootProps, getInputProps }) => (
                        <section className="Dropzone">
                            <div {...getRootProps()}>
                                <input {...getInputProps()} />
                                <Card>
                                    {owner && (
                                        <div className="upload-button">
                                            {/*
                                            <button
                                                className="primary"
                                                onClick={() => {
                                                    createGameRecord({
                                                        library_collection_id: parseInt(
                                                            this.state.collection_id,
                                                        ),
                                                    });
                                                }}
                                            >
                                                {_("Record Game")}
                                            </button>
                                            */}
                                            <button
                                                className="primary"
                                                onClick={() =>
                                                    openSGFPasteModal(this.uploadSGFText)
                                                }
                                            >
                                                {_("Paste SGF")}
                                            </button>
                                            <button
                                                className="primary"
                                                onClick={() => this.dropzone?.open()}
                                            >
                                                {_("Upload")}
                                            </button>
                                        </div>
                                    )}

                                    {hasCollections && (
                                        <div className="collections">
                                            {collection.collections.map((collection) => (
                                                <div
                                                    key={collection.id}
                                                    className="collection-entry"
                                                    onClick={this.setCollection.bind(
                                                        this,
                                                        collection.id,
                                                    )}
                                                >
                                                    {owner && (
                                                        <span className="private-lock">
                                                            {collection["private"] ? (
                                                                <i className="fa fa-lock" />
                                                            ) : (
                                                                <i className="fa fa-unlock" />
                                                            )}
                                                        </span>
                                                    )}
                                                    <span className="collection">
                                                        {collection.name}/
                                                    </span>
                                                    <span className="game-count">
                                                        {interpolate(
                                                            _("{{library_collection_size}} games"),
                                                            {
                                                                library_collection_size:
                                                                    collection.game_ct,
                                                            },
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {hasCollections && <hr />}

                                    <div className="games">
                                        {hasGames && this.renderColumnHeaders(!!owner)}
                                        {owner && hasGames && (
                                            <div className="game-entry">
                                                <span className="select">
                                                    <input
                                                        type="checkbox"
                                                        checked={all_games_checked}
                                                        onChange={this.toggleAllGamesChecked}
                                                    />
                                                </span>
                                            </div>
                                        )}
                                        {collection.games.map((game) => (
                                            <div key={game.game_id} className="game-entry">
                                                {owner && (
                                                    <span className="select">
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                (this.state.games_checked as any)[
                                                                    game.entry_id
                                                                ] || false
                                                            }
                                                            onChange={this.setCheckedGame.bind(
                                                                this,
                                                                game.entry_id,
                                                            )}
                                                        />
                                                    </span>
                                                )}
                                                <span className="date-column">
                                                    {moment(game.started).format("ll")}
                                                </span>
                                                <span className="name-column">
                                                    <Link to={`/game/${game.game_id}`}>
                                                        {game.name}
                                                    </Link>
                                                </span>
                                                <span className="black-column">
                                                    <Player
                                                        user={game.black}
                                                        disableCacheUpdate={true}
                                                    />
                                                </span>
                                                <span className="white-column">
                                                    <Player
                                                        user={game.white}
                                                        disableCacheUpdate={true}
                                                    />
                                                </span>
                                                <span className="outcome-column">
                                                    {outcome_formatter(game)}
                                                </span>
                                                <span className="date-column">
                                                    {moment(game.created).format("ll")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    {!(hasCollections || hasGames) && (
                                        <div className="empty-text">
                                            <h3>{_("This SGF collection is empty.")}</h3>
                                            {owner && (
                                                <h4>
                                                    {_(
                                                        "Add some SGFs to this collection by dragging the SGF files here or using the 'Upload' button.",
                                                    )}
                                                </h4>
                                            )}
                                            {owner && (
                                                <button
                                                    className="reject"
                                                    onClick={this.deleteCollection}
                                                >
                                                    {_("Delete this collection")}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        </section>
                    )}
                </Dropzone>
            </div>
        );
    }
}

export const LibraryPlayer = rr6ClassShim(_LibraryPlayer);

function outcome_formatter(entry: Entry) {
    if (entry.outcome && entry.outcome !== "?") {
        let ret = "T";
        if (entry.white_lost && !entry.black_lost) {
            ret = "B";
        }
        if (!entry.white_lost && entry.black_lost) {
            ret = "W";
        }

        let outcome = getOutcomeTranslation(entry.outcome);
        if (/^[0-9.]+$/.test(outcome)) {
            outcome = parseFloat(outcome).toString();
        }

        ret += "+" + outcome;
        return ret;
    } else {
        return entry.outcome;
    }
}
