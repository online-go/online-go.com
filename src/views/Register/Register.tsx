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
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { _, pgettext } from "translate";
import { Card } from "material";
import { errorAlerter } from "misc";
import { post } from "requests";
import { get_ebi } from "SignIn";
import { useUser } from "hooks";
import cached from "cached";

import { SocialLoginButtons } from "SocialLoginButtons";

export function Register(): JSX.Element {
    const navigate = useNavigate();
    const user = useUser();
    const ref_username = React.useRef<HTMLInputElement>(null);
    const ref_email = React.useRef<HTMLInputElement | null>(null);
    const ref_password = React.useRef<HTMLInputElement | null>(null);
    const [error, setError] = React.useState<string>();

    if (!user.anonymous) {
        navigate("/");
    }

    const register = (
        event: React.MouseEvent | React.KeyboardEvent | React.TouchEvent | React.PointerEvent,
    ): boolean | void => {
        const actually_register = () => {
            post("/api/v0/register", {
                username: ref_username.current?.value.trim(),
                password: ref_password.current?.value,
                email: ref_email.current?.value.trim(),
                ebi: get_ebi(),
            })
                .then((config) => {
                    data.set(cached.config, config);

                    // Note: this causes a page reload, and the new user is set up from scratch in the process
                    if (window.location.hash && window.location.hash[1] === "/") {
                        window.location.pathname = window.location.hash.substring(1);
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
            if (!ref_username.current || !ref_password.current || !ref_email.current) {
                return false;
            }

            if (ref_username.current.value.trim() === "" || !validateUsername()) {
                ref_username.current.focus();
                return true;
            }

            if (ref_username.current.value.trim() === "") {
                ref_username.current.focus();
                return true;
            }

            if (ref_password.current.value.trim() === "") {
                ref_password.current.focus();
                return true;
            }
            if (
                focus_email &&
                ref_email.current.value.trim() === "" &&
                ref_email.current !== document.activeElement
            ) {
                ref_email.current.focus();
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
            if ((event as React.KeyboardEvent).charCode === 13) {
                event.preventDefault();
                if (focus_empty(true)) {
                    return false;
                }
                actually_register();
            }
        }

        if (event.type === "click" || (event as React.KeyboardEvent).charCode === 13) {
            return false;
        }

        return;
    };

    const validateUsername = () => {
        if (!ref_username.current) {
            return false;
        }

        if (/@/.test(ref_username.current.value)) {
            $(ref_username.current).addClass("validation-error");
            setError(
                _(
                    "Your username will be publicly visible, please do not use your email address here.",
                ),
            );
            ref_username.current.focus();
            return false;
        } else {
            if ($(ref_username.current).hasClass("validation-error")) {
                $(ref_username.current).removeClass("validation-error");
                setError(undefined);
            }
        }
        return true;
    };

    return (
        <div id="Register">
            <div>
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
                            ref={ref_username}
                            name="username"
                            onKeyPress={register}
                            onChange={validateUsername}
                        />
                        {error && <div className="error-message">{error}</div>}
                        <label htmlFor="password">
                            {_("Password") /* translators: New account registration */}
                        </label>
                        <input
                            className="boxed"
                            id="password"
                            ref={ref_password}
                            type="password"
                            name="password"
                            onKeyPress={register}
                        />
                        <label htmlFor="email">
                            {_("Email (optional)") /* translators: New account registration */}
                        </label>
                        <input
                            className="boxed"
                            id="email"
                            ref={ref_email}
                            type="email"
                            name="email"
                            onKeyPress={register}
                        />
                        <div style={{ textAlign: "right", marginBottom: "1.0rem" }}>
                            <button className="primary" onClick={register}>
                                <i className="fa fa-sign-in" />
                                {pgettext(
                                    "This is the button they press to register with OGS",
                                    "Register",
                                )}
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

                    <SocialLoginButtons />
                </Card>

                <div className="sign-in-option">
                    <h3>{_("Already have an account?")} </h3>
                    <div>
                        <Link to="/sign-in" className="btn primary">
                            <b>{_("Sign-in here!")}</b>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
