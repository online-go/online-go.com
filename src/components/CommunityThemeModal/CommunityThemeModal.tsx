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
//import * as ValidUrl from "valid-url";

import { _ } from "translate";
import { Modal } from "Modal";

interface Events {}

function jsonError(text: string): string {
    try {
        const j = JSON.parse(text);
        if (j) {
            return "";
        } // use j to stop typescript from complaining
    } catch (e) {
        return e.toString();
    }
}

interface CommunityThemeModalProperties {
    change_theme: any; // function params: description, jsontext, context , where "context" is whatever you like (in OGS it's "board" or "white", etc.)
    theme_context: any; // "board", "white", "black" -- whatever you set it to
    initial_json: string;
    caller: any;
}

export class CommunityThemeModal extends Modal<Events, CommunityThemeModalProperties, any> {
    constructor(props) {
        super(props);

        this.state = {
            description: "",
            json: "",
            maybeJSON: this.props.initial_json,
            errorText: "",
        };
    }

    setDescription = (e) => {
        if (e.target.value.length < 45) {
            this.setState({ description: e.target.value });
        }
    };

    setJSON = (e) => {
        const err = jsonError(this.state.MaybeJSON);
        this.setState({ maybeJSON: e.target.value, errorText: err });
    };

    saveTheme = () => {
        if (!jsonError(this.state.maybeJSON)) {
            this.props.change_theme(
                this.state.description,
                this.state.maybeJSON,
                this.props.theme_context,
                this.props.caller,
            );
        }
        this.close();
    };

    render() {
        const err = jsonError(this.state.maybeJSON);
        const inputs_valid =
            this.state.maybeJSON.length === 0 || (!err && this.state.description.length >= 0); // some basic sanity that they put something in

        return (
            <div className="Modal CommunityThemeModal" ref="modal">
                <div className="header">{_("Custom Community Theme")}</div>
                <div className="description">
                    <div>{_("Description")}:</div>
                    <input value={this.state.description} onChange={this.setDescription} />
                </div>
                <div className="json-code">
                    <div>JSON Code:</div>
                    <textarea defaultValue={this.state.maybeJSON} onChange={this.setJSON} />
                </div>
                <div className="json-errors">{_(err)}</div>
                <div className="buttons">
                    <button onClick={this.close}>{_("Cancel")}</button>
                    {inputs_valid ? (
                        <button className="primary" onClick={this.saveTheme}>
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
