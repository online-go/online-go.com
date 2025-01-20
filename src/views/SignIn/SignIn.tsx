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
import { Link } from "react-router-dom";
import * as data from "@/lib/data";
import { useNavigate, useSearchParams } from "react-router-dom";
import { _ } from "@/lib/translate";
import { Card } from "@/components/material";
import { errorAlerter, uuid } from "@/lib/misc";
import { post } from "@/lib/requests";
import cached from "@/lib/cached";
import { Md5 } from "ts-md5/dist/esm/md5";
import { useUser } from "@/lib/hooks";

import { SocialLoginButtons } from "@/components/SocialLoginButtons";

window.Md5 = Md5;
import { alert } from "@/lib/swal_config";
import { LoadingButton } from "@/components/LoadingButton";

/***
 * Setup a device UUID so we can logout other *devices* and not all other
 * tabs with our new logout-other-devices button
 */
export function get_device_id() {
    const device_id = data.set("device.uuid", data.get("device.uuid", uuid()));
    return device_id;
}

export function get_ebi() {
    const device_id = get_device_id();

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
    return (
        device_id + "." + screen_dims + "." + plugin_hash + "." + user_agent_hash + "." + tzoffset
    );
}

export function SignIn(): React.ReactElement {
    const user = useUser();
    const navigate = useNavigate();
    const [search] = useSearchParams();
    const [submitLoading, setSubmitLoading] = React.useState(false);
    const ref_username = React.useRef<HTMLInputElement>(null);
    const ref_password = React.useRef<HTMLInputElement>(null);

    if (!user.anonymous) {
        navigate("/");
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        if (submitLoading) {
            return;
        }
        const actually_login = () => {
            return post("/api/v0/login", {
                username: ref_username.current!.value.trim(),
                password: ref_password.current!.value,
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

                        //window.location.pathname = config.redirect + (window.location.hash || "");

                        //window.location = window.location.origin + config.redirect + "?next=/";
                        if (window.location.hash) {
                            window.location.href =
                                window.location.origin + config.redirect + window.location.hash;
                        } else {
                            window.location.href =
                                window.location.origin + config.redirect + "?next=/";
                        }
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

        if (ref_username.current?.value.trim() === "") {
            ref_username.current.focus();
            return;
        }
        if (ref_password.current?.value.trim() === "") {
            ref_password.current.focus();
            return;
        }

        try {
            setSubmitLoading(true);
            await actually_login();
        } finally {
            setSubmitLoading(false);
        }
    };

    const resetPassword = () => {
        void alert
            .fire({
                text: _("What is your username?"),
                input: "text",
                showCancelButton: true,
                inputValidator: (username): string | void => {
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
            {typeof search.get("login-error") === "string" ? (
                <h2 className="error">
                    <i className="fa fa-exclamation-triangle" />{" "}
                    <span>{_("An error occurred signing in, please try again")}</span>
                </h2>
            ) : null}

            <Card>
                <h2>{_("Sign in")}</h2>
                <form name="login" autoComplete="on" onSubmit={onSubmit}>
                    <label htmlFor="username">
                        {_("Username") /* translators: Provide username to sign in with */}
                    </label>
                    <input
                        className="boxed"
                        id="username"
                        autoFocus
                        ref={ref_username}
                        name="username"
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
                    />
                    <div className="form-actions">
                        <a onClick={resetPassword}>{_("Forgot password?")}</a>
                        <LoadingButton
                            type="submit"
                            className="primary"
                            style={{ whiteSpace: "nowrap" }}
                            loading={submitLoading}
                            icon={<i className="fa fa-sign-in" />}
                        >
                            {_("Sign in")}
                        </LoadingButton>
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
                <SocialLoginButtons
                    next_url={"/wait-for-user#" + window.location.hash.substring(1)}
                />
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
    );
}
