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
import { api1 } from "requests";
import { errorAlerter } from "misc";

interface Events {}

interface GameLibraryModalProperties {
    userLibrary: any;
    gameID: number;
}

export class GameLibraryModal extends Modal<Events, GameLibraryModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    addToLibrary = () => {
        //goto url endpoint that downloads the sgf file
        fetch(api1(`games/${this.props.gameID}/sgf`))
            .then((data) => {
                // data should contain the sgf file which is automatically downloaded when a user visits the same endpoint
                const file = data;
                console.log(file);
            })
            .catch(errorAlerter);

        // If im correct then we call post("me/games/sgf/%%", collection_id, file) to have this file saved to the given library
    };

    render() {
        const data: any = JSON.stringify(this.props.userLibrary);
        const json = JSON.parse(data);
        return (
            <div className="Modal GameLibraryModal">
                <div className="collection-list">
                    <h1>Libraries</h1>
                    {json.map((data, index) => (
                        <div className="collection-row" key={data.id}>
                            <span className="cell">
                                <i className="fa fa-book" />
                            </span>
                            <span className="cell">
                                <h1>{data[index]}</h1>
                            </span>
                            <span className="cell">
                                <button onClick={() => this.addToLibrary()}>add</button>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export function openGameLibraryModal(userLibrary: any, gameID: number): void {
    openModal(<GameLibraryModal userLibrary={userLibrary} gameID={gameID} fastDismiss />);
}
