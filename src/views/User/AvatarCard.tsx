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

import * as player_cache from "player_cache";
import { del, put } from "requests";

import { alert } from "swal_config";

import * as data from "data";

import { Flag } from "Flag";
import { image_resizer } from "image_resizer";
import { errorAlerter, ignore } from "misc";
import { Player } from "Player";
import { PlayerIcon } from "PlayerIcon";
import Dropzone from "react-dropzone";
import { durationString } from "TimeControl";
import { cc_to_country_name, pgettext, sorted_locale_countries, _ } from "translate";
import { is_valid_url } from "url_validation";
import { usePreference } from "preferences";

const inlineBlock = { display: "inline-flex", alignItems: "center" };

export interface AvatarCardEditableFields {
    username: string;
    first_name: string | null;
    last_name: string | null;
    real_name_is_private: boolean;
    country: string;
    website: string;
}

interface AvatarCardUserType extends AvatarCardEditableFields {
    id: number;
    is_watched: boolean;
    is_superuser: boolean;
    is_moderator: boolean;
    timeout_provisional: boolean;
    supporter: boolean;
    ui_class_extra: string | null;
    on_vacation: boolean;
    name: string | undefined;
    is_bot: boolean;
    is_tournament_moderator: boolean;
    bot_ai: string;
    bot_owner: player_cache.PlayerCacheEntry | null;
    vacation_left: number;
    professional: boolean;
    icon?: string;
}

interface AvatarCardProps {
    user: AvatarCardUserType;
    force_show_ratings: boolean;
    editing: boolean;

    /** called when the edit button is clicked */
    onEdit: () => void;
    /** called when the save button is clicked */
    onSave: (user: AvatarCardEditableFields) => void;
    /** called when the Moderate button is clicked */
    openModerateUser: () => void;
}

