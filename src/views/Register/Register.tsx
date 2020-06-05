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
import {errorAlerter} from "misc";
import {LineText} from "misc-ui";
import {post} from "requests";
import {get_ebi} from "SignIn";
import cached from 'cached';

export class Register extends React.PureComponent<{}, any> {
    refs: {
        username: any;
        email: any;
        password: any;
    };

    constructor(props) {
        super(props);
        this.state = {};
    }

    register = event => {
        let actually_register = () => {
            console.log("Should be logging in");

            post("/api/v0/register", {
                "username": this.refs.username.value.trim(),
                "password": this.refs.password.value,
                "email": this.refs.email.value.trim(),
                "ebi": get_ebi()
            }).then((config) => {
                data.set(cached.config, config);

                if (window.location.hash && window.location.hash[1] === "/") {
                    window.location.pathname = window.location.hash.substr(1);
                } else {
                    window.location.pathname = "/";
                }
            }).catch(errorAlerter);
        };

        let focus_empty = (focus_email?: boolean) => {
            if (this.refs.username.value.trim() === "" || !this.validateUsername()) {
                this.refs.username.focus();
                return true;
            }

            if (this.refs.username.value.trim() === "") {
                this.refs.username.focus();
                return true;
            }

            if (this.refs.password.value.trim() === "") {
                this.refs.password.focus();
                return true;
            }
            if (
                focus_email &&
                this.refs.email.value.trim() === "" &&
                this.refs.email !== document.activeElement
            ) {
                this.refs.email.focus();
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
    }

    validateUsername = (ev?) => {
        if (/@/.test(this.refs.username.value)) {
            $(this.refs.username).addClass("validation-error");
            this.setState({"error": _("Your username will be publically visible, please do not use your email address here.")});
            this.refs.username.focus();
            return false;
        } else {
            if ($(this.refs.username).hasClass("validation-error")) {
                $(this.refs.username).removeClass("validation-error");
                this.setState({"error": null});
            }
        }
        return true;
    }

    render() {
        return (
            <div id="Register">
                <Card>
                    <h2>{_("Welcome new player!")}</h2>
                    <form name="login" autoComplete="on">
                        <label htmlFor="username">{_("Username") /* translators: New account registration */}</label>
                        <input className="boxed" id="username" autoFocus ref="username" name="username" onKeyPress={this.register} onChange={this.validateUsername} />
                        {this.state.error && <div className="error-message">{this.state.error}</div>}
                        <label htmlFor="password">{_("Password") /* translators: New account registration */}</label>
                        <input className="boxed" id="password" ref="password" type="password" name="password" onKeyPress={this.register} />
                        <label htmlFor="email">{_("Email (optional)") /* translators: New account registration */}</label>
                        <input className="boxed" id="email" ref="email" type="email" name="email" onKeyPress={this.register} />
                        <div style={{textAlign: "right", marginBottom: "1.0rem"}}>
                            <button className="primary" onClick={this.register}>
                                <i className="fa fa-sign-in" /> {_("Sign up")}
                            </button>
                        </div>
                    </form>

                    <div className="social-buttons">
                        <LineText>{
                            _("or log in to your account:") /* translators: username or password, or sign in to your account */
                        }</LineText>
                        <Link to="/sign-in" className="s btn md-icon"><i className='email-icon fa fa-envelope-o' /> {_("Login with Email")}</Link>
                        <a href="/login/google-oauth2/" className="s btn md-icon" target="_self"><span  className="google google-icon" /> {_("Login with Google")}</a>
                        <a href="/login/facebook/" className="s btn md-icon" target="_self"><span className="facebook facebook-icon" /> {_("Login with Facebook")}</a>
                        <a href="/login/twitter/" className="s btn md-icon" target="_self"><i className="twitter twitter-icon fa fa-twitter" />{_("Login with Twitter")}</a>
                    </div>
                </Card>
            </div>
        );
    }
}
