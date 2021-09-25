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
import * as preferences from "preferences";
import * as data from "data";
import * as moment from "moment";

import Select from 'react-select';
import ITC from 'ITC';
import { ValidPreference } from "preferences";
import { Link } from "react-router-dom";
import { _, pgettext, interpolate } from "translate";
import { post, get, put, del, abort_requests_in_flight, getCookie } from "requests";
import { errorAlerter, errorLogger, ignore, Timeout, dup } from "misc";
import { durationString } from "TimeControl";
import { allRanks, IRankInfo } from "rank_utils";
import { Card } from "material";
import { sfx, SpriteGroups, sprite_packs, ValidSound, ValidSoundGroup } from "sfx";
import { SpritePack } from "sfx_sprites";
import { current_language, setCurrentLanguage, languages } from "translate";
import { toast } from 'toast';
import { profanity_regex } from 'profanity_filter';
import { logout } from 'NavBar';
import { Flag } from "Flag";
import { EventEmitter } from 'eventemitter3';
import { LineText } from 'misc-ui';
import { Toggle } from 'Toggle';
import { LoadingPage } from 'Loading';
import { browserHistory } from "ogsHistory";
import { IAssociation, associations } from "associations";
import { BlockPlayerModal, getAllBlocksWithUsernames } from "BlockPlayer";
import { object } from "prop-types";
import { Player } from "Player";
import { PaginatedTable } from "PaginatedTable";
import { SocialLoginButtons } from "SignIn";


declare var swal;
export const MAX_DOCK_DELAY = 3.0;

ITC.register('logout', (device_uuid) => {
    if (device_uuid !== data.get('device.uuid', '')) {
        swal("This device has been logged out remotely").then(logout).catch(logout);
    }
});

function logoutOtherDevices() {
        swal({
            text: "Logout of other devices you are logged in to?",
            showCancelButton: true,
        }).then((password) => {
            ITC.send("logout", data.get('device.uuid'));
            swal("Other devices have been logged out").then(ignore).catch(ignore);
        }).catch(ignore);
    //get("/api/v0/logout?everywhere=1").then(console.log).catch(errorAlerter);
}

function logoutAndClearLocalData() {
    try {
        get("/api/v0/logout")
        .then((config) => {
            window.location.href = '/';
        })
        .catch(errorLogger);
    } catch (e) {
        console.warn(e);
    }

    try {
        let cookies = document.cookie.split(";");

        for (let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i];
            let eqPos = cookie.indexOf("=");
            let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
    } catch (e) {
        console.warn(e);
    }

    try {
        localStorage.clear();
    } catch (e) {
        console.warn(e);
    }
}


interface SettingsState {
    profile?: any;
    notifications?: any;
    vacation_left?: string;
    hide_ui_class?: boolean;
    self_reported_account_linkages?: any;
}

interface SettingGroupProps {
    state: SettingsState;
    vacation_base_time: number;
    refresh: () => () => void;
    updateSelfReportedAccountLinkages: (link:any) => void;
}

interface SettingsProperties {
    match: {
        params: {
            category: string
        }
    };
}


export function Settings({match:{params:{category}}}:SettingsProperties):JSX.Element {
    const [settings_state, setSettingsState]:[SettingsState, (s: SettingsState) => void] = React.useState({});
    const [vacation_base_time, set_vacation_base_time]:[number, (s: number) => void] = React.useState(Date.now());
    const [loaded, set_loaded]:[number, (b: number) => void] = React.useState(0);

    React.useEffect(refresh, []);

    const selected = category;
    data.set('settings.page-selected', selected);

    function select(s: string): void {
        data.set('settings.page-selected', s);
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
            abort_requests_in_flight('me/settings', 'GET');
        };
    }


    let groups:Array<{key:string, label:string}> = [
        { key: 'general'         , label: _("General Preferences") },
        { key: 'sound'           , label: _("Sound Preferences") },
        { key: 'game'            , label: _("Game Preferences") },
        { key: 'chat'            , label: _("Chat Preferences")},
        { key: 'vacation'        , label: _("Vacation") },
        { key: 'email'           , label: _("Email Notifications") },
        { key: 'announcement'    , label: _("Announcements Preferences") },
        { key: 'blocked_players' , label: _("Blocked Players") },
        { key: 'account'         , label: _("Account Settings") },
        { key: 'link'            , label: _("Account Linking") },
        { key: 'logout'          , label: _("Logout") },
    ];

    let SelectedPage:(props:SettingGroupProps) => JSX.Element = () => <div>Error</div>;

    switch (selected) {
        case 'sound'           : SelectedPage = SoundPreferences        ; break ;
        case 'vacation'        : SelectedPage = VacationSettings        ; break ;
        case 'account'         : SelectedPage = AccountSettings         ; break ;
        case 'logout'          : SelectedPage = LogoutPreferences       ; break ;
        case 'email'           : SelectedPage = EmailPreferences        ; break ;
        case 'announcement'    : SelectedPage = AnnouncementPreferences ; break ;
        case 'blocked_players' : SelectedPage = BlockedPlayerPreferences  ; break ;
        case 'game'            : SelectedPage = GamePreferences         ; break ;
        case 'general'         : SelectedPage = GeneralPreferences      ; break ;
        case 'link'            : SelectedPage = LinkPreferences         ; break ;
        case 'chat'            : SelectedPage = ChatPreferences         ; break ;
    }

    let props:SettingGroupProps = {
        state: settings_state,
        vacation_base_time: vacation_base_time,
        refresh: refresh,
        updateSelfReportedAccountLinkages: (new_link:any) => {
            let ns = dup(settings_state);
            ns.self_reported_account_linkages = new_link;
            setSettingsState(ns);
        }
    };

    return (
        <div className="Settings container">
            <h2 className="page-title"><i className="fa fa-gear"></i>{_("Settings")}</h2>

            <div id='SettingsContainer'>
                <SettingsGroupSelector>
                    {groups.map((x) =>
                        <SettingsGroup key={x.key} selected={selected === x.key} onClick={() => select(x.key)}>{x.label}</SettingsGroup>
                    )}
                </SettingsGroupSelector>

                <Select
                    id='SettingsGroupDropdown'
                    className='settings-group-option-select'
                    classNamePrefix='ogs-react-select'
                    value={groups.filter(opt => opt.key === selected)[0]}
                    getOptionValue={data => data.key}
                    onChange={(data:any) => select(data.key)}
                    options={groups}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                            <div ref={innerRef} {...innerProps}
                                className={'settings-group ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({innerProps, data}) => (
                            <span {...innerProps} className='settings-group'>
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({children}) => (
                            <div className='settings-group-container'>
                                {children}
                            </div>
                        ),
                    }}
                />

                <div id='SelectedSettingsContainer'>
                    {loaded
                        ? <SelectedPage {...props} />
                        : <LoadingPage />
                    }
                </div>
            </div>

        </div>
    );
}

interface PreferenceDropdownProps {
    value: any;
    options: Array<{value: any, label: string}>;
    onChange: (value:any) => void;
}

function PreferenceDropdown(props: PreferenceDropdownProps):JSX.Element {
    return (
        <Select
            className='PreferenceDropdown'
            classNamePrefix='ogs-react-select'
            value={props.options.filter(opt => opt.value === props.value)[0]}
            getOptionValue={data => data.value}
            onChange={(data:any) => props.onChange(data.value)}
            options={props.options}
            isClearable={false}
            isSearchable={false}
            blurInputOnSelect={true}
            components={{
                Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                    <div ref={innerRef} {...innerProps}
                        className={'PreferenceDropdown-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                        {data.label}
                    </div>
                ),
                SingleValue: ({innerProps, data}) => (
                    <span {...innerProps} className='PreferenceDropdown-value'>
                        {data.label}
                    </span>
                ),
                ValueContainer: ({children}) => (
                    <div className='PreferenceDropdown-value-container'>
                        {children}
                    </div>
                ),
            }}
        />
    );
}

function PreferenceLine(props: {title: (string | JSX.Element), description?: string, children: React.ReactNode}):JSX.Element {
    return (
        <div className='PreferenceLine'>
            <span className='PreferenceLineTitle'>
                {props.title}
                {props.description && <div className='PreferenceLineDescription'>{props.description}</div>}
            </span>
            <span className='PreferenceLineBody'>{props.children}</span>
        </div>
    );
}


function SettingsGroupSelector(props: {children: React.ReactNode}):JSX.Element {
    return (
        <div id='SettingsGroupSelector'>
            {props.children}
        </div>
    );
}

function SettingsGroup(props: {selected: boolean, onClick: (ev?: any) => void, children: React.ReactNode}):JSX.Element {
    return (
        <div className={'SettingsGroup' + (props.selected ? ' selected' : '')} onClick={props.onClick}>
            {props.children}
            <span className='spacer'/>
            { props.selected
                    ?  <i className='fa fa-chevron-right' />
                    :  <i />
            }
        </div>
    );
}

