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
import Select from "react-select";

import { useParams } from "react-router-dom";

import * as DynamicHelp from "react-dynamic-help";

import * as preferences from "@/lib/preferences";
import * as data from "@/lib/data";

import { _, interpolate } from "@/lib/translate";
import { get, abort_requests_in_flight } from "@/lib/requests";

import { errorAlerter, dup } from "@/lib/misc";
import { durationString } from "@/components/TimeControl";

import { logout, logoutOtherDevices, logoutAndClearLocalData } from "@/lib/auth";
import { LoadingPage } from "@/components/Loading";
import { browserHistory } from "@/lib/ogsHistory";

import { SettingGroupPageProps, SettingsState } from "@/lib/SettingsCommon";

import { SoundPreferences } from "./SoundPreferences";
import { GeneralPreferences } from "./GeneralPreferences";
import { GamePreferences } from "./GamePreferences";
import { ChatPreferences } from "./ChatPreferences";
import { ModeratorPreferences } from "./ModeratorPreferences";
import { BlockedPlayerPreferences } from "./BlockedPlayerPreferences";
import { VacationSettings } from "./VacationSettings";
import { AccountSettings } from "./AccountSettings";
import { LinkPreferences } from "./LinkPreferences";
import { AnnouncementPreferences } from "./AnnouncementPreferences";
import { EmailPreferences } from "./EmailPreferences";
import { HelpSettings } from "./HelpSettings";
import { Supporter } from "@/views/Supporter";
import { GoTVPreferences } from "./GoTVPreferences";
import { ThemePreferences } from "./ThemePreferences";

export function Settings(): React.ReactElement {
    const { category } = useParams();
    const [settings_state, setSettingsState]: [SettingsState, (s: SettingsState) => void] =
        React.useState({});
    const [vacation_base_time, set_vacation_base_time]: [number, (s: number) => void] =
        React.useState(Date.now());
    const [loaded, set_loaded]: [number, (b: number) => void] = React.useState(0);

    const { registerTargetItem, signalUsed } = React.useContext(DynamicHelp.Api);

    signalUsed("settings-nav-link"); // they have arrived here now, so they don't need to be told how to get here anymore

    const { ref: accountSettingsButton } = registerTargetItem("account-settings-button"); // cleared on AccountSettings page

    React.useEffect(refresh, []);

    function select(s: string): void {
        data.set("settings.page-selected", s);
        browserHistory.push(`/settings/${s}`);
    }

    function refresh(): () => void {
        let canceled = false;

        get("me/settings")
            .then((settings) => {
                if (!canceled) {
                    set_vacation_base_time(Date.now());
                    setSettingsState({
                        profile: settings.profile,
                        notifications: settings.notifications,
                        vacation_left: durationString(settings.profile.vacation_left),
                        hide_ui_class: settings.site_preferences.hide_ui_class,
                        self_reported_account_linkages: settings.self_reported_account_linkages,
                    });
                    set_loaded(1);
                }
            })
            .catch(errorAlerter);

        return () => {
            canceled = true;
            abort_requests_in_flight("me/settings", "GET");
        };
    }

    const selected = category;
    data.set("settings.page-selected", selected);
    const groups: Array<{
        key: string;
        label: string | React.ReactElement;
        ref?: React.RefObject<any> | React.RefCallback<HTMLElement>;
    }> = [
        { key: "general", label: _("General Preferences") },
        { key: "sound", label: _("Sound Preferences") },
        { key: "game", label: _("Game Preferences") },
        { key: "theme", label: _("Themes & Visuals") },
        { key: "chat", label: _("Chat Preferences") },
        { key: "gotv", label: interpolate(_("%s Preferences"), ["GoTV"]) },
        {
            key: "supporter",
            label: (
                <span>
                    {_("Supporter Settings")}
                    <i className="fa fa-star" />
                </span>
            ),
        },
        { key: "moderator", label: _("Moderator Preferences") },
        { key: "vacation", label: _("Vacation") },
        { key: "email", label: _("Email Notifications") },
        { key: "announcement", label: _("Announcements Preferences") },
        { key: "blocked_players", label: _("Blocked Players") },
        { key: "account", label: _("Account Settings"), ref: accountSettingsButton },
        { key: "link", label: _("Account Linking") },
        { key: "help", label: _("Help Settings") },

        /*
        {
            key: "experiments",
            label: pgettext(
                "Optional user interface experiments for user testing and feedback",
                "Experiments",
            ),
        },
        */
        { key: "logout", label: _("Logout") },
    ];

    let SelectedPage: (props: SettingGroupPageProps) => React.ReactElement | null = () => (
        <div>Error</div>
    );

    switch (selected) {
        case "general":
            SelectedPage = GeneralPreferences;
            break;
        case "sound":
            SelectedPage = SoundPreferences;
            break;
        case "game":
            SelectedPage = GamePreferences;
            break;
        case "theme":
            SelectedPage = ThemePreferences;
            break;
        case "chat":
            SelectedPage = ChatPreferences;
            break;
        case "gotv":
            SelectedPage = GoTVPreferences;
            break;
        case "supporter":
            SelectedPage = SupporterSettings;
            break;
        case "moderator":
            SelectedPage = ModeratorPreferences;
            break;
        case "vacation":
            SelectedPage = VacationSettings;
            break;
        case "email":
            SelectedPage = EmailPreferences;
            break;
        case "account":
            SelectedPage = AccountSettings;
            break;
        case "blocked_players":
            SelectedPage = BlockedPlayerPreferences;
            break;
        case "announcement":
            SelectedPage = AnnouncementPreferences;
            break;
        case "help":
            SelectedPage = HelpSettings;
            break;
        case "link":
            SelectedPage = LinkPreferences;
            break;
        case "logout":
            SelectedPage = LogoutPreferences;
            break;

        /*
        case "experiments":
            SelectedPage = Experiments;
            break;
            */
    }

    const child_props: SettingGroupPageProps = {
        state: settings_state,
        vacation_base_time: vacation_base_time,
        refresh: refresh,
        updateSelfReportedAccountLinkages: (new_link: any) => {
            const ns = dup(settings_state);
            ns.self_reported_account_linkages = new_link;
            setSettingsState(ns);
        },
    };

    const user = data.get("user");

    return (
        <div className="Settings container">
            <h2 className="page-title">
                <i className="fa fa-gear"></i>
                {_("Settings")}
            </h2>

            <div id="SettingsContainer">
                {/* Desktop selector - mobile below */}
                <SettingsGroupSelector>
                    {groups
                        .filter(
                            (x) =>
                                x.key !== "moderator" || user.is_moderator || user.moderator_powers,
                        )
                        .map((x) => (
                            <SettingsGroup
                                key={x.key}
                                selected={selected === x.key}
                                onClick={() => select(x.key)}
                                ref={x.ref}
                            >
                                {x.label}
                            </SettingsGroup>
                        ))}
                </SettingsGroupSelector>

                {/* Mobile selector - desktop above */}
                <Select
                    id="SettingsGroupDropdown"
                    className="settings-group-option-select"
                    classNamePrefix="ogs-react-select"
                    value={groups.filter((opt) => opt.key === selected)[0]}
                    getOptionValue={(data) => data.key}
                    onChange={(data: any) => select(data.key)}
                    options={groups.filter(
                        (x) => x.key !== "moderator" || user.is_moderator || user.moderator_powers,
                    )}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                            <div
                                ref={innerRef}
                                {...innerProps}
                                className={
                                    "settings-group " +
                                    (isFocused ? "focused " : "") +
                                    (isSelected ? "selected" : "")
                                }
                            >
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({ innerProps, data }) => (
                            <span {...innerProps} className="settings-group">
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({ children }) => (
                            <div className="settings-group-container">{children}</div>
                        ),
                    }}
                />

                <div id="SelectedSettingsContainer">
                    {loaded ? <SelectedPage {...child_props} /> : <LoadingPage />}
                </div>
            </div>
        </div>
    );
}

