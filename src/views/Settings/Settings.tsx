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

import {ValidPreference} from "preferences";
import {Link} from "react-router-dom";
import {_, pgettext, interpolate} from "translate";
import {post, get, put, del, abort_requests_in_flight} from "requests";
import {errorAlerter, errorLogger, ignore} from "misc";
import {durationString} from "TimeControl";
import {Card} from "material";
import {sfx, SpritePack, SpriteGroups, sprite_packs, ValidSound, ValidSoundGroup} from "sfx";
import {LanguagePicker} from "LanguagePicker";
import {current_language, languages} from "translate";
import {toast} from 'toast';
import {profanity_regex} from 'profanity_filter';
import {logout} from 'NavBar';
import {Flag} from "Flag";
import {EventEmitter} from 'eventemitter3';
import {LineText} from 'misc-ui';
import {Toggle} from 'Toggle';
import {LoadingPage} from 'Loading';
import Select from 'react-select';
import ITC from 'ITC';

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
}

interface SettingGroupProps {
    state: SettingsState;
    vacation_base_time: number;
    refresh: () => () => void;
}

export function Settings():JSX.Element {
    const [selected, __select]:[string, (s: string) => void] = React.useState(data.get('settings.page-selected', 'general'));
    const [settings_state, set_settings_state]:[SettingsState, (s: SettingsState) => void] = React.useState({});
    const [vacation_base_time, set_vacation_base_time]:[number, (s: number) => void] = React.useState(Date.now());
    const [loaded, set_loaded]:[number, (b: number) => void] = React.useState(0);

    React.useEffect(refresh, []);

    function select(s: string): void {
        __select(s);
        data.set('settings.page-selected', s);
    }

    function refresh(): () => void {
        let canceled = false;

        get("me/settings")
        .then((settings) => {
            if (!canceled) {
                set_vacation_base_time(Date.now());
                set_settings_state({
                    profile: settings.profile,
                    notifications: settings.notifications,
                    vacation_left: durationString(settings.profile.vacation_left),
                    hide_ui_class: settings.site_preferences.hide_ui_class,
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
        { key: 'sound'    , label: _("Sound Preferences") },
        { key: 'vacation' , label: _("Vacation") },
        { key: 'account'  , label: _("Account Settings") },
        { key: 'logout'   , label: _("Logout") },
        { key: 'email'    , label: _("Email Notifications") },
        { key: 'game'     , label: _("Game Preferences") },
        { key: 'general'  , label: _("General Preferences") },
    ];

    let SelectedPage:(props:SettingGroupProps) => JSX.Element = () => <div>Error</div>;

    switch (selected) {
        case 'sound'    : SelectedPage = SoundPreferences   ; break;
        case 'vacation' : SelectedPage = VacationSettings      ; break;
        case 'account'  : SelectedPage = AccountSettings    ; break;
        case 'logout'   : SelectedPage = LogoutPreferences  ; break;
        case 'email'    : SelectedPage = EmailPreferences   ; break;
        case 'game'     : SelectedPage = GamePreferences    ; break;
        case 'general'  : SelectedPage = GeneralPreferences ; break;
    }

    let props:SettingGroupProps = {
        state: settings_state,
        vacation_base_time: vacation_base_time,
        refresh: refresh,
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

    let user = data.get('user');

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
        if (props.state.profile.no_password_set) { // social auth account
            post("/api/v0/changePassword", {
                "new_password": password1,
                "old_password": "!",
            })
            .then((obj) => {
                props.refresh();
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

    return (
        <div>
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
            </dl>

            <i><Link to={`/user/view/${user.id}#edit`}>{_("To update your profile information, click here")}</Link></i>
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

    function setDockDelay(ev) {
        let new_delay = parseFloat(ev.target.value);
        preferences.set("dock-delay", new_delay);
        _setDockDelay(new_delay);
    }
    function toggleAIReview(ev) {
        preferences.set("ai-review-enabled", !ai_review_enabled);
        _setAiReviewEnabled(!ai_review_enabled);
    }
    function toggleVariationsInChat(ev) {
        preferences.set("variations-in-chat-enabled", !variations_in_chat);
        _setVariationsInChat(!variations_in_chat);
    }

    function setAutoAdvance(ev) {
        preferences.set("auto-advance-after-submit", ev.target.checked),
        _setAutoAdvance(preferences.get("auto-advance-after-submit"));
    }
    function setAlwaysDisableAnalysis(ev) {
        preferences.set("always-disable-analysis", ev.target.checked),
        _setAlwaysDisableAnalysis(preferences.get("always-disable-analysis"));
    }
    function setDynamicTitle(ev) {
        preferences.set("dynamic-title", ev.target.checked),
        _setDynamicTitle(preferences.get("dynamic-title"));
    }
    function setFunctionKeysEnabled(ev) {
        preferences.set("function-keys-enabled", ev.target.checked),
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
    function setLiveSubmitMode(ev) {
        setSubmitMode("live", ev.target.value);
    }
    function setCorrSubmitMode(ev) {
        setSubmitMode("correspondence", ev.target.value);
    }
    function setBoardLabeling(ev) {
        preferences.set('board-labeling', ev.target.value);
        setBoardLabeling(ev.target.value);
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
            <dl>
                <dt>{
                    _("Game-control-dock pop-out delay") // translators: This is the text under settings for controling the slide out delay of the list of game buttons in the game (pause, review, sgf link, etc...)
                }</dt>
                <dd className="inline-flex">
                    <input type="range"
                           onChange={setDockDelay}
                              value={dock_delay} min={0} max={MAX_DOCK_DELAY} step={0.1}
                    />
                    <span>&nbsp;{
                        dock_delay === MAX_DOCK_DELAY
                            ?  _("Off") // translators: Indicates the dock slide out has been turned off
                            : interpolate(_("{{number_of}} seconds"), { number_of:  dock_delay}) // translators: Indicates the number of seconds to delay the slide out of the panel of game buttons on the right side of the game page
                    }</span>
                </dd>


                <dt>{_("Board labeling")}</dt>
                <dd>
                    <select value={board_labeling} onChange={setBoardLabeling}>
                        <option value="automatic">{_("Automatic")}</option>
                        <option value="A1">A1</option>
                        <option value="1-1">1-1</option>
                    </select>
                </dd>

                <dt>{_("Live game submit mode")}</dt>
                <dd>
                    <select value={live_submit_mode} onChange={setLiveSubmitMode}>
                        <option value="single">{_("One-click to move")}</option>
                        <option value="double">{_("Double-click to move")}</option>
                        <option value="button">{_("Submit-move button")}</option>
                    </select>
                </dd>
                <dt>{_("Correspondence submit mode")}</dt>
                <dd>
                    <select value={corr_submit_mode} onChange={setCorrSubmitMode}>
                        <option value="single">{_("One-click to move")}</option>
                        <option value="double">{_("Double-click to move")}</option>
                        <option value="button">{_("Submit-move button")}</option>
                    </select>
                </dd>
                <dt><label htmlFor="autoadvance">{_("Auto-advance to next game after making a move")}</label></dt>
                <dd>
                    <input id="autoadvance" type="checkbox" checked={autoadvance} onChange={setAutoAdvance} />
                </dd>
                <dt>{_("Autoplay delay (in seconds)")}</dt>
                <dd>
                    <input type="number" step="0.1" min="0.1" onChange={updateAutoplayDelay} value={autoplay_delay} />
                </dd>
                <dt><label htmlFor="disable-ai-review">{_("Disable AI review")}</label></dt>
                <dd>
                    <input type="checkbox" id="disable-ai-review" checked={!ai_review_enabled} onChange={toggleAIReview}/>
                    <div><i>
                    {_("will enable or disable the artificial intelligence reviews at the end of a game.")}
                    </i></div>
                </dd>
                <dt><label htmlFor="always-disable-analysis">{_("Always disable analysis")}</label></dt>
                <dd>
                    <input id="always-disable-analysis" type="checkbox" checked={always_disable_analysis} onChange={setAlwaysDisableAnalysis} />
                    <div><i>
                    {_("will disable the analysis mode and conditional moves for you in all games, even if it is not disabled in the game's settings. (If allowed in game settings, your opponent will still have access to analysis.)")}
                    </i></div>
                </dd>
                <dt><label htmlFor="dynamic-title">{_("Dynamic title")}</label></dt>
                <dd>
                    <input id="dynamic-title" type="checkbox" checked={dynamic_title} onChange={setDynamicTitle} />
                    <div><i>
                    {_("Choose whether to show in the web page title whose turn it is (dynamic) or who the users are (not dynamic)")}
                    </i></div>
                </dd>
                <dt><label htmlFor="function-keys-enabled">{_("Enable function keys for game analysis shortcuts")}</label></dt>
                <dd>
                    <input id="function-keys-enabled" type="checkbox" checked={function_keys_enabled} onChange={setFunctionKeysEnabled} />
                </dd>
                <dt><label htmlFor="disable-varations-in-chat">{_("Disable clickable variations in chat")}</label></dt>
                <dd>
                    <input type="checkbox" id="disable-variations-in-chat" checked={!variations_in_chat} onChange={toggleVariationsInChat}/>
                    <div><i>
                    {_("will enable or disable the hoverable and clickable variations displayed in a game or review chat.")}
                    </i></div>
                </dd>
            </dl>
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

    function updateProfanityFilter(ev) {
        let new_profanity_settings = {};
        Array.prototype.filter.apply(ev.target.options, [x => x.selected]).map(opt => new_profanity_settings[opt.value] = true);
        preferences.set("profanity-filter", new_profanity_settings);
        _setProfanityFilter(Object.keys(new_profanity_settings));
    }

    function updateGameListThreshold(ev) {
        preferences.set("game-list-threshold", parseInt(ev.target.value));
        _setGameListThreshold(preferences.get("game-list-threshold"));
    }

    function setShowOfflineFriends(ev) {
        preferences.set("show-offline-friends", ev.target.checked);
        _setShowOfflineFriends(preferences.get("show-offline-friends"));
    }

    function setUnicodeFilterUsernames(ev) {
        preferences.set("unicode-filter", ev.target.checked);
        _setUnicodeFilterUsernames(preferences.get("unicode-filter"));
    }

    function setTranslationDialogNeverShow(ev) {
        preferences.set("translation-dialog-never-show", ev.target.checked);
        _setTranslationDialogNeverShow(preferences.get("translation-dialog-never-show"));
    }

    function updateDesktopNotifications(ev) {
        let enabled = ev.target.checked;

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

    function updateHideUIClass(ev) {
        let checked = ev.target.checked;

        setHideUiClass(!checked);
        put(`me/settings`, {
            'site_preferences': {
                'hide_ui_class': !checked
            }
        })
        .catch(errorAlerter);
    }

    function setShowTournamentIndicator(ev) {
        preferences.set("show-tournament-indicator", ev.target.checked),
        _setShowTournamentIndicator(preferences.get("show-tournament-indicator"));
    }

    function setHideRanks(ev) {
        preferences.set("hide-ranks", ev.target.checked),
        _setHideRanks(preferences.get("hide-ranks"));
    }

    function updateIncidentReportNotifications(ev) {
        let checked = ev.target.checked;
        preferences.set("notify-on-incident-report", checked);
        setIncidentReportNotifications(checked);
    }

    return (
        <div>
            <dl>
                <dt>{_("Language")}</dt>
                <dd><LanguagePicker /></dd>

                <dt>{_("Profanity filter")}</dt>
                <dd>
                    <select multiple onChange={updateProfanityFilter} value={profanity_filter} >
                        {Object.keys(languages).filter(lang => lang in profanity_regex).map((lang) => (
                            <option key={lang} value={lang}>{languages[lang]}</option>
                        ))}
                    </select>
                </dd>

                <dt>{_("Game thumbnail list threshold")}</dt>
                <dd>
                    <select onChange={updateGameListThreshold} value={game_list_threshold}>
                        <option value={0}>{_("Always show list")}</option>
                        {[3, 5, 10, 25, 50, 100, 200].map((value, idx) =>
                            <option key={idx} value={value}>{value}</option>
                        )}
                    </select>
                </dd>

                <dt>{_("Desktop notifications")}</dt>
                <dd>
                    <input type="checkbox"
                            checked={desktop_notifications_enabled}
                            onChange={updateDesktopNotifications}
                            disabled={!desktop_notifications_enableable}
                            id="desktop_notifications"/>
                    <label htmlFor="desktop_notifications">
                        {desktop_notifications_enabled ? _("Enabled") : _("Disabled")}
                    </label>
                    {!desktop_notifications_enableable &&
                        <div><i>
                        {_("Desktop notifications are not supported by your browser")}
                        </i></div>
                    }
                </dd>

                <dt><label htmlFor="show-offline-friends">{_("Show offline friends on list")}</label></dt>
                <dd>
                    <input id="show-offline-friends" type="checkbox" checked={show_offline_friends} onChange={setShowOfflineFriends} />
                </dd>

                <dt><label htmlFor="unicode-filter-usernames">{_("Hide special unicode symbols in usernames")}</label></dt>
                <dd>
                    <input id="unicode-filter-usernames" type="checkbox" checked={unicode_filter_usernames} onChange={setUnicodeFilterUsernames} />
                </dd>

                <dt><label htmlFor="translation-dialog-never-show">{_('Never show the "needs translation" message on the home page')}</label></dt>
                <dd>
                    <input id="translation-dialog-never-show" type="checkbox" checked={translation_dialog_never_show} onChange={setTranslationDialogNeverShow} />
                </dd>

                {(user.supporter || null) && <dt>{_("Golden supporter name")}</dt>}
                {(user.supporter || null) &&
                    <dd>
                        <input type="checkbox" checked={!hide_ui_class} onChange={updateHideUIClass} id='hide_ui_class' />

                        <label htmlFor="hide_ui_class">
                            {!hide_ui_class ? _("Enabled") : _("Disabled")}
                        </label>
                    </dd>
                }

                <dt><label htmlFor="show-tournament-indicator">{_("Show tournament indicator")}</label></dt>
                <dd>
                    <input id="show-tournament-indicator" type="checkbox" checked={show_tournament_indicator} onChange={setShowTournamentIndicator} />
                </dd>
                <dt><label htmlFor="hide-ranks">{_("Hide ranks and ratings")}</label></dt>
                <dd>
                    <input id="hide-ranks" type="checkbox" checked={hide_ranks} onChange={setHideRanks} />
                </dd>


                {(user.is_moderator || null) &&
                    <dt><label htmlFor="incident-report-notifications">{_("Notify me when an incident is submitted for moderation")}</label></dt>
                }
                {(user.is_moderator || null) &&
                    <dd>
                        <input type="checkbox"
                                checked={incident_report_notifications}
                                onChange={updateIncidentReportNotifications}
                                id='incident_report_notifications'
                                />
                        <label htmlFor="incident_report_notifications">
                            {incident_report_notifications ? _("Enabled") : _("Disabled")}
                        </label>
                    </dd>
                }
            </dl>
        </div>
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


let play_timeout:number | null = null;
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
