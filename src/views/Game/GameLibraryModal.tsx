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
import { openModal, Modal } from "Modal";
import { api1, post } from "requests";
import { errorAlerter } from "misc";
import { _ } from "translate";

interface Events {}

interface GameLibraryModalProperties {
    userID: number;
    userLibrary: any;
    gameID: number;
}

export class GameLibraryModal extends Modal<Events, GameLibraryModalProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            gameName: "",
            collectionName: "",
            collections: [],
        };
    }

    componentDidMount(): void {
        const data: any = JSON.stringify(this.props.userLibrary);
        const json = JSON.parse(data);
        this.setState({ collections: json });
    }

    setGameName = (ev) => {
        this.setState({ gameName: ev.target.value });
    };

    setCollectionName = (ev) => {
        this.setState({ collectionName: ev.target.value });
    };

    async addToLibrary(collection) {
        const url = api1(`games/${this.props.gameID}/sgf`);
        await fetch(url, {
            method: "GET",
            // Specifically set header otherwise 415 error
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.blob())
            .then((data) => {
                const sgfName = `${this.state.gameName}.sgf`;
                const gameFile = new File([data as BlobPart], sgfName, {
                    type: "application/x-go-sgf",
                    lastModified: new Date().getTime(),
                });
                this.setState({ gameName: "" });
                post("me/games/sgf/%%", collection[0], gameFile).catch(errorAlerter);
            })
            .catch(errorAlerter);
    }

    createCollection() {
        console.log("clicked!");
        post("library/%%/collections", this.props.userID, {
            name: this.state.collectionName,
        })
            .then((res) => {
                const collection_id = [res.collection_id];
                console.log("HERE " + collection_id);
                this.addToLibrary(collection_id).catch(errorAlerter);
            })
            .catch(errorAlerter);
    }

    render() {
        return (
            <div className="Modal GameLibraryModal">
                <div className="collection-list">
                    <h1>Libraries</h1>
                    <input
                        type="text"
                        value={this.state.gameName}
                        onChange={this.setGameName}
                        placeholder={_("Insert SGF File Name")}
                    />
                    {this.state.collections.length > 0 ? (
                        this.state.collections.map((data) => (
                            <div className="collection-row" key={data.id}>
                                <span className="cell">
                                    <i className="fa fa-book" />
                                </span>
                                <span className="cell">
                                    <h1>{data[1]}</h1>
                                </span>
                                <span className="cell">
                                    <button onClick={() => this.addToLibrary(data)}>add</button>
                                </span>
                            </div>
                        ))
                    ) : (
                        <div>
                            <span className="cell">
                                <input
                                    type="text"
                                    value={this.state.collectionName}
                                    onChange={this.setCollectionName}
                                    placeholder={_("Insert Collection Name")}
                                />
                                <button onClick={() => this.createCollection()}>
                                    Create Collection
                                </button>
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}

export function openGameLibraryModal(userID: number, userLibrary: any, gameID: number): void {
    openModal(
        <GameLibraryModal userID={userID} userLibrary={userLibrary} gameID={gameID} fastDismiss />,
    );
}