function VacationSettings(props:SettingGroupProps):JSX.Element {
    const [vacation_left, set_vacation_left]:[number, (x: number) => void]
        = React.useState(props.state.profile.vacation_left - (Date.now() - props.vacation_base_time) / 1000);


    React.useEffect(() => {
        let vacation_interval = setInterval(() => {
            if (props.state.profile.on_vacation) {
                set_vacation_left(props.state.profile.vacation_left - (Date.now() - props.vacation_base_time) / 1000);
            }
        }, 1000);

        return function cleanup() {
            clearInterval(vacation_interval);
        };
    });

    function endVacation() {
        del("me/vacation")
        .then((data) => props.refresh())
        .catch(errorAlerter);
    }
    function startVacation() {
        put("me/vacation")
        .then((data) => props.refresh())
        .catch(errorAlerter);
    }

    let vacation_string = vacation_left > 0 ? durationString(vacation_left) : ("0 " + _("Seconds").toLowerCase());

    return (
    <div>
        <h3>
            {props.state.profile.on_vacation
                ?  <span className="vacation-status">
                       <i className="fa fa-smile-o"></i>
                           &nbsp; {_("You are on vacation")} &nbsp;
                       <i className="fa fa-smile-o"></i>
                   </span>
                : <span>{_("Vacation Control")}</span>
            }
        </h3>
        <div className="vacation-container">
            <div>
                {props.state.profile.on_vacation
                    ? <button onClick={endVacation} className="primary">{_("End vacation")}</button>
                    : <button onClick={startVacation} className="primary">{_("Go on vacation")}</button>
                }
            </div>

            <div>
                {(!props.state.profile.on_vacation || null) &&
                    <i>
                    {_("This will pause any correspondence games you are in until you end your vacation")}
                    </i>
                }
            </div>

            <div>{interpolate(_("You have {{vacation_left}} of vacation available"),
                              {vacation_left: vacation_string})
            }</div>
        </div>
    </div>
    );
}

function LogoutPreferences(props:SettingGroupProps):JSX.Element {
    return (
        <div className='LogoutButtons'>
            <div>
                <button onClick={logout} className="primary">{_("Logout")}</button>
            </div>

            <div>
                <button onClick={logoutOtherDevices} className="danger">{_("Logout other devices")}</button>
            </div>

            <div>
                <button onClick={logoutAndClearLocalData} className="danger">{_("Logout and clear all settings")}</button>
            </div>
        </div>
    );
}


function AccountSettings(props:SettingGroupProps):JSX.Element {
    const [password1, setPassword1]:[string, (x: string) => void] = React.useState('');
    const [password2, setPassword2]:[string, (x: string) => void] = React.useState('');
    const [email, __setEmail]:[string, (x: string) => void] = React.useState(props.state.profile.email);
    const [email_changed, setEmailChanged]:[boolean, (x: boolean) => void] = React.useState();
    const [message, setMessage]:[string, (x: string) => void] = React.useState('');
    const [settings, setSettings]:[any, (x: any) => void] = React.useState({});

    React.useEffect(refreshAccountSettings, []);

    let user = data.get('user');

    function refreshAccountSettings() {
        get(`me/account_settings`)
        .then((settings) => {
            console.log(settings);
            setSettings(settings);
        })
        .catch(errorLogger);
    }

    function setEmail(s:string):void {
        __setEmail(s);
        setEmailChanged(true);
    }

    function passwordIsValid():boolean {
        return password1.length < 1024 && password1.length > 3 && password1 === password2;
    }

    function emailIsValid():boolean {
        if (email.trim() === "") {
            return true;
        }
        let re = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;
        return re.test(email.trim());
    }

    function saveEmail():void {
        put("players/%%", user.id, { email })
        .then(() => {
            setEmailChanged(false);
            setMessage(_("Email updated successfully!"));
        }).catch(errorAlerter);
    }

    function savePassword():void {
        if (!settings.password_is_set) { // social auth account
            post("/api/v0/changePassword", {
                "new_password": password1,
                "old_password": "!",
            })
            .then((obj) => {
                props.refresh();
                refreshAccountSettings();
                swal(_("Password updated successfully!"));
            })
            .catch(errorAlerter);
        } else {
            swal({
                text: _("Enter your current password"),
                input: "password",
            }).then((password) => {
                post("/api/v0/changePassword", {
                    "old_password": password,
                    "new_password": password1,
                })
                .then((obj) => {
                    swal(_("Password updated successfully!"));
                })
                .catch(errorAlerter);
            }).catch(errorAlerter);
        }
    }

    function resendValidationEmail() {
        post("me/validateEmail", {})
        .then(() => {
            swal("Validation email sent! Please check your email and click the validation link.");
        })
        .catch(errorAlerter);
    }

    function deleteAccount():void {

        function doDel(password:string | null) {
            if (user && user.id) {
                del(`players/${user.id}`, {
                    "password": password,
                })
                .then(() => {
                    try {
                        data.remove('user');
                    } catch (e) {
                    }

                    try {
                        data.removePrefix('config');
                    } catch (e) {
                    }

                    try {
                        data.removePrefix('preferences');
                    } catch (e) {
                    }

                    window.location.href = "/";
                })
                .catch(errorAlerter);
            }
        }
        if (user && user.id) {
            if (!settings.password_is_set) { // social auth account
                swal({text: _("Are you sure you want to delete this account? This cannot be undone."), showCancelButton: true})
                .then(() => {
                    doDel(null);
                })
                .catch(ignore);
            } else {
                swal({
                    text: _("Enter your current password"),
                    input: "password",
                }).then((password) => {
                    doDel(password);
                }).catch(errorAlerter);
            }
        }
    }

    return (
        <div>
            <i><Link to={`/user/view/${user.id}#edit`}>{_("To update your profile information, click here")}</Link></i>
            <dl>
                <dt>{_("Email address")}</dt>
                <dd><input type="email" name="new_email" value={email} onChange={ev => setEmail(ev.target.value)} />
                {!email_changed ? null :
                    <button disabled={!emailIsValid()} className="primary" onClick={saveEmail}>
                        {emailIsValid() ? _("Update email address") : _("Email address is not valid")}
                    </button>
                }
                {message && <div>{message}</div>}
                {email && !email_changed && !user.email_validated &&
                    <div>
                        <div className='awaiting-validation-text'>
                            {_("Awaiting email address confirmation. Chat will be disabled until your email address has been validated.")}
                        </div>
                        <button onClick={resendValidationEmail}>{_("Resend validation email")}</button>
                    </div>
                }
                </dd>

                <dt>{_("Password")}</dt>
                <dd className="password-update">
                    <div>
                        <input type="password" value={password1} onChange={ev => setPassword1(ev.target.value)} />
                    </div>
                    <div>
                        <input placeholder={_("(again)")} type="password" value={password2} onChange={ev => setPassword2(ev.target.value)} />
                    </div>
                    <div>
                        {password1.length === 0 ? null :
                            <button disabled={!passwordIsValid()} className="primary" onClick={savePassword}>
                                {passwordIsValid() ?  _("Update password") :  _("Passwords don't match")}
                            </button>
                        }
                    </div>
                </dd>


                <dt>{_("Social account linking")}</dt>
                {settings.social_auth_accounts &&
                    <dd>
                        {settings.social_auth_accounts.map((account, idx) =>
                            <div key={account.provider}>
                            <div className='social-link'>
                                {account.provider === "google-oauth2" && <span className="google google-oauth2-icon" />}
                                {account.provider === "facebook" && <span className="facebook facebook-icon" />}
                                {account.provider === "twitter" && <i className="twitter twitter-icon fa fa-twitter" />}
                                {account.provider === "apple-id" && <i className="apple apple-id-icon fa fa-apple" />}

                                {account.uid}

                                <form method='POST' action={`/disconnect/${account.provider}/`}>
                                    <input type='hidden' name='csrfmiddlewaretoken' value={getCookie("csrftoken")} />
                                    {settings.password_is_set && <button type='submit'>Unlink</button>}
                                </form>
                            </div>
                            </div>
                        )}
                    </dd>
                }

                <dd>
                    <SocialLoginButtons />
                </dd>

                <dt>{_("Delete account")}</dt>
                <dd><i>{_("Warning: this action is permanant, there is no way to recover an account after it's been deleted.")}</i></dd>
                <dd><button className='reject' onClick={deleteAccount}>{_("Delete account")}</button></dd>
            </dl>

        </div>
    );
}

