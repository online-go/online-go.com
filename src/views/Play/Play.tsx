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
import ReactResizeDetector from "react-resize-detector";
import { Link } from "react-router-dom";
import { browserHistory } from "ogsHistory";
import { _, pgettext, interpolate } from "translate";
import { Card } from "material";
import { put, post, get, del } from "requests";
import { SeekGraph } from "SeekGraph";
import { PersistentElement } from "PersistentElement";
import { isLiveGame, shortShortTimeControl, usedForCheating } from "TimeControl";
import { challenge, createOpenChallenge, challengeComputer } from "ChallengeModal";
import { openGameAcceptModal } from "GameAcceptModal";
import { errorAlerter, rulesText, timeControlSystemText, dup, uuid, ignore } from "misc";
import { Player } from "Player";
import { openAutomatchSettings, getAutomatchSettings } from "AutomatchSettings";
import * as data from "data";
import * as preferences from "preferences";
import { automatch_manager, AutomatchPreferences } from "automatch_manager";
import { bot_count } from "bots";
import { SupporterGoals } from "SupporterGoals";
import { boundedRankString } from "rank_utils";
import * as player_cache from "player_cache";
import swal from "sweetalert2";
import { Size } from "src/lib/types";
import { join } from "@sentry/utils";

const CHALLENGE_LIST_FREEZE_PERIOD = 1000; // Freeze challenge list for this period while they move their mouse on it

interface PlayState {
    live_list: Array<any>;
    correspondence_list: Array<any>;
    rengo_list: Array<any>;
    showLoadingSpinnerForCorrespondence: boolean;
    show_all_challenges: boolean;
    show_ranked_challenges: boolean;
    show_unranked_challenges: boolean;
    show_19x19_challenges: boolean;
    show_13x13_challenges: boolean;
    show_9x9_challenges: boolean;
    show_other_boardsize_challenges: boolean;
    automatch_size_options: Size[];
    freeze_challenge_list: boolean; // Don't change the challenge list while they are trying to point the mouse at it
    pending_challenges: Array<any>; // challenges received while frozen
    admin_pending: boolean; // used to change cursor while waiting for rengo admin actions
}

export class Play extends React.Component<{}, PlayState> {
    ref_container: HTMLDivElement;
    canvas: HTMLCanvasElement;

    seekgraph: SeekGraph;
    resize_check_interval;

    private list_freeze_timeout;

    constructor(props) {
        super(props);
        this.state = {
            live_list: [],
            correspondence_list: [],
            rengo_list: [],
            showLoadingSpinnerForCorrespondence: false,
            show_all_challenges: preferences.get("show-all-challenges"),
            show_ranked_challenges: preferences.get("show-ranked-challenges"),
            show_unranked_challenges: preferences.get("show-unranked-challenges"),
            show_19x19_challenges: preferences.get("show-19x19-challenges"),
            show_13x13_challenges: preferences.get("show-13x13-challenges"),
            show_9x9_challenges: preferences.get("show-9x9-challenges"),
            show_other_boardsize_challenges: preferences.get("show-other-boardsize-challenges"),
            automatch_size_options: data.get("automatch.size_options", ["19x19"]),
            freeze_challenge_list: false, // Don't change the challenge list while they are trying to point the mouse at it
            pending_challenges: [], // challenges received while frozen
            admin_pending: false,
        };
        this.canvas = document.createElement("canvas");
        this.list_freeze_timeout = null;
    }

    componentDidMount() {
        window.document.title = _("Play");
        this.seekgraph = new SeekGraph({
            canvas: this.canvas,
        });
        this.onResize();
        this.seekgraph.on("challenges", this.updateChallenges);
        automatch_manager.on("entry", this.onAutomatchEntry);
        automatch_manager.on("start", this.onAutomatchStart);
        automatch_manager.on("cancel", this.onAutomatchCancel);
    }

    componentWillUnmount() {
        automatch_manager.off("entry", this.onAutomatchEntry);
        automatch_manager.off("start", this.onAutomatchStart);
        automatch_manager.off("cancel", this.onAutomatchCancel);
        this.seekgraph.destroy();
        if (this.list_freeze_timeout) {
            clearTimeout(this.list_freeze_timeout);
            this.list_freeze_timeout = null;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.freeze_challenge_list &&
            !this.state.freeze_challenge_list &&
            this.state.pending_challenges.length !== 0
        ) {
            this.updateChallenges(this.state.pending_challenges);
        }
    }

    onResize = () => {
        if (!this.ref_container) {
            return;
        }

        const w = this.ref_container.offsetWidth;
        const h = this.ref_container.offsetHeight;
        if (w !== this.seekgraph.width || h !== this.seekgraph.height) {
            this.seekgraph.resize(w, h);
        }
        if (w === 0 || h === 0) {
            // Wait for positive size
            setTimeout(this.onResize, 500);
        }
    };

