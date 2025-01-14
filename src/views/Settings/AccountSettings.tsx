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
import * as DynamicHelp from "react-dynamic-help";
import { cached } from "@/lib/cached";
import * as player_cache from "@/lib/player_cache";
import Dropzone from "react-dropzone";
import { alert } from "@/lib/swal_config";
import { PlayerIcon } from "@/components/PlayerIcon";
import { post, get, put, del, getCookie } from "@/lib/requests";
import { errorAlerter, errorLogger, ignore } from "@/lib/misc";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { SettingGroupPageProps } from "@/lib/SettingsCommon";
import { useUser } from "@/lib/hooks";
import { image_resizer } from "@/lib/image_resizer";
import { Flag } from "@/components/Flag";
import { toast } from "@/lib/toast";
import { InfoBall } from "@/components/InfoBall";
import { pgettext, sorted_locale_countries, _ } from "@/lib/translate";

export function AccountSettings(props: SettingGroupPageProps): React.ReactElement {
    const user = useUser();

    const [username, _setUsername] = React.useState(user.username);
    const [first_name, setFirstName] = React.useState("");
    const [last_name, setLastName] = React.useState("");
    const [real_name_is_private, setRealNameIsPrivate] = React.useState(true);
    const [country, setCountry] = React.useState("un");
    const [website, setWebsite] = React.useState("");
    const [password1, __setPassword1] = React.useState("");
    const [password2, setPassword2] = React.useState("");
    const [email, setEmail] = React.useState(props.state.profile.email);
    const [email_validated, setEmailValidated] = React.useState(true);
    const [new_icon, setNewIcon] = React.useState<(File & { preview: any }) | null>(null);
    const [settings, setSettings] = React.useState<any>({}); // we probably need a type for settings
    const [loading, setLoading] = React.useState(true);

    const profile_changed =
        settings &&
        (settings.username !== username ||
            settings.first_name !== first_name ||
            settings.last_name !== last_name ||
            settings.real_name_is_private !== real_name_is_private ||
            settings.country !== country ||
            settings.email !== email ||
            settings.website !== website);
    const email_changed = settings.email !== email;

    const { registerTargetItem, signalUsed } = React.useContext(DynamicHelp.Api);

    signalUsed("account-settings-button"); // they have arrived here now, so they don't need to be told how to get here anymore

    const { ref: passwordEntry, used: signalPasswordTyping } = registerTargetItem("password-entry");
    const { ref: usernameEntry, used: signalUsernameTyping } = registerTargetItem("username-edit");

    const setPassword1 = (password: string): void => {
        __setPassword1(password);
        signalPasswordTyping();
    };

    const setUsername = (username: string): void => {
        _setUsername(username);
        signalUsernameTyping();
    };

    React.useEffect(refreshAccountSettings, []);

    function refreshAccountSettings() {
        setLoading(true);
        get(`me/account_settings`)
            .then((settings) => {
                //console.log(settings);
                setSettings(settings);
                setUsername(settings.username);
                setFirstName(settings.first_name);
                setLastName(settings.last_name);
                setRealNameIsPrivate(settings.real_name_is_private);
                setCountry(settings.country);
                setWebsite(settings.website);
                setEmailValidated(settings.email_validated);
                setEmail(settings.email);
                setLoading(false);
            })
            .catch(errorLogger);
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
                    toast(<span>{_("Password updated successfully!")}</span>, 5000);
                    setPassword1("");
                    setPassword2("");
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
                                toast(<span>{_("Password updated successfully!")}</span>, 5000);
                                setPassword1("");
                                setPassword2("");
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
                            localStorage.clear();
                        } catch {
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

    const updateIcon = (files: File[]) => {
        console.log(files);
        const file = files[0];
        setNewIcon(Object.assign(file, { preview: URL.createObjectURL(file) }));

        image_resizer(files[0], 512, 512, 65535)
            .then((file: Blob) => {
                put(`players/${user.id}/icon`, file)
                    .then((res) => {
                        console.log("Upload successful", res);
                        user.icon = res.icon;
                        player_cache.update({
                            id: user.id,
                            icon: res.icon,
                        });
                    })
                    .catch(errorAlerter);
            })
            .catch(errorAlerter);
    };
    const clearIcon = () => {
        setNewIcon(null);
        del(`players/${user.id}/icon`)
            .then((res) => {
                console.log("Cleared icon", res);
                user.icon = res.icon;
                player_cache.update({
                    id: user.id,
                    icon: res.icon,
                });
            })
            .catch(errorAlerter);
    };

    const save = () => {
        if (profile_changed) {
            const data = {
                username,
                first_name,
                last_name,
                real_name_is_private,
                country,
                email,
                website,
            };
            put(`players/${user.id}`, data)
                .then(() => {
                    cached.refresh.config(() => window.location.reload());
                    toast(<span>{_("Account settings updated successfully!")}</span>, 5000);
                })
                .catch(errorAlerter);
        }

        if (password1.length > 0 && passwordIsValid()) {
            savePassword();
        }
    };

    let save_button_disabled = (loading || !profile_changed) && password1.length === 0;
    let save_button_text = _("Save changes");

    if (password1.length > 0 && !passwordIsValid()) {
        save_button_text = _("Passwords don't match");
        save_button_disabled = true;
    }

    if (email.trim() !== "" && !emailIsValid()) {
        save_button_text = _("Invalid email");
        save_button_disabled = true;
    }

    return (
        <div className="AccountSettings">
            <div className="row">
                <div className="left">
                    <dl>
                        <dt ref={usernameEntry}>
                            {_("Username")}
                            <InfoBall>
                                {pgettext(
                                    "This is an explanation for what 'Username' is",
                                    "This is what other players will know you as. You may change your username once every 30 days.",
                                )}
                            </InfoBall>
                        </dt>
                        <dd>
                            <div>
                                <input
                                    value={username}
                                    onChange={(ev) => setUsername(ev.target.value)}
                                />
                            </div>
                        </dd>

                        <dt>{_("Password")}</dt>
                        <dd className="password-update" ref={passwordEntry}>
                            <div>
                                <input
                                    type="password"
                                    placeholder={_("Enter a new password")}
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
                        </dd>

                        <dt>
                            {_("Name")}
                            <InfoBall>{_("Providing your real name is optional.")}</InfoBall>
                        </dt>
                        <dd>
                            <div>
                                <input
                                    className="name-input"
                                    placeholder={_("First") /* translators: First name */}
                                    value={first_name || ""}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                                &nbsp;
                                <input
                                    className="name-input"
                                    placeholder={_("Last") /* translators: Last name */}
                                    value={last_name || ""}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                            <div>
                                <input
                                    type="checkbox"
                                    id="real-name-is-private"
                                    checked={real_name_is_private}
                                    onChange={(e) => setRealNameIsPrivate(e.target.checked)}
                                />{" "}
                                <label htmlFor="real-name-is-private">{_("Hide real name")}</label>
                            </div>
                        </dd>

                        <dt>
                            {_("Email address")}
                            <InfoBall>
                                {_(
                                    'Providing your email address is optional. Your email address is used for sending things like password reset requests and turn notifications. Notification emails may be turned off under "Email Notifications".',
                                )}
                            </InfoBall>
                        </dt>
                        <dd>
                            <input
                                type="email"
                                name="new_email"
                                value={email}
                                onChange={(ev) => setEmail(ev.target.value)}
                            />
                            <div style={{ marginTop: "0.5rem" }}>
                                <i>We will never sell your email address.</i>
                            </div>

                            {email && !email_changed && !email_validated && (
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
                    </dl>
                </div>

                <div className="right">
                    <dl>
                        <dt>{_("Icon")}</dt>
                        <dd>
                            <Dropzone onDrop={updateIcon} multiple={false}>
                                {({ getRootProps, getInputProps }) => (
                                    <section className="Dropzone">
                                        <div {...getRootProps()}>
                                            <input {...getInputProps()} />
                                            {new_icon ? (
                                                <img
                                                    src={new_icon.preview}
                                                    style={{ height: "128px", width: "128px" }}
                                                />
                                            ) : (
                                                <PlayerIcon id={user.id} size={128} />
                                            )}
                                        </div>
                                    </section>
                                )}
                            </Dropzone>
                        </dd>
                        <dd className="clear-icon-container">
                            <button className="xs" onClick={clearIcon}>
                                {_("Clear icon")}
                            </button>
                        </dd>

                        <dt>{_("Country")}</dt>
                        <dd>
                            <div className="country-line">
                                <Flag country={country} big />
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                >
                                    {sorted_locale_countries.map((C) => (
                                        <option key={C.cc} value={C.cc}>
                                            {C.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </dd>

                        <dt>{_("Website")}</dt>
                        <dd>
                            <div className="website-url">
                                <input
                                    type="url"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
                        </dd>
                    </dl>
                </div>
            </div>

            <div className="save-button-container">
                <button className="primary" onClick={save} disabled={save_button_disabled}>
                    {save_button_text}
                </button>
            </div>

            <div className="row">
                <dl>
                    <dt>{_("Social account linking")}</dt>
                    {settings.social_auth_accounts && (
                        <dd>
                            {settings.social_auth_accounts.map((account: any) => (
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

                                        <form
                                            method="POST"
                                            action={`/disconnect/${account.provider}/`}
                                        >
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
        </div>
    );
}

function GitHubUsername({ uid }: { uid: string }): React.ReactElement {
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
