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

import * as data from "data";
import { get, put } from "requests";

import { Player } from "Player";

interface JosekiAdminProps {
    server_url: string;
}

interface JosekiAdminState {
    user_id: string;
    can_comment: boolean;
    can_edit: boolean;
    can_admin: boolean;
    throb: boolean;
}

export class JosekiPermissionsPanel extends React.PureComponent<
    JosekiAdminProps,
    JosekiAdminState
> {
    constructor(props: JosekiAdminProps) {
        super(props);
        this.state = {
            user_id: "",
            can_comment: false,
            can_edit: false,
            can_admin: false,
            throb: true, // we are actually waiting for them to type an ID.
        };
    }

    onUserIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const new_id = e.target.value;
        if (!/^\d*$/.test(new_id)) {
            return;
        } else {
            this.setState({ user_id: new_id });
        }

        this.setState({ throb: true });
        get(this.props.server_url + "permissions?id=" + e.target.value)
            .then((body) => {
                this.setState({
                    can_comment: body.can_comment,
                    can_edit: body.can_edit,
                    can_admin: body.can_admin,
                    throb: false,
                });
            })
            .catch((r) => {
                console.log("Permissions GET failed:", r);
            });
    };

    onCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.updatePermission("can_comment", e.target.checked);
    };

    onEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.updatePermission("can_edit", e.target.checked);
    };

    onAdminChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.updatePermission("can_admin", e.target.checked);
    };

    updatePermission = (permission: keyof JosekiAdminState, value: boolean) => {
        this.setState({
            [permission]: value,
            throb: true,
        } as any);

        const new_permissions: any = {
            can_comment: this.state.can_comment,
            can_edit: this.state.can_edit,
            can_admin: this.state.can_admin,
        };

        new_permissions[permission] = value;

        put(this.props.server_url + "permissions?id=" + this.state.user_id, new_permissions)
            .then((body) => {
                // Display the result of what happened
                console.log("permissions result", body);
                this.setState({ throb: false });
            })
            .catch((r) => {
                console.log("Permissions PUT failed:", r);
            });
    };

    render = () => {
        const protect_self = data.get("user").id === parseInt(this.state.user_id); // don't let people dis-admin themselves!

        return (
            <div className="joseki-permissions-panel">
                <div>User id:</div>
                <input value={this.state.user_id} onChange={this.onUserIdChange} />
                <Player user={parseInt(this.state.user_id)} />
                <div>comment</div>
                {this.state.throb ? (
                    <React.Fragment>
                        <input
                            type="checkbox"
                            checked={this.state.can_comment}
                            onChange={this.onCommentChange}
                            disabled={true}
                        />
                        <div>edit</div>
                        <input
                            type="checkbox"
                            checked={this.state.can_edit}
                            onChange={this.onEditChange}
                            disabled={true}
                        />
                        <div>admin</div>
                        <input
                            type="checkbox"
                            checked={this.state.can_admin}
                            onChange={this.onAdminChange}
                            disabled={true}
                        />
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <input
                            type="checkbox"
                            checked={this.state.can_comment}
                            onChange={this.onCommentChange}
                        />
                        <div>edit</div>
                        <input
                            type="checkbox"
                            checked={this.state.can_edit}
                            onChange={this.onEditChange}
                        />
                        <div>admin</div>
                        <input
                            type="checkbox"
                            checked={this.state.can_admin}
                            onChange={this.onAdminChange}
                            disabled={protect_self}
                        />
                    </React.Fragment>
                )}
            </div>
        );
    };
}
