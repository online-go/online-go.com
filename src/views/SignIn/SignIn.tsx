/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import * as data from "data";
import {_} from "translate";
import {Card} from "material";
import {LineText} from "misc-ui";
import {errorAlerter, ignore} from "misc";
import {post} from "requests";
import cached from 'cached';
import {Md5} from 'ts-md5/dist/md5';

window['Md5'] = Md5;
declare let swal;

export function get_bid() {
    let bid = data.get("bid") || `${Math.random()}`.split(".")[1];
    data.set("bid", bid);
    return bid;
}

export function get_ebi() {
    let bid = get_bid();

    let plugin_hash = "xxx";
    let user_agent_hash = "xxx";
    let screen_dims = "0.0.0.0";
    let tzoffset = "0";
    try {
        tzoffset = `${new Date().getTimezoneOffset() + 13}`;
        user_agent_hash = Md5.hashStr(navigator.userAgent) as string;
        screen_dims =
            (window.screen.width || 0) * 37 +
            1 +
            "." +
            ((window.screen.height || 0) * 17 + 3) +
            "." +
            /*window.screen.availLeft||*/ (0 * 7 + 5) +
            "." +
            /*window.screen.availTop||*/ (0 * 117 + 7);
        let plugin_string = "";
        try {
            for (let i = 0; i < navigator.plugins.length; ++i) {
                plugin_string += navigator.plugins[i].filename || "";
                plugin_string += navigator.plugins[i].description || "";
                plugin_string += navigator.plugins[i].name || "";
            }
        } catch (e) {
            console.error(e);
        }
        if (plugin_string !== "") {
            plugin_hash = Md5.hashStr(plugin_string) as string;
        }
    } catch (e) {
        console.error(e);
    }
    return bid + "." + screen_dims + "." + plugin_hash + "." + user_agent_hash + "." + tzoffset;
}

export class SignIn extends React.PureComponent<{}, any> {
    refs: {
        username: any;
        password: any;
    };

    constructor(props) {
        super(props);
        this.state = {};
        this.login = this.login.bind(this);
    }

    login(event) {
        let actually_login = () => {
            post("/api/v0/login", {
                "username": this.refs.username.value.trim(),
                "password": this.refs.password.value,
                "ebi": get_ebi()
            }).then((config) => {
                if ("redirect" in config) {
                    window.location.pathname = config.redirect;
                    return;
                }

                data.set(cached.config, config);
                if (window.location.hash && window.location.hash[1] === "/") {
                    window.location.pathname = window.location.hash.substr(1);
                } else {
                    window.location.pathname = "/";
                }
            }).catch(errorAlerter);
        };

        let focus_empty = () => {
            if (this.refs.username.value.trim() === "") {
                this.refs.username.focus();
                return true;
            }
            if (this.refs.password.value.trim() === "") {
                this.refs.password.focus();
                return true;
            }

            return false;
        };

        if (event.type === "click") {
            event.preventDefault();
            if (focus_empty()) {
                return false;
            }
            actually_login();
        }
        if (event.type === "keypress") {
            if (event.charCode === 13) {
                event.preventDefault();
                if (focus_empty()) {
                    return false;
                }
                actually_login();
            }
        }

        if (event.type === "click" || event.charCode === 13) {
            return false;
        }
    }

    resetPassword = () => {
        swal({
            text: _("What is your username?"),
            input: "text",
            showCancelButton: true
        })
            .then((username) => {
                post("/api/v0/reset", {username: username})
                    .then((res) => {
                        if (res.success) {
                            swal(_("An email with your new password has been emailed to you."));
                        } else {
                            console.error(res);
                            errorAlerter(res);
                        }
                    })
                    .catch(errorAlerter);
            })
            .catch(ignore);
    };

    render() {
        return (
            <div id="SignIn">
                <div>
                    <Card>
                        <h2>{_("Sign in")}</h2>
                        <form name="login" autoComplete="on">
                            <label htmlFor="username">{_("Username") /* translators: Provide username to sign in with */}</label>
                            <input className="boxed" id="username" autoFocus ref="username" name="username" onKeyPress={this.login} />
                            <label htmlFor="password">{_("Password") /* translators: Provide password to sign in with */}</label>
                            <input className="boxed" id="password" ref="password" type="password" name="password" onKeyPress={this.login} />
                            <div className="form-actions">
                                <a onClick={this.resetPassword}>{_("Forgot password?")}</a>
                                <button className="primary" onClick={this.login}>
                                    <i className="fa fa-sign-in" /> {_("Sign in")}
                                </button>
                            </div>
                        </form>

                        <LineText>{
                            _("or sign in using another account:") /* translators: username or password, or sign in with social authentication */
                        }</LineText>
                        <SocialLoginButtons />
                    </Card>

                    <div className="registration">
                        <h3>{_("New to Online-Go?")} </h3>
                        <div>
                            <Link to="/register" className="btn primary">
                                <b>{_("Register here!")/* translators: register for an account */}</b></Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}


export function SocialLoginButtons(): JSX.Element {
    return (
        <div className="social-buttons">
            <a href="/login/google-oauth2/" className="s btn md-icon" target="_self"><span className="google google-oauth2-icon" /> {_("Sign in with Google")}</a>
            <a href="/login/facebook/" className="s btn md-icon" target="_self"><span className="facebook facebook-icon" /> {_("Sign in with Facebook")}</a>
            <a href="/login/twitter/" className="s btn md-icon" target="_self"><i className="twitter twitter-icon fa fa-twitter" />{_("Sign in with Twitter")}</a>
            <a href="/login/apple-id/" className="s btn md-icon" target="_self"><i className="apple apple-id-icon fa fa-apple" />{_("Sign in with Apple")}</a>
        </div>
    );
}
