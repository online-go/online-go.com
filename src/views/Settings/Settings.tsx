/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import {Link} from "react-router-dom";
import {_, pgettext, interpolate} from "translate";
import {post, get, put, del} from "requests";
import {errorAlerter, ignore} from "misc";
import {durationString} from "TimeControl";
import {Card} from "material";
import {sfx} from "goban";
import {LanguagePicker} from "LanguagePicker";
import * as preferences from "preferences";
import * as data from "data";
import {current_language, languages} from "translate";
import {toast} from 'toast';
import {profanity_regex} from 'profanity_filter';


declare var swal;
export const MAX_DOCK_DELAY = 3.0;

export class Settings extends React.PureComponent<{}, any> {
    vacation_base_time = Date.now();
    vacation_interval = null;

    constructor(props) {
        super(props);

        let desktop_notifications_enabled = false;

        try {
            desktop_notifications_enabled = preferences.get("desktop-notifications") && (Notification as any).permission === "granted";
        } catch (e) {
            /* not all browsers support the Notification API */
        }


        this.state = {
            resolved: false,
            profile: {email: ""},
            notifications: {},
            vacation_left: "",
            volume: preferences.get("sound-volume"),
            voice_countdown: preferences.get("sound-voice-countdown"),
            sound_enabled: preferences.get("sound-enabled"),
            live_submit_mode: this.getSubmitMode("live"),
            corr_submit_mode: this.getSubmitMode("correspondence"),
            password1: "",
            password2: "",
            email_changed: false,
            email_message: null,
            profanity_filter: Object.keys(preferences.get("profanity-filter")),
            game_list_threshold: preferences.get("game-list-threshold"),
            autoadvance: preferences.get("auto-advance-after-submit"),
            autoplay_delay: preferences.get("autoplay-delay") / 1000,
            always_disable_analysis: preferences.get("always-disable-analysis"),
            show_offline_friends: preferences.get("show-offline-friends"),
            unicode_filter_usernames: preferences.get("unicode-filter"),
            desktop_notifications_enabled: desktop_notifications_enabled,
            desktop_notifications_enableable: typeof(Notification) !== "undefined",
            hide_ui_class: false,
            show_ads_on_game_page: preferences.get('show-ads-on-game-page'),
            board_labeling: preferences.get("board-labeling"),
            translation_dialog_never_show: preferences.get("translation-dialog-never-show"),
            dock_delay: preferences.get("dock-delay"),
        };
    }

    componentDidMount() {{{
        this.resolve();
        this.vacation_interval = setInterval(() => {
            if (this.state.profile.on_vacation) {
                let vacation_time_left = this.state.profile.vacation_left - (Date.now() - this.vacation_base_time) / 1000;
                let vacation_string = vacation_time_left > 0 ? durationString(vacation_time_left) : ("0 " + _("Seconds").toLowerCase());
                if (this.state.vacation_left !== vacation_string) {
                    this.setState({vacation_left: vacation_string});
                }
            }
        }, 1000);
    }}}
    componentWillUnmount() {{{
        if (this.vacation_interval) {
            clearInterval(this.vacation_interval);
        }
    }}}
    resolve() {{{
        get("me/settings")
        .then((settings) => {
            this.setState({
                profile: settings.profile,
                notifications: settings.notifications,
                vacation_left: durationString(settings.profile.vacation_left),
                hide_ui_class: settings.site_preferences.hide_ui_class,
            });
        })
        .catch(errorAlerter);
    }}}
    endVacation = () => {{{
        del("me/vacation")
        .then((data) => {
            this.vacation_base_time = Date.now();
            this.setState({
                profile: Object.assign({}, this.state.profile, {
                    on_vacation: data.on_vacation,
                    vacation_left: data.vacation_left,
                })
            });
        })
        .catch(errorAlerter);
    }}}
    startVacation = () => {{{
        put("me/vacation")
        .then((data) => {
            this.vacation_base_time = Date.now();
            this.setState({
                profile: Object.assign({}, this.state.profile, {
                    on_vacation: data.on_vacation,
                    vacation_left: data.vacation_left,
                })
            });
        })
        .catch(errorAlerter);
    }}}
    setVolume = (ev) => {{{
        this._setVolume(parseFloat(ev.target.value));
    }}}
    _setVolume(volume) {{{
        let enabled = volume > 0;

        preferences.set("sound-volume", volume);
        preferences.set("sound-enabled", enabled);

        this.setState({
            volume: volume,
            sound_enabled: enabled,
        });
    }}}

