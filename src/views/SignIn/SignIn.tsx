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
import { useNavigate } from "react-router-dom";
import { _ } from "translate";
import { Card } from "material";
import { errorAlerter } from "misc";
import { post } from "requests";
import cached from "cached";
import { Md5 } from "ts-md5/dist/md5";
import { useUser } from "hooks";

import { SocialLoginButtons } from "SocialLoginButtons";

window["Md5"] = Md5;
import { alert } from "swal_config";

export function get_bid() {
    const bid = data.get("bid") || `${Math.random()}`.split(".")[1];
    data.set("bid", bid);
    return bid;
}

export function get_ebi() {
    const bid = get_bid();

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

export function SignIn(): JSX.Element {
    const user = useUser();
    const navigate = useNavigate();
    const ref_username = React.useRef<HTMLInputElement>(null);
    const ref_password = React.useRef<HTMLInputElement>(null);

    if (!user.anonymous) {
        navigate("/");
    }

    const login = (
        event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>,
    ) => {
        const actually_login = () => {
            post("/api/v0/login", {
                username: ref_username.current.value.trim(),
                password: ref_password.current.value,
                ebi: get_ebi(),
            })
                .then((config) => {
                    data.remove("appeals.banned_user_id");
                    data.remove("appeals.jwt");
                    data.remove("appeals.ban-reason");

                    if ("redirect" in config) {
                        // The username/password supplied is not valid, but the server can detect that the person might have a valid SSO,
                        // in which case it asks us to redirect to SSO, for them to sign in.

                        // We need to retain any info in location.hash, because it can also have a ChallengeLink redirect
                        // to be honoured after login!

                        window.location.pathname = config.redirect + (window.location.hash || "");
                        return;
                    }
                    data.set(cached.config, config);

                    // Note: this causes a page reload, and the new user is set up from scratch in the process
                    if (window.location.hash && window.location.hash[1] === "/") {
                        const next_page = window.location.hash.substring(1);
                        window.location.pathname = next_page;
                    } else {
                        window.location.pathname = "/";
                    }
                })
                .catch((response) => {
                    if (response.responseJSON && response.responseJSON.error_code === "banned") {
                        data.set("appeals.banned_user_id", response.responseJSON.banned_user_id);
                        data.set("appeals.jwt", response.responseJSON.jwt);
                        data.set("appeals.ban-reason", response.responseJSON.ban_reason);
                        window.location.pathname = "/appeal";
                    } else {
                        errorAlerter(response);
                    }
                });
        };

        const focus_empty = () => {
            if (ref_username.current.value.trim() === "") {
                ref_username.current.focus();
                return true;
            }
            if (ref_password.current.value.trim() === "") {
                ref_password.current.focus();
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
            if ((event as any).charCode === 13) {
                event.preventDefault();
                if (focus_empty()) {
                    return false;
                }
                actually_login();
            }
        }

        if (event.type === "click" || (event as any).charCode === 13) {
            return false;
        }
    };

    const resetPassword = () => {
        void alert
            .fire({
                text: _("What is your username?"),
                input: "text",
                showCancelButton: true,
                inputValidator: (username) => {
                    if (!username) {
                        return _("Please supply a username!");
                    }
                },
            })
            .then(({ value: username, isConfirmed }) => {
                if (isConfirmed) {
                    post("/api/v0/reset", { username: username })
                        .then((res) => {
                            if (res.success) {
                                void alert.fire(
                                    _("An email with your new password has been emailed to you."),
                                );
                            } else {
                                console.error(res);
                                errorAlerter(res);
                            }
                        })
                        .catch(errorAlerter);
                }
            });
    };

    return (
        <div id="SignIn">
            <div>
                <Card>
                    <h2>{_("Sign in")}</h2>
                    <form name="login" autoComplete="on">
                        <label htmlFor="username">
                            {_("Username") /* translators: Provide username to sign in with */}
                        </label>
                        <input
                            className="boxed"
                            id="username"
                            autoFocus
                            ref={ref_username}
                            name="username"
                            onKeyPress={login}
                            autoCapitalize="off"
                        />
                        <label htmlFor="password">
                            {_("Password") /* translators: Provide password to sign in with */}
                        </label>
                        <input
                            className="boxed"
                            id="password"
                            ref={ref_password}
                            type="password"
                            name="password"
                            onKeyPress={login}
                        />
                        <div className="form-actions">
                            <a onClick={resetPassword}>{_("Forgot password?")}</a>
                            <button className="primary" onClick={login}>
                                <i className="fa fa-sign-in" /> {_("Sign in")}
                            </button>
                        </div>
                    </form>

                    <hr />
                    <span>
                        {
                            _(
                                "or sign in using another account:",
                            ) /* translators: username or password, or sign in with social authentication */
                        }
                    </span>
                    <SocialLoginButtons next_url={window.location.hash.substring(1)} />
                </Card>

                <div className="registration">
                    <h3>{_("New to Online-Go?")} </h3>
                    <div>
                        <Link to="/register" className="btn primary">
                            <b>{_("Register here!") /* translators: register for an account */}</b>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