function ChatPreferences(props:SettingGroupProps):JSX.Element {
    const [show_empty_chat_notification, _setEmptyChatNotification]:[boolean, (x: boolean) => void] = React.useState(preferences.get("show-empty-chat-notification"));
    const [group_chat_unread, _setGroupChatUnread]:[boolean, (x: boolean) => void] = React.useState(preferences.get("chat-subscribe-group-chat-unread"));
    const [group_chat_mentions, _setGroupChatMentions]:[boolean, (x: boolean) => void] = React.useState(preferences.get("chat-subscribe-group-mentions"));
    const [tournament_chat_unread, _setTournamentChatUnread]:[boolean, (x: boolean) => void] = React.useState(preferences.get("chat-subscribe-tournament-chat-unread"));
    const [tournament_chat_mentions, _setTournamentChatMentions]:[boolean, (x: boolean) => void] = React.useState(preferences.get("chat-subscribe-tournament-mentions"));

    function toggleEmptyChatNotification(checked) {
        preferences.set("show-empty-chat-notification", checked);
        _setEmptyChatNotification(checked);
    }

    function toggleGroupChatMentions(checked) {
        preferences.set("chat-subscribe-group-mentions", checked);
        _setGroupChatMentions(checked);
    }

    function toggleGroupChatUnread(checked) {
        preferences.set("chat-subscribe-group-chat-unread", checked);
        _setGroupChatUnread(checked);
    }

    function toggleTournamentChatMentions(checked) {
        preferences.set("chat-subscribe-tournament-mentions", checked);
        _setTournamentChatMentions(checked);
    }

    function toggleTournamentChatUnread(checked) {
        preferences.set("chat-subscribe-tournament-chat-unread", checked);
        _setTournamentChatUnread(checked);
    }

    return (
        <div>
            <PreferenceLine title={_("Show chat notification icon when there are no unread messages.")}>
                <Toggle checked={show_empty_chat_notification} onChange={toggleEmptyChatNotification}/>
            </PreferenceLine>

            <PreferenceLine title={_("Notify me when I'm mentioned in group chats I'm a member of.")}
                description={_("This only applies to chats you haven't choosen a different setting.")}
                >
                <Toggle checked={group_chat_mentions} onChange={toggleGroupChatMentions}/>
            </PreferenceLine>

            <PreferenceLine title={_("Notify me about unread messages in group chats I'm a member of.")}
                description={_("This only applies to chats you haven't choosen a different setting.")}
                >
                <Toggle checked={group_chat_unread} onChange={toggleGroupChatUnread}/>
            </PreferenceLine>

            <PreferenceLine title={_("Notify me when I'm mentioned in tournament chats I'm a member of.")}
                description={_("This only applies to chats you haven't choosen a different setting.")}
                >
                <Toggle checked={tournament_chat_mentions} onChange={toggleTournamentChatMentions}/>
            </PreferenceLine>

            <PreferenceLine title={_("Notify me about unread messages in tournament chats I'm a member of.")}
                description={_("This only applies to chats you haven't choosen a different setting.")}
                >
                <Toggle checked={tournament_chat_unread} onChange={toggleTournamentChatUnread}/>
            </PreferenceLine>
        </div>
    );
}

function EmailPreferences(props:SettingGroupProps):JSX.Element {
    return (
        <div>
            {_("Email me a notification when ...")}
            {Object.keys(props.state.notifications).map((k, idx) =>
                <EmailNotificationToggle key={k} name={_(props.state.notifications[k].description)} notification={k} state={props.state} />
            )}
        </div>
    );
}

function BlockedPlayerPreferences(props:SettingGroupProps):JSX.Element {
    let [blocked_players, setBlockedPlayers]: [Array<any> | null, (x:Array<any> | null) => void] = React.useState(null);

    React.useEffect(() => {
        getAllBlocksWithUsernames()
        .then((blocks) => setBlockedPlayers(blocks))
        .catch(errorAlerter);
    }, []);

    if (blocked_players === null) {
        return (
            <div id="BlockedPlayers">
            </div>
        );
    }

    return (
        <div id="BlockedPlayers">
            <h2>{_("Blocked players")}</h2>
            <div>
                {blocked_players.map((block_state) => {
                    let user_id = block_state.blocked;
                    if (!user_id) {
                        return (null);
                    }
                    return (
                        <div key={user_id} className='blocked-player-row'>
                            <span className='blocked-player'>{block_state.username}</span>
                            <BlockPlayerModal playerId={user_id} inline={true} />
                        </div>
                    );
                })}

                {blocked_players.length === 0
                    ? <div>{_("You have not blocked any players")}</div> : null }
            </div>
            <br/>
        </div>
    );
}

function AnnouncementPreferences(props:SettingGroupProps):JSX.Element {
    let [blocked_players, setBlockedPlayers]: [Array<any> | null, (x:Array<any> | null) => void] = React.useState(null);

    React.useEffect(() => {
        getAllBlocksWithUsernames()
        .then((blocks) => {
            blocks = blocks.filter(bs => bs.block_announcements);
            setBlockedPlayers(blocks);
        })
        .catch(errorAlerter);
    }, []);

    const [mute_stream_announcements, _muteStreamAnnouncements]:[boolean, (x: boolean) => void] =
        React.useState(preferences.get("mute-stream-announcements"));
    const [mute_event_announcements, _muteEventAnnouncements]:[boolean, (x: boolean) => void] =
        React.useState(preferences.get("mute-event-announcements"));

    function toggleMuteStreamAnnouncements(checked) {
        preferences.set("mute-stream-announcements", checked);
        _muteStreamAnnouncements(checked);
    }

    function toggleMuteEventAnnouncements(checked) {
        preferences.set("mute-event-announcements", checked);
        _muteEventAnnouncements(checked);
    }

    return (
        <div id="AnnouncementPreferences">
            <br/>
            <h2>{_("Announcements")}</h2>
            <div>
                <PreferenceLine title={_("Hide stream announcements")}>
                    <Toggle checked={mute_stream_announcements} onChange={toggleMuteStreamAnnouncements} />
                </PreferenceLine>
                <PreferenceLine title={_("Hide event announcements")}>
                    <Toggle checked={mute_event_announcements} onChange={toggleMuteEventAnnouncements} />
                </PreferenceLine>
            </div>

            <h2>{_("Announcement History")}</h2>

            <PaginatedTable
                className="announcement-history"
                source={`announcements/history`}
                orderBy={["-timestamp"]}
                columns={[
                    {header: "Time"      , className: "announcement-time ", render: (a) => moment(a.timestamp).format('YYYY-MM-DD LTS')},
                    {header: "Duration"  , className: "", render: (a) => {
                            let ms = moment(a.expiration).diff(moment(a.timestamp));
                            let d = moment.duration(ms);
                            return Math.floor(d.asHours()) + moment.utc(ms).format(":mm");
                            //.format('HH:mm')
                        }
                    },
                    {header: "Type"      , className: "announcement-type ", render: (a) => {
                        switch (a.type) {
                            case "system": return pgettext("Announcement type", "System");
                            case "event": return pgettext("Announcement type", "Event");
                            case "stream": return pgettext("Announcement type (video stream)", "Stream");
                        }
                        return a.type;
                    }},
                    {header: "Player"    , className: "", render: (a) => <Player user={a.creator} />},
                    {header: "Message"   , className: "announcement-message", render: (a) => a.text},
                    {header: "Link"      , className: "announcement-link", render: (a) => <a href={a.link}>{a.link}</a>},
                ]}
            />

            {blocked_players && blocked_players.length > 0 &&
                <div>
                    <h2>{_("Blocked players")}</h2>
                    {blocked_players.map((block_state) => {
                        let user_id = block_state.blocked;
                        if (!user_id) {
                            return (null);
                        }
                        return (
                            <div key={user_id} className='blocked-player-row'>
                                <span className='blocked-player'>{block_state.username}</span>
                                <BlockPlayerModal playerId={user_id} inline={true} onlyAnnouncements={true} />
                            </div>
                        );
                    })}
                </div>
            }
        </div>
    );
}

