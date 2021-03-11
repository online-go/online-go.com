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
import * as data from "data";
import {_, pgettext, interpolate} from "translate";
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import {PlayerAutocomplete} from "PlayerAutocomplete";
import {abort_requests_in_flight, del, put, post, get} from "requests";
import {errorAlerter, ignore, getOutcomeTranslation} from "misc";
import {Player} from "Player";
import {Card} from "material";
import * as Dropzone from "react-dropzone";
import * as moment from "moment";

interface LibraryPlayerProperties {
    match: {
        params: any
    };
}

export class LibraryPlayer extends React.PureComponent<LibraryPlayerProperties, any> {
    refs: {
        dropzone;
    };

    constructor(props) {
        super(props);

        this.state = {
            player_id: parseInt(this.props.match.params.player_id),
            collection_id: this.props.match.params.collection_id || 0,
            collections: null,
            games_checked: {},
            new_collection_name: "",
            new_collection_private: false,
        };
    }

    componentDidMount() {
        this.refresh(this.state.player_id).then(ignore).catch(ignore);
    }
    UNSAFE_componentWillReceiveProps(next_props) {
        let update: any = {};

        if (this.props.match.params.player_id !== next_props.match.params.player_id) {
            this.refresh(parseInt(next_props.match.params.player_id)).then(ignore).catch(ignore);
            update.player_id = parseInt(next_props.match.params.player_id);
            update.games_checked = {};
        }

        if (next_props.match.params.collection_id) {
            if (this.props.match.params.collection_id !== next_props.match.params.collection_id) {
                update.collection_id = parseInt(next_props.match.params.collection_id);
                update.games_checked = {};
            }
        } else {
            update.collection_id = 0;
            update.games_checked = {};
        }

        this.setState(update);
    }
    componentWillUnmount() {
        abort_requests_in_flight("library/");
    }
    refresh(player_id: number) {
        let promise = get("library/%%", player_id);

        promise
        .then((library) => {
            let collections = {};

            let root = {
                id: 0,
                name: "",
                "private": "",
                parent_id: 0,
                parent: null,
                collections: [],
                games: [],
            };

            collections[0] = root;

            for (let c of library.collections) {
                let collection = {
                    id: c[0],
                    name: c[1],
                    "private": c[2],
                    parent_id: c[3] || 0,
                    collections: [],
                    games: [],
                };
                collections[collection.id] = collection;
            }

            for (let id in collections) {
                if (id === "0") {
                    continue;
                }

                collections[id].parent = collections[collections[id].parent_id];
                collections[id].parent.collections.push(collections[id]);
            }

            for (let g of library.games) {
                let game = {
                    "entry_id": g[0],
                    "game_id": g[1],
                    "collection_id": g[2],
                    "collection": collections[g[2] || 0],
                    "created": g[3],
                    "started": g[4],
                    "ended": g[5],
                    "name": g[6].trim() || ("#" + g[1]),
                    "starred": g[7],
                    "notes": g[8],

                    "black": {
                        "id": g[9],
                        "username": g[10],
                        "ranking": g[11],
                        "professional": g[12],
                    },
                    "white": {
                        "id": g[13],
                        "username": g[14],
                        "ranking": g[15],
                        "professional": g[16],
                    },
                    "black_lost": g[17],
                    "white_lost": g[18],
                    "outcome": g[19],
                };

                game.collection.games.push(game);
            }

            for (let collection_id in collections) {
                let collection = collections[collection_id];
                collection.collections.sort((a, b) => a.name.localeCompare(b));
                collection.games.sort((a, b) => a.name.localeCompare(b));
            }

            let ct = (collection) => {
                let acc = 0;
                for (let c of collection.collections) {
                    acc += ct(c);
                }
                acc += collection.games.length;
                collection.game_ct = acc;
                return acc;
            };
            ct(collections[0]);

            this.setState({collections: collections});
        })
        .catch(errorAlerter);

        return promise;
    }

    uploadSGFs = (files) => {
        if (parseInt(this.props.match.params.player_id) === data.get("user").id) {
            files = files.filter((file) => /.sgf$/i.test(file.name));
            Promise.all(files.map((file) => post("me/games/sgf/%%", this.state.collection_id, file)))
            .then(() => {
                this.refresh(this.props.match.params.player_id).then(ignore).catch(ignore);
            })
            .catch(errorAlerter);
        } else {
            console.log("Not uploading selected files since we're not on our own library page");
        }
    }

    setCollection(collection_id) {
        browserHistory.push(`/library/${this.state.player_id}/${collection_id}`);
    }
    setCheckedGame(entry_id, event) {
        let new_games_checked = Object.assign({}, this.state.games_checked);
        if (event.target.checked) {
            new_games_checked[entry_id] = true;
        } else {
            delete new_games_checked[entry_id];
        }

        this.setState({
            games_checked: new_games_checked
        });
    }
    setNewCollectionName = (ev) => {
        this.setState({new_collection_name: ev.target.value});
    }
    setNewCollectionPrivate = (ev) => {
        this.setState({new_collection_private: ev.target.checked});
    }
    createCollection = () => {

        post("library/%%/collections", this.state.player_id, {
            "parent_id": this.state.collection_id,
            "name": this.state.new_collection_name,
            "private": this.state.new_collection_private ? 1 : 0,
        })
        .then(() => this.refresh(this.state.player_id))
        .catch(errorAlerter);

        this.setState({
            new_collection_name: ""
        });
    }
    deleteCollection = () => {
        let parent = this.state.collections[this.state.collection_id].parent;
        post("library/%%", this.state.player_id, {
            delete_collections: [this.state.collection_id]
        })
        .then(() => {
            this.refresh(this.state.player_id)
            .then(() => this.setCollection(parent.id))
            .catch(ignore);
        })
        .catch(errorAlerter);
    }
    deleteGames = () => {
        post("library/%%", this.state.player_id, {
            delete_entries: Object.keys(this.state.games_checked)
        })
        .then(() => {
            this.refresh(this.state.player_id).then(ignore).catch(ignore);
        })
        .catch(errorAlerter);
        this.setState({"games_checked": {}});
    }
    toggleAllGamesChecked = () => {
        let collection = this.state.collections[this.state.collection_id];
        let all_games_checked = true;
        for (let g of collection.games) {
            if (!(g.entry_id in this.state.games_checked)) {
                all_games_checked = false;
                break;
            }
        }
        if (all_games_checked) {
            this.setState({games_checked: {}});
        } else {
            let new_checked = {};
            for (let g of collection.games) {
                new_checked[g.entry_id] = true;
            }
            this.setState({games_checked: new_checked});
        }
    }