    setDockDelay = (ev) => {{{
        let new_delay = parseFloat(ev.target.value);
        preferences.set("dock-delay", new_delay);
        this.setState({"dock_delay": new_delay});
    }}}

    setVoiceCountdown = (ev) => {{{
        preferences.set("sound-voice-countdown", ev.target.checked);
        this.setState({"voice_countdown": ev.target.checked});
    }}}
    setShowAdsOnGamePage = (ev) => {{{
        if (!ev.target.checked) {
            swal({
                'text': _("Please consider becoming a site supporter instead of disabling these ads. The increased revenue from these ads is being used to expand OGS by providing better services to Asia, Europe, and neighboring regions."),
                'showCancelButton': true,
                confirmButtonText: _("Keep Ads"),
                cancelButtonText: _("Disable Ads"),
            })
            .then((val) => {
            })
            .catch((e) => {
                preferences.set("show-ads-on-game-page", false);
                this.setState({show_ads_on_game_page: false});
            });
        } else {
            preferences.set("show-ads-on-game-page", true);
            this.setState({show_ads_on_game_page: true});
        }
    }}}
    toggleVolume = (ev) => {{{
        this._setVolume(this.state.volume > 0 ? 0 : 0.5);
    }}}
    playSampleSound = () => {{{
        let num = Math.round(Math.random() * 10000) % 5;
        sfx.play("stone-" + (num + 1));
    }}}

    getSubmitMode(speed) {{{
        let single = preferences.get(`one-click-submit-${speed}` as any);
        let dbl = preferences.get(`double-click-submit-${speed}` as any);
        return single ? "single" : (dbl ? "double" : "button");
    }}}
    setSubmitMode(speed, mode) {{{
        switch (mode) {
            case "single":
                preferences.set(`double-click-submit-${speed}`, false);
                preferences.set(`one-click-submit-${speed}`, true);
                break;
            case "double":
                preferences.set(`double-click-submit-${speed}`, true);
                preferences.set(`one-click-submit-${speed}`, false);
                break;
            case "button":
                preferences.set(`double-click-submit-${speed}`, false);
                preferences.set(`one-click-submit-${speed}`, false);
                break;
        }
        if (speed === "live") {
            this.setState({live_submit_mode: this.getSubmitMode(speed)});
        }
        if (speed === "correspondence") {
            this.setState({corr_submit_mode: this.getSubmitMode(speed)});
        }
    }}}
    setLiveSubmitMode = (ev) => {{{
        this.setSubmitMode("live", ev.target.value);
    }}}
    setCorrSubmitMode = (ev) => {{{
        this.setSubmitMode("correspondence", ev.target.value);
    }}}
    setBoardLabeling = (ev) => {{{
        preferences.set('board-labeling', ev.target.value);
        this.setState({'board_labeling': ev.target.value});
    }}}