function GamePreferences(props:SettingGroupProps):JSX.Element {
    const [dock_delay, _setDockDelay]:[number, (x: number) => void] = React.useState(preferences.get("dock-delay"));
    const [ai_review_enabled, _setAiReviewEnabled]:[boolean, (x: boolean) => void] = React.useState(preferences.get("ai-review-enabled"));
    const [variations_in_chat, _setVariationsInChat]:[boolean, (x: boolean) => void] = React.useState(preferences.get("variations-in-chat-enabled"));
    const [live_submit_mode, _setLiveSubmitMode]:[string, (x: string) => void] = React.useState(getSubmitMode('live'));
    const [corr_submit_mode, _setCorrSubmitMode]:[string, (x: string) => void] = React.useState(getSubmitMode('correspondence'));
    const [board_labeling, _setBoardLabeling]:[string, (x: string) => void] = React.useState(preferences.get('board-labeling'));

    const [autoadvance, _setAutoAdvance]:[boolean, (x: boolean) => void] = React.useState(preferences.get('auto-advance-after-submit'));
    const [always_disable_analysis, _setAlwaysDisableAnalysis]:[boolean, (x: boolean) => void] = React.useState(preferences.get('always-disable-analysis'));
    const [dynamic_title, _setDynamicTitle]:[boolean, (x: boolean) => void] = React.useState(preferences.get('dynamic-title'));
    const [function_keys_enabled, _setFunctionKeysEnabled]:[boolean, (x: boolean) => void] = React.useState(preferences.get('function-keys-enabled'));
    const [autoplay_delay, _setAutoplayDelay]:[number, (x: number) => void] = React.useState(preferences.get('autoplay-delay') / 1000);
    const [variation_stone_transparency, _setVariationStoneTransparency]:[number, (x: number) => void] = React.useState(preferences.get("variation-stone-transparency"));
    const [visual_undo_request_indicator, _setVisualUndoRequestIndicator]:[boolean, (x: boolean) => void] = React.useState(preferences.get("visual-undo-request-indicator"));

    function setDockDelay(ev) {
        let new_delay = parseFloat(ev.target.value);
        preferences.set("dock-delay", new_delay);
        _setDockDelay(new_delay);
    }
    function toggleAIReview(checked) {
        preferences.set("ai-review-enabled", !checked);
        _setAiReviewEnabled(!checked);
    }
    function toggleVariationsInChat(checked) {
        preferences.set("variations-in-chat-enabled", !checked);
        _setVariationsInChat(!checked);
    }

    function setAutoAdvance(checked) {
        preferences.set("auto-advance-after-submit", checked),
        _setAutoAdvance(preferences.get("auto-advance-after-submit"));
    }
    function setAlwaysDisableAnalysis(checked) {
        preferences.set("always-disable-analysis", checked),
        _setAlwaysDisableAnalysis(preferences.get("always-disable-analysis"));
    }
    function setDynamicTitle(checked) {
        preferences.set("dynamic-title", checked),
        _setDynamicTitle(preferences.get("dynamic-title"));
    }
    function setFunctionKeysEnabled(checked) {
        preferences.set("function-keys-enabled", checked),
        _setFunctionKeysEnabled(preferences.get("function-keys-enabled"));
    }

    function getSubmitMode(speed) {
        let single = preferences.get(`one-click-submit-${speed}` as ValidPreference);
        let dbl = preferences.get(`double-click-submit-${speed}` as ValidPreference);
        return single ? "single" : (dbl ? "double" : "button");
    }
    function setSubmitMode(speed, mode) {
        switch (mode) {
            case "single":
                preferences.set(`double-click-submit-${speed}` as ValidPreference, false);
                preferences.set(`one-click-submit-${speed}` as ValidPreference, true);
                break;
            case "double":
                preferences.set(`double-click-submit-${speed}` as ValidPreference, true);
                preferences.set(`one-click-submit-${speed}` as ValidPreference, false);
                break;
            case "button":
                preferences.set(`double-click-submit-${speed}` as ValidPreference, false);
                preferences.set(`one-click-submit-${speed}` as ValidPreference, false);
                break;
        }
        if (speed === "live") {
            _setLiveSubmitMode(getSubmitMode(speed));
        }
        if (speed === "correspondence") {
            _setCorrSubmitMode(getSubmitMode(speed));
        }
    }
    function setLiveSubmitMode(value) {
        setSubmitMode("live", value);
    }
    function setCorrSubmitMode(value) {
        setSubmitMode("correspondence", value);
    }
    function setVariationStoneTransparency(ev) {
        let value = parseFloat(ev.target.value);

        if (value >= 0.0 && value <= 1.0) {
            _setVariationStoneTransparency(value);
            preferences.set("variation-stone-transparency", value);
        }
    }
    function setVisualUndoRequestIndicator(checked) {
        preferences.set("visual-undo-request-indicator", checked);
        _setVisualUndoRequestIndicator(checked);
    }
    function setBoardLabeling(value) {
        preferences.set('board-labeling', value);
        _setBoardLabeling(value);
    }
    function updateAutoplayDelay(ev) {
        let delay = parseFloat(ev.target.value);

        if (delay >= 0.1) {
            _setAutoplayDelay(delay);
            preferences.set("autoplay-delay", Math.round(1000 * delay));
        }
    }

    return (
        <div>
            <PreferenceLine title={
                _("Game-control-dock pop-out delay") // translators: This is the text under settings for controling the slide out delay of the list of game buttons in the game (pause, review, sgf link, etc...)
            }>
                <input type="range"
                       onChange={setDockDelay}
                          value={dock_delay} min={0} max={MAX_DOCK_DELAY} step={0.1}
                />
                <span>&nbsp;{
                    dock_delay === MAX_DOCK_DELAY
                        ?  _("Off") // translators: Indicates the dock slide out has been turned off
                        : interpolate(_("{{number_of}} seconds"), { number_of:  dock_delay}) // translators: Indicates the number of seconds to delay the slide out of the panel of game buttons on the right side of the game page
                }</span>
            </PreferenceLine>

            <PreferenceLine title={_("Board labeling")}>
                <PreferenceDropdown
                    value={board_labeling}
                    options={[
                        { value: "automatic", label: _("Automatic")},
                        { value: "A1", label: "A1"},
                        { value: "1-1", label: "1-1"},
                    ]}
                    onChange={setBoardLabeling}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Live game submit mode")}>
                <PreferenceDropdown
                    value={getSubmitMode('live')}
                    options={[
                        { value: "single", label: _("One-click to move") },
                        { value: "double", label: _("Double-click to move") },
                        { value: "button", label: _("Submit-move button") },
                    ]}
                    onChange={setLiveSubmitMode}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Correspondence submit mode")}>
                <PreferenceDropdown
                    value={getSubmitMode('correspondence')}
                    options={[
                        { value: "single", label: _("One-click to move") },
                        { value: "double", label: _("Double-click to move") },
                        { value: "button", label: _("Submit-move button") },
                    ]}
                    onChange={setCorrSubmitMode}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Auto-advance to next game after making a move")}>
                <Toggle checked={autoadvance} onChange={setAutoAdvance} />
            </PreferenceLine>

            <PreferenceLine title={_("Autoplay delay (in seconds)")}>
                <input type="number" step="0.1" min="0.1" onChange={updateAutoplayDelay} value={autoplay_delay} />
            </PreferenceLine>

            <PreferenceLine title={_("Disable AI review")}
                description={_("This will enable or disable the artificial intelligence reviews at the end of a game.")}
                >
                <Toggle checked={!ai_review_enabled} onChange={toggleAIReview}/>
            </PreferenceLine>

            <PreferenceLine title={_("Always disable analysis")}
                description={_("This will disable the analysis mode and conditional moves for you in all games, even if it is not disabled in the game's settings. (If allowed in game settings, your opponent will still have access to analysis.)")}
                >
                <Toggle checked={always_disable_analysis} onChange={setAlwaysDisableAnalysis} />
            </PreferenceLine>

            <PreferenceLine title={_("Visual undo request indicator")}
                description={_("This will cause an undo request to be indicated by a mark on your opponent's last move.")}
                >
                <Toggle checked={visual_undo_request_indicator} onChange={setVisualUndoRequestIndicator} />
            </PreferenceLine>

            <PreferenceLine title={_("Dynamic title")}
                description={_("Choose whether to show in the web page title whose turn it is (dynamic) or who the users are (not dynamic)")}
                >
                <Toggle checked={dynamic_title} onChange={setDynamicTitle} />
            </PreferenceLine>

            <PreferenceLine title={_("Enable function keys for game analysis shortcuts")}>
                <Toggle checked={function_keys_enabled} onChange={setFunctionKeysEnabled} />
            </PreferenceLine>

            <PreferenceLine title={_("Disable clickable variations in chat")}
                description={_("This will enable or disable the hoverable and clickable variations displayed in a game or review chat.")}
                >
                <Toggle checked={!variations_in_chat} onChange={toggleVariationsInChat}/>
            </PreferenceLine>

            <PreferenceLine title={_("Variation stone transparency")}
                description={_("Choose the level of transparency for stones shown in variations. 0.0 is transparent and 1.0 is opaque.")}
                >
                <input type="number" step="0.1" min="0.0" max="1.0" onChange={setVariationStoneTransparency} value={variation_stone_transparency} />
            </PreferenceLine>
        </div>
    );
}