    updateChallenges = (challenges) => {
        if (this.state.freeze_challenge_list) {
            const live = this.state.live_list;
            const corr = this.state.correspondence_list;
            const rengo = this.state.rengo_list;
            for (const list of [live, corr, rengo]) {
                for (const i in list) {
                    const id = list[i].challenge_id;
                    if (!challenges[id]) {
                        // console.log("Challenge went away:", id);
                        list[i].removed = true;
                        list[i].ineligible_reason = _(
                            "challenge no longer available",
                        ); /* translator: the person can't accept this challenge because it has been removed or accepted already */
                    }
                }
            }
            //console.log("pending list store...");
            this.setState({
                pending_challenges: challenges,
                live_list: live,
                correspondence_list: corr,
            });
            return;
        }

        //console.log("Updating challenges with:", challenges);
        const live = [];
        const corr = [];
        const rengo = [];
        for (const i in challenges) {
            const C = challenges[i];
            player_cache
                .fetch(C.user_id)
                .then(() => 0)
                .catch(ignore); /* just get the user data ready ready if we don't already have it */
            C.ranked_text = C.ranked ? _("Yes") : _("No");
            if (C.handicap === -1) {
                C.handicap_text = _("Auto");
            } else if (C.handicap === 0) {
                C.handicap_text = _("No");
            } else {
                C.handicap_text = C.handicap;
            }

            if (C.rengo) {
                rengo.push(C);
            } else if (C.time_per_move > 0 && C.time_per_move < 3600) {
                // TBD: why aren't we using isLive here?
                live.push(C);
            } else {
                corr.push(C);
            }
        }
        live.sort(challenge_sort);
        corr.sort(challenge_sort);
        rengo.sort(time_per_move_challenge_sort);

        //console.log("list update...");
        this.setState({
            live_list: live,
            correspondence_list: corr,
            rengo_list: rengo,
            pending_challenges: [],
        });
    };

    acceptOpenChallenge(challenge) {
        openGameAcceptModal(challenge)
            .then((challenge) => {
                browserHistory.push(`/game/${challenge.game_id}`);
                //window['openGame'](obj.game);
                this.unfreezeChallenges();
            })
            .catch(errorAlerter);
    }

    cancelOpenChallenge(challenge) {
        del("challenges/%%", challenge.challenge_id)
            .then(() => 0)
            .catch(errorAlerter);
        this.unfreezeChallenges();
    }

    cancelOwnChallenges = (challenge_list) => {
        challenge_list.forEach((c) => {
            if (c.user_challenge) {
                this.cancelOpenChallenge(c);
            }
        });
    };

    extractUser(challenge) {
        return {
            id: challenge.user_id,
            username: challenge.username,
            rank: challenge.rank,
            professional: challenge.pro,
        };
    }

    onAutomatchEntry = (entry) => {
        this.forceUpdate();
    };

    onAutomatchStart = (entry) => {
        this.forceUpdate();
    };

    onAutomatchCancel = (entry) => {
        this.forceUpdate();
    };

    findMatch = (speed: "blitz" | "live" | "correspondence") => {
        const settings = getAutomatchSettings(speed);
        const preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options: this.state.automatch_size_options.map((size) => {
                return {
                    size: size,
                    speed: speed,
                };
            }),
            lower_rank_diff: settings.lower_rank_diff,
            upper_rank_diff: settings.upper_rank_diff,
            rules: {
                condition: settings.rules.condition,
                value: settings.rules.value,
            },
            time_control: {
                condition: settings.time_control.condition,
                value: settings.time_control.value,
            },
            handicap: {
                condition: settings.handicap.condition,
                value: settings.handicap.value,
            },
        };
        preferences.uuid = uuid();
        automatch_manager.findMatch(preferences);
        this.onAutomatchEntry(preferences);

