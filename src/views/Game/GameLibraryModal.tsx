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
        const userLibrary: any = JSON.stringify(this.props.userLibrary);
        const userlibraryJSON = JSON.parse(userLibrary);
        this.setState({ collections: userlibraryJSON });
    }

    setGameName = (ev) => {
        this.setState({ gameName: ev.target.value });
    };

    setCollectionName = (ev) => {
        this.setState({ collectionName: ev.target.value });
    };

    resetTextFields = () => {
        this.setState({ gameName: "" });
        this.setState({ collectionName: "" });
    };

    async addToLibrary(collection) {
        const url = api1(`games/${this.props.gameID}/sgf`);
        await fetch(url, {
            method: "GET",
            // Specify the content-type of the request otherwise the "games/%%/sgf" endpoint will respond with a 415 error code
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => response.blob())
            .then((data) => {
                // Pull sgfName from value implemented by user setting a default value if empty
                let gameName = this.state.gameName;
                if (this.state.gameName === "") {
                    gameName = `My Game #${this.props.gameID}`;
                }
                const gameFile = new File([data as BlobPart], `${gameName}.sgf`, {
                    type: "application/x-go-sgf",
                    lastModified: new Date().getTime(),
                });
                // Create post request adding SGF File to the given collection using collection's id
                post("me/games/sgf/%%", collection[0], gameFile).catch(errorAlerter);
                this.resetTextFields();
                this.close(); // Closes modal after creating post request
            })
            .catch(errorAlerter);
    }

    async createCollection() {
        if (this.state.collectionName === "") {
            await this.setState({ collectionName: "My_Collection" });
        }
        // Create a new library within the user's libraries
        post("library/%%/collections", this.props.userID, {
            name: this.state.collectionName,
        })
            .then((res) => {
                // Pull the newly created collection's id to be used to identify which collection we add our SGF File too
                const collection_id = [res.collection_id];
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
                        className="file-name-inputfield"
                        type="text"
                        value={this.state.gameName}
                        onChange={this.setGameName}
                        placeholder={_("Insert SGF File Name")}
                    />
                    {/* If user has collections in their library map and render them. Otherwise; allow user to create collection */}
                    {this.state.collections.length > 0 ? (
                        this.state.collections.map((data) => (
                            <div className="collection-row" key={data.id}>
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
                            </span>
                            <span className="cell">
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
