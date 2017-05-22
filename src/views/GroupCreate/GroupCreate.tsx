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
import {_, pgettext, interpolate} from "translate";
import {post, get} from "requests";
import {EventEmitterPureComponent} from "EventEmitterPureComponent";
import {browserHistory} from "react-router";

declare var swal;

interface GroupCreateProperties {
}

export class GroupCreate extends EventEmitterPureComponent<GroupCreateProperties, any> {
    refs: {
        name
    };

    constructor(props) {
        super(props);
        this.state = {
            group: {
                name: "",
                require_invitation: false,
                is_public: true,
                hide_details: false,
            }
        };
    }

    createGroup() {
        if (this.state.group.name.trim() !== "") {
            console.info(this.state.group);
            post("groups/", this.state.group)
            .then((group) => {
                browserHistory.push(`/group/${group.id}`);
            })
            .catch((err) => {
                swal(_("Error creating group"), JSON.parse(err.responseText).error);
            });
        } else {
            this.refs.name.focus();
        }
    }

    render() {
        return (
        <div className="GroupCreate">
            <div className="container" style={{maxWidth: "42em", paddingTop: "5em"}}>

                <div style={{textAlign: "center"}}>
                    <h1>{_("Excellent, another group!")}</h1>
                    <p>{_("To begin, please fill out some basic information about your group.")}</p>
                </div>
                <div className="well">
                    <div className="form-horizontal" role="form">
                        <div className="form-group">
                            <label className="col-sm-5 control-label" htmlFor="group-create-name">{_("Group Name")}</label>
                            <div className="col-sm-6">
                                <input type="text" ref="name" className="form-control" id="group-create-name" value={this.state.group.name} onChange={(ev) => this.upstate("group.name", ev)} placeholder={_("Group Name")}/>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-sm-5 control-label" htmlFor="group-create-public">{_("Open to the public")}</label>
                            <div className="col-sm-6">
                                <div className="checkbox">
                                    <input type="checkbox" id="group-create-public" checked={this.state.group.is_public} onChange={(ev) => this.upstate("group.is_public", ev)}/>
                                </div>
                            </div>
                        </div>
                        {(!this.state.group.is_public || null) &&
                            <div className="form-group">
                                <label className="col-sm-5 control-label" htmlFor="group-create-disable-invitation">{_("Disable invitation requests")}</label>
                                <div className="col-sm-6">
                                    <div className="checkbox">
                                        <input type="checkbox" id="group-create-disable-invitation" checked={this.state.group.require_invitation} onChange={(ev) => this.upstate("group.require_invitation", ev)}/>
                                    </div>
                                </div>
                            </div>
                        }
                        <div className="form-group">
                            <label className="col-sm-5 control-label" htmlFor="group-create-hide-details">{_("Hide details from non-members")}</label>
                            <div className="col-sm-6">
                                <div className="checkbox">
                                    <input type="checkbox" id="group-create-hide-details" checked={this.state.group.hide_details} onChange={(ev) => this.upstate("group.hide_details", ev)}/>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="col-sm-5 control-label"></label>
                            <div className="col-sm-6">
                                <button className="primary" onClick={() => (this.createGroup())}>{_("Create your group!")}</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        );
    }
}
