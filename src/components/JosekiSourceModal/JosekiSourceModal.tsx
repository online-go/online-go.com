/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import * as ValidUrl from "valid-url";

import { _ } from "translate";
import { Modal } from "Modal";

interface Events {}

interface JosekiSourceModalProperties {
    add_joseki_source: any;
}

export class JosekiSourceModal extends Modal<Events, JosekiSourceModalProperties, any> {
    constructor(props) {
        super(props);

        this.state = {
            description: "",
            url: "",
        };
    }

    setDescription = (e) => {
        if (e.target.value.length < 45) {
            // none longer than this at josekipedia
            this.setState({ description: e.target.value });
        }
    };

    setUrl = (e) => {
        this.setState({ url: e.target.value });
    };

    saveNewJoseki = (e) => {
        this.props.add_joseki_source(this.state.description, this.state.url);
        this.close();
    };

    render() {
        const inputs_valid =
            (this.state.url.length === 0 || ValidUrl.isWebUri(this.state.url)) &&
            this.state.description.length > 8; // some basic sanity that they put something in

        return (
            <div className="Modal JosekiSourceModal" ref="modal">
                <div className="header">{_("New Joseki Source")}</div>
                <div className="description">
                    <div>{_("Source")}:</div>
                    <input value={this.state.description} onChange={this.setDescription} />
                </div>
                <div className="url">
                    <div>URL:</div>
                    <input value={this.state.url} onChange={this.setUrl} />
                </div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    {inputs_valid ? (
                        <button className="primary" onClick={this.saveNewJoseki}>
                            {_("Save")}
                        </button>
                    ) : (
                        <button>{_("Save")}</button>
                    )}
                </div>
            </div>
        );
    }
}
