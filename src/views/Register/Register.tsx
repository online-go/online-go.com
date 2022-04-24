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
import { Link } from "react-router-dom";
import * as data from "data";
import { _ } from "translate";
import { Card } from "material";
import { errorAlerter } from "misc";
import { post } from "requests";
import { get_ebi } from "SignIn";
import cached from "cached";

export class Register extends React.PureComponent<{}, any> {
    ref_username = React.createRef<HTMLInputElement>();
    ref_email = React.createRef<HTMLInputElement>();
    ref_password = React.createRef<HTMLInputElement>();

    constructor(props) {
        super(props);
        this.state = {};
    }

    register = (event) => {
        const actually_register = () => {
            console.log("Should be logging in");

            post("/api/v0/register", {
                username: this.ref_username.current.value.trim(),
                password: this.ref_password.current.value,
                email: this.ref_email.current.value.trim(),
                ebi: get_ebi(),
            })
                .then((config) => {
                    console.log("Logged in");
                    data.set(cached.config, config);

                    if (window.location.hash && window.location.hash[1] === "/") {
                        window.location.pathname = window.location.hash.substr(1);
                    } else {
                        window.location.pathname = "/";
                    }
                })
                .catch((err) => {
                    if (err.responseJSON && err.responseJSON.error_code === "banned") {
                        data.set("appeals.banned_user_id", err.responseJSON.banned_user_id);
                        data.set("appeals.jwt", err.responseJSON.jwt);
                        data.set("appeals.ban-reason", err.responseJSON.ban_reason);
                        window.location.pathname = "/appeal";
                        return;
                    }

                    if (err.responseJSON) {
                        console.log(err.responseJSON);
                        if (err.responseJSON.firewall_action === "COLLECT_VPN_INFORMATION") {
                            //console.error("VPN information collection requested");
                            window.location.pathname = "/blocked-vpn";
                        } else {
                            errorAlerter(err);
                        }
                    } else {
                        errorAlerter(err);
                    }
                });
        };

        const focus_empty = (focus_email?: boolean) => {
            if (this.ref_username.current.value.trim() === "" || !this.validateUsername()) {
                this.ref_username.current.focus();
                return true;
            }

            if (this.ref_username.current.value.trim() === "") {
                this.ref_username.current.focus();
                return true;
            }

            if (this.ref_password.current.value.trim() === "") {
                this.ref_password.current.focus();
                return true;
            }
            if (
                focus_email &&
                this.ref_email.current.value.trim() === "" &&
                this.ref_email.current !== document.activeElement
            ) {
                this.ref_email.current.focus();
                return true;
            }

            return false;
        };

        if (event.type === "click") {
            event.preventDefault();
            if (focus_empty()) {
                return false;
            }
            actually_register();
        }
        if (event.type === "keypress") {
            if (event.charCode === 13) {
                event.preventDefault();
                if (focus_empty(true)) {
                    return false;
                }
                actually_register();
            }
        }

        if (event.type === "click" || event.charCode === 13) {
            return false;
        }
    };

    validateUsername = () => {
        if (/@/.test(this.ref_username.current.value)) {
            $(this.ref_username.current).addClass("validation-error");
            this.setState({
                error: _(
                    "Your username will be publically visible, please do not use your email address here.",
                ),
            });
            this.ref_username.current.focus();
            return false;
        } else {
            if ($(this.ref_username.current).hasClass("validation-error")) {
                $(this.ref_username.current).removeClass("validation-error");
                this.setState({ error: null });
            }
        }
        return true;
    };

    render() {
        return (
            <div id="Register">
                <Card>
                    <h2>{_("Welcome new player!")}</h2>
                    <form name="login" autoComplete="on">
                        <label htmlFor="username">
                            {_("Username") /* translators: New account registration */}
                        </label>
                        <input
                            className="boxed"
                            id="username"
                            autoFocus
                            ref={this.ref_username}
                            name="username"
                            onKeyPress={this.register}
                            onChange={this.validateUsername}
                        />
                        {this.state.error && (
                            <div className="error-message">{this.state.error}</div>
                        )}
                        <label htmlFor="password">
                            {_("Password") /* translators: New account registration */}
                        </label>
                        <input
                            className="boxed"
                            id="password"
                            ref={this.ref_password}
                            type="password"
                            name="password"
                            onKeyPress={this.register}
                        />
                        <label htmlFor="email">
                            {_("Email (optional)") /* translators: New account registration */}
                        </label>
                        <input
                            className="boxed"
                            id="email"
                            ref={this.ref_email}
                            type="email"
                            name="email"
                            onKeyPress={this.register}
                        />
                        <div style={{ textAlign: "right", marginBottom: "1.0rem" }}>
                            <button className="primary" onClick={this.register}>
                                <i className="fa fa-sign-in" /> {_("Sign up")}
                            </button>
                        </div>
                    </form>

                    <div className="social-buttons">
                        <Link to="/sign-in" className="s btn md-icon">
                            <i className="email-icon fa fa-envelope-o" /> {_("Sign in with Email")}
                        </Link>
                        <a href="/login/google-oauth2/" className="s btn md-icon" target="_self">
                            <span className="google google-oauth2-icon" />{" "}
                            {_("Sign in with Google")}
                        </a>
                        <a href="/login/facebook/" className="s btn md-icon" target="_self">
                            <span className="facebook facebook-icon" /> {_("Sign in with Facebook")}
                        </a>
                        <a href="/login/twitter/" className="s btn md-icon" target="_self">
                            <i className="twitter twitter-icon fa fa-twitter" />
                            {_("Sign in with Twitter")}
                        </a>
                        <a href="/login/apple-id/" className="s btn md-icon" target="_self">
                            <i className="twitter apple-id-icon fa fa-apple" />
                            {_("Sign in with Apple")}
                        </a>
                    </div>
                </Card>
            </div>
        );
    }
}
