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
import {AdUnit} from "AdUnit";
import {browserHistory} from "react-router";
import {_, pgettext, interpolate} from "translate";
import {post, get, del} from "requests";
import {SeekGraph} from "SeekGraph";
import {PersistentElement} from "PersistentElement";
import {shortShortTimeControl} from "TimeControl";
import {createOpenChallenge, challengeComputer} from "ChallengeModal";
import {openGameAcceptModal} from "GameAcceptModal";
import {errorAlerter} from "misc";
import {Player} from "Player";
import {openNewGameModal} from "NewGameModal";
import data from "data";
import {FirstTimeSetup} from "FirstTimeSetup";


interface PlayProperties {
}

export class Play extends React.Component<PlayProperties, any> {
    refs: {
        container
    };
    canvas: any;

    seekgraph: SeekGraph;
    resize_check_interval;

    constructor(props) {
        super(props);
        this.state = {
            live_list: [],
            correspondence_list: [],
        };
        this.canvas = $("<canvas>")[0];
    }

    componentDidMount() {{{
        this.seekgraph = new SeekGraph({
            canvas: this.canvas
        });
        this.resize();
        this.seekgraph.on("challenges", this.updateChallenges);

        $(window).on("resize", this.resize);
    }}}
    componentWillUnmount() {{{
        console.log("Unmounted Play");
        $(window).off("resize", this.resize);
        this.seekgraph.destroy();
    }}}
    resize = () => {{{
        let w = this.refs.container.offsetWidth;
        let h = this.refs.container.offsetHeight;
        if (w !== this.seekgraph.width || h !== this.seekgraph.height) {
            this.seekgraph.resize(w, h);
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
        console.log(challenge);
        del(`challenges/${challenge.challenge_id}`).then(() => 0).catch(errorAlerter);
    }}}
    extractUser(challenge) {{{
        return {
            id: challenge.user_id,
            username: challenge.username,
            rank: challenge.rank,
            professional: challenge.pro,
        };
    }}}



    render() {
        if (!data.get("user").setup_rank_set) {
            return <FirstTimeSetup/>;
        }

        return (
            <div className="Play container">

                <div ref="container" className="seek-graph-container">
                    <PersistentElement elt={this.canvas} />
                </div>

                <AdUnit unit="cdm-zone-01" nag/>

                <div className="challenge-buttons">
                    <button className="btn primary raise" style={{marginRight: "1em"}} onClick={openNewGameModal}>{_("Create a game")}</button> 
                </div>

                <div id="challenge-list-container">
                  <div id="challenge-list-inner-container">
                    <div id="challenge-list">
                        <div className="challenge-row">
                            <span className="cell break" colSpan={2}>{_("Short Games")}</span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                        </div>

                        <div className="challenge-row">
                            <span className="head"></span>
                            <span className="head">{_("Player")}</span>
                            <span className="head">{_("Size")}</span>
                            <span className="head">{_("Time")}</span>
                            <span className="head">{_("Ranked")}</span>
                            <span className="head">{_("Handicap")}</span>
                            <span className="head" style={{textAlign: "left"}}>{_("Name")}</span>
                        </div>
                        {this.state.live_list.map((C, idx) => (
                            <div key={idx} className="challenge-row">
                                <span className="cell" style={{textAlign: "center"}}>
                                    {(C.eligible || null) && <button onClick={this.acceptOpenChallenge.bind(this, C)} className="btn success xs">{_("Accept")}</button>}
                                    {(!C.eligible && !C.user_challenge || null) && <span className="ineligible" title={C.ineligible_reason}>{_("Can't accept")}</span>}
                                    {(C.user_challenge || null) && <button onClick={this.cancelOpenChallenge.bind(this, C)} className="btn reject xs">{_("Remove")}</button>}
                                </span>
                                <span className="cell" style={{textAlign: "left", maxWidth: "10em", overflow: "hidden"}}>
                                    <Player user={this.extractUser(C)}/>
                                </span>
                                <span className={"cell " + ((C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19)) ? "bold" : "")}>
                                    {C.width}x{C.height}
                                </span>
                                <span className={"cell " + ((C.time_per_move > 3600 || C.time_per_move === 0) ? "bold" : "")}>
                                    {shortShortTimeControl(C.time_control_parameters)}
                                </span>
                                <span className="cell" style={{textAlign: "center"}}>
                                    {C.ranked_text}
                                </span>
                                <span className="cell" style={{textAlign: "center"}}>
                                    {C.handicap_text}
                                </span>
                                <span className="cell" style={{textAlign: "left"}}>
                                    {C.name}
                                </span>
                            </div>
                        ))}

                        <div style={{marginTop: "2em"}}>
                        </div>

                        <div className="challenge-row" style={{marginTop: "1em"}}>
                            <span className="cell break" colSpan={2}>{_("Long Games")}</span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                            <span className="cell break"></span>
                        </div>
                        <div className="challenge-row">
                            <span className="head"></span>
                            <span className="head">{_("Player")}</span>
                            <span className="head">{_("Size")}</span>
                            <span className="head">{_("Time")}</span>
                            <span className="head">{_("Ranked")}</span>
                            <span className="head">{_("Handicap")}</span>
                            <span className="head" style={{textAlign: "left"}}>{_("Name")}</span>
                        </div>

                        {this.state.correspondence_list.map((C, idx) => (
                            <div key={idx} className="challenge-row">
                                <span className="cell" style={{textAlign: "center"}}>
                                    {(C.eligible || null) && <button onClick={this.acceptOpenChallenge.bind(this, C)} className="btn success xs">{_("Accept")}</button>}
                                    {(!C.eligible && !C.user_challenge || null) && <span className="ineligible" title={C.ineligible_reason}>{_("Can't accept")}</span>}
                                    {(C.user_challenge || null) && <button onClick={this.cancelOpenChallenge.bind(this, C)} className="btn reject xs">{_("Remove")}</button>}
                                </span>
                                <span className="cell" style={{textAlign: "left", maxWidth: "10em", overflow: "hidden"}}>
                                    <Player user={this.extractUser(C)}/>
                                </span>
                                <span className={"cell " + ((C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19)) ? "bold" : "")}>
                                    {C.width}x{C.height}
                                </span>
                                <span className="cell">
                                    {shortShortTimeControl(C.time_control_parameters)}
                                </span>
                                <span className="cell" style={{textAlign: "center"}}>
                                    {C.ranked_text}
                                </span>
                                <span className="cell" style={{textAlign: "center"}}>
                                    {C.handicap_text}
                                </span>
                                <span className="cell" style={{textAlign: "left"}}>
                                    {C.name}
                                </span>
                            </div>
                        ))}
                    </div>
                  </div>
                </div>



            </div>
        );
    }
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
