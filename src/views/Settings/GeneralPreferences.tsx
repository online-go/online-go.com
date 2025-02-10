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
import * as ReactSelect from "react-select";
import Select from "react-select";

import * as data from "@/lib/data";

import { _ } from "@/lib/translate";
import { put } from "@/lib/requests";
import { errorAlerter, ignore, dev_site } from "@/lib/misc";

import { current_language, setCurrentLanguage, languages } from "@/lib/translate";
import { toast } from "@/lib/toast";
import { profanity_regex } from "@/lib/profanity_filter";

import * as preferences from "@/lib/preferences";
import { usePreference } from "@/lib/preferences";

import { Toggle } from "@/components/Toggle";

import { SettingGroupPageProps, PreferenceLine, PreferenceDropdown } from "@/lib/SettingsCommon";

export function GeneralPreferences(props: SettingGroupPageProps): React.ReactElement {
    const [profanity_filter, _setProfanityFilter]: [Array<string>, (x: Array<string>) => void] =
        React.useState(Object.keys(preferences.get("profanity-filter")));

    const [game_list_threshold, _setGameListThreshold]: [number, (x: number) => void] =
        React.useState(preferences.get("game-list-threshold"));
    const [_desktop_notifications, setDesktopNotifications] =
        usePreference("desktop-notifications");
    /*
    const [desktop_notifications_require_interaction, setDesktopNotificationsRequireInteraction] =
        usePreference("desktop-notifications-require-interaction");
    */
    const [show_offline_friends, setShowOfflineFriends] = usePreference("show-offline-friends");
    const [unicode_filter_usernames, setUnicodeFilterUsernames] = usePreference("unicode-filter");
    const [translation_dialog_never_show, setTranslationDialogNeverShow] = usePreference(
        "translation-dialog-never-show",
    );
    const [hide_ui_class, setHideUiClass]: [boolean, (x: boolean) => void] = React.useState(
        !!props.state.hide_ui_class,
    );
    const [show_tournament_indicator, setShowTournamentIndicator] = usePreference(
        "show-tournament-indicator",
    );
    const [show_tournament_indicator_on_mobile, setShowTournamentIndicatorOnMobile] = usePreference(
        "show-tournament-indicator-on-mobile",
    );
    const [hide_ranks, setHideRanks] = usePreference("hide-ranks");
    const [rating_graph_always_use, setAlwaysUse] = usePreference("rating-graph-always-use");
    const [rating_graph_plot_by_games, setPlotByGames] = usePreference(
        "rating-graph-plot-by-games",
    );
    const [enable_v6, setEnableV6]: [boolean, (x: boolean) => void] = React.useState(
        data.get("experiments.v6") === "enabled",
    );
    const [show_slow_internet_warning, setShowSlowInternetWarning] = usePreference(
        "show-slow-internet-warning",
    );

    const user = data.get("user");
    const desktop_notifications_enableable: boolean = typeof Notification !== "undefined";

    let desktop_notifications_enabled = false;
    try {
        desktop_notifications_enabled =
            preferences.get("desktop-notifications") &&
            (Notification as any).permission === "granted";
    } catch {
        /* not all browsers support the Notification API */
    }

    function updateProfanityFilter(
        langs: ReactSelect.MultiValue<{ value: string; label: string }>,
    ) {
        if (!langs) {
            langs = [];
        }

        const new_profanity_settings: { [cc: string]: true } = {};

        langs.forEach((lang) => {
            new_profanity_settings[lang.value] = true;
        });

        preferences.set("profanity-filter", new_profanity_settings);
        _setProfanityFilter(langs.map((lang) => lang.value));
    }

    function updateGameListThreshold(ev: React.ChangeEvent<HTMLInputElement>) {
        let threshold = parseInt(ev.target.value);
        if (!isNaN(threshold)) {
            threshold = Math.min(300, Math.max(0, threshold));
            preferences.set("game-list-threshold", threshold);
            _setGameListThreshold(threshold);
        } else {
            _setGameListThreshold(ev.target.value as any);
        }
    }

    /*
    function updateDesktopNotificationsRequireInteraction(enabled) {
        setDesktopNotificationsRequireInteraction(enabled);
    }
    */

    function updateDesktopNotifications(enabled: boolean) {
        if (!enabled) {
            //this.setState({'desktop_notifications_enabled': false});
        }

        try {
            setDesktopNotifications(enabled);

            if (enabled) {
                if ((Notification as any).permission === "denied") {
                    //this.setState({'desktop_notifications_enabled': false});
                    toast(
                        <div>
                            {_(
                                "You have previously denied desktop notifications on OGS, you will need to go into your browser settings and change your decision there to enable them.",
                            )}
                        </div>,
                    );
                }

                if ((Notification as any).permission === "granted") {
                    //this.setState({'desktop_notifications_enabled': true});
                }

                if ((Notification as any).permission === "default") {
                    const onRequestResult = (perm: string) => {
                        if (perm === "granted") {
                            //this.setState({'desktop_notifications_enabled': true});
                            console.log("granted notification permission");
                        } else {
                            //this.setState({'desktop_notifications_enabled': false});
                            toast(
                                <div>
                                    {_(
                                        "You have previously denied desktop notifications on OGS, you will need to go into your browser settings and change your decision there to enable them.",
                                    )}
                                </div>,
                            );
                        }
                    };

                    try {
                        Notification.requestPermission().then(onRequestResult).catch(ignore);
                    } catch {
                        /* deprecated usage, but only way supported on safari currently */
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        Notification.requestPermission(onRequestResult);
                    }
                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    function updateHideUIClass(checked: boolean) {
        setHideUiClass(!checked);
        put(`me/settings`, {
            site_preferences: {
                hide_ui_class: !checked,
            },
        }).catch(errorAlerter);
    }

    const show_debug_language = dev_site();
    const language_options = Object.entries(languages)
        .filter((lang_entry) => show_debug_language || lang_entry[0] !== "debug")
        .map((lang_entry) => ({
            value: lang_entry[0],
            label: lang_entry[1],
        }));

    function setLanguage(language_code: string) {
        preferences.set("language", language_code);
        setCurrentLanguage(language_code);
        window.location.reload();
    }

    // Render...
    return (
        <div className="GeneralPreferences">
            <PreferenceLine title={_("Language")}>
                <PreferenceDropdown
                    value={current_language}
                    options={language_options}
                    onChange={setLanguage}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Profanity filter")}>
                <Select
                    className="ProfanityDropdown"
                    classNamePrefix="ogs-react-select"
                    defaultValue={language_options.filter(
                        (lang) => profanity_filter.indexOf(lang.value) >= 0,
                    )}
                    options={language_options.filter((lang) => lang.value in profanity_regex)}
                    onChange={updateProfanityFilter}
                    isMulti
                />
            </PreferenceLine>

            <PreferenceLine
                title={_("Game thumbnail list threshold")}
                description={_("Set to 0 to always show list.")}
            >
                <input
                    value={game_list_threshold}
                    onChange={updateGameListThreshold}
                    type="number"
                    min="0"
                    max="300"
                    step="1"
                />
            </PreferenceLine>

            <PreferenceLine title={_("Desktop notifications")}>
                <Toggle
                    checked={desktop_notifications_enabled}
                    onChange={updateDesktopNotifications}
                    disabled={!desktop_notifications_enableable}
                />

                {!desktop_notifications_enableable && (
                    <div>
                        <i>{_("Desktop notifications are not supported by your browser")}</i>
                    </div>
                )}
            </PreferenceLine>

            {/* desktop_notifications_enabled && (
                <PreferenceLine
                    title={_("Keep desktop notifications open until clicked")}
                    description={_("Note: Some browsers do not support this feature.")}
                >
                    <Toggle
                        checked={desktop_notifications_require_interaction}
                        onChange={updateDesktopNotificationsRequireInteraction}
                    />
                </PreferenceLine>
            )*/}

            <PreferenceLine title={_("Show offline friends on list")}>
                <Toggle checked={show_offline_friends} onChange={setShowOfflineFriends} />
            </PreferenceLine>

            <PreferenceLine title={_("Hide special unicode symbols in usernames")}>
                <Toggle checked={unicode_filter_usernames} onChange={setUnicodeFilterUsernames} />
            </PreferenceLine>

            <PreferenceLine
                title={_('Never show the "needs translation" message on the home page')}
            >
                <Toggle
                    checked={translation_dialog_never_show}
                    onChange={setTranslationDialogNeverShow}
                />
            </PreferenceLine>

            {(user.supporter || user.is_moderator || null) && (
                <PreferenceLine title={_("Golden supporter name")}>
                    <Toggle
                        checked={!hide_ui_class}
                        onChange={updateHideUIClass}
                        id="hide_ui_class"
                    />
                </PreferenceLine>
            )}

            <PreferenceLine title={_("Show tournament indicator")}>
                <i className="fa fa-desktop" />{" "}
                <Toggle checked={show_tournament_indicator} onChange={setShowTournamentIndicator} />
                <i className="fa fa-mobile" />{" "}
                <Toggle
                    checked={show_tournament_indicator_on_mobile}
                    onChange={setShowTournamentIndicatorOnMobile}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Hide ranks and ratings")}>
                <Toggle checked={hide_ranks} onChange={setHideRanks} />
            </PreferenceLine>

            <PreferenceLine title={_("Enable experimental interface changes")}>
                <Toggle
                    checked={enable_v6}
                    onChange={(tf) => {
                        data.set("experiments.v6", tf ? "enabled" : undefined);
                        setEnableV6(tf);
                    }}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Plot rating graph by")}>
                <span>{_("Ask me")}</span>
                <Toggle checked={rating_graph_always_use} onChange={setAlwaysUse} />
                <span>{_("Always use:")}</span>
                <span>{_("time")}</span>
                <Toggle
                    checked={rating_graph_plot_by_games}
                    onChange={setPlotByGames}
                    disabled={!preferences.get("rating-graph-always-use")}
                />
                <span>{_("games")}</span>
            </PreferenceLine>

            <PreferenceLine title={_("Warn when internet slowdowns are detected")}>
                <Toggle
                    checked={show_slow_internet_warning}
                    onChange={setShowSlowInternetWarning}
                />
            </PreferenceLine>
        </div>
    );
}
