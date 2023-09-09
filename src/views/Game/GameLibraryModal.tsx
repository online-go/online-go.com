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
//import { get } from "requests";
//import * as data from "data";
//import { errorAlerter } from "misc";

interface Events {}

interface GameLibraryModalProperties {
    userLibrary: any;
}

export class GameLibraryModal extends Modal<Events, GameLibraryModalProperties, {}> {
    constructor(props) {
        super(props);
    }

    render() {
        const data: any = JSON.stringify(this.props.userLibrary);
        const json = JSON.parse(data);
        json.map((data) => {
            console.log(data[1]);
        });
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
                                <button>add</button>
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
}

export function openGameLibraryModal(userLibrary: any): void {
    openModal(<GameLibraryModal userLibrary={userLibrary} fastDismiss />);
}