function SettingsGroupSelector(props: { children: React.ReactNode }): React.ReactElement {
    return <div id="SettingsGroupSelector">{props.children}</div>;
}

type SettingsGroupProps = { selected: boolean; onClick: () => void; children: React.ReactNode };

const SettingsGroup = React.forwardRef<HTMLDivElement, SettingsGroupProps>(
    (props: SettingsGroupProps, ref): React.ReactElement => {
        return (
            <div
                className={"SettingsGroup" + (props.selected ? " selected" : "")}
                onClick={props.onClick}
                ref={ref}
            >
                {props.children}
                <span className="spacer" />
                {props.selected ? <i className="fa fa-chevron-right" /> : <i />}
            </div>
        );
    },
);

function LogoutPreferences(): React.ReactElement {
    return (
        <div className="LogoutButtons">
            <div>
                <button onClick={logout} className="primary">
                    {_("Logout")}
                </button>
            </div>

            <div>
                <button onClick={logoutOtherDevices} className="danger">
                    {_("Logout other devices")}
                </button>
            </div>

            <div>
                <button onClick={logoutAndClearLocalData} className="danger">
                    {_("Logout and clear all settings")}
                </button>
            </div>
        </div>
    );
}

function SupporterSettings(): React.ReactElement {
    return <Supporter />;
}

/*
export function Experiments(): React.ReactElement {
    const [test, setTest] = React.useState<boolean>(data.get("experiments.test") === "a");

    return (
        <div className="Experiments">
            <PreferenceLine title={"Enable Experimental Interface Changes"}>
                <Toggle
                    checked={test}
                    onChange={(tf) => {
                        data.set("experiments.test", tf ? "a" : undefined);
                        setTest(tf);
                    }}
                />
            </PreferenceLine>
            <Experiment name="test">
                <Variant value="a">
                    <div>Variant div</div>
                </Variant>
                <Default>
                    <div>Default div</div>
                </Default>
            </Experiment>
        </div>
    );
}
*/

preferences.watch(
    "sound.vibrate-on-stone-placement",
    (tf) => {
        try {
            if (tf && navigator.vibrate) {
                navigator.vibrate(50);
            }
        } catch (e) {
            console.error(e);
        }
    },
    false,
    true,
);

_("I receive an invitation to a group");
_("A tournament you have joined has started");
_("Game has been resumed from the stone removal phase");
_("Someone requests to join my group");
_("Group news is sent out");
_("Someone challenges me to a game");
_("It is my turn to move");
_("A game starts");
_("A game ends");
_("I am running out of time to make a move");
_("A user sends you a mail message");
_("I receive an invitation to a tournament");
_("A tournament you have joined has finished");
_("Someone sends me a friend request");