        if (speed === "correspondence") {
            this.setState({ showLoadingSpinnerForCorrespondence: true });
        }
    };

    dismissCorrespondenceSpinner = () => {
        this.setState({ showLoadingSpinnerForCorrespondence: false });
    };

    cancelActiveAutomatch = () => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        this.forceUpdate();
    };

    newComputerGame = () => {
        if (bot_count() === 0) {
            swal(_("Sorry, all bots seem to be offline, please try again later.")).catch(swal.noop);
            return;
        }
        challengeComputer();
    };

    newCustomGame = () => {
        challenge(null);
    };

    toggleSize(size) {
        let size_options = dup(this.state.automatch_size_options);
        if (size_options.indexOf(size) >= 0) {
            size_options = size_options.filter((x) => x !== size);
        } else {
            size_options.push(size);
        }
        if (size_options.length === 0) {
            size_options.push("19x19");
        }
        data.set("automatch.size_options", size_options);
        this.setState({ automatch_size_options: size_options });
    }

    toggleShowAllChallenges = () => {
        preferences.set("show-all-challenges", !this.state.show_all_challenges);
        this.setState({ show_all_challenges: !this.state.show_all_challenges });
    };

    toggleShowUnrankedChallenges = () => {
        preferences.set("show-unranked-challenges", !this.state.show_unranked_challenges);
        this.setState({ show_unranked_challenges: !this.state.show_unranked_challenges });
    };

    toggleShowRankedChallenges = () => {
        preferences.set("show-ranked-challenges", !this.state.show_ranked_challenges);
        this.setState({ show_ranked_challenges: !this.state.show_ranked_challenges });
    };

    toggleShow19x19Challenges = () => {
        preferences.set("show-19x19-challenges", !this.state.show_19x19_challenges);
        this.setState({ show_19x19_challenges: !this.state.show_19x19_challenges });
    };

    toggleShow13x13Challenges = () => {
        preferences.set("show-13x13-challenges", !this.state.show_13x13_challenges);
        this.setState({ show_13x13_challenges: !this.state.show_13x13_challenges });
    };

    toggleShow9x9Challenges = () => {
        preferences.set("show-9x9-challenges", !this.state.show_9x9_challenges);
        this.setState({ show_9x9_challenges: !this.state.show_9x9_challenges });
    };

    toggleShowOtherBoardsizeChallenges = () => {
        preferences.set("show-other-boardsize-challenges", !this.state.show_other_boardsize_challenges);
        this.setState({ show_other_boardsize_challenges: !this.state.show_other_boardsize_challenges });
    };

    anyChallengesToShow = (challenge_list): boolean => {
        return (
            (this.state.show_all_challenges && challenge_list.length) ||
            challenge_list.reduce((prev, current) => {
                return prev || current.eligible || current.user_challenge;
            }, false)
        );
    };

    liveOwnChallengePending = (): any => {
        const locp = this.state.live_list.find((c) => c.user_challenge);
        return locp;
    };

    ownRengoChallengePending = (): any => {
        const orcp = this.state.rengo_list.find((c) => c.user_challenge);
        return orcp;
    };

    joinedRengoChallengePending = (): any => {
        const user_id = data.get("config.user").id;
        const jrcp = this.state.rengo_list.find((c) => c["rengo_participants"].includes(user_id) && !c.user_challenge);
        return jrcp;
    };

    startOwnRengoChallenge = () => {
        const our_challenge = this.state.rengo_list.find((c) => c.user_challenge);

        swal({
            text: "Starting...",
            type: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        }).catch(swal.noop);

        post("challenges/%%/start", our_challenge.challenge_id, {})
            .then(() => {
                swal.close();
            })
            .catch((err) => {
                swal.close();
                errorAlerter(err);
            });
    };

    freezeChallenges = () => {
        if (this.list_freeze_timeout) {
            clearTimeout(this.list_freeze_timeout);
        }
        if (!this.state.freeze_challenge_list) {
            //console.log("Freeze challenges...");
            this.setState({ freeze_challenge_list: true });
        }
        this.list_freeze_timeout = setTimeout(this.unfreezeChallenges, CHALLENGE_LIST_FREEZE_PERIOD);
    };

    unfreezeChallenges = () => {
        //console.log("Unfreeze challenges...");
        this.setState({ freeze_challenge_list: false });
        if (this.list_freeze_timeout) {
            clearTimeout(this.list_freeze_timeout);
            this.list_freeze_timeout = null;
        }
    };

    render() {
        const corr_automatcher_uuids = Object.keys(automatch_manager.active_correspondence_automatchers);
        const corr_automatchers = corr_automatcher_uuids.map(
            (uuid) => automatch_manager.active_correspondence_automatchers[uuid],
        );
        corr_automatchers.sort((a, b) => a.timestamp - b.timestamp);

        return (
            <div className="Play container">
                <SupporterGoals />
                <div className="row">
                    <div className="col-sm-6">
                        <Card>{this.automatchContainer()}</Card>
                    </div>
                    <div className="col-sm-6">
                        <Card>
                            <div ref={(el) => (this.ref_container = el)} className="seek-graph-container">
                                <ReactResizeDetector handleWidth handleHeight onResize={() => this.onResize()} />
                                <PersistentElement elt={this.canvas} />
                            </div>
                        </Card>
                    </div>
                </div>

                <div id="challenge-list-container">
                    <div id="challenge-list-inner-container">
                        <div id="challenge-list" onMouseMove={this.freezeChallenges}>
                            {(corr_automatchers.length || null) && (
                                <div className="challenge-row">
                                    <span className="cell break">{_("Your Automatch Requests")}</span>
                                    {this.cellBreaks(7)}
                                </div>
                            )}
                            {(corr_automatchers.length || null) && (
                                <div className="challenge-row">
                                    <span className="head"></span>
                                    <span className="head">{_("Rank")}</span>
                                    <span className="head">{_("Size")}</span>
                                    <span className="head">{_("Time Control")}</span>
                                    <span className="head">{_("Handicap")}</span>
                                    <span className="head">{_("Rules")}</span>
                                </div>
                            )}
                            {corr_automatchers.map((m) => (
                                <div className="challenge-row automatch-challenge-row" key={m.uuid}>
                                    <span className="cell">
                                        <button
                                            className="reject xs"
                                            onClick={() => {
                                                automatch_manager.cancel(m.uuid);
                                                if (corr_automatchers.length === 1) {
                                                    this.setState({ showLoadingSpinnerForCorrespondence: false });
                                                }
                                            }}
                                        >
                                            {pgettext("Cancel automatch", "Cancel")}
                                        </button>
                                    </span>

                                    <span className="cell">
                                        {m.lower_rank_diff === m.upper_rank_diff ? (
                                            <span>&plusmn; {m.lower_rank_diff}</span>
                                        ) : (
                                            <span>
                                                -{m.lower_rank_diff} &nbsp; +{m.upper_rank_diff}
                                            </span>
                                        )}
                                    </span>

                                    <span className="cell">
                                        {m.size_speed_options
                                            .filter((x) => x.speed === "correspondence")
                                            .map((x) => x.size)
                                            .join(",")}
                                    </span>

                                    <span className={m.time_control.condition + " cell"}>
                                        {m.time_control.condition === "no-preference"
                                            ? pgettext("Automatch: no preference", "No preference")
                                            : timeControlSystemText(m.time_control.value.system)}
                                    </span>

                                    <span className={m.handicap.condition + " cell"}>
                                        {m.handicap.condition === "no-preference"
                                            ? pgettext("Automatch: no preference", "No preference")
                                            : m.handicap.value === "enabled"
                                            ? pgettext("Handicap dnabled", "Enabled")
                                            : pgettext("Handicap disabled", "Disabled")}
                                    </span>

                                    <span className={m.rules.condition + " cell"}>
                                        {m.rules.condition === "no-preference"
                                            ? pgettext("Automatch: no preference", "No preference")
                                            : rulesText(m.rules.value)}
                                    </span>
                                </div>
                            ))}

                            <div style={{ marginTop: "2em" }}></div>

                            <div className="custom-games-list-header-row">{_("Custom Games")}</div>

                            <div className="challenge-row">
                                <span className="cell break">{_("Short Games")}</span>
                                {this.cellBreaks(8)}
                            </div>

                            {this.anyChallengesToShow(this.state.live_list) ? this.challengeListHeaders() : null}

                            {this.challengeList(true)}

                            <div style={{ marginTop: "2em" }}></div>

                            <div className="challenge-row" style={{ marginTop: "1em" }}>
                                <span className="cell break">{_("Long Games")}</span>
                                {this.cellBreaks(8)}
                            </div>

                            {this.anyChallengesToShow(this.state.correspondence_list)
                                ? this.challengeListHeaders()
                                : null}

                            {this.challengeList(false)}

                            <div style={{ marginTop: "2em" }}></div>

                            <div className="challenge-row" style={{ marginTop: "1em" }}>
                                <span className="cell break">{_("Rengo")}</span>
                                {this.cellBreaks(8)}
                            </div>

                            {this.anyChallengesToShow(this.state.rengo_list) ? this.rengoListHeaders() : null}

                            {this.rengoList()}
                        </div>
                    </div>
                </div>

                <div className="showall-selector">
                    <input
                        id="show-all-challenges"
                        type="checkbox"
                        checked={this.state.show_all_challenges}
                        onChange={this.toggleShowAllChallenges}
                    />
                    <label htmlFor="show-all-challenges">{_("Show ineligible challenges")}</label>
                    <br></br>
                    <input
                        id="show-ranked-challenges"
                        type="checkbox"
                        checked={this.state.show_ranked_challenges}
                        onChange={this.toggleShowRankedChallenges}
                    />
                    <label htmlFor="show-ranked-challenges">{_("Ranked")}</label>
                    <input
                        id="show-unranked-challenges"
                        type="checkbox"
                        checked={this.state.show_unranked_challenges}
                        onChange={this.toggleShowUnrankedChallenges}
                    />
                    <label htmlFor="show-unranked-challenges">{_("Unranked")}</label>
                    <br></br>
                    <input
                        id="show-19x19-challenges"
                        type="checkbox"
                        checked={this.state.show_19x19_challenges}
                        onChange={this.toggleShow19x19Challenges}
                    />
                    <label htmlFor="show-19x19-challenges">{_("19x19")}</label>
                    <input
                        id="show-13x13-challenges"
                        type="checkbox"
                        checked={this.state.show_13x13_challenges}
                        onChange={this.toggleShow13x13Challenges}
                    />
                    <label htmlFor="show-13x13-challenges">{_("13x13")}</label>
                    <input
                        id="show-9x9-challenges"
                        type="checkbox"
                        checked={this.state.show_9x9_challenges}
                        onChange={this.toggleShow9x9Challenges}
                    />
                    <label htmlFor="show-9x9-challenges">{_("9x9")}</label>
                    <input
                        id="show-other-boardsize-challenges"
                        type="checkbox"
                        checked={this.state.show_other_boardsize_challenges}
                        onChange={this.toggleShowOtherBoardsizeChallenges}
                    />
                    <label htmlFor="show-other-boardsize-challenges">{_("Other boardsizes")}</label>
                </div>
            </div>
        );
    }

    rengoReadyToStart = (challenge) =>
        challenge.rengo_black_team.length &&
        challenge.rengo_white_team.length &&
        challenge.rengo_black_team.length + challenge.rengo_white_team.length > 2;

    automatchContainer() {
        const size_enabled = (size) => {
            return this.state.automatch_size_options.indexOf(size) >= 0;
        };

        const own_rengo_challenge = this.ownRengoChallengePending();
        const joined_rengo_challenge = this.joinedRengoChallengePending();

        const own_rengo_challenge_ready_to_start = own_rengo_challenge && this.rengoReadyToStart(own_rengo_challenge);

        const joined_rengo_challenge_ready_to_start =
            joined_rengo_challenge && this.rengoReadyToStart(joined_rengo_challenge);

        if (automatch_manager.active_live_automatcher) {
            return (
                <div className="automatch-container">
                    <div className="automatch-header">{_("Finding you a game...")}</div>
                    <div className="automatch-row-container">
                        <div className="spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                    </div>
                    <div className="automatch-settings">
                        <button className="danger sm" onClick={this.cancelActiveAutomatch}>
                            {pgettext("Cancel automatch", "Cancel")}
                        </button>
                    </div>
                </div>
            );
        } else if (this.liveOwnChallengePending()) {
            return (
                <div className="automatch-container">
                    <div className="automatch-header">{_("Waiting for opponent...")}</div>
                    <div className="automatch-row-container">
                        <div className="spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                    </div>
                    <div className="automatch-settings">
                        <button
                            className="danger sm"
                            onClick={this.cancelOwnChallenges.bind(self, this.state.live_list)}
                        >
                            {pgettext("Cancel challenge", "Cancel")}
                        </button>
                    </div>
                </div>
            );
        } else if (own_rengo_challenge || joined_rengo_challenge) {
            return (
                <div className="automatch-container">
                    <div className="automatch-header">
                        {own_rengo_challenge_ready_to_start
                            ? _("Waiting for your decision to start...")
                            : joined_rengo_challenge_ready_to_start
                            ? _("Waiting for organiser to start...")
                            : _("Waiting for Rengo players...")}
                        <div className="small-spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                    </div>
                    <div className={"rengo-admin-container" + (this.state.admin_pending ? " pending" : "")}>
                        {this.renderRengoChallengePane()}
                    </div>
                    <div className="rengo-challenge-buttons">
                        {(own_rengo_challenge || null) && (
                            <React.Fragment>
                                <div className="automatch-settings">
                                    <button
                                        className="danger sm"
                                        onClick={this.cancelOwnChallenges.bind(self, this.state.rengo_list)}
                                    >
                                        {pgettext("Cancel challenge", "Cancel")}
                                    </button>
                                </div>
                                {(own_rengo_challenge_ready_to_start || null) && (
                                    <div className="automatch-settings">
                                        <button className="success sm" onClick={this.startOwnRengoChallenge}>
                                            {pgettext("Start game", "Start")}
                                        </button>
                                    </div>
                                )}
                            </React.Fragment>
                        )}
                        {(joined_rengo_challenge || null) && (
                            <div className="automatch-settings">
                                <button
                                    onClick={this.unNominateForRengoChallenge.bind(this, joined_rengo_challenge)}
                                    className="btn success xs"
                                >
                                    {_("Withdraw")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            );
        } else if (this.state.showLoadingSpinnerForCorrespondence) {
            return (
                <div className="automatch-container">
                    <div className="automatch-header">{_("Finding you a game...")}</div>
                    <div className="automatch-settings-corr">
                        {_(
                            'This can take several minutes. You will be notified when your match has been found. To view or cancel your automatch requests, please see the list below labeled "Your Automatch Requests".',
                        )}
                    </div>
                    <div className="automatch-row-container">
                        <button className="primary" onClick={this.dismissCorrespondenceSpinner}>
                            {_(pgettext("Dismiss the 'finding correspondence automatch' message", "Got it"))}
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="automatch-container">
                    <div className="automatch-header">
                        <div>{_("Quick match finder")}</div>
                        <div className="btn-group">
                            <button
                                className={size_enabled("9x9") ? "primary sm" : "sm"}
                                onClick={() => this.toggleSize("9x9")}
                            >
                                9x9
                            </button>
                            <button
                                className={size_enabled("13x13") ? "primary sm" : "sm"}
                                onClick={() => this.toggleSize("13x13")}
                            >
                                13x13
                            </button>
                            <button
                                className={size_enabled("19x19") ? "primary sm" : "sm"}
                                onClick={() => this.toggleSize("19x19")}
                            >
                                19x19
                            </button>
                        </div>
                        <div className="automatch-settings">
                            <span className="automatch-settings-link fake-link" onClick={openAutomatchSettings}>
                                <i className="fa fa-gear" />
                                {_("Settings ")}
                            </span>
                        </div>
                    </div>
                    <div className="automatch-row-container">
                        <div className="automatch-row">
                            <button className="primary" onClick={() => this.findMatch("blitz")}>
                                <div className="play-button-text-root">
                                    <i className="fa fa-bolt" /> {_("Blitz")}
                                    <span className="time-per-move">
                                        {pgettext("Automatch average time per move", "~10s per move")}
                                    </span>
                                </div>
                            </button>
                            <button className="primary" onClick={() => this.findMatch("live")}>
                                <div className="play-button-text-root">
                                    <i className="fa fa-clock-o" /> {_("Normal")}
                                    <span className="time-per-move">
                                        {pgettext("Automatch average time per move", "~30s per move")}
                                    </span>
                                </div>
                            </button>
                        </div>
                        <div className="automatch-row">
                            <button className="primary" onClick={this.newComputerGame}>
                                <div className="play-button-text-root">
                                    <i className="fa fa-desktop" /> {_("Computer")}
                                    <span className="time-per-move"></span>
                                </div>
                            </button>
                            <button className="primary" onClick={() => this.findMatch("correspondence")}>
                                <div className="play-button-text-root">
                                    <span>
                                        <i className="ogs-turtle" /> {_("Correspondence")}
                                    </span>
                                    <span className="time-per-move">
                                        {pgettext("Automatch average time per move", "~1 day per move")}
                                    </span>
                                </div>
                            </button>
                        </div>
                        <div className="custom-game-header">
                            <div>{_("Custom Game")}</div>
                        </div>
                        <div className="custom-game-row">
                            <button className="primary" onClick={this.newCustomGame}>
                                <i className="fa fa-cog" /> {_("Create")}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    commonSpan = (text: string, align: "center" | "left") => {
        return (
            <span className="cell" style={{ textAlign: align }}>
                {text}
            </span>
        );
    };

    challengeList(isLive: boolean) {
        const challenge_list = isLive ? this.state.live_list : this.state.correspondence_list;

        const user = data.get("user");

        const timeControlClassName = (config) => {
            // This appears to be bolding live games compared to blitz?
            const isBold = isLive && (config.time_per_move > 3600 || config.time_per_move === 0);
            return "cell " + (isBold ? "bold" : "");
        };

        if (!this.anyChallengesToShow(challenge_list)) {
            return (
                <div className="ineligible">
                    {
                        this.state.show_all_challenges
                            ? _("(none)") /* translators: There are no challenges in the system, nothing to list here */
                            : _(
                                  "(none available)",
                              ) /* translators: There are no challenges that this person is eligible for */
                    }
                </div>
            );
        }

        return challenge_list.map((C) =>
            (C.eligible || C.user_challenge || this.state.show_all_challenges) &&
            ((this.state.show_unranked_challenges && !C.ranked) || (this.state.show_ranked_challenges && C.ranked)) &&
            ((this.state.show_19x19_challenges && C.width === 19 && C.height === 19) ||
                (this.state.show_13x13_challenges && C.width === 13 && C.height === 13) ||
                (this.state.show_9x9_challenges && C.width === 9 && C.height === 9) ||
                (this.state.show_other_boardsize_challenges &&
                    (C.width !== C.height || (C.width !== 19 && C.width !== 13 && C.width !== 9)))) ? (
                <div key={C.challenge_id} className={"challenge-row"}>
                    <span className={"cell"} style={{ textAlign: "center" }}>
                        {user.is_moderator && (
                            <button
                                onClick={this.cancelOpenChallenge.bind(this, C)}
                                className="btn danger xs pull-left "
                            >
                                <i className="fa fa-trash" />
                            </button>
                        )}

                        {((C.eligible && !C.removed) || null) && (
                            <button onClick={this.acceptOpenChallenge.bind(this, C)} className="btn success xs">
                                {_("Accept")}
                            </button>
                        )}

                        {(C.user_challenge || null) && (
                            <button onClick={this.cancelOpenChallenge.bind(this, C)} className="btn reject xs">
                                {_("Remove")}
                            </button>
                        )}

                        {
                            /* Mark eligible suspect games with a warning icon and warning explanation popup.
                                 We do let users see the warning for their own challenges. */
                            (((C.eligible || C.user_challenge) &&
                                !C.removed &&
                                (C.komi !== null ||
                                    usedForCheating(C.time_control_parameters) ||
                                    (C.handicap !== 0 && C.handicap !== -1))) ||
                                null) && (
                                <React.Fragment>
                                    <i className="cheat-alert fa fa-exclamation-triangle fa-xs" />
                                    <p className="cheat-alert-tooltiptext">
                                        {(C.komi !== null
                                            ? pgettext("Warning for users accepting game", "Custom komi") +
                                              ": " +
                                              C.komi +
                                              " "
                                            : "") +
                                            (usedForCheating(C.time_control_parameters)
                                                ? pgettext("Warning for users accepting game", "Unusual time setting") +
                                                  " "
                                                : "") +
                                            (C.handicap !== 0 && C.handicap !== -1
                                                ? pgettext("Warning for users accepting game", "Custom handicap") +
                                                  ": " +
                                                  C.handicap_text
                                                : "")}
                                    </p>
                                </React.Fragment>
                            )
                        }

                        {(((!C.eligible || C.removed) && !C.user_challenge) || null) && (
                            <span className="ineligible" title={C.ineligible_reason}>
                                {_("Can't accept")}
                            </span>
                        )}
                    </span>
                    <span className="cell" style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}>
                        <Player user={this.extractUser(C)} rank={true} />
                    </span>
                    {/*commonSpan(boundedRankString(C.rank), "center")*/}
                    <span
                        className={
                            "cell " +
                            (C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19) ? "bold" : "")
                        }
                    >
                        {C.width}x{C.height}
                    </span>
                    <span className={timeControlClassName(C)}>{shortShortTimeControl(C.time_control_parameters)}</span>
                    {this.commonSpan(C.ranked_text, "center")}
                    {this.commonSpan(C.handicap_text, "center")}
                    {this.commonSpan(C.name, "left")}
                    {this.commonSpan(rulesText(C.rules), "left")}
                </div>
            ) : null,
        );
    }

    cellBreaks(amount) {
        const result = [];
        for (let i = 0; i < amount; ++i) {
            result.push(<span key={i} className="cell break"></span>);
        }
        return result;
    }

    challengeListHeaders() {
        return (
            <div className="challenge-row">
                <span className="head"></span>
                <span className="head">{_("Player")}</span>
                {/* <span className="head">{_("Rank")}</span> */}
                <span className="head">{_("Size")}</span>
                <span className="head time-control-header">{_("Time")}</span>
                <span className="head">{_("Ranked")}</span>
                <span className="head">{_("Handicap")}</span>
                <span className="head" style={{ textAlign: "left" }}>
                    {_("Name")}
                </span>
                <span className="head" style={{ textAlign: "left" }}>
                    {_("Rules")}
                </span>
            </div>
        );
    }

    rengoListHeaders() {
        return (
            <div className="challenge-row">
                <span className="head"></span>
                <span className="head">{_("Organiser")}</span>
                {/* <span className="head">{_("Rank")}</span> */}
                <span className="head">{_("Size")}</span>
                <span className="head time-control-header">{_("Time")}</span>
                <span className="head">{_("")}</span>
                <span className="head">{_("Handicap")}</span>
                <span className="head" style={{ textAlign: "left" }}>
                    {_("Name")}
                </span>
                <span className="head" style={{ textAlign: "left" }}>
                    {_("Rules")}
                </span>
            </div>
        );
    }

    unNominateForRengoChallenge = (C) => {
        swal({
            text: _("Withdrawing..."), // translator: the server is processing their request to withdraw from a rengo challenge
            type: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        }).catch(swal.noop);

        del("challenges/%%/join", C.challenge_id, {})
            .then(() => {
                swal.close();
            })
            .catch((err) => {
                swal.close();
                errorAlerter(err);
            });
    };

    rengoList = () => {
        if (!this.anyChallengesToShow(this.state.rengo_list)) {
            return (
                <div className="ineligible">
                    {
                        this.state.show_all_challenges
                            ? _("(none)") /* translators: There are no challenges in the system, nothing to list here */
                            : _(
                                  "(none available)",
                              ) /* translators: There are no challenges that this person is eligible for */
                    }
                </div>
            );
        }

        const user = data.get("user");

        return this.state.rengo_list.map((C) =>
            (C.eligible || C.user_challenge || this.state.show_all_challenges) &&
            ((this.state.show_unranked_challenges && !C.ranked) || (this.state.show_ranked_challenges && C.ranked)) &&
            ((this.state.show_19x19_challenges && C.width === 19 && C.height === 19) ||
                (this.state.show_13x13_challenges && C.width === 13 && C.height === 13) ||
                (this.state.show_9x9_challenges && C.width === 9 && C.height === 9) ||
                (this.state.show_other_boardsize_challenges &&
                    (C.width !== C.height || (C.width !== 19 && C.width !== 13 && C.width !== 9)))) ? (
                <div key={C.challenge_id} className={"challenge-row"}>
                    <span className={"cell"} style={{ textAlign: "center" }}>
                        {user.is_moderator && (
                            <button
                                onClick={this.cancelOpenChallenge.bind(this, C)}
                                className="btn danger xs pull-left "
                            >
                                <i className="fa fa-trash" />
                            </button>
                        )}

                        {(C.user_challenge || null) && (
                            <button onClick={this.cancelOpenChallenge.bind(this, C)} className="btn reject xs">
                                {_("Remove")}
                            </button>
                        )}

                        {((C.eligible && !C.removed && !C.user_challenge && !C.rengo_participants.includes(user.id)) ||
                            null) && (
                            <button onClick={nominateForRengoChallenge.bind(this, C)} className="btn success xs">
                                {_("Join")}
                            </button>
                        )}

                        {((C.eligible && !C.removed && !C.user_challenge && C.rengo_participants.includes(user.id)) ||
                            null) && (
                            <button onClick={this.unNominateForRengoChallenge.bind(this, C)} className="btn success xs">
                                {_("Withdraw")}
                            </button>
                        )}

                        {
                            /* Mark eligible suspect games with a warning icon and warning explanation popup.
                                 We do let users see the warning for their own challenges. */
                            (((C.eligible || C.user_challenge) &&
                                !C.removed &&
                                (C.komi !== null ||
                                    usedForCheating(C.time_control_parameters) ||
                                    (C.handicap !== 0 && C.handicap !== -1))) ||
                                null) && (
                                <React.Fragment>
                                    <i className="cheat-alert fa fa-exclamation-triangle fa-xs" />
                                    <p className="cheat-alert-tooltiptext">
                                        {(C.komi !== null
                                            ? pgettext("Warning for users accepting game", "Custom komi") +
                                              ": " +
                                              C.komi +
                                              " "
                                            : "") +
                                            (usedForCheating(C.time_control_parameters)
                                                ? pgettext("Warning for users accepting game", "Unusual time setting") +
                                                  " "
                                                : "") +
                                            (C.handicap !== 0 && C.handicap !== -1
                                                ? pgettext("Warning for users accepting game", "Custom handicap") +
                                                  ": " +
                                                  C.handicap_text
                                                : "")}
                                    </p>
                                </React.Fragment>
                            )
                        }

                        {(((!C.eligible || C.removed) && !C.user_challenge) || null) && (
                            <span className="ineligible" title={C.ineligible_reason}>
                                {_("Can't accept")}
                            </span>
                        )}
                    </span>
                    <span className="cell" style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}>
                        <Player user={this.extractUser(C)} rank={true} />
                    </span>
                    {/*commonSpan(boundedRankString(C.rank), "center")*/}
                    <span
                        className={
                            "cell " +
                            (C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19) ? "bold" : "")
                        }
                    >
                        {C.width}x{C.height}
                    </span>
                    <span>{shortShortTimeControl(C.time_control_parameters)}</span>
                    {this.commonSpan("", "center") /* rengo is unranked always (at present) */}
                    {this.commonSpan(C.handicap_text, "center")}
                    {this.commonSpan(C.name, "left")}
                    {this.commonSpan(rulesText(C.rules), "left")}
                </div>
            ) : null,
        );
    };

    assignToTeam = (player_id: number, team: string, challenge) => {
        const assignment =
            team === "rengo_black_team" ? "assign_black" : team === "rengo_white_team" ? "assign_white" : "unassign";

        this.setState({ admin_pending: true });

        put("challenges/%%/team", challenge.challenge_id, {
            [assignment]: [player_id], // back end expects an array of changes, but we only ever send one at a time.
        })
            .then(() => {
                this.setState({ admin_pending: false });
            })
            .catch((err) => {
                this.setState({ admin_pending: false });
                errorAlerter(err);
            });
    };

    renderRengoChallengePane = () => {
        const our_challenge =
            this.state.rengo_list.find((c) => c.user_challenge) ||
            this.state.rengo_list.find((c) => c["rengo_participants"].includes(data.get("config.user").id));

        //console.log("rengo pane:", our_challenge);

        // this function should not be called if the user doesn't have a rengo challenge open...
        if (our_challenge === undefined) {
            return <div>(oops - if you had a rengo challenge open, the details would be showing here!)</div>;
        }

        const nominees = our_challenge["rengo_nominees"];
        const black_team = our_challenge["rengo_black_team"];
        const white_team = our_challenge["rengo_white_team"];

        if (nominees.length + black_team.length + white_team.length === 0) {
            // This should be at most transitory, since the creator is added as a player on creation!
            return <div className="no-rengo-players-to-admin">{_("(none yet - standby!)")}</div>;
        }

        return (
            <React.Fragment>
                <div className="rengo-admin-header">{_("Black:")}</div>
                {(black_team.length === 0 || null) && (
                    <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                )}
                {black_team.map((n, i) => (
                    <div className="rengo-assignment-row" key={i}>
                        {(our_challenge.user_challenge || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-lg fa-times-circle-o unassign"
                                    onClick={this.assignToTeam.bind(self, n, "none", our_challenge)}
                                />
                                <i
                                    className="fa fa-lg fa-arrow-down"
                                    onClick={this.assignToTeam.bind(self, n, "rengo_white_team", our_challenge)}
                                />
                            </React.Fragment>
                        )}
                        <Player user={n} rank={true} key={i} />
                    </div>
                ))}

                <div className="rengo-admin-header">{_("White:")}</div>
                {(white_team.length === 0 || null) && (
                    <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                )}
                {white_team.map((n, i) => (
                    <div className="rengo-assignment-row" key={i}>
                        {(our_challenge.user_challenge || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-lg fa-times-circle-o unassign"
                                    onClick={this.assignToTeam.bind(self, n, "none", our_challenge)}
                                />
                                <i
                                    className="fa fa-lg fa-arrow-up"
                                    onClick={this.assignToTeam.bind(self, n, "rengo_black_team", our_challenge)}
                                />
                            </React.Fragment>
                        )}
                        <Player user={n} rank={true} key={i} />
                    </div>
                ))}

                <div className="rengo-admin-header">{_("Unassigned:")}</div>
                {(nominees.length === 0 || null) && <div className="no-rengo-players-to-admin">{_("(none left)")}</div>}
                {nominees.map((n, i) => (
                    <div className="rengo-assignment-row" key={i}>
                        {(our_challenge.user_challenge || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-lg fa-arrow-up black"
                                    onClick={this.assignToTeam.bind(self, n, "rengo_black_team", our_challenge)}
                                />
                                <i
                                    className="fa fa-lg fa-arrow-up white"
                                    onClick={this.assignToTeam.bind(self, n, "rengo_white_team", our_challenge)}
                                />
                            </React.Fragment>
                        )}
                        <Player user={n} rank={true} key={i} />
                    </div>
                ))}
            </React.Fragment>
        );
    };
}

function challenge_sort(A, B) {
    if (A.eligible && !B.eligible) {
        return -1;
    }
    if (!A.eligible && B.eligible) {
        return 1;
    }

    if (A.user_challenge && !B.user_challenge) {
        return -1;
    }
    if (!A.user_challenge && B.user_challenge) {
        return 1;
    }

    const t = A.username.localeCompare(B.username);
    if (t) {
        return t;
    }

    if (A.ranked && !B.ranked) {
        return -1;
    }
    if (!A.ranked && B.ranked) {
        return 1;
    }

    return A.challenge_id - B.challenge_id;
}

// This is used by the SeekGraph to perform this function as well as this page...

export function nominateForRengoChallenge(C) {
    swal({
        text: _("Joining..."), // translator: the server is processing their request to join a rengo game
        type: "info",
        showCancelButton: false,
        showConfirmButton: false,
        allowEscapeKey: false,
    }).catch(swal.noop);

    put("challenges/%%/join", C.challenge_id, {})
        .then(() => {
            swal.close();
        })
        .catch((err) => {
            swal.close();
            errorAlerter(err);
        });
}

function time_per_move_challenge_sort(A, B) {
    const comparison = Math.sign(A.time_per_move - B.time_per_move);

    if (comparison) {
        return comparison;
    } else {
        return challenge_sort(A, B);
    }
}