    render() {
        let owner = this.state.player_id === data.get("user").id || null;
        if (this.state.collections == null) {
            return <div className="LibraryPlayer"/>;
        }

        let bread_crumbs = [];
        let collection = this.state.collections[this.state.collection_id];

        if (!collection) {
            return <div className="LibraryPlayer"><h1>{_("This library collection doesn't exist or is private")}</h1></div>;
        }

        let cur = collection;
        do {
            bread_crumbs.unshift(cur);
            cur = cur.parent;
        } while (cur);

        let all_games_checked = true;
        for (let g of collection.games) {
            if (!(g.entry_id in this.state.games_checked)) {
                all_games_checked = false;
                break;
            }
        }

        return (
            <div className="LibraryPlayer container">
                <div className="space-between">
                    <div className="breadcrumbs">
                        {bread_crumbs.map((collection, idx) => (
                            <span className="breadcrumb" onClick={this.setCollection.bind(this, collection.id)} key={idx}>
                                {collection.name}/
                            </span>
                        ))}
                    </div>
                    {owner &&
                        <div className="new-collection flex center-vertically">
                            {(Object.keys(this.state.games_checked).length === 0 || null) &&
                                <div className="name-checkbox">
                                    <input type="text" value={this.state.new_collection_name} onChange={this.setNewCollectionName} placeholder={_("New collection name")} />
                                    <div className="row">
                                        <input type="checkbox" id="private" checked={this.state.new_collection_private} onChange={this.setNewCollectionPrivate} />
                                        <label htmlFor="private"><i className="fa fa-lock"></i>{_("Private collection")}</label>
                                    </div>
                                </div>
                            }
                            {(Object.keys(this.state.games_checked).length === 0 || null) &&
                                <button className="primary" disabled={this.state.new_collection_name.trim() === ""} onClick={this.createCollection}>{_("Create collection")}</button>
                            }
                            {(Object.keys(this.state.games_checked).length > 0 || null) &&
                                <button className="reject" onClick={this.deleteGames}>{_("Delete selected SGFs")}</button>
                            }
                        </div>
                    }
                </div>



                <Dropzone ref="dropzone" className="Dropzone" accept=".sgf" onDrop={this.uploadSGFs} multiple={true} disableClick>
                    <Card>

                        {owner &&
                            <div className="upload-button">
                                <button className="primary" onClick={() => this.refs.dropzone.open()}>{_("Upload")}</button>
                            </div>
                        }

                        {(collection.collections.length > 0 || null) &&
                            <div className="collections">
                                {collection.collections.map((collection, idx) => (
                                    <div key={idx} className="collection-entry"  onClick={this.setCollection.bind(this, collection.id)}>
                                        {owner &&
                                            <span className="private-lock">
                                                {collection["private"] ? <i className="fa fa-lock" /> : <i className="fa fa-unlock" /> }
                                            </span>
                                        }
                                        <span className="collection">
                                            {collection.name}/
                                        </span>
                                        <span className="game-count">{interpolate(_("{{library_collection_size}} games"), {library_collection_size: collection.game_ct})}</span>
                                    </div>
                                ))}
                            </div>
                        }
                        {(collection.collections.length > 0 || null) &&
                            <hr/>
                        }

                        <div className="games">
                            {owner && (collection.games.length > 0 || null) &&
                                <div className="game-entry">
                                    <span className="select"><input type="checkbox" checked={all_games_checked} onChange={this.toggleAllGamesChecked} /></span>
                                </div>
                            }
                            {collection.games.map((game, idx) => (
                                <div key={idx} className="game-entry">
                                    {owner &&
                                        <span className="select"><input type="checkbox" checked={this.state.games_checked[game.entry_id] || false} onChange={this.setCheckedGame.bind(this, game.entry_id)} /></span>
                                    }
                                    <span className="date">{moment(game.started).format("ll")}</span>
                                    <span className="name"><Link to={`/game/${game.game_id}`}>{game.name}</Link></span>
                                    <span className="black"><Player user={game.black} disableCacheUpdate={true}/></span>
                                    <span className="white"><Player user={game.white} disableCacheUpdate={true}/></span>
                                    <span className="outcome">{outcome_formatter(game)}</span>
                                </div>
                            ))}
                        </div>

                        {((collection.games.length === 0 && collection.collections.length === 0) || null) &&
                            <div className="empty-text">
                                <h3>{_("This SGF collection is empty.")}</h3>
                                {owner &&
                                    <h4>{_("Add some SGFs to this collection by dragging the SGF files here or using the 'Upload' button.")}</h4>
                                }
                                {owner &&
                                    <button className="reject" onClick={this.deleteCollection}>{_("Delete this collection")}</button>
                                }
                            </div>
                        }


                    </Card>
                </Dropzone>
            </div>
        );
    }
}

function outcome_formatter(entry) {
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