    notification_bindings= {};
    updateNotification(key) {{{
        if (!(key in this.notification_bindings)) {
            this.notification_bindings[key] = this._updateNotification.bind(this, key);
        }
        return this.notification_bindings[key];
    }}}
    _updateNotification(key, event) {{{
        let up = {};
        up[key] = {
            "description": this.state.notifications[key].description,
            "value": {
                "email": event.target.checked,
                "mobile": event.target.checked,
            }
        };
        this.setState({notifications: Object.assign({}, this.state.notifications, up)});
        put("me/settings", {
            notifications: up
        })
        .then(() => 0)
        .catch(errorAlerter);
    }}}
    updateProfanityFilter = (ev) => {{{
        let new_profanity_settings = {};
        Array.prototype.filter.apply(ev.target.options, [x => x.selected]).map(opt => new_profanity_settings[opt.value] = true);
        preferences.set("profanity-filter", new_profanity_settings);
        this.setState({profanity_filter: Object.keys(new_profanity_settings)});
    }}}
    setAutoAdvance = (ev) => {{{
        preferences.set("auto-advance-after-submit", ev.target.checked),
        this.setState({autoadvance: preferences.get("auto-advance-after-submit")});
    }}}
    setAlwaysDisableAnalysis = (ev) => {{{
        preferences.set("always-disable-analysis", ev.target.checked),
        this.setState({always_disable_analysis: preferences.get("always-disable-analysis")});
    }}}
    setShowOfflineFriends = (ev) => {{{
        preferences.set("show-offline-friends", ev.target.checked),
        this.setState({show_offline_friends: preferences.get("show-offline-friends")});
    }}}
    setUnicodeFilterUsernames = (ev) => {{{
        preferences.set("unicode-filter", ev.target.checked),
        this.setState({unicode_filter_usernames: preferences.get("unicode-filter")});
    }}}
    setTranslationDialogNeverShow = (ev) => {{{
        preferences.set("translation-dialog-never-show", ev.target.checked),
        this.setState({translation_dialog_never_show: preferences.get("translation-dialog-never-show")});
    }}}
    updateDesktopNotifications = (ev) => {{{
        let enabled = ev.target.checked;

        if (!enabled) {
            this.setState({'desktop_notifications_enabled': false});
        }

        try {
            preferences.set('desktop-notifications', enabled);

            if (enabled) {
                if ((Notification as any).permission === 'denied') {
                    this.setState({'desktop_notifications_enabled': false});
                    toast(<div>{_("You have previously denied desktop notifications on OGS, you will need to go into your browser settings and change your decision there to enable them.")}</div>);
                }

                if ((Notification as any).permission === 'granted') {
                    this.setState({'desktop_notifications_enabled': true});
                }

                if ((Notification as any).permission === 'default') {
                    let onRequestResult = (perm) => {
                        if (perm === "granted") {
                            this.setState({'desktop_notifications_enabled': true});
                            console.log("granted notification permission");
                        } else {
                            this.setState({'desktop_notifications_enabled': false});
                            toast(<div>{_("You have previously denied desktop notifications on OGS, you will need to go into your browser settings and change your decision there to enable them.")}</div>);
                        }
                    };

                    try {
                        Notification.requestPermission().then(onRequestResult);
                    } catch (e) {
                        /* deprecated usage, but only way supported on safari currently */
                        Notification.requestPermission(onRequestResult);
                    }

                }
            }
        } catch (e) {
            console.error(e);
        }
    }}}
    updateHideUIClass = (ev) => {{{
        let checked = ev.target.checked;
        this.setState({'hide_ui_class': !checked});
        put(`me/settings`, 0, {
            'site_preferences': {
                'hide_ui_class': !checked
            }
        });
    }}}

    updatePassword1 = (ev) => {{{
        this.setState({password1: ev.target.value});
    }}}
    updatePassword2 = (ev) => {{{
        this.setState({password2: ev.target.value});
    }}}
    updateEmail = (ev) => {{{
        this.setState({
            profile: Object.assign({}, this.state.profile, {email: ev.target.value.trim()}),
            email_changed: true
        });
    }}}

    passwordIsValid() {{{
        return this.state.password1.length < 1024 && this.state.password1.length > 3 && this.state.password1 === this.state.password2;
    }}}
    emailIsValid() {{{
        if (this.state.profile.email.trim() === "") {
            return true;
        }
        let re = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
        return re.test(this.state.profile.email.trim());
    }}}

