/*
 * Copyright (C) 2012-2019  Online-Go.com
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
import {_} from "translate";
import {put, get} from "requests";
import {errorAlerter, ignore} from "misc";
import {Modal, openModal} from "Modal";

interface Events {
}

interface ModerateUserProperties {
    playerId?: number;
}

declare var swal;

export class ModerateUser extends Modal<Events, ModerateUserProperties, any> {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            username: "...",
        };
    }

    componentWillMount() {
        get("players/%%/full", this.props.playerId)
        .then((dets) => {
            console.log(dets);
            this.setState(Object.assign({loading: false}, dets.user, {bot_owner: dets.user.bot_owner ? dets.user.bot_owner.id : null}));
        })
        .catch(errorAlerter);
    }

    save = () => {
        swal({
            text: _("Moderator note"),
            input: "text",
            showCancelButton: true,
        })
        .then((reason) => {
            if (!reason) {
                return;
            }

            this.close();

            let fields = [
                "is_bot", "is_banned", "is_shadowbanned",
                "bot_owner", "bot_ai", "username",
                "supporter", "username", "password", "email",
            ];

            let settings: any = {};
            for (let f of fields) {
                settings[f] = this.state[f];
            }

            settings.moderation_note = reason;

            put(`players/${this.props.playerId}/moderate`, settings)
            .then(() => {
                this.close();
            })
            .catch(errorAlerter);
        })
        .catch(ignore);
    }
    setLockedUsername = (ev) => this.setState({locked_username: ev.target.checked});
    setSupporter = (ev) => this.setState({supporter: ev.target.checked});
    setProfessional = (ev) => this.setState({professional: ev.target.checked});
    setBanned = (ev) => this.setState({is_banned: ev.target.checked});
    setShadowbanned = (ev) => this.setState({is_shadowbanned: ev.target.checked});
    setBot = (ev) => this.setState({is_bot: ev.target.checked});
    setBotOwner = (ev) => this.setState({bot_owner: parseInt(ev.target.value)});

    setUsername = (ev) => this.setState({username: ev.target.value});
    setEmail = (ev) => this.setState({email: ev.target.value});
    setPassword = (ev) => this.setState({password: ev.target.value});

    render() {
        let user = this.state;

        return (
            <div className="Modal ModerateUser" ref="modal">
                <div className="header">
                    <h1>{this.state.username}</h1>
                </div>
                {(this.state.loading === false || null) &&
                    <div className="body">
                        <div className="row">
                            <div className="col-sm-4">
                                <h3>Special Attributes</h3>
                                <dl className="horizontal left">
                                    <dt><label htmlFor="supporter">Supporter</label></dt>
                                    <dd><input id="supporter" type="checkbox" checked={user.supporter} onChange={this.setSupporter} /></dd>

                                    <dt><label htmlFor="banned">Banned</label></dt>
                                    <dd><input id="banned" type="checkbox" checked={user.is_banned} onChange={this.setBanned} /></dd>

                                    <dt><label htmlFor="shadowbanned">Shadowbanned</label></dt>
                                    <dd><input id="shadowbanned" type="checkbox" checked={user.is_shadowbanned} onChange={this.setShadowbanned} /></dd>

                                    <dt><label htmlFor="bot">Bot</label></dt>
                                    <dd>
                                        <input id="bot" type="checkbox" checked={user.is_bot} onChange={this.setBot} />
                                        {(user.is_bot || null) && <input type="number" style={{width: "7rem"}} placeholder="Bot owner" value={this.state.bot_owner || ""} onChange={this.setBotOwner} /> }
                                    </dd>
                                </dl>
                            </div>
                            <div className="col-sm-8">
                                <h3>Account Info</h3>
                                <dl className="horizontal right">
                                    {/* "search" is a hack to get lastpass to not autofill */}
                                    <dt><label htmlFor="user-search-name">Username</label></dt>
                                    <dd>
                                        <input type="text" id="user-search-name" value={user.username} onChange={this.setUsername} autoComplete="off"/>
                                    </dd>

                                    <dt><label htmlFor="email">Email</label></dt>
                                    <dd>
                                        <input type="text" id="email" value={user.email} onChange={this.setEmail} autoComplete="off"/>
                                    </dd>

                                    <dt><label htmlFor="password">Password</label></dt>
                                    <dd>
                                        <input type="text" id="password" value={user.password} onChange={this.setPassword} autoComplete="off"/>
                                    </dd>
                                </dl>
                            </div>
                        </div>
                    </div>
                }
                <div className="buttons">
                    <button onClick={this.close}>{_("Close")}</button>
                    {(this.state.loading === false || null) && <button onClick={this.save}>{_("Save")}</button>}
                </div>
            </div>
        );
    }
}

export function openModerateUserModal(user) { // TODO
    return openModal(<ModerateUser playerId={user.id} />);
}
