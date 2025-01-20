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
import * as data from "@/lib/data";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { _, pgettext } from "@/lib/translate";
import { Card } from "@/components/material";
import { errorAlerter } from "@/lib/misc";
import { post } from "@/lib/requests";
import { get_ebi } from "@/views/SignIn";
import { useUser } from "@/lib/hooks";
import cached from "@/lib/cached";

import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { LoadingButton } from "@/components/LoadingButton";

export function Register(): React.ReactElement {
    const navigate = useNavigate();
    const user = useUser();
    const ref_username = React.useRef<HTMLInputElement>(null);
    const ref_email = React.useRef<HTMLInputElement | null>(null);
    const ref_password = React.useRef<HTMLInputElement | null>(null);
    const [error, setError] = React.useState<string>();
    const [submitLoading, setSubmitLoading] = React.useState(false);

    if (!user.anonymous) {
        navigate("/");
    }

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
        event.preventDefault();
        if (submitLoading) {
            return;
        }
        const actually_register = async () => {
            return post("/api/v0/register", {
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

        if (ref_username.current?.value.trim() === "" || !validateUsername()) {
            ref_username.current?.focus();
            return;
        }

        if (ref_password.current?.value.trim() === "") {
            ref_password.current?.focus();
            return;
        }

        if (
            (document.activeElement === ref_username.current ||
                document.activeElement === ref_password.current) &&
            ref_email.current?.value.trim() === ""
        ) {
            ref_email.current.focus();
            return;
        }

        try {
            setSubmitLoading(true);
            await actually_register();
        } finally {
            setSubmitLoading(false);
        }
        return;
    };

    const validateUsername = () => {
        if (!ref_username.current) {
            return false;
        }

        if (/@/.test(ref_username.current.value)) {
            ref_username.current.classList.add("validation-error");
            setError(
                _(
                    "Your username will be publicly visible, please do not use your email address here.",
                ),
            );
            ref_username.current.focus();
            return false;
        } else {
            if (ref_username.current.classList.contains("validation-error")) {
                ref_username.current.classList.remove("validation-error");
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
                    <form name="login" autoComplete="on" onSubmit={onSubmit}>
                        <label htmlFor="username">
                            {_("Username") /* translators: New account registration */}
                        </label>
                        <input
                            className="boxed"
                            id="username"
                            autoFocus
                            ref={ref_username}
                            name="username"
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
                        />
                        <div style={{ textAlign: "right", marginBottom: "1.0rem" }}>
                            <LoadingButton
                                type="submit"
                                className="primary"
                                loading={submitLoading}
                                icon={<i className="fa fa-sign-in" />}
                            >
                                {pgettext(
                                    "This is the button they press to register with OGS",
                                    "Register",
                                )}
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

                    <SocialLoginButtons next_url={"/wait-for-user"} />
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