    saveEmail = () => {{{
        put("players/%%", this.state.profile.id, {
            "email": this.state.profile.email
        })
        .then(() => {
            this.setState({
                email_changed: false,
                email_message: _("Email updated successfully!")
            });
        }).catch(errorAlerter);
        /*
        swal({
            text: _("Enter your current password"),
        }).then((password) => {
            put("me/settings", {
                'password': password,
                ...
            })
            .then(()=>{
                swal(_("Email updated successfully!"))
            })
        }).catch(()=>0);
        */
    }}}
    savePassword = () => {{{
        if (this.state.profile.no_password_set) { // ie social auth account
            post("/api/v0/changePassword", {
                "new_password": this.state.password1,
                "old_password": "!",
            })
            .then((obj) => {
                this.resolve();
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
                    "new_password": this.state.password1,
                })
                .then((obj) => {
                    swal(_("Password updated successfully!"));
                })
                .catch(errorAlerter);
            }).catch(errorAlerter);
        }
    }}}

    updateGameListThreshold = (ev) => {{{
        this.setState({
            game_list_threshold: parseInt(ev.target.value)
        });
        preferences.set("game-list-threshold", parseInt(ev.target.value));
    }}}

    updateAutoplayDelay = (ev) => {{{
        this.setState({
            autoplay_delay: ev.target.value
        });
        if (parseFloat(ev.target.value) && parseFloat(ev.target.value) >= 0.1) {
            preferences.set("autoplay-delay", Math.round(1000 * parseFloat(ev.target.value)));
        }
    }}}
    resendValidationEmail = () => {{{
        post("me/validateEmail", {})
        .then(() => {
            swal("Validation email sent! Please check your email and click the validation link.");
        })
        .catch(errorAlerter);
    }}}

    render() {
        let user = data.get("user");
        let aga_ratings_enabled = null;

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

        return (
        <div className="Settings container">
            <h2 className="page-title"><i className="fa fa-gear"></i>{_("Settings")}</h2>
            <div className="row">
                <div className="col-sm-7">
                    <Card>
                        <h3>{_("General Settings")}</h3>
                        <dl>
                            <dt>{_("Language")}</dt>
                            <dd><LanguagePicker /></dd>

                            <dt>{_("Profanity filter")}</dt>
                            <dd>
                                <select multiple onChange={this.updateProfanityFilter} value={this.state.profanity_filter} >
                                    {Object.keys(languages).filter(lang => lang in profanity_regex).map((lang) => (
                                        <option key={lang} value={lang}>{languages[lang]}</option>
                                    ))}
                                </select>
                            </dd>

                            <dt>{_("Game thumbnail list threshold")}</dt>
                            <dd>
                                <select onChange={this.updateGameListThreshold} value={this.state.game_list_threshold}>
                                    <option value={0}>{_("Always show list")}</option>
                                    {[3, 5, 10, 25, 50, 100, 200].map((value, idx) =>
                                        <option key={idx} value={value}>{value}</option>
                                    )}
                                </select>
                            </dd>

                            <dt>{_("Desktop notifications")}</dt>
                            <dd>
                                <input type="checkbox"
                                        checked={this.state.desktop_notifications_enabled}
                                        onChange={this.updateDesktopNotifications}
                                        disabled={!this.state.desktop_notifications_enableable}
                                        id="desktop_notifications"/>
                                <label htmlFor="desktop_notifications">
                                    {this.state.desktop_notifications_enabled ? _("Enabled") : _("Disabled")}
                                </label>
                                {!this.state.desktop_notifications_enableable &&
                                    <div><i>
                                    {_("Desktop notifications are not supported by your browser")}
                                    </i></div>
                                }
                            </dd>

                            <dt><label htmlFor="show-offline-friends">{_("Show offline friends on list")}</label></dt>
                            <dd>
                                <input id="show-offline-friends" type="checkbox" checked={this.state.show_offline_friends} onChange={this.setShowOfflineFriends} />
                            </dd>

                            <dt><label htmlFor="unicode-filter-usernames">{_("Hide special unicode symbols in usernames")}</label></dt>
                            <dd>
                                <input id="unicode-filter-usernames" type="checkbox" checked={this.state.unicode_filter_usernames} onChange={this.setUnicodeFilterUsernames} />
                            </dd>

                            <dt><label htmlFor="translation-dialog-never-show">{_('Never show the "needs translation" message on the home page')}</label></dt>
                            <dd>
                                <input id="translation-dialog-never-show" type="checkbox" checked={this.state.translation_dialog_never_show} onChange={this.setTranslationDialogNeverShow} />
                            </dd>

                            {(user.supporter || null) && <dt>{_("Golden supporter name")}</dt>}
                            {(user.supporter || null) &&
                                <dd>
                                    <input type="checkbox"
                                            checked={!this.state.hide_ui_class}
                                            onChange={this.updateHideUIClass}
                                            id='hide_ui_class'
                                            />
                                    <label htmlFor="hide_ui_class">
                                        {!this.state.hide_ui_class ? _("Enabled") : _("Disabled")}
                                    </label>
                                </dd>
                            }
                        </dl>
                    </Card>

                    <Card>{/* {{{ */}
                        <h3>{_("Game Preferences")}</h3>
                        <dl>
                            <dt>{_("Sound")}</dt>
                            <dd className="inline-flex">
                                <i className={"fa volume-icon " +
                                    (this.state.volume === 0 ? "fa-volume-off"
                                        : (this.state.volume > 0.5 ? "fa-volume-up" : "fa-volume-down"))}
                                        onClick={this.toggleVolume}
                                /> <input type="range"
                                    onChange={this.setVolume}
                                    value={this.state.volume} min={0} max={1.0} step={0.01}
                                /> <span onClick={this.playSampleSound} style={{cursor: "pointer"}}>
                                    {_("Test") /* translators: Play a test sound to test the current volume setting */ } <i className="fa fa-play" />
                                </span>
                            </dd>
                            <dt>{_("Game control dock expansion delay") /* translators: This is the text under settings for controling the slide out delay of the list of game buttons in the game (pause, review, sgf link, etc...) */}</dt>
                            <dd className="inline-flex">
                                <input type="range"
                                       onChange={this.setDockDelay}
                                          value={this.state.dock_delay} min={0} max={MAX_DOCK_DELAY} step={0.1}
                                />
                                <span>&nbsp;{
                                    this.state.dock_delay === MAX_DOCK_DELAY
                                        ?  _("Off") /* translators: Indicates the dock slide out has been turned off */
                                        : interpolate(_("{{number_of}} seconds"), { number_of:  this.state.dock_delay}) /* translators: Indicates the number of seconds to delay the slide out of the list of game buttons on the right side of the game page */
                                }</span>
                            </dd>
                            <dt><label htmlFor="voice-countdown">{_("Voice countdown")}</label></dt>
                            <dd><input type="checkbox" id="voice-countdown" checked={this.state.voice_countdown} onChange={this.setVoiceCountdown}/></dd>
                            <dt>{_("Board labeling")}</dt>
                            <dd>
                                <select value={this.state.board_labeling} onChange={this.setBoardLabeling}>
                                    <option value="automatic">{_("Automatic")}</option>
                                    <option value="A1">A1</option>
                                    <option value="1-1">1-1</option>
                                </select>
                            </dd>

                            <dt>{_("Live game submit mode")}</dt>
                            <dd>
                                <select value={this.state.live_submit_mode} onChange={this.setLiveSubmitMode}>
                                    <option value="single">{_("One-click to move")}</option>
                                    <option value="double">{_("Double-click to move")}</option>
                                    <option value="button">{_("Submit-move button")}</option>
                                </select>
                            </dd>
                            <dt>{_("Correspondence submit mode")}</dt>
                            <dd>
                                <select value={this.state.corr_submit_mode} onChange={this.setCorrSubmitMode}>
                                    <option value="single">{_("One-click to move")}</option>
                                    <option value="double">{_("Double-click to move")}</option>
                                    <option value="button">{_("Submit-move button")}</option>
                                </select>
                            </dd>
                            <dt><label htmlFor="autoadvance">{_("Auto-advance to next game after making a move")}</label></dt>
                            <dd>
                                <input id="autoadvance" type="checkbox" checked={this.state.autoadvance} onChange={this.setAutoAdvance} />
                            </dd>
                            <dt>{_("Autoplay delay (in seconds)")}</dt>
                            <dd>
                                <input type="number" step="0.1" min="0.1" onChange={this.updateAutoplayDelay} value={this.state.autoplay_delay} />
                            </dd>
                            {(!user.supporter || null) &&
                                <dt><label htmlFor="show-ads-on-game-page">{_("Show ads on game page")}</label></dt>
                            }
                            {(!user.supporter || null) &&
                                <dd>
                                    <input type="checkbox" id="show-ads-on-game-page" checked={this.state.show_ads_on_game_page} onChange={this.setShowAdsOnGamePage}/>
                                </dd>
                            }
                            <dt><label htmlFor="always-disable-analysis">{_("Always disable analysis")}</label></dt>
                            <dd>
                                <input id="always-disable-analysis" type="checkbox" checked={this.state.always_disable_analysis} onChange={this.setAlwaysDisableAnalysis} />
                                <div><i>
                                {_("This will disable the analysis mode and conditional moves for you in all games, even if it is not disabled in the game's settings.")}
                                </i></div>
                            </dd>
                        </dl>
                    </Card>
                    {/* }}} */}


                    <Card>{/* {{{ */}
                        <h3>{_("Email Notifications")}</h3>
                        {_("Email me a notification when ...")}
                        {Object.keys(this.state.notifications).map((k, idx) =>
                            <div className="notification-option" key={k}>
                                <input type="checkbox" id={k}
                                    checked={this.state.notifications[k].value.email}
                                    onChange={this.updateNotification(k)}
                                />
                                <label htmlFor={k}>{_(this.state.notifications[k].description)}</label>
                            </div>
                        )}
                    </Card>
                    {/* }}} */}


                    {aga_ratings_enabled && /* {{{ */
                        <Card>
                            <h3>{_("AGA Settings")}</h3>


                        </Card>
                    /* }}} */}

                </div>
                <div className="col-sm-5">

                    <Card>{/* {{{ */}
                        <h3>
                            {this.state.profile.on_vacation
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
                                {this.state.profile.on_vacation
                                    ? <button onClick={this.endVacation} className="primary">{_("End vacation")}</button>
                                    : <button onClick={this.startVacation} className="primary">{_("Go on vacation")}</button>
                                }
                            </div>

                            <div>
                                {(!this.state.profile.on_vacation || null) &&
                                    <i>
                                    {_("This will pause any correspondence games you are in until you end your vacation")}
                                    </i>
                                }
                            </div>

                            <div>{interpolate(_("You have {{vacation_left}} of vacation available"),
                                              {vacation_left: this.state.vacation_left})
                            }</div>
                        </div>
                    </Card>
                    {/* }}} */}


                    <Card>{/* {{{ */}
                        <h3>{_("Account Settings")}</h3>

                        <dl>
                            <dt>{_("Email address")}</dt>
                            <dd><input type="email" name="new_email"
                                value={this.state.profile.email}
                                onChange={this.updateEmail}
                            />
                            {!this.state.email_changed ? null :
                                <button disabled={!this.emailIsValid()} className="primary" onClick={this.saveEmail}>
                                    {this.emailIsValid() ? _("Update email address") : _("Email address is not valid")}
                                </button>
                            }
                            {this.state.email_message && <div>{this.state.email_message}</div>}
                            {this.state.profile.email && !this.state.email_changed && !data.get('user').email_validated &&
                                <div>
                                    <div className='awaiting-validation-text'>
                                        {_("Awaiting email address confirmation. Chat will be disabled until your email address has been validated.")}
                                    </div>
                                    <button onClick={this.resendValidationEmail}>{_("Resend validation email")}</button>
                                </div>
                            }
                            </dd>

                            <dt>{_("Password")}</dt>
                            <dd className="password-update">
                                <div>
                                <input type="password" name="new_password1"
                                    value={this.state.password1}
                                    onChange={this.updatePassword1}
                                    />
                                </div>
                                <div>
                                <input placeholder={_("(again)")} type="password" name="new_password2"
                                    value={this.state.password2}
                                    onChange={this.updatePassword2}
                                    />
                                </div>
                                <div>
                                    {this.state.password1.length === 0 ? null :
                                        <button disabled={!this.passwordIsValid()} className="primary" onClick={this.savePassword}>
                                            {this.passwordIsValid() ?  _("Update password") :  _("Passwords don't match")}
                                        </button>
                                    }
                                </div>
                            </dd>
                        </dl>

                        <i><Link to={`/user/view/${user.id}#edit`}>{_("To update your profile information, click here")}</Link></i>


                    </Card>
                    {/* }}} */}

                </div>
            </div>
        </div>
        );
    }
}
