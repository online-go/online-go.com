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
import {browserHistory} from "ogsHistory";
import {_, pgettext, interpolate} from "translate";
import {Card} from "material";
import {post, get, del} from "requests";
import {SeekGraph} from "SeekGraph";
import {PersistentElement} from "PersistentElement";
import {shortShortTimeControl} from "TimeControl";
import {challenge, createOpenChallenge, challengeComputer} from "ChallengeModal";
import {openGameAcceptModal} from "GameAcceptModal";
import {errorAlerter, rulesText, timeControlSystemText, dup, uuid} from "misc";
import {Player} from "Player";
import {openNewGameModal} from "NewGameModal";
import {openAutomatchSettings, getAutomatchSettings} from "AutomatchSettings";
import * as data from "data";
import {automatch_manager, AutomatchPreferences} from 'automatch_manager';
import {bot_count} from "bots";
import {SupporterGoals} from "SupporterGoals";
import {boundedRankString} from "rank_utils";


interface PlayProperties {
}

export class Play extends React.Component<PlayProperties, any> {
    ref_container: HTMLDivElement;
    canvas: any;

    seekgraph: SeekGraph;
    resize_check_interval;

    constructor(props) {
        super(props);
        this.state = {
            live_list: [],
            correspondence_list: [],
            disableCorrespondenceButton: false,
            show_all_challenges: false,
            automatch_size_options: data.get('automatch.size_options', ['19x19']),
        };
        this.canvas = $("<canvas>")[0];
    }

    componentDidMount() {{{
        this.seekgraph = new SeekGraph({
            canvas: this.canvas
        });
        this.resize();
        this.seekgraph.on("challenges", this.updateChallenges);
        automatch_manager.on('entry', this.onAutomatchEntry);
        automatch_manager.on('start', this.onAutomatchStart);
        automatch_manager.on('cancel', this.onAutomatchCancel);
        $(window).on("resize", this.resize);
    }}}

    componentWillUnmount() {{{
        $(window).off("resize", this.resize);
        automatch_manager.off('entry', this.onAutomatchEntry);
        automatch_manager.off('start', this.onAutomatchStart);
        automatch_manager.off('cancel', this.onAutomatchCancel);
        this.seekgraph.destroy();
    }}}

    resize = () => {{{
        if (!this.ref_container) {
            return;
        }

        let w = this.ref_container.offsetWidth;
        let h = this.ref_container.offsetHeight;
        if (w !== this.seekgraph.width || h !== this.seekgraph.height) {
            this.seekgraph.resize(w, h);
        }
        if (w === 0 || h === 0) { // Wait for positive size
            setTimeout(this.resize, 500);
        }
    }}}

    updateChallenges = (challenges) => {{{
        let live = [];
        let corr = [];
        for (let i in challenges) {
            let C = challenges[i];
            C.ranked_text = C.ranked ? _("Yes") : _("No");
            if (C.handicap === -1) {
                C.handicap_text = _("Auto");
            }
            else if (C.handicap === 0) {
                C.handicap_text = _("No");
            }
            else {
                C.handicap_text = C.handicap;
            }

            if (C.time_per_move > 0 && C.time_per_move < 3600) {
                live.push(C);
            } else {
                corr.push(C);
            }
        }
        live.sort(challenge_sort);
        corr.sort(challenge_sort);

        this.setState({
            live_list: live,
            correspondence_list: corr
        });
    }}}

    acceptOpenChallenge(challenge) {{{
        openGameAcceptModal(challenge).then((challenge) => {
            browserHistory.push(`/game/${challenge.game_id}`);
            //window['openGame'](obj.game);
        }).catch(errorAlerter);
    }}}

    cancelOpenChallenge(challenge) {{{
        del("challenges/%%", challenge.challenge_id).then(() => 0).catch(errorAlerter);
    }}}

    extractUser(challenge) {{{
        return {
            id: challenge.user_id,
            username: challenge.username,
            rank: challenge.rank,
            professional: challenge.pro,
        };
    }}}

    onAutomatchEntry = (entry) => {{{
        this.forceUpdate();
    }}}

    onAutomatchStart = (entry) => {{{
        this.forceUpdate();
    }}}

    onAutomatchCancel = (entry) => {{{
        this.forceUpdate();
    }}}