function GeneralPreferences(props:SettingGroupProps):JSX.Element {
    const [profanity_filter, _setProfanityFilter]:[Array<string>, (x: Array<string>) => void]
        = React.useState(Object.keys(preferences.get("profanity-filter")));
    const [game_list_threshold, _setGameListThreshold]:[number, (x: number) => void]
        = React.useState(preferences.get("game-list-threshold"));
    const [desktop_notifications, _setDesktopNotifications]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("desktop-notifications"));
    const [show_offline_friends, _setShowOfflineFriends]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("show-offline-friends"));
    const [unicode_filter_usernames, _setUnicodeFilterUsernames]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("unicode-filter"));
    const [translation_dialog_never_show, _setTranslationDialogNeverShow]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("translation-dialog-never-show"));
    const [hide_ui_class, setHideUiClass]:[boolean, (x: boolean) => void]
        = React.useState(props.state.hide_ui_class);
    const [show_tournament_indicator, _setShowTournamentIndicator]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("show-tournament-indicator"));
    const [hide_ranks, _setHideRanks]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("hide-ranks"));
    const [rating_graph_always_use, _setAlwaysUse]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("rating-graph-always-use"));
    const [rating_graph_plot_by_games, _setUseGames]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("rating-graph-plot-by-games"));
    const [incident_report_notifications, setIncidentReportNotifications]:[boolean, (x: boolean) => void]
        = React.useState(preferences.get("notify-on-incident-report"));

    const user = data.get("user");
    const desktop_notifications_enableable:boolean = typeof(Notification) !== "undefined";

    let desktop_notifications_enabled = false;
    try {
        desktop_notifications_enabled = preferences.get("desktop-notifications") && (Notification as any).permission === "granted";
    } catch (e) {
        /* not all browsers support the Notification API */
    }

    function updateProfanityFilter(langs: {value: string, label: string}[]) {
        if (!langs) {
            langs = [];
        }

        let new_profanity_settings = {};

        langs.forEach((lang) => {
            new_profanity_settings[lang.value] = true;
        });

        preferences.set("profanity-filter", new_profanity_settings);
        _setProfanityFilter(langs.map(lang => lang.value));
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

    function setShowOfflineFriends(checked) {
        preferences.set("show-offline-friends", checked);
        _setShowOfflineFriends(preferences.get("show-offline-friends"));
    }

    function setUnicodeFilterUsernames(checked) {
        preferences.set("unicode-filter", checked);
        _setUnicodeFilterUsernames(preferences.get("unicode-filter"));
    }

    function setTranslationDialogNeverShow(checked) {
        preferences.set("translation-dialog-never-show", checked);
        _setTranslationDialogNeverShow(preferences.get("translation-dialog-never-show"));
    }

    function updateDesktopNotifications(enabled) {
        if (!enabled) {
            //this.setState({'desktop_notifications_enabled': false});
        }

        try {
            preferences.set('desktop-notifications', enabled);
            _setDesktopNotifications(enabled);

            if (enabled) {
                if ((Notification as any).permission === 'denied') {
                    //this.setState({'desktop_notifications_enabled': false});
                    toast(<div>{_("You have previously denied desktop notifications on OGS, you will need to go into your browser settings and change your decision there to enable them.")}</div>);
                }

                if ((Notification as any).permission === 'granted') {
                    //this.setState({'desktop_notifications_enabled': true});
                }

                if ((Notification as any).permission === 'default') {
                    let onRequestResult = (perm) => {
                        if (perm === "granted") {
                            //this.setState({'desktop_notifications_enabled': true});
                            console.log("granted notification permission");
                        } else {
                            //this.setState({'desktop_notifications_enabled': false});
                            toast(<div>{_("You have previously denied desktop notifications on OGS, you will need to go into your browser settings and change your decision there to enable them.")}</div>);
                        }
                    };

                    try {
                        Notification.requestPermission()
                            .then(onRequestResult)
                            .catch(ignore);
                    } catch (e) {
                        /* deprecated usage, but only way supported on safari currently */
                        // tslint:disable-next-line:no-floating-promises
                        Notification.requestPermission(onRequestResult);
                    }

                }
            }
        } catch (e) {
            console.error(e);
        }
    }

    function updateHideUIClass(checked) {
        setHideUiClass(!checked);
        put(`me/settings`, {
            'site_preferences': {
                'hide_ui_class': !checked
            }
        })
        .catch(errorAlerter);
    }

    function setShowTournamentIndicator(checked) {
        preferences.set("show-tournament-indicator", checked),
        _setShowTournamentIndicator(preferences.get("show-tournament-indicator"));
    }

    function setAlwaysUse(checked) {
        preferences.set("rating-graph-always-use", checked),
        _setAlwaysUse(preferences.get("rating-graph-always-use"));
    }

    function setPlotByGames(checked) {
        preferences.set("rating-graph-plot-by-games", checked),
        _setUseGames(preferences.get("rating-graph-plot-by-games"));
    }

    function setHideRanks(checked) {
        preferences.set("hide-ranks", checked),
        _setHideRanks(preferences.get("hide-ranks"));
    }

    function updateIncidentReportNotifications(checked) {
        preferences.set("notify-on-incident-report", checked);
        setIncidentReportNotifications(checked);
    }

    const language_options = Object.entries(languages).map(lang_entry => ({
        'value': lang_entry[0], 'label': lang_entry[1]
    }));

    function setLanguage(language_code: string) {
            preferences.set("language", language_code);
            setCurrentLanguage(language_code);
            window.location.reload();
    }

    return (
        <div>
            <PreferenceLine title={_("Language")}>
                <PreferenceDropdown
                    value={current_language}
                    options={language_options}
                    onChange={setLanguage}
                />
            </PreferenceLine>

            <PreferenceLine title={_("Profanity filter")}>
                <Select
                    className = "ProfanityDropdown"
                    classNamePrefix = "ogs-react-select"
                    defaultValue = {language_options.filter(lang =>
                        profanity_filter.indexOf(lang.value) >= 0)}
                    options = {language_options.filter(lang =>
                        lang.value in profanity_regex)}
                    onChange = {updateProfanityFilter}
                    isMulti
                    />
            </PreferenceLine>

            <PreferenceLine title={_("Game thumbnail list threshold")} description={_("Set to 0 to always show list.")}>
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

                {!desktop_notifications_enableable &&
                    <div><i>
                    {_("Desktop notifications are not supported by your browser")}
                    </i></div>
                }
            </PreferenceLine>

            <PreferenceLine title={_("Show offline friends on list")}>
                <Toggle checked={show_offline_friends} onChange={setShowOfflineFriends} />
            </PreferenceLine>

            <PreferenceLine title={_("Hide special unicode symbols in usernames")}>
                <Toggle checked={unicode_filter_usernames} onChange={setUnicodeFilterUsernames} />
            </PreferenceLine>

            <PreferenceLine title={_('Never show the "needs translation" message on the home page')}>
                <Toggle checked={translation_dialog_never_show} onChange={setTranslationDialogNeverShow} />
            </PreferenceLine>

            {(user.supporter || user.is_moderator || null) &&
                <PreferenceLine title={_("Golden supporter name")}>
                    <Toggle checked={!hide_ui_class} onChange={updateHideUIClass} id='hide_ui_class' />
                </PreferenceLine>
            }

            <PreferenceLine title={_("Show tournament indicator")}>
                <Toggle checked={show_tournament_indicator} onChange={setShowTournamentIndicator} />
            </PreferenceLine>

            <PreferenceLine title={_("Hide ranks and ratings")}>
                <Toggle checked={hide_ranks} onChange={setHideRanks} />
            </PreferenceLine>

            <PreferenceLine title={_("Plot rating graph by")}>
                <span>{_("Ask me")}</span><Toggle checked={rating_graph_always_use} onChange={setAlwaysUse} />
                <span>{_("Always use:")}</span><span>{_("time")}</span><Toggle checked={rating_graph_plot_by_games} onChange={setPlotByGames} disabled={!preferences.get("rating-graph-always-use")}/><span>{_("games")}</span>
            </PreferenceLine>

            {(user.is_moderator || null) &&
                <PreferenceLine title={_("Notify me when an incident is submitted for moderation")}>
                    <Toggle checked={incident_report_notifications} onChange={updateIncidentReportNotifications} />
                </PreferenceLine>
            }
        </div>
    );
}

let update_link_preferences_debounce:Timeout;

