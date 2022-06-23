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

import * as data from "data";

import { Link } from "react-router-dom";
import { _ } from "translate";
import { post, get, put, del, getCookie } from "requests";
import { errorAlerter, errorLogger, ignore } from "misc";

import { SocialLoginButtons } from "SocialLoginButtons";
import { alert } from "swal_config";

import { SettingGroupProps } from "SettingsCommon";

export function AccountSettings(props: SettingGroupProps): JSX.Element {
    const [password1, setPassword1]: [string, (x: string) => void] = React.useState("");
    const [password2, setPassword2]: [string, (x: string) => void] = React.useState("");
    const [email, __setEmail]: [string, (x: string) => void] = React.useState(
        props.state.profile.email,
    );
    const [email_changed, setEmailChanged]: [boolean, (x: boolean) => void] = React.useState();
    const [message, setMessage]: [string, (x: string) => void] = React.useState("");
    const [settings, setSettings]: [any, (x: any) => void] = React.useState({});

    React.useEffect(refreshAccountSettings, []);

    const user = data.get("user");

    function refreshAccountSettings() {
        get(`me/account_settings`)
            .then((settings) => {
                console.log(settings);
                setSettings(settings);
            })
            .catch(errorLogger);
    }

    function setEmail(s: string): void {
        __setEmail(s);
        setEmailChanged(true);
    }

    function passwordIsValid(): boolean {
        return password1.length < 1024 && password1.length > 3 && password1 === password2;
    }

    function emailIsValid(): boolean {
        if (email.trim() === "") {
            return true;
        }
        const re =
            /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
        return re.test(email.trim());
    }

    function saveEmail(): void {
        put("players/%%", user.id, { email })
            .then(() => {
                setEmailChanged(false);
                setMessage(_("Email updated successfully!"));
            })
            .catch(errorAlerter);
    }

    function savePassword(): void {
        if (!settings.password_is_set) {
            // social auth account
            post("/api/v0/changePassword", {
                new_password: password1,
                old_password: "!",
            })
                .then(() => {
                    props.refresh();
                    refreshAccountSettings();
                    void alert.fire(_("Password updated successfully!"));
                })
                .catch(errorAlerter);
        } else {
            alert
                .fire({
                    text: _("Enter your current password"),
                    input: "password",
                })
                .then(({ value: password }) => {
                    if (password) {
                        post("/api/v0/changePassword", {
                            old_password: password,
                            new_password: password1,
                        })
                            .then(() => {
                                void alert.fire(_("Password updated successfully!"));
                            })
                            .catch(errorAlerter);
                    }
                })
                .catch(errorAlerter);
        }
    }

    function resendValidationEmail() {
        post("me/validateEmail", {})
            .then(() => {
                void alert.fire(
                    "Validation email sent! Please check your email and click the validation link.",
                );
            })
            .catch(errorAlerter);
    }

    function deleteAccount(): void {
        function doDel(password: string | null) {
            if (user && user.id) {
                del(`players/${user.id}`, {
                    password: password,
                })
                    .then(() => {
                        try {
                            data.remove("user");
                        } catch (e) {
                            // ignore error
                        }

                        try {
                            data.removePrefix("config");
                        } catch (e) {
                            // ignore error
                        }

                        try {
                            data.removePrefix("preferences");
                        } catch (e) {
                            // ignore error
                        }

                        window.location.href = "/";
                    })
                    .catch(errorAlerter);
            }
        }
        if (user && user.id) {
            if (!settings.password_is_set) {
                // social auth account
                void alert
                    .fire({
                        text: _(
                            "Are you sure you want to delete this account? This cannot be undone.",
                        ),
                        showCancelButton: true,
                    })
                    .then(({ value: accept }) => {
                        if (accept) {
                            doDel(null);
                        }
                    });
            } else {
                alert
                    .fire({
                        text: _("Enter your current password"),
                        input: "password",
                    })
                    .then(({ value: password }) => {
                        if (password) {
                            doDel(password);
                        }
                    })
                    .catch(errorAlerter);
            }
        }
    }

    // Render...

    return (
        <div>
            <i>
                <Link to={`/user/view/${user.id}#edit`}>
                    {_("To update your profile information, click here")}
                </Link>
            </i>
            <dl>
                <dt>{_("Email address")}</dt>
                <dd>
                    <input
                        type="email"
                        name="new_email"
                        value={email}
                        onChange={(ev) => setEmail(ev.target.value)}
                    />
                    {!email_changed ? null : (
                        <button disabled={!emailIsValid()} className="primary" onClick={saveEmail}>
                            {emailIsValid()
                                ? _("Update email address")
                                : _("Email address is not valid")}
                        </button>
                    )}
                    {message && <div>{message}</div>}
                    {email && !email_changed && !user.email_validated && (
                        <div>
                            <div className="awaiting-validation-text">
                                {_(
                                    "Awaiting email address confirmation. Chat will be disabled until your email address has been validated.",
                                )}
                            </div>
                            <button onClick={resendValidationEmail}>
                                {_("Resend validation email")}
                            </button>
                        </div>
                    )}
                </dd>

                <dt>{_("Password")}</dt>
                <dd className="password-update">
                    <div>
                        <input
                            type="password"
                            value={password1}
                            onChange={(ev) => setPassword1(ev.target.value)}
                        />
                    </div>
                    <div>
                        <input
                            placeholder={_("(again)")}
                            type="password"
                            value={password2}
                            onChange={(ev) => setPassword2(ev.target.value)}
                        />
                    </div>
                    <div>
                        {password1.length === 0 ? null : (
                            <button
                                disabled={!passwordIsValid()}
                                className="primary"
                                onClick={savePassword}
                            >
                                {passwordIsValid()
                                    ? _("Update password")
                                    : _("Passwords don't match")}
                            </button>
                        )}
                    </div>
                </dd>

                <dt>{_("Social account linking")}</dt>
                {settings.social_auth_accounts && (
                    <dd>
                        {settings.social_auth_accounts.map((account) => (
                            <div key={account.provider}>
                                <div className="social-link">
                                    {account.provider === "github" && (
                                        <span className="github fa fa-github" />
                                    )}
                                    {account.provider === "google-oauth2" && (
                                        <span className="google google-oauth2-icon" />
                                    )}
                                    {account.provider === "facebook" && (
                                        <span className="facebook facebook-icon" />
                                    )}
                                    {account.provider === "twitter" && (
                                        <i className="twitter twitter-icon fa fa-twitter" />
                                    )}
                                    {account.provider === "apple-id" && (
                                        <i className="apple apple-id-icon fa fa-apple" />
                                    )}

                                    {account.provider === "github" && (
                                        <GitHubUsername uid={account.uid} />
                                    )}
                                    {account.provider !== "github" && account.uid}

                                    <form method="POST" action={`/disconnect/${account.provider}/`}>
                                        <input
                                            type="hidden"
                                            name="csrfmiddlewaretoken"
                                            value={getCookie("csrftoken")}
                                        />
                                        {settings.password_is_set && (
                                            <button type="submit">Unlink</button>
                                        )}
                                    </form>
                                </div>
                            </div>
                        ))}
                    </dd>
                )}

                <dd>
                    <SocialLoginButtons />
                </dd>

                <dt>{_("Delete account")}</dt>
                <dd>
                    <i>
                        {_(
                            "Warning: this action is permanent, there is no way to recover an account after it's been deleted.",
                        )}
                    </i>
                </dd>
                <dd>
                    <button className="reject" onClick={deleteAccount}>
                        {_("Delete account")}
                    </button>
                </dd>
            </dl>
        </div>
    );
}

function GitHubUsername({ uid }: { uid: string }): JSX.Element {
    const [username, setUsername] = React.useState("");

    React.useEffect(() => {
        get(`https://api.github.com/user/${uid}`)
            .then((res) => {
                setUsername(res.login);
            })
            .catch(ignore);
    }, [uid]);

    return (
        <span className="GitHubUsername">
            <img src={`https://avatars.githubusercontent.com/u/${uid}?v=4`} />
            <span>{username}</span>
        </span>
    );
}