    findMatch = (speed: 'blitz' | 'live' | 'correspondence') => {{{
        let settings = getAutomatchSettings(speed);
        let preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options: this.state.automatch_size_options.map((size) => {
                return {
                    'size': size,
                    'speed': speed,
                };
            }),
            lower_rank_diff: settings.lower_rank_diff,
            upper_rank_diff: settings.upper_rank_diff,
            rules: {
                condition: settings.rules.condition,
                value: settings.rules.value
            },
            time_control: {
                condition: settings.time_control.condition,
                value: settings.time_control.value
            },
            handicap: {
                condition: settings.handicap.condition,
                value: settings.handicap.value
            }
        };
        preferences.uuid = uuid();
        automatch_manager.findMatch(preferences);
        this.onAutomatchEntry(preferences);

        if (speed === 'correspondence') {
            this.setState({disableCorrespondenceButton: true});
            setTimeout(() => this.setState({disableCorrespondenceButton: false}), 1000);
        }
    }}}

    cancelActiveAutomatch = () => {{{
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        this.forceUpdate();
    }}}

    newComputerGame = () => {{{
        if (bot_count() === 0) {
            swal(_("Sorry, all bots seem to be offline, please try again later."));
            return;
        }
        challengeComputer();
    }}}

    newCustomGame = () => {{{
        challenge(null);
    }}}

    toggleSize(size) {{{
        let size_options = dup(this.state.automatch_size_options);
        if (size_options.indexOf(size) >= 0) {
            size_options = size_options.filter((x) => x !== size);
        }
        else {
            size_options.push(size);
        }
        if (size_options.length === 0) {
            size_options.push('19x19');
        }
        data.set('automatch.size_options', size_options);
        this.setState({automatch_size_options: size_options});
    }}}

    toggleShowAllChallenges = () => {{{
        this.setState({show_all_challenges: !this.state.show_all_challenges});
    }}}

    anyChallengesToShow = (live) => {{{
        let challengeList = live ? this.state.live_list : this.state.correspondence_list;

        return this.state.show_all_challenges && challengeList.length || challengeList.reduce( (prev, current) => {
            return prev || current.eligible || current.user_challenge;
        }, false );
    }}}

    render() {
        let corr_automatcher_uuids = Object.keys(automatch_manager.active_correspondence_automatchers);
        let corr_automatchers = corr_automatcher_uuids.map((uuid) => automatch_manager.active_correspondence_automatchers[uuid]);
        corr_automatchers.sort((a, b) => a.timestamp - b.timestamp);


        return (
            <div className="Play container">
                <SupporterGoals/>
                <div className='row'>
                    <div className='col-sm-6'>
                        <Card>
                            {this.automatchContainer()}
                        </Card>
                    </div>
                    <div className='col-sm-6'>
                        <Card>
                            <div ref={el => this.ref_container = el} className="seek-graph-container">
                                <PersistentElement elt={this.canvas}/>
                            </div>
                        </Card>
                    </div>
                </div>

                <div id="challenge-list-container">
                    <div id="challenge-list-inner-container">
                        <div id="challenge-list">

                            {(corr_automatchers.length || null) &&
                            <div className='challenge-row'>
                                <span className="cell break">{_("Automatch")}</span>
                                {this.cellBreaks(7)}
                            </div>
                            }
                            {(corr_automatchers.length || null) &&
                            <div className='challenge-row'>
                                <span className="head"></span>
                                <span className="head">{_("Rank")}</span>
                                <span className="head">{_("Size")}</span>
                                <span className="head">{_("Time Control")}</span>
                                <span className="head">{_("Handicap")}</span>
                                <span className="head">{_("Rules")}</span>
                            </div>
                            }
                            {corr_automatchers.map((m) => (
                                <div className='challenge-row automatch-challenge-row' key={m.uuid}>
                                <span className='cell'>
                                    <button className='reject xs'
                                            onClick={() => automatch_manager.cancel(m.uuid)}>{pgettext("Cancel automatch", "Cancel")}</button>
                                </span>

                                    <span className='cell'>
                                    {m.lower_rank_diff === m.upper_rank_diff ?
                                        <span>&plusmn; {m.lower_rank_diff}</span> :
                                        <span>-{m.lower_rank_diff} &nbsp; +{m.upper_rank_diff}</span>}
                                </span>

                                    <span className='cell'>
                                    {m.size_speed_options.filter((x) => x.speed === 'correspondence').map((x) => x.size).join(',')}
                                </span>

                                    <span className={m.time_control.condition + ' cell'}>
                                    {m.time_control.condition === 'no-preference'
                                        ? pgettext("Automatch: no preference", "No preference")
                                        : timeControlSystemText(m.time_control.value.system)
                                    }
                                </span>

                                    <span className={m.handicap.condition + ' cell'}>
                                    {m.handicap.condition === 'no-preference'
                                        ? pgettext("Automatch: no preference", "No preference")
                                        : (m.handicap.value === 'enabled' ? pgettext("Handicap dnabled", "Enabled") : pgettext("Handicap disabled", "Disabled"))
                                    }
                                </span>

                                    <span className={m.rules.condition + ' cell'}>
                                    {m.rules.condition === 'no-preference'
                                        ? pgettext("Automatch: no preference", "No preference")
                                        : rulesText(m.rules.value)
                                    }
                                </span>
                                </div>
                            ))}

                            <div style={{marginTop: "2em"}}></div>

                            {/* There must be a better way to get the header in the centre! At least this doesn't cause warnings :) */}
                            <div className='custom-games-list-header-row'>
                                <span className='cell'></span>
                                <span className='cell'></span>
                                <span className='cell'></span>
                                <span className='cell'></span>
                                <span className='cell'>{_("Custom Games")}</span>
                            </div>


                            <div className="challenge-row">
                                <span className="cell break">{_("Short Games")}</span>
                                {this.cellBreaks(8)}
                            </div>

                            {this.anyChallengesToShow(true) ? this.challengeListHeaders() : null}

                            {this.challengeList(true)}

                            <div style={{marginTop: "2em"}}></div>

                            <div className="challenge-row" style={{marginTop: "1em"}}>
                                <span className="cell break">{_("Long Games")}</span>
                                {this.cellBreaks(8)}
                            </div>

                            {this.anyChallengesToShow(false) ? this.challengeListHeaders() : null}

                            {this.challengeList(false)}

                            <div className="showall-selector">
                                <input id="show-all-challenges" type="checkbox" checked={this.state.show_all_challenges}
                                       onChange={this.toggleShowAllChallenges}/>
                                <label htmlFor="show-all-challenges">{_("Show all challenges")}</label>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        );
    }

    automatchContainer() {{{
        let size_enabled = (size) => {
            return this.state.automatch_size_options.indexOf(size) >= 0;
        };

        if (automatch_manager.active_live_automatcher) {
            return (
                <div className='automatch-container'>
                    <div className='automatch-header'>
                        {_("Finding you a game...")}
                    </div>
                    <div className='automatch-row-container'>
                        <div className="spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                    </div>
                    <div className='automatch-settings'>
                        <button className='danger sm' onClick={this.cancelActiveAutomatch}>{pgettext("Cancel automatch", "Cancel")}</button>
                    </div>
                </div>
            );
        }
        else {
            return (
                <div className='automatch-container'>
                    <div className='automatch-header'>
                        <div>{_("Quick match finder")}</div>
                        <div className='btn-group'>
                            <button className={size_enabled('9x9') ? 'primary sm' : 'sm'} onClick={() => this.toggleSize("9x9")}>9x9</button>
                            <button className={size_enabled('13x13') ? 'primary sm' : 'sm'} onClick={() => this.toggleSize("13x13")}>13x13</button>
                            <button className={size_enabled('19x19') ? 'primary sm' : 'sm'} onClick={() => this.toggleSize("19x19")}>19x19</button>
                        </div>
                        <div className='automatch-settings'>
                            <span className='automatch-settings-link fake-link' onClick={openAutomatchSettings}><i className='fa fa-gear'/>{_("Settings ")}</span>
                        </div>
                    </div>
                    <div className='automatch-row-container'>
                        <div className='automatch-row'>
                            <button className='primary' onClick={() => this.findMatch("blitz")}>
                                <div className='play-button-text-root'>
                                    <i className="fa fa-bolt" /> {_("Blitz")}
                                    <span className='time-per-move'>{pgettext("Automatch average time per move", "~10s per move")}</span>
                                </div>
                            </button>
                            <button className='primary' onClick={() => this.findMatch("live")}>
                                <div className='play-button-text-root'>
                                    <i className="fa fa-clock-o" /> {_("Normal")}
                                    <span className='time-per-move'>{pgettext("Automatch average time per move", "~30s per move")}</span>
                                </div>
                            </button>
                        </div>
                        <div className='automatch-row'>
                            <button className='primary' onClick={this.newComputerGame}>
                                <div className='play-button-text-root'>
                                    <i className="fa fa-desktop" /> {_("Computer")}
                                    <span className='time-per-move'></span>
                                </div>
                            </button>
                            <button className='primary' disabled={this.state.disableCorrespondenceButton} onClick={() => this.findMatch("correspondence")}>
                                <div className='play-button-text-root'>
                                    {this.state.disableCorrespondenceButton
                                        ? <span><i className="fa fa-check" /> {_("Correspondence")}</span>
                                        : <span><i className="ogs-turtle" /> {_("Correspondence")}</span>
                                    }
                                    <span className='time-per-move'>{pgettext("Automatch average time per move", "~1 day per move")}</span>
                                </div>
                            </button>
                        </div>
                        <div className='custom-game-header'>
                            <div>{_("Custom Game")}</div>
                        </div>
                        <div className='custom-game-row'>
                            <button className='primary' onClick={this.newCustomGame}>
                                <i className="fa fa-cog" /> {_("Create")}
                            </button>
                        </div>
                    </div>

                </div>
            );
        }
    }}}

    challengeList(isLive: boolean) {{{
        let timeControlClassName = (config) => {
            let isBold = isLive && (config.time_per_move > 3600 || config.time_per_move === 0);
            return "cell " + (isBold ? "bold" : "");
        };

        if (!this.anyChallengesToShow(isLive)) {
            return (
                <div className={"ineligible"}>
                    {this.state.show_all_challenges ?
                        "(none)" :
                        "(none available)"
                    }
                </div>
            );
        }

        let commonSpan = (text: string, align: string) => {
            return <span className="cell" style={{textAlign: align}}>
                {text}
            </span>;
        };

        let challengeList = isLive ? this.state.live_list : this.state.correspondence_list;

        return challengeList.map((C) => (
            (C.eligible || C.user_challenge || this.state.show_all_challenges ?
                    <div key={C.challenge_id} className="challenge-row">
                        <span className="cell" style={{textAlign: "center"}}>
                            {(C.eligible || null) && <button onClick={this.acceptOpenChallenge.bind(this, C)} className="btn success xs">{_("Accept")}</button>}
                            {(!C.eligible && !C.user_challenge || null) && <span className="ineligible" title={C.ineligible_reason}>{_("Can't accept")}</span>}
                            {(C.user_challenge || null) && <button onClick={this.cancelOpenChallenge.bind(this, C)} className="btn reject xs">{_("Remove")}</button>}
                        </span>
                        <span className="cell" style={{textAlign: "left", maxWidth: "10em", overflow: "hidden"}}>
                            <Player user={this.extractUser(C)} rank={false} />
                        </span>
                        {commonSpan(boundedRankString(C.rank), "center")}
                        <span className={"cell " + ((C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19)) ? "bold" : "")}>
                            {C.width}x{C.height}
                        </span>
                        <span className={timeControlClassName(C)}>
                            {shortShortTimeControl(C.time_control_parameters)}
                        </span>
                        {commonSpan(C.ranked_text, "center")}
                        {commonSpan(C.handicap_text, "center")}
                        {commonSpan(C.name, "left")}
                        {commonSpan(rulesText(C.rules), "left")}
                    </div> :
                    null
            )));
    }}}

    cellBreaks(amount) {{{
        let result = [];
        for (let i = 0; i < amount; ++i) {
            result.push(<span key={i} className="cell break"></span>);
        }
        return result;
    }}}
    challengeListHeaders() {{{
        return <div className="challenge-row">
            <span className="head"></span>
            <span className="head">{_("Player")}</span>
            <span className="head">{_("Rank")}</span>
            <span className="head">{_("Size")}</span>
            <span className="head">{_("Time")}</span>
            <span className="head">{_("Ranked")}</span>
            <span className="head">{_("Handicap")}</span>
            <span className="head" style={{textAlign: "left"}}>{_("Name")}</span>
            <span className="head" style={{textAlign: "left"}}>{_("Rules")}</span>
        </div>;
    }}}

}

function challenge_sort(A, B) {
    if (A.eligible && !B.eligible) { return -1; }
    if (!A.eligible && B.eligible) { return 1; }

    if (A.user_challenge && !B.user_challenge) { return -1; }
    if (!A.user_challenge && B.user_challenge) { return 1; }

    let t = A.username.localeCompare(B.username);
    if (t) { return t; }

    if (A.ranked && !B.ranked) { return -1; }
    if (!A.ranked && B.ranked) { return 1; }

    return A.challenge_id - B.challenge_id;
}