function LinkPreferences(props:SettingGroupProps):JSX.Element {
    let link = props.state.self_reported_account_linkages || {};

    function set(key:string):((value: any) => void) {
        return ((value: any) => {
            if (typeof(value) === "object") {
                value = value.target.value; // event
            }

            link[key] = value;
            props.updateSelfReportedAccountLinkages(link);
            if (update_link_preferences_debounce) {
                clearTimeout(update_link_preferences_debounce);
            }
            update_link_preferences_debounce = setTimeout(() => {
                clearTimeout(update_link_preferences_debounce);
                update_link_preferences_debounce = undefined;
                put('me/settings', {
                    'self_reported_account_linkages': props.state.self_reported_account_linkages
                })
                .then((res) => console.log(res))
                .catch(errorAlerter);
            }, 500);
        });
    }

    return (
        <div id='LinkPreferences'>
            <div className='LinkPreferencesDescription'>
                {
                    _("Here you can list other places you play and have a rating or a rank. You can choose to publically display this information or not. Providing this even if you don't want it publically known helps us tune our ranking algorithm and provide guidance on converting ranks between servers and organizations for the community, so the information is important and greatly appreciated.")
                }
            </div>

            <PreferenceLine
                title={_("Show this information on your profile page")}
                >
                <Toggle checked={!link.hidden} onChange={(tf) => set('hidden')(!tf)} />
            </PreferenceLine>

            <PreferenceLine
                title={_("Only show ranks, not ids and usernames")}
                >
                <Toggle disabled={link.hidden} checked={link.hidden_ids && !link.hidden} onChange={(tf) => set('hidden_ids')(tf)} />
            </PreferenceLine>


            <h2>{_("Associations")}</h2>

            <PreferenceLine title={<AssociationSelect value={link.org1} onChange={set('org1')} />}>
                <input type="text"
                    placeholder={pgettext("Go association Identifier or PIN number", "ID or PIN")}
                    value={link.org1_id || ""}
                    onChange={set('org1_id')}
                />
                <RankSelect value={link.org1_rank} onChange={set('org1_rank')} />
            </PreferenceLine>

            <PreferenceLine title={<AssociationSelect value={link.org2} onChange={set('org2')} />}>
                <input type="text"
                    placeholder={pgettext("Go association Identifier or PIN number", "ID or PIN")}
                    value={link.org2_id || ""}
                    onChange={set('org2_id')}
                />
                <RankSelect value={link.org2_rank} onChange={set('org2_rank')} />
            </PreferenceLine>

            <PreferenceLine title={<AssociationSelect value={link.org3} onChange={set('org3')} />}>
                <input type="text"
                    placeholder={pgettext("Go association Identifier or PIN number", "ID or PIN")}
                    value={link.org3_id || ""}
                    onChange={set('org3_id')}
                />
                <RankSelect value={link.org3_rank} onChange={set('org3_rank')} />
            </PreferenceLine>

            <h2>{_("Servers")}</h2>
            <PreferenceLine title={_("KGS")}>
                <input type="text" placeholder={_("Username")} value={link.kgs_username || ""} onChange={set('kgs_username')} />
                <RankSelect value={link.kgs_rank} onChange={set('kgs_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("IGS / PandaNet")}>
                <input type="text" placeholder={_("Username")} value={link.igs_username || ""} onChange={set('igs_username')} />
                <RankSelect value={link.igs_rank} onChange={set('igs_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("DGS")}>
                <input type="text" placeholder={_("Username")} value={link.dgs_username || ""} onChange={set('dgs_username')} />
                <RankSelect value={link.dgs_rank} onChange={set('dgs_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("Little Golem")}>
                <input type="text" placeholder={_("Username")} value={link.golem_username || ""} onChange={set('golem_username')} />
                <RankSelect value={link.golem_rank} onChange={set('golem_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("WBaduk")}>
                <input type="text" placeholder={_("Username")} value={link.wbaduk_username || ""} onChange={set('wbaduk_username')} />
                <RankSelect value={link.wbaduk_rank} onChange={set('wbaduk_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("Tygem")}>
                <input type="text" placeholder={_("Username")} value={link.tygem_username || ""} onChange={set('tygem_username')} />
                <RankSelect value={link.tygem_rank} onChange={set('tygem_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("Fox")}>
                <input type="text" placeholder={_("Username")} value={link.fox_username || ""} onChange={set('fox_username')} />
                <RankSelect value={link.fox_rank} onChange={set('fox_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("Yike Weiqi")}>
                <input type="text" placeholder={_("Username")} value={link.yike_username || ""} onChange={set('yike_username')} />
                <RankSelect value={link.yike_rank} onChange={set('yike_rank')} />
            </PreferenceLine>
            <PreferenceLine title={_("GoQuest")}>
                <input type="text" placeholder={_("Username")} value={link.goquest_username || ""} onChange={set('goquest_username')} />
                <RankSelect value={link.goquest_rank} onChange={set('goquest_rank')} />
            </PreferenceLine>
        </div>
    );
}

const rank_select_ranks = allRanks();
function RankSelect({value, onChange}:{value: number, onChange: (value:number) => void}):JSX.Element {
    return (
        <select className='RankSelect' value={value} onChange={(ev) => onChange(parseInt(ev.target.value))}>
            <option value={-999}>{_("-- Select Rank --")}</option>
            {rank_select_ranks.map((rank:IRankInfo) =>
                <option key={rank.rank} value={rank.rank}>{rank.label}</option>
            )}
        </select>
    );
}


function AssociationSelect({value, onChange}:{value: string, onChange: (value:string) => void}):JSX.Element {
    let user_countries = [];
    try {
        if (data.get('user').country) {
            /* If there's an association for the user's country, we put it at the top of the list */
            if (associations.filter(a => a.country === data.get('user').country).length > 0) {
                user_countries.push(data.get('user').country);
            }
        }
    } catch (err) {
        // pass
    }

    if (user_countries.length === 0 || user_countries[0] === "un") {
        /* Couldn't figure out a best assocation to put up top? Put the most common ones up on top */
        user_countries = [
            "us", "eu", "jp", "cn", "kr"
        ];
    }

    associations.sort((a:IAssociation, b:IAssociation) => {
        if (user_countries.indexOf(a.country) >= 0) {
            if (user_countries.indexOf(b.country) >= 0) {
                return a.name < b.name ? -1 : 1;
            }
            return -1;
        }
        if (user_countries.indexOf(b.country) >= 0) {
            return 1;
        }

        return a.country < b.country ? -1 : 1;
    });

    return (
        <select className='AssociationSelect' value={value} onChange={(ev) => onChange(ev.target.value)}>
            <option value={''}>{_("-- Select Association --")}</option>
            {associations.map((association:IAssociation) =>
                <option key={association.country} value={association.country}>{association.name}</option>
            )}
        </select>
    );
}


function SoundPreferences(props:SettingGroupProps):JSX.Element {
    const [tick_tock_start, __setTickTockStart]:[number, (x: number) => void] = React.useState(preferences.get('sound.countdown.tick-tock.start'));
    const [ten_seconds_start, __setTenSecondsStart]:[number, (x: number) => void] = React.useState(preferences.get('sound.countdown.ten-seconds.start'));
    const [five_seconds_start, __setFiveSecondsStart]:[number, (x: number) => void] = React.useState(preferences.get('sound.countdown.five-seconds.start'));
    const [every_second_start, __setEverySecondStart]:[number, (x: number) => void] = React.useState(preferences.get('sound.countdown.every-second.start'));
    const [count_direction, __setCountDirection]:[string, (x: string) => void] = React.useState(preferences.get('sound.countdown.byoyomi-direction'));
    let count_direction_auto = 'down';

    if (count_direction === 'auto') {
        count_direction_auto =
            (current_language === 'ja' || current_language === 'ko')
            ? 'up' : 'down';
    }

    let count_direction_computed = count_direction !== 'auto' ? count_direction : count_direction_auto;

    function setTickTockStart(opt):void {
        preferences.set('sound.countdown.tick-tock.start', opt.value);
        __setTickTockStart(opt.value);
    }
    function setTenSecondsStart(opt):void {
        preferences.set('sound.countdown.ten-seconds.start', opt.value);
        __setTenSecondsStart(opt.value);
    }
    function setFiveSecondsStart(opt):void {
        preferences.set('sound.countdown.five-seconds.start', opt.value);
        __setFiveSecondsStart(opt.value);
    }
    function setEverySecondStart(opt):void {
        preferences.set('sound.countdown.every-second.start', opt.value);
        __setEverySecondStart(opt.value);
    }
    function setCountDirection(opt):void {
        preferences.set('sound.countdown.byoyomi-direction', opt.value);
        __setCountDirection(opt.value);
    }

    const start_options = [
        {value: 0,  label: pgettext("Never play the countdown sound", "Never")},
        {value: 60, label: pgettext("Start playing the countdown sound at 60 seconds", "60 seconds")},
        {value: 45, label: pgettext("Start playing the countdown sound at 45 seconds", "45 seconds")},
        {value: 30, label: pgettext("Start playing the countdown sound at 30 seconds", "30 seconds")},
        {value: 20, label: pgettext("Start playing the countdown sound at 20 seconds", "20 seconds")},
        {value: 15, label: pgettext("Start playing the countdown sound at 15 seconds", "15 seconds")},
        {value: 10, label: pgettext("Start playing the countdown sound at 10 seconds", "10 seconds")},
        {value: 5, label: pgettext("Start playing the countdown sound at 5 seconds", "5 seconds")},
        {value: 3, label: pgettext("Start playing the countdown sound at 3 seconds", "3 seconds")},
    ];

    const start_options_fives = [
        {value: 0,  label: pgettext("Never play the countdown sound", "Never")},
        {value: 60, label: pgettext("Start playing the countdown sound at 60 seconds", "60 seconds")},
        {value: 45, label: pgettext("Start playing the countdown sound at 45 seconds", "45 seconds")},
        {value: 30, label: pgettext("Start playing the countdown sound at 30 seconds", "30 seconds")},
        {value: 20, label: pgettext("Start playing the countdown sound at 20 seconds", "20 seconds")},
        {value: 15, label: pgettext("Start playing the countdown sound at 15 seconds", "15 seconds")},
        {value: 10, label: pgettext("Start playing the countdown sound at 10 seconds", "10 seconds")},
        {value: 5, label: pgettext("Start playing the countdown sound at 5 seconds", "5 seconds")},
    ];

    const start_options_tens = [
        {value: 0,  label: pgettext("Never play the countdown sound", "Never")},
        {value: 60, label: pgettext("Start playing the countdown sound at 60 seconds", "60 seconds")},
        {value: 50, label: pgettext("Start playing the countdown sound at 50 seconds", "50 seconds")},
        {value: 40, label: pgettext("Start playing the countdown sound at 40 seconds", "40 seconds")},
        {value: 30, label: pgettext("Start playing the countdown sound at 30 seconds", "30 seconds")},
        {value: 20, label: pgettext("Start playing the countdown sound at 20 seconds", "20 seconds")},
        {value: 10, label: pgettext("Start playing the countdown sound at 10 seconds", "10 seconds")},
    ];

    const counting_direction_options = [
        {value: 'auto',  label: count_direction_auto === 'up'
            ? pgettext("Let the system decide which way to announce seconds left on the clock (up)", "Auto (up)")
            : pgettext("Let the system decide which way to announce seconds left on the clock (down)", "Auto (down)")
        },
        {value: 'down', label: pgettext("Announce seconds left counting down", "Down")},
        {value: 'up', label: pgettext("Announce seconds left counting up", "Up")},
    ];


    return (<div>
        <div className='Settings-Card'>
        <div>
            <h4>{pgettext('Overall sound level', "Master Volume")}</h4>

            <span>
            </span>
            <span>
                <Volume group='master' sample={['black-1', 'white-2', 'capture-handful', '5_periods_left']} />
            </span>
        </div>

        <div>
            <h4>{pgettext('Sound pack to use for things like "You have won" and "Undo requested" phrases', "Game Voice")}</h4>
            <span>
                <SoundPackSelect group='game_voice' options={SpriteGroups.game_voice} />
            </span>
            <span>
                <Volume group='game_voice' sample={['byoyomi', 'you_have_won']} />
            </span>
        </div>

        <div>
            <h4>{pgettext('Sound pack to use for clock countdown, "3", "2", "1"', "Clock Countdown")}</h4>
            <span>
                <SoundPackSelect group='countdown' options={SpriteGroups.countdown} />
            </span>
            <span>
                <Volume group='countdown' sample={
                    ["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]
                } />
            </span>
        </div>
        <div>
            <h5>{pgettext('When we should start playing the soft clock tick-tock sound when the clock is running out', "Soft tick-tock every second starting at")}</h5>

            <span>
                <Select
                    className='sound-option-select'
                    classNamePrefix='ogs-react-select'
                    value={start_options.filter(opt => opt.value === tick_tock_start)[0]}
                    getOptionValue={data => data.value}
                    onChange={setTickTockStart}
                    options={start_options}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                            <div ref={innerRef} {...innerProps}
                                className={'sound-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({innerProps, data}) => (
                            <span {...innerProps} className='sound-option'>
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({children}) => (
                            <div className='sound-option-container'>
                                {children}
                            </div>
                        ),
                    }}
                />
            </span>

            <span>
                <PlayButton sample={['tick', 'tock', 'tick', 'tock', 'tick', 'tock-3left', 'tick-2left', 'tock-1left']} />
            </span>
        </div>
        <div>
            <h5>{pgettext("When we should start counting down at 10 second intervals", "Count every 10 seconds starting at")}</h5>

            <span>
                <Select
                    className='sound-option-select'
                    classNamePrefix='ogs-react-select'
                    value={start_options_tens.filter(opt => opt.value === ten_seconds_start)[0]}
                    getOptionValue={data => data.value}
                    onChange={setTenSecondsStart}
                    options={start_options_tens}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                            <div ref={innerRef} {...innerProps}
                                className={'sound-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({innerProps, data}) => (
                            <span {...innerProps} className='sound-option'>
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({children}) => (
                            <div className='sound-option-container'>
                                {children}
                            </div>
                        ),
                    }}
                />
            </span>

            <span>
                <PlayButton sample={['60', '50', '40', '30', '20', '10']} />
            </span>
        </div>
        <div>
            <h5>{pgettext("When we should start counting down at 5 second intervals", "Count every 5 seconds starting at")}</h5>

            <span>
                <Select
                    className='sound-option-select'
                    classNamePrefix='ogs-react-select'
                    value={start_options_fives.filter(opt => opt.value === five_seconds_start)[0]}
                    getOptionValue={data => data.value}
                    onChange={setFiveSecondsStart}
                    options={start_options_fives}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                            <div ref={innerRef} {...innerProps}
                                className={'sound-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({innerProps, data}) => (
                            <span {...innerProps} className='sound-option'>
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({children}) => (
                            <div className='sound-option-container'>
                                {children}
                            </div>
                        ),
                    }}
                />
            </span>

            <span>
                <PlayButton sample={['30', '25', '20', '15', '10', '5']} />
            </span>
        </div>

        <div>
            <h5>{pgettext("When we should start announcing time left on the clock every second", "Count every second starting at")}</h5>

            <span>
                <Select
                    className='sound-option-select'
                    classNamePrefix='ogs-react-select'
                    value={start_options.filter(opt => opt.value === every_second_start)[0]}
                    getOptionValue={data => data.value}
                    onChange={setEverySecondStart}
                    options={start_options}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                            <div ref={innerRef} {...innerProps}
                                className={'sound-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({innerProps, data}) => (
                            <span {...innerProps} className='sound-option'>
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({children}) => (
                            <div className='sound-option-container'>
                                {children}
                            </div>
                        ),
                    }}
                />
            </span>

            <span>
                <PlayButton sample={["10", "9", "8", "7", "6", "5", "4", "3", "2", "1"]} />
            </span>
        </div>

        <div>
            <h5>{pgettext("When announcing how long is left on the clock during a byo-yomi period, should we count up or down?", "Count up or down during a byo-yomi period?")}</h5>

            <span>
                <Select
                    className='sound-option-select'
                    classNamePrefix='ogs-react-select'
                    value={counting_direction_options.filter(opt => opt.value === count_direction)[0]}
                    getOptionValue={data => data.value}
                    onChange={setCountDirection}
                    options={counting_direction_options}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                            <div ref={innerRef} {...innerProps}
                                className={'sound-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                                {data.label}
                            </div>
                        ),
                        SingleValue: ({innerProps, data}) => (
                            <span {...innerProps} className='sound-option'>
                                {data.label}
                            </span>
                        ),
                        ValueContainer: ({children}) => (
                            <div className='sound-option-container'>
                                {children}
                            </div>
                        ),
                    }}
                />
            </span>

            <span>
                <PlayButton sample={
                    count_direction_computed === 'up'
                    ? ["1", "2", "3", "4", "5"]
                    : ["5", "4", "3", "2", "1"]
                } />
            </span>
        </div>

        <div>
            <h4>{pgettext('Sound pack to use for things like stone placement sounds', "Stone Sounds")}</h4>
            <span>
                <SoundPackSelect group='stones' options={SpriteGroups.stones} />
            </span>
            <span>
                <Volume group='stones' sample={['black-1', 'white-2', 'black-3']} />
            </span>
        </div>

        <div>
            <h4>{pgettext('Sound pack to use for various effects', "Effects")}</h4>
            <span>
                <SoundPackSelect group='effects' options={SpriteGroups.effects} />
            </span>
            <span>
                <Volume group='effects' sample={['tutorial-bling', 'tutorial-pass']} />
            </span>
        </div>
        </div>

        <LineText>{pgettext("Settings for individual sound options", "Individual sound options")}</LineText>

        <div className="flex-row">
            <div className="flex-col sound-sample-left-column">

                <Card>
                    <SoundToggle name={pgettext('Sound sample option', 'Byoyomi')} sprite='byoyomi' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Overtime')} sprite='overtime' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Start Counting')} sprite='start_counting' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Period')} sprite='period' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', '5 periods left')} sprite='5_periods_left' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', '4 periods left')} sprite='4_periods_left' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', '3 periods left')} sprite='3_periods_left' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', '2 periods left')} sprite='2_periods_left' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Last period')} sprite='last_period' voiceopt={true} />
                </Card>

                <Card>
                    <SoundToggle name={pgettext('Sound sample option', 'Black wins')} sprite='black_wins' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'White wins')} sprite='white_wins' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'You have won')} sprite='you_have_won' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Tie')} sprite='tie' voiceopt={true} />
                </Card>

                <Card>
                    <SoundToggle name={pgettext('Sound sample option', 'Challenge received')} sprite='challenge_received' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Game started')} sprite='game_started' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Game paused')} sprite='game_paused' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Game resumed')} sprite='game_resumed' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Undo granted')} sprite='undo_granted' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Undo requested')} sprite='undo_requested' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Pass')} sprite='pass' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Remove the dead stones')} sprite='remove_the_dead_stones' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Review started')} sprite='review_started' voiceopt={true} />
                </Card>
            </div>
            <div className='flex-col'>
                <Card>
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 1 stone')} sprite='capture-1' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 2 stones')} sprite='capture-2' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 3 stones')} sprite='capture-3' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 4 stones')} sprite='capture-4' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 5 stones')} sprite='capture-5' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 1 stone - pile')} sprite='capture-1-pile' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 2 stones - pile')} sprite='capture-2-pile' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 3 stones - pile')} sprite='capture-3-pile' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture 4 stones - pile')} sprite='capture-4-pile' />
                    <SoundToggle name={pgettext('Sound sample option', 'Capture lots of stones')} sprite='capture-handful' />
                </Card>

                <Card>
                    <SoundToggle name={pgettext('Sound sample option', 'Disconnected')} sprite='disconnected' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Reconnected')} sprite='reconnected' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Player disconnected')} sprite='player_disconnected' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Player reconnected')} sprite='player_reconnected' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Your opponent has disconnected')} sprite='your_opponent_has_disconnected' voiceopt={true} />
                    <SoundToggle name={pgettext('Sound sample option', 'Your opponent has reconnected')} sprite='your_opponent_has_reconnected' voiceopt={true} />
                </Card>

                <Card>
                    <SoundToggle name={pgettext('Sound sample option', 'Tutorial - bling')} sprite='tutorial-bling' />
                    <SoundToggle name={pgettext('Sound sample option', 'Tutorial - pass')} sprite='tutorial-pass' />
                    <SoundToggle name={pgettext('Sound sample option', 'Tutorial - fail')} sprite='tutorial-fail' />
                    <SoundToggle name={pgettext('Sound sample option', 'Tutorial - ping')} sprite='tutorial-ping' />
                </Card>

                <Card>
                    <PreferenceToggle name={pgettext("Shift the audio to the left or right depending on where the stone was placed.", "Positional stone placement effect")} preference="sound.positional-stone-placement-effect" />
                {navigator.vibrate
                    ?
                        <PreferenceToggle name={pgettext("On mobile devices, vibrate when a stone is placed?", "Vibrate when stone is placed")} preference="sound.vibrate-on-stone-placement" />
                    : null
                }
                </Card>

            </div>
        </div>
    </div>);
}