export function AvatarCard({
    user,
    force_show_ratings,
    editing,
    onEdit,
    onSave,
    openModerateUser,
}: AvatarCardProps) {
    const [new_username, setNewUsername] = React.useState(user.username);
    const [new_first_name, setNewFirstName] = React.useState(user.first_name);
    const [new_last_name, setNewLastName] = React.useState(user.last_name);
    const [new_real_name_is_private, setNewRealNameIsPrivate] = React.useState(
        user.real_name_is_private,
    );
    const [new_country, setNewCountry] = React.useState(user.country);
    const [new_website, setNewWebsite] = React.useState(user.website);
    const [hide_moderator_controls] = usePreference("moderator.hide-profile-information");

    const toggleEdit = () => {
        if (editing) {
            let promise: Promise<{ value?: boolean }>;
            if (!data.get("user")?.is_moderator && user.username !== new_username) {
                promise = alert.fire({
                    text: _(
                        "You can only change your name once every 30 days. Are you sure you wish to change your username at this time?",
                    ),
                    showCancelButton: true,
                });
            } else {
                promise = Promise.resolve({ value: true }); // pretend to be an accepted alert
            }
            promise
                .then(({ value }) => {
                    if (value) {
                        onSave({
                            username: new_username,
                            first_name: new_first_name,
                            last_name: new_last_name,
                            real_name_is_private: new_real_name_is_private,
                            country: new_country,
                            website: new_website,
                        });
                    }
                })
                .catch(ignore);
        } else {
            setNewUsername(user.username);
            setNewFirstName(user.first_name);
            setNewLastName(user.last_name);
            setNewRealNameIsPrivate(user.real_name_is_private);
            setNewCountry(user.country);
            setNewWebsite(user.website);

            onEdit();
        }
    };

    const global_user = data.get("config.user");
    let cleaned_website = "";
    if (user && user.website) {
        if (user.website.indexOf("http") !== 0) {
            cleaned_website = "https://" + user.website;
        } else {
            cleaned_website = user.website;
        }

        if (!is_valid_url(cleaned_website)) {
            cleaned_website = "";
        }
    }

    const [new_icon, setNewIcon] = React.useState<(File & { preview: any }) | null>(null);
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

    return (
        <div className="avatar-container">
            {editing ? (
                <input
                    className="username-input"
                    value={new_username}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder={_("User Name")}
                />
            ) : (
                <span className="username">
                    <Player user={user} forceShowRank={force_show_ratings} />
                </span>
            )}

            {editing ? (
                <div className="dropzone-container">
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
                </div>
            ) : (
                <PlayerIcon id={user.id} size={128} />
            )}
            {editing && (
                <div className="clear-icon-container">
                    <button className="xs" onClick={clearIcon}>
                        {_("Clear icon")}
                    </button>
                </div>
            )}

            <AvatarSubtext user={user} global_user={global_user} />

            {(editing || null) && (
                <div>
                    <input
                        className="name-input"
                        placeholder={_("First") /* translators: First name */}
                        value={new_first_name || ""}
                        onChange={(e) => setNewFirstName(e.target.value)}
                    />
                    &nbsp;
                    <input
                        className="name-input"
                        placeholder={_("Last") /* translators: Last name */}
                        value={new_last_name || ""}
                        onChange={(e) => setNewLastName(e.target.value)}
                    />
                </div>
            )}
            {!editing && user.name && (
                <div className={user.real_name_is_private ? "italic" : ""}>
                    {user.name}
                    {user.real_name_is_private ? " " + _("(hidden)") : ""}
                </div>
            )}

            {(editing || null) && (
                <div>
                    <input
                        type="checkbox"
                        id="real-name-is-private"
                        checked={new_real_name_is_private}
                        onChange={(e) => setNewRealNameIsPrivate(e.target.checked)}
                    />{" "}
                    <label htmlFor="real-name-is-private">{_("Hide real name")}</label>
                </div>
            )}

            {user.is_bot && (
                <div>
                    <i className="fa fa-star"></i> <b>{_("Artificial Intelligence")}</b>{" "}
                    <i className="fa fa-star"></i>
                </div>
            )}
            {user.is_bot && (
                <div id="bot-ai-name">
                    {pgettext("Bot AI engine", "Engine")}: {user.bot_ai}
                </div>
            )}
            {user.is_bot && (user as any)?.bot_owner?.id !== 1 && (
                <div>
                    {_("Administrator")}:{" "}
                    {user.bot_owner ? (
                        <Player user={user.bot_owner} />
                    ) : (
                        <span style={{ color: "gray" }}>[null]</span>
                    )}
                </div>
            )}

            {editing ? (
                <div className="country-line">
                    <Flag country={new_country} big />
                    <select value={new_country} onChange={(e) => setNewCountry(e.target.value)}>
                        {sorted_locale_countries.map((C) => (
                            <option key={C.cc} value={C.cc}>
                                {C.name}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <div className="country-line">
                    <Flag country={user.country} big />
                    <span>{cc_to_country_name(user.country)}</span>
                </div>
            )}

            {!editing && user.website && cleaned_website && (
                <div className="website-url">
                    <a target="_blank" rel="noopener" href={cleaned_website}>
                        {user.website}
                    </a>
                </div>
            )}
            {(editing || null) && (
                <div className="website-url">
                    <input
                        type="url"
                        value={new_website}
                        onChange={(e) => setNewWebsite(e.target.value)}
                    />
                </div>
            )}

            <div className="avatar-buttons">
                {(global_user.id === user.id || global_user.is_moderator || null) && (
                    <>
                        <button onClick={toggleEdit} className="xs edit-button">
                            <i className={editing ? "fa fa-save" : "fa fa-pencil"} />{" "}
                            {" " + (editing ? _("Save") : _("Edit"))}
                        </button>
                    </>
                )}

                {global_user.is_moderator && !hide_moderator_controls && (
                    <button className="danger xs pull-right" onClick={openModerateUser}>
                        {_("Moderator Controls")}
                    </button>
                )}
            </div>
        </div>
    );
}

function getVacationLeftText(vacation_left: number): string {
    return vacation_left > 0 ? durationString(vacation_left) : "0 " + _("Seconds").toLowerCase();
}

function AvatarSubtext({ user, global_user }: { user: AvatarCardUserType; global_user: any }) {
    const [vacation_left_text, setVacationLeftText] = React.useState(
        getVacationLeftText(user.vacation_left),
    );

    React.useEffect(() => {
        setVacationLeftText(getVacationLeftText(user.vacation_left));
        const interval_start = Date.now();
        const vacation_update_interval = setInterval(() => {
            if (user) {
                if (user.on_vacation) {
                    const time_diff = Math.round((Date.now() - interval_start) / 1000);
                    const vacation_time_left = user.vacation_left - time_diff;
                    setVacationLeftText(getVacationLeftText(vacation_time_left));
                }
            }
        }, 1000);

        return () => {
            clearInterval(vacation_update_interval);
        };
    }, [user.id, user.vacation_left]);

    return (
        <div className="avatar-subtext">
            {global_user.is_moderator && user.is_watched && (
                <div>
                    <h3 style={inlineBlock}>
                        <i className="fa fa-exclamation-triangle"></i> Watched{" "}
                        <i className="fa fa-exclamation-triangle"></i>
                    </h3>
                </div>
            )}

            {user.ui_class_extra && user.ui_class_extra.indexOf("aga") >= 0 && (
                <div>
                    <h4 style={inlineBlock}>
                        <img src="https://cdn.online-go.com/assets/agaico1.png" /> {_("AGA Staff")}{" "}
                    </h4>
                </div>
            )}

            {!user.is_superuser && user.is_moderator && (
                <div>
                    <h3 style={inlineBlock}>
                        <i className="fa fa-gavel"></i> {_("Moderator")}
                    </h3>
                </div>
            )}

            {!user.is_moderator && user.supporter && (
                <div>
                    <h3 style={inlineBlock}>
                        <i className="fa fa-star"></i> {_("Site Supporter")}{" "}
                        <i className="fa fa-star"></i>
                    </h3>
                </div>
            )}

            {user.is_superuser && (
                <div>
                    <h3 style={inlineBlock}>
                        <i className="fa fa-smile-o fa-spin"></i> {_("OGS Developer")}{" "}
                        <i className="fa fa-smile-o fa-spin"></i>
                    </h3>
                </div>
            )}

            {!user.is_superuser && user.is_tournament_moderator && (
                <div>
                    <h3 style={inlineBlock}>
                        <i className="fa fa-trophy"></i> {_("Tournament Moderator")}{" "}
                        <i className="fa fa-trophy"></i>
                    </h3>
                </div>
            )}

            {user.on_vacation && (
                <div>
                    <h3 style={inlineBlock}>
                        <i className="fa fa-smile-o fa-spin"></i> {_("On Vacation")} -{" "}
                        {vacation_left_text} <i className="fa fa-smile-o fa-spin"></i>
                    </h3>
                </div>
            )}
        </div>
    );
}
