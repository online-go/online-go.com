/*
 * Copyright (C) 2012-2022  Online-Go.com
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
import { _ } from "translate";
import { post } from "requests";
import { errorAlerter } from "misc";
import { browserHistory } from "ogsHistory";

interface GroupCreateState {
    name: string;
    require_invitation: boolean;
    is_public: boolean;
    hide_details: boolean;
}

export class GroupCreate extends React.PureComponent<{}, GroupCreateState> {
    ref_name = React.createRef<HTMLInputElement>();

    constructor(props) {
        super(props);
        this.state = {
            name: "",
            require_invitation: false,
            is_public: true,
            hide_details: false,
        };
    }

    createGroup() {
        if (this.state.name.trim() !== "") {
            const group = {
                name: this.state.name,
                require_invitation: this.state.require_invitation,
                is_public: this.state.is_public,
                hide_details: this.state.hide_details,
            };
            post("groups/", group)
                .then((group) => {
                    browserHistory.push(`/group/${group.id}`);
                })
                .catch(errorAlerter);
        } else {
            this.ref_name.current.focus();
        }
    }

    set_name = (ev) => this.setState({ name: ev.target.value });
    set_is_public = (ev) => this.setState({ is_public: ev.target.checked });
    set_require_invitation = (ev) => this.setState({ require_invitation: ev.target.checked });
    set_hide_details = (ev) => this.setState({ hide_details: ev.target.checked });

    render() {
        return (
            <div className="GroupCreate">
                <div className="container" style={{ maxWidth: "42em", paddingTop: "5em" }}>
                    <div style={{ textAlign: "center" }}>
                        <h1>{_("Excellent, another group!")}</h1>
                        <p>
                            {_(
                                "To begin, please fill out some basic information about your group.",
                            )}
                        </p>
                    </div>
                    <div className="well">
                        <div className="form-horizontal" role="form">
                            <div className="form-group">
                                <label
                                    className="col-sm-5 control-label"
                                    htmlFor="group-create-name"
                                >
                                    {_("Group Name")}
                                </label>
                                <div className="col-sm-6">
                                    <input
                                        type="text"
                                        ref={this.ref_name}
                                        className="form-control"
                                        id="group-create-name"
                                        value={this.state.name}
                                        onChange={this.set_name}
                                        placeholder={_("Group Name")}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label
                                    className="col-sm-5 control-label"
                                    htmlFor="group-create-public"
                                >
                                    {_("Open to the public")}
                                </label>
                                <div className="col-sm-6">
                                    <div className="checkbox">
                                        <input
                                            type="checkbox"
                                            id="group-create-public"
                                            checked={this.state.is_public}
                                            onChange={this.set_is_public}
                                        />
                                    </div>
                                </div>
                            </div>
                            {(!this.state.is_public || null) && (
                                <div className="form-group">
                                    <label
                                        className="col-sm-5 control-label"
                                        htmlFor="group-create-disable-invitation"
                                    >
                                        {_("Disable invitation requests")}
                                    </label>
                                    <div className="col-sm-6">
                                        <div className="checkbox">
                                            <input
                                                type="checkbox"
                                                id="group-create-disable-invitation"
                                                checked={this.state.require_invitation}
                                                onChange={this.set_require_invitation}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="form-group">
                                <label
                                    className="col-sm-5 control-label"
                                    htmlFor="group-create-hide-details"
                                >
                                    {_("Hide details from non-members")}
                                </label>
                                <div className="col-sm-6">
                                    <div className="checkbox">
                                        <input
                                            type="checkbox"
                                            id="group-create-hide-details"
                                            checked={this.state.hide_details}
                                            onChange={this.set_hide_details}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="col-sm-5 control-label"></label>
                                <div className="col-sm-6">
                                    <button className="primary" onClick={() => this.createGroup()}>
                                        {_("Create your group!")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