function SoundToggle(props:{name: string, sprite: ValidSound, voiceopt?: boolean}):JSX.Element {
    const [on, __set]:[boolean, (x:boolean) => void] = React.useState(sfx.getSpriteEnabled(props.sprite));
    const [voice, __setVoice]:[boolean, (x:boolean) => void] = React.useState(sfx.getSpriteVoiceEnabled(props.sprite));

    function setSpriteEnabled(on:boolean):void {
        sfx.setSpriteEnabled(props.sprite, on);
        __set(on);
    }

    function setSpriteVoiceEnabled(on:boolean):void {
        sfx.setSpriteVoiceEnabled(props.sprite, on);
        __setVoice(on);
    }
    return (
        <div className='SoundToggle'>
            <label>
                <span className='sound-toggle-name' >{props.name}</span>
                <Toggle id={`sprite-enabled-${props.sprite}`} onChange={setSpriteEnabled} checked={on} />
            </label>
            {props.voiceopt &&
                <label className='SoundToggle-voice-label'>
                    {voice
                        ? <span className='voice-or-effect'>{pgettext('Use the spoken voice sound for this sound effect', 'Voice')}</span>
                        : <span className='voice-or-effect'>{pgettext('Use a non verbal sound effect', 'Effect')}</span>
                    }
                    <Toggle
                        disabled={!on}
                        id={`sprite-enabled-${props.sprite}-voice`}
                        onChange={setSpriteVoiceEnabled}
                        checked={voice}
                    />
                </label>
            }
            <PlayButton sample={props.sprite} />
        </div>
    );
}

