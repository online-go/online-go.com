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
import {Link} from "react-router-dom";
import {browserHistory} from "ogsHistory";
import * as data from "data";
import {_} from "translate";
import {Card} from "material";
import {LineText} from "misc-ui";
import {errorAlerter, ignore} from "misc";
import {post, get} from "requests";

declare var swal;
declare function md5(str: string): string;

export function get_ebi() {
    let bid = data.get("bid") || `${Math.random()}`.split(".")[1];
    data.set("bid", bid);

    let plugin_hash = "xxx";
    let user_agent_hash = "xxx";
    let screen_dims = "0.0.0.0";
    let tzoffset = "0";
    try {
        tzoffset = `${(new Date().getTimezoneOffset() + 13)}`;
        user_agent_hash = md5(navigator.userAgent);
        screen_dims =
            ((window.screen.width || 0) * 37 + 1) + "." +
            ((window.screen.height || 0) * 17 + 3) + "." +
            ((/*window.screen.availLeft||*/0) * 7 + 5) + "." +
            ((/*window.screen.availTop||*/0) * 117 + 7);
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
            plugin_hash = md5(plugin_string);
        }
    } catch (e) {
        console.error(e);
    }
    return bid + "." + screen_dims + "." + plugin_hash + "." + user_agent_hash + "." +   tzoffset;
}

export class SignIn extends React.PureComponent<{}, any> {
    refs: {
        username: any;
        password: any;
    };

    constructor(props) {
        super(props);
        this.state = { };
        this.login = this.login.bind(this);
    }

    login(event) {
        let actually_login = () => {
            console.log("Should be logging in");

            post("/api/v0/login", {
                "username": this.refs.username.value.trim(),
                "password": this.refs.password.value,
                "ebi": get_ebi()
            }).then((config) => {
                if ("redirect" in config) {
                    window.location.pathname = config.redirect;
                    return;
                }

                data.set("config", config);
                console.log("Logged in!");
                console.info(config);
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
            showCancelButton: true,
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
    }

    render() {
        return (
        <div id="SignIn">
          <div>
            <Card>
            <h2>{_("Sign in")}</h2>
                <form name="login" autoComplete="on">
                    <input className="boxed" autoFocus ref="username" name="username" onKeyPress={this.login} placeholder={_("Username") /* translators: Provide username to sign in with */} />
                    <input className="boxed" ref="password" type="password" name="password" onKeyPress={this.login} placeholder={_("Password") /* translators: Provide password to sign in with */} />
                    <div style={{textAlign: "right", marginBottom: "1.0rem"}}>
                        <button className="primary" onClick={this.login}>
                            <i className="fa fa-sign-in"/> {_("Sign in")}
                        </button>
                    </div>
                </form>

                <div className="social-buttons">
                    <LineText>{
                        _("or sign in with") /* translators: username or password, or sign in with social authentication */
                    }</LineText>
                    <a className="zocial google icon"
                        href="/login/google-oauth2/" target="_self">Google</a>
                    <a className="zocial facebook icon"
                        href="/login/facebook/" target="_self">Facebook</a>
                    <a className="zocial twitter icon"
                        href="/login/twitter/" target="_self">Twitter</a>
                </div>
            </Card>

            <div className="registration">
                <h3>{_("New to Online-Go?")} </h3>
                <div>
                <Link to="/register" className="btn primary">
                <b>{_("Register here!")/* translators: register for an account */}</b></Link>
                </div>
            </div>

            <hr/>

            <div className="registration">
                {_("Forgot your password?")} <button className="sm" onClick={this.resetPassword} >{_("Click here!")}</button>
            </div>
          </div>
        </div>
        );
    }
}