function EmailNotificationToggle(props:{state: SettingsState, name: string, notification: string}):JSX.Element {
    const [on, __set]:[boolean, (x:boolean) => void] = React.useState(!!props.state.notifications[props.notification].value.email);

    function save(on:boolean):void {
        __set(on);
        let up = {};
        up[props.notification] = {
            "description": props.state.notifications[props.notification].description,
            "value": {
                "email": on,
                "mobile": on,
            }
        };
        props.state.notifications[props.notification] = up[props.notification];
        put("me/settings", {
            notifications: up
        })
        .then(() => 0)
        .catch(errorAlerter);
    }

    return (
        <div className='EmailNotificationToggle'>
            <label>
                <span className='preference-toggle-name' >{props.name}</span>
                <Toggle onChange={save} checked={on} />
            </label>
        </div>
    );
}

function PreferenceToggle(props:{name: string, preference: ValidPreference}):JSX.Element {
    const [on, __set]:[boolean, (x:boolean) => void] = React.useState(preferences.get(props.preference));

    function setPreference(on:boolean):void {
        preferences.set(props.preference, on);
        __set(on);
    }

    return (
        <div className='PreferenceToggle'>
            <label>
                <span className='preference-toggle-name' >{props.name}</span>
                <Toggle id={`preference-toggle-${props.preference}`} onChange={setPreference} checked={on} />
            </label>
        </div>
    );
}


function SoundPackSelect(props:{group:ValidSoundGroup, options:Array<SpritePack>}):JSX.Element {
    const [pack_id, __setPackId]:[string, (x:string) => void] = React.useState(sfx.getPackId(props.group));

    function filter({label, value, data}, text:string):boolean {
        if (!text) {
            text = "";
        }
        text = text.toLowerCase();
        let pack:SpritePack = data;

        if (pack.name.toLowerCase().indexOf(text) >= 0) {
            return true;
        }
        if (pack.pack_id.toLowerCase().indexOf(text) >= 0) {
            return true;
        }
        return false;
    }

    function setPackId(pack:SpritePack):void {
        __setPackId(pack.pack_id);
        sfx.setPackId(props.group, pack.pack_id);
    }

    return (
        <Select
            className='sound-select'
            classNamePrefix='ogs-react-select'
            value={sprite_packs[pack_id]}
            onChange={setPackId}
            options={props.options}
            isClearable={false}
            isSearchable={false}
            blurInputOnSelect={true}
            noResultsText={_("No results found")}
            filterOption={filter}
            getOptionLabel={pack => pack.pack_id}
            getOptionValue={pack => pack.pack_id}
            components={{
                Option: ({innerRef, innerProps, isFocused, isSelected, data}) => (
                    <div ref={innerRef} {...innerProps}
                        className={'sound-pack-option ' + (isFocused ? 'focused ' :'') + (isSelected ? 'selected' : '')}>
                        <Flag country={data.country} /> {data.name}
                    </div>
                ),
                SingleValue: ({innerProps, data}) => (
                    <span {...innerProps} className='sound-pack-option'>
                        <Flag country={data.country} /> {data.name}
                    </span>
                ),
                ValueContainer: ({children}) => (
                    <div className='sound-pack-option-container'>
                        {children}
                    </div>
                ),
            }}
        />
    );
}

function Volume(props:{group: ValidSoundGroup, sample: ValidSound | Array<ValidSound>}):JSX.Element {
    const [volume, __setVolume]:[number, (x:number) => void] = React.useState(sfx.getVolume(props.group));

    function setVolume(v:number):void {
        __setVolume(v);
        sfx.setVolume(props.group, v);
    }

    function setVolumeHandler(ev: React.ChangeEvent<HTMLInputElement>):void {
        setVolume(parseFloat(ev.target.value));
    }

    function toggleVolumeHandler(ev: any):void {
        if (volume > 0) {
            setVolume(0);
        } else {
            setVolume(1);
        }
    }


    return (
        <span className='volume'>
            <i className={"fa volume-icon " +
                (volume === 0 ? "fa-volume-off"
                    : (volume > 0.5 ? "fa-volume-up" : "fa-volume-down"))}
                    onClick={toggleVolumeHandler} />
            <input type="range"
                onChange={setVolumeHandler}
                value={volume} min={0} max={1.0} step={0.05} />

            <PlayButton sample={props.sample} />
        </span>
    );
}


let play_timeout:Timeout | null = null;
let play_emitter = new EventEmitter();

function PlayButton(props:{sample: ValidSound | Array<ValidSound>}):JSX.Element {
    const [playing, setPlaying]:[boolean, any] = React.useState(false);
    let samples:Array<ValidSound> = typeof(props.sample) === 'string' ? [props.sample] : props.sample;

    function play(ev: any):void {
        let _samples = samples.slice();
        if (play_timeout) {
            clearTimeout(play_timeout);
        }
        sfx.stop();
        play_emitter.emit('stop');
        play_emitter.once('stop', () => setPlaying(false));

        function process_next() {
            play_timeout = null;
            if (_samples.length) {
                let sample = _samples.shift();
                let start = Date.now();
                play_timeout = setTimeout(process_next, 1000);
                sfx.play(sample);
            } else {
                setPlaying(false);
            }
        }

        process_next();
        setPlaying(true);
    }

    function stop(ev: any):void {
        play_emitter.emit('stop');
        clearTimeout(play_timeout);
        play_timeout = null;
        sfx.stop();
        setPlaying(false);
    }

    return (
        playing ?
            <span onClick={stop} style={{cursor: "pointer"}}>
                <i className="fa fa-stop" />
            </span>
            :
            <span onClick={play} style={{cursor: "pointer"}}>
                <i className="fa fa-play" />
            </span>
    );
}


preferences.watch('sound.vibrate-on-stone-placement', (tf) => {
    try {
        if (tf && navigator.vibrate) {
            navigator.vibrate(50);
        }
    } catch (e) {
        console.error(e);
    }
}, false, true);

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
