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
import * as data from "data";
import * as DynamicHelp from "react-dynamic-help";

import * as preferences from "preferences";
import * as player_cache from "player_cache";
import * as rengo_utils from "rengo_utils";
import { OgsResizeDetector } from "OgsResizeDetector";
import { browserHistory } from "ogsHistory";
import { _, pgettext } from "translate";
import { Card } from "material";
import { SeekGraph, SeekGraphLegend } from "SeekGraph";
import { PersistentElement } from "PersistentElement";
import {
    isLiveGame,
    shortShortTimeControl,
    timeControlSystemText,
    usedForCheating,
} from "TimeControl";
import { challenge, challengeComputer } from "ChallengeModal";
import { openGameAcceptModal } from "GameAcceptModal";
import { errorAlerter, rulesText, dup, uuid, ignore } from "misc";
import { Player } from "Player";
import { openAutomatchSettings, getAutomatchSettings } from "AutomatchSettings";
import { automatch_manager, AutomatchPreferences } from "automatch_manager";
import { bot_count } from "bots";
import { SupporterGoals } from "SupporterGoals";
import { CreatedChallengeInfo } from "types";
import { ChallengeLinkButton } from "ChallengeLinkButton";
import { allocateCanvasOrError } from "goban";

import { alert } from "swal_config";
import { Size } from "src/lib/types";

import { RengoManagementPane } from "RengoManagementPane";
import { RengoTeamManagementPane } from "RengoTeamManagementPane";
import {
    Challenge,
    ChallengeFilter,
    ChallengeFilterKey,
    shouldDisplayChallenge,
} from "challenge_utils";

const CHALLENGE_LIST_FREEZE_PERIOD = 1000; // Freeze challenge list for this period while they move their mouse on it

interface PlayState {
    live_list: Array<Challenge>;
    correspondence_list: Array<Challenge>;
    rengo_list: Array<Challenge>;
    showLoadingSpinnerForCorrespondence: boolean;
    filter: ChallengeFilter;
    automatch_size_options: Size[];
    freeze_challenge_list: boolean; // Don't change the challenge list while they are trying to point the mouse at it
    pending_challenges: Array<Challenge>; // challenges received while frozen
    show_in_rengo_management_pane: number[]; // a challenge_ids for challenges to show with pane open in the rengo challenge list
}

export class Play extends React.Component<{}, PlayState> {
    ref_container: HTMLDivElement;
    canvas: HTMLCanvasElement;

    seekgraph: SeekGraph;
    resize_check_interval;

    static contextType: React.Context<DynamicHelp.AppApi> = DynamicHelp.Api;
    declare context: React.ContextType<typeof DynamicHelp.Api>;

    private list_freeze_timeout;

    static filterPreferenceMapping: Map<ChallengeFilterKey, preferences.ValidPreference> = new Map([
        ["showIneligible", "show-all-challenges"],
        ["showRanked", "show-ranked-challenges"],
        ["showUnranked", "show-unranked-challenges"],
        ["show19x19", "show-19x19-challenges"],
        ["show13x13", "show-13x13-challenges"],
        ["show9x9", "show-9x9-challenges"],
        ["showOtherSizes", "show-other-boardsize-challenges"],
        ["showRengo", "show-rengo-challenges"],
    ]);

    constructor(props) {
        super(props);

        const user = data.get("user");

        const filter = {};
        Play.filterPreferenceMapping.forEach((pref, key) => {
            if (user.anonymous) {
                filter[key] = true;
            } else {
                filter[key] = preferences.get(pref);
            }
        });

        this.state = {
            live_list: [],
            correspondence_list: [],
            rengo_list: [],
            showLoadingSpinnerForCorrespondence: false,
            filter: filter as ChallengeFilter,
            automatch_size_options: data.get("automatch.size_options", ["9x9", "13x13", "19x19"]),
            freeze_challenge_list: false, // Don't change the challenge list while they are trying to point the mouse at it
            pending_challenges: [], // challenges received while frozen
            show_in_rengo_management_pane: [],
        };
        this.canvas = allocateCanvasOrError();
        this.list_freeze_timeout = null;
    }

    componentDidMount() {
        window.document.title = _("Play");
        this.seekgraph = new SeekGraph({
            canvas: this.canvas,
            filter: this.state.filter,
        });
        this.onResize();
        this.seekgraph.on("challenges", this.updateChallenges);
        automatch_manager.on("entry", this.onAutomatchEntry);
        automatch_manager.on("start", this.onAutomatchStart);
        automatch_manager.on("cancel", this.onAutomatchCancel);

        const [match, id] = window.location.hash.match(/#rengo:(\d+)/) || [];
        if (match) {
            this.openRengoChallengePane(parseInt(id));
        }
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

    updateChallenges = (challenges: Challenge[]) => {
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
            } else if (isLiveGame(C.time_control_parameters, C.width, C.height)) {
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

    acceptOpenChallenge = (challenge: Challenge) => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        openGameAcceptModal(challenge)
            .then((challenge) => {
                browserHistory.push(`/game/${challenge.game_id}`);
                //window['openGame'](obj.game);_
                this.unfreezeChallenges();
            })
            .catch(errorAlerter);
    };

    cancelOpenChallenge = (challenge: Challenge) => {
        alert
            .fire({
                text: _("Are you sure you want to delete this rengo challenge?"),
                showCancelButton: true,
                confirmButtonText: _("Yes"),
                cancelButtonText: _("Cancel"),
            })
            .then(({ value: yes }) => {
                if (yes) {
                    // stop trying to show the cancelled challenge
                    this.closeChallengeManagementPane(challenge.challenge_id);

                    // do the action
                    rengo_utils.cancelChallenge(challenge).catch(errorAlerter);
                }
            })
            .catch(() => 0);

        this.unfreezeChallenges();
    };

    cancelOwnChallenges = (challenge_list: Challenge[]) => {
        challenge_list.forEach((c) => {
            if (c.user_challenge) {
                this.cancelOpenChallenge(c);
            }
        });
    };

    extractUser(challenge: Challenge) {
        return {
            id: challenge.user_id,
            username: challenge.username,
            rank: challenge.rank,
            professional: !!challenge.pro,
        };
    }

    onAutomatchEntry = () => {
        this.forceUpdate();
    };

    onAutomatchStart = () => {
        this.forceUpdate();
    };

    onAutomatchCancel = () => {
        this.forceUpdate();
    };

    findMatch = (speed: "blitz" | "live" | "correspondence") => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

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
        this.onAutomatchEntry();

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
            void alert.fire(_("Sorry, all bots seem to be offline, please try again later."));
            return;
        }
        challengeComputer();
    };

    newCustomGame = () => {
        challenge(null, null, null, null, this.challengeCreated);
    };

    challengeCreated = (c: CreatedChallengeInfo) => {
        if (c.rengo && !c.live) {
            this.toggleRengoChallengePane(c.challenge_id);
        }
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

    toggleFilterHandler = (key: ChallengeFilterKey) => {
        const newValue = !this.state.filter[key];
        const newFilter = { ...this.state.filter };
        newFilter[key] = newValue;
        if (this.seekgraph) {
            this.seekgraph.setFilter(newFilter);
        }
        preferences.set(Play.filterPreferenceMapping.get(key), newValue);
        this.setState({ filter: newFilter });
    };

    anyChallengesToShow = (challenge_list: Challenge[]): boolean => {
        return (
            (this.state.filter.showIneligible && (challenge_list.length as any)) ||
            challenge_list.reduce((prev, current) => {
                return prev || current.eligible || current.user_challenge;
            }, false)
        );
    };

    liveOwnChallengePending = (): Challenge => {
        // a user should have only one of these at any time
        const locp = this.state.live_list.find((c) => c.user_challenge);
        return locp;
    };

    ownRengoChallengesPending = (): Challenge[] => {
        // multiple correspondence are possible, plus one live
        const orcp = this.state.rengo_list.filter((c) => c.user_challenge);
        //console.log("own rcp", orcp);
        return orcp;
    };

    joinedRengoChallengesPending = (): Challenge[] => {
        // multiple correspondence are possible, plus one live
        const user_id = data.get("config.user").id;
        const jrcp = this.state.rengo_list.filter(
            (c) => c["rengo_participants"].includes(user_id) && !c.user_challenge,
        );
        // console.log("joined rcp", jrcp);
        return jrcp;
    };

    freezeChallenges = () => {
        if (this.list_freeze_timeout) {
            clearTimeout(this.list_freeze_timeout);
        }
        if (!this.state.freeze_challenge_list) {
            //console.log("Freeze challenges...");
            this.setState({ freeze_challenge_list: true });
        }
        this.list_freeze_timeout = setTimeout(
            this.unfreezeChallenges,
            CHALLENGE_LIST_FREEZE_PERIOD,
        );
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
        const corr_automatcher_uuids = Object.keys(
            automatch_manager.active_correspondence_automatchers,
        );
        const corr_automatchers = corr_automatcher_uuids.map(
            (uuid) => automatch_manager.active_correspondence_automatchers[uuid],
        );
        corr_automatchers.sort((a, b) => a.timestamp - b.timestamp);
        const showSeekGraph = preferences.get("show-seek-graph");

        return (
            <div className="Play container">
                <SupporterGoals />
                <div className="row">
                    <div className="col-sm-6 play-column">
                        <Card>{this.automatchContainer()}</Card>
                    </div>
                    {showSeekGraph && (
                        <div className="col-sm-6 play-column">
                            <Card>
                                <div
                                    ref={(el) => (this.ref_container = el)}
                                    className="seek-graph-container"
                                >
                                    <OgsResizeDetector
                                        handleWidth
                                        handleHeight
                                        onResize={() => this.onResize()}
                                    />
                                    <PersistentElement elt={this.canvas} />
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
                <div className="row">
                    <SeekGraphLegend
                        filter={this.state.filter}
                        showIcons={preferences.get("show-seek-graph")}
                        toggleHandler={this.toggleFilterHandler}
                    ></SeekGraphLegend>
                </div>

                <div id="challenge-list-container">
                    <div id="challenge-list-inner-container">
                        <div id="challenge-list" onMouseMove={this.freezeChallenges}>
                            {(corr_automatchers.length || null) && (
                                <div className="challenge-row">
                                    <span className="cell break">
                                        {_("Your Automatch Requests")}
                                    </span>
                                    {this.cellBreaks(7)}
                                </div>
                            )}
                            {(corr_automatchers.length || null) && (
                                <div className="challenge-row">
                                    <span className="head">{/* buttons */}</span>
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
                                                    this.setState({
                                                        showLoadingSpinnerForCorrespondence: false,
                                                    });
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
                                    <span className="cell"></span>
                                </div>
                            ))}

                            <div className="custom-games-list-header-row">{_("Custom Games")}</div>

                            <div className="challenge-row">
                                <span className="cell break">{_("Short Games")}</span>
                                {this.cellBreaks(8)}
                            </div>

                            {this.anyChallengesToShow(this.state.live_list)
                                ? this.challengeListHeaders()
                                : null}

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
                        </div>
                        {this.state.filter.showRengo && (
                            <div id="challenge-list" onMouseMove={this.freezeChallenges}>
                                <div className="challenge-row" style={{ marginTop: "1em" }}>
                                    <span className="cell break">{_("Rengo")}</span>
                                </div>
                                <table id="rengo-table">
                                    <thead>
                                        {this.anyChallengesToShow(this.state.rengo_list)
                                            ? this.rengoListHeaders()
                                            : null}
                                    </thead>
                                    <tbody>{this.rengoList()}</tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    automatchContainer() {
        const size_enabled = (size) => {
            return this.state.automatch_size_options.indexOf(size) >= 0;
        };

        const own_live_rengo_challenge = this.ownRengoChallengesPending().find((c) =>
            isLiveGame(c.time_control_parameters, c.width, c.height),
        );
        const joined_live_rengo_challenge = this.joinedRengoChallengesPending().find((c) =>
            isLiveGame(c.time_control_parameters, c.width, c.height),
        );

        const rengo_challenge_to_show = own_live_rengo_challenge || joined_live_rengo_challenge;

        const user = data.get("user");
        const anon = user.anonymous;
        const warned = user.has_active_warning_flag;

        //  Construction of the pane we need to show...
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
        } else if (rengo_challenge_to_show) {
            return (
                <div className="automatch-container">
                    <div className="rengo-live-match-header">
                        <div className="small-spinner">
                            <div className="double-bounce1"></div>
                            <div className="double-bounce2"></div>
                        </div>
                    </div>
                    <RengoManagementPane
                        user={user}
                        challenge_id={rengo_challenge_to_show.challenge_id}
                        rengo_challenge_list={this.state.rengo_list}
                        startRengoChallenge={rengo_utils.startOwnRengoChallenge}
                        cancelChallenge={this.cancelOpenChallenge}
                        withdrawFromRengoChallenge={this.unNominateForRengoChallenge}
                        joinRengoChallenge={rengo_utils.nominateForRengoChallenge}
                    >
                        <RengoTeamManagementPane
                            user={user}
                            challenge_id={rengo_challenge_to_show.challenge_id}
                            challenge_list={this.state.rengo_list}
                            moderator={user.is_moderator}
                            show_chat={false}
                            assignToTeam={rengo_utils.assignToTeam}
                            kickRengoUser={rengo_utils.kickRengoUser}
                        />
                    </RengoManagementPane>
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
                            {_(
                                pgettext(
                                    "Dismiss the 'finding correspondence automatch' message",
                                    "Got it",
                                ),
                            )}
                        </button>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="automatch-container">
                    <div className="automatch-header">
                        <div>{_("Automatch finder")}</div>
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
                            <span
                                className="automatch-settings-link fake-link"
                                onClick={openAutomatchSettings}
                            >
                                <i className="fa fa-gear" />
                                {_("Settings ")}
                            </span>
                        </div>
                    </div>
                    <div className="automatch-row-container">
                        <div className="automatch-row">
                            <button
                                className="primary"
                                onClick={() => this.findMatch("blitz")}
                                disabled={anon || warned}
                            >
                                <div className="play-button-text-root">
                                    <i className="fa fa-bolt" /> {_("Blitz")}
                                    <span className="time-per-move">
                                        {pgettext(
                                            "Automatch average time per move",
                                            "~10s per move",
                                        )}
                                    </span>
                                </div>
                            </button>
                            <button
                                className="primary"
                                onClick={() => this.findMatch("live")}
                                disabled={anon || warned}
                            >
                                <div className="play-button-text-root">
                                    <i className="fa fa-clock-o" /> {_("Normal")}
                                    <span className="time-per-move">
                                        {pgettext(
                                            "Automatch average time per move",
                                            "~30s per move",
                                        )}
                                    </span>
                                </div>
                            </button>
                        </div>
                        <div className="automatch-row">
                            <button
                                className="primary"
                                onClick={this.newComputerGame}
                                disabled={anon || warned}
                            >
                                <div className="play-button-text-root">
                                    <i className="fa fa-desktop" /> {_("Computer")}
                                    <span className="time-per-move"></span>
                                </div>
                            </button>
                            <button
                                className="primary"
                                onClick={() => this.findMatch("correspondence")}
                                disabled={anon || warned}
                            >
                                <div className="play-button-text-root">
                                    <span>
                                        <i className="ogs-turtle" /> {_("Correspondence")}
                                    </span>
                                    <span className="time-per-move">
                                        {pgettext(
                                            "Automatch average time per move",
                                            "~1 day per move",
                                        )}
                                    </span>
                                </div>
                            </button>
                        </div>
                        <div className="custom-game-header">
                            <div>{_("Custom Game")}</div>
                        </div>
                        <div className="custom-game-row">
                            <button
                                className="primary"
                                onClick={this.newCustomGame}
                                disabled={anon || warned}
                            >
                                <i className="fa fa-cog" /> {_("Create")}
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    suspectChallengeIcon = (C: Challenge): JSX.Element =>
        /* Mark eligible suspect games with a warning icon and warning explanation popup.
           We do let users see the warning for their own challenges. */
        (((C.eligible || C.user_challenge) &&
            !C.removed &&
            (C.komi !== null ||
                usedForCheating(C.time_control_parameters) ||
                (C.handicap !== 0 && C.handicap !== -1))) ||
            null) && (
            <span className="suspect-challenge">
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
            </span>
        );

    challengeList(show_live_list: boolean) {
        const challenge_list = show_live_list
            ? this.state.live_list
            : this.state.correspondence_list;

        const user = data.get("user");

        const timeControlClassName = (config) => {
            // This appears to be bolding live games compared to blitz?
            const isBold =
                show_live_list && (config.time_per_move > 3600 || config.time_per_move === 0);
            return "cell " + (isBold ? "bold" : "");
        };

        if (!this.anyChallengesToShow(challenge_list)) {
            return (
                <div className="ineligible">
                    {
                        this.state.filter.showIneligible
                            ? _(
                                  "(none)",
                              ) /* translators: There are no challenges in the system, nothing to list here */
                            : _(
                                  "(none available)",
                              ) /* translators: There are no challenges that this person is eligible for */
                    }
                </div>
            );
        }

        return challenge_list.map((C) =>
            shouldDisplayChallenge(C, this.state.filter) ? (
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
                            <button
                                onClick={this.acceptOpenChallenge.bind(this, C)}
                                className="btn success xs"
                            >
                                {_("Accept")}
                            </button>
                        )}

                        {(C.user_challenge || null) && (
                            <button
                                onClick={this.cancelOpenChallenge.bind(this, C)}
                                className="btn reject xs"
                            >
                                {_("Remove")}
                            </button>
                        )}

                        {this.suspectChallengeIcon(C)}

                        {(((!C.eligible || C.removed) && !C.user_challenge) || null) && (
                            <span className="ineligible" title={C.ineligible_reason}>
                                {_("Can't accept")}
                            </span>
                        )}
                    </span>
                    <span
                        className="cell"
                        style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}
                    >
                        <Player user={this.extractUser(C)} rank={true} />
                    </span>
                    <span
                        className={
                            "cell " +
                            (C.width !== C.height ||
                            (C.width !== 9 && C.width !== 13 && C.width !== 19)
                                ? "bold"
                                : "")
                        }
                    >
                        {C.width}x{C.height}
                    </span>
                    <span className={timeControlClassName(C)}>
                        {shortShortTimeControl(C.time_control_parameters)}
                    </span>
                    <span className="cell">{C.ranked_text}</span>
                    <span className="cell">{C.handicap_text}</span>
                    <span className="cell">{C.name}</span>
                    <span className="cell">{rulesText(C.rules)}</span>
                    <span className="cell">
                        {(C.user_challenge || null) && <ChallengeLinkButton uuid={C.uuid} />}
                    </span>
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
                <span className="head">{/* buttons */}</span>
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
                <span className="head">{/* invite link */}</span>
            </div>
        );
    }

    unNominateForRengoChallenge = (C: Challenge) => {
        this.closeChallengeManagementPane(C.challenge_id);

        rengo_utils.unNominate(C).catch(errorAlerter);
    };

    rengoListHeaders() {
        return (
            <>
                <tr className="challenge-row">
                    <td className="head " style={{ textAlign: "right" }}>
                        {/* buttons */ ""}
                    </td>
                    <td className="head organizer">{_("Organizer")}</td>
                    {/* <td className="head">{_("Rank")}</td> */}
                    <td className="head size">{_("Size")}</td>
                    <td className="head time-control-header">{_("Time")}</td>
                    <td className="head">{_("Casual")}</td>
                    <td className="head">{_("Auto-Start")}</td>
                    <td className="head">{_("Signed up")}</td>
                    <td className="head">{_("Handicap")}</td>
                    <td className="head" style={{ textAlign: "left" }}>
                        {_("Name")}
                    </td>
                    <td className="head" style={{ textAlign: "left" }}>
                        {/* invite link */ ""}
                    </td>
                </tr>
            </>
        );
    }

    nominateAndShow = (C) => {
        this.toggleRengoChallengePane(C.challenge_id);
        rengo_utils.nominateForRengoChallenge(C).catch(errorAlerter);
    };

    rengoList = () => {
        if (!this.anyChallengesToShow(this.state.rengo_list)) {
            return (
                <tr key="none-available">
                    <td colSpan={9}>
                        <div className="ineligible">
                            {
                                this.state.filter.showIneligible
                                    ? _(
                                          "(none)",
                                      ) /* translators: There are no challenges in the system, nothing to list here */
                                    : _(
                                          "(none available)",
                                      ) /* translators: There are no challenges that this person is eligible for */
                            }
                        </div>
                    </td>
                </tr>
            );
        }

        const user = data.get("user");

        const live_list = this.state.rengo_list.filter((c) =>
            isLiveGame(c.time_control_parameters, c.width, c.height),
        );
        const corr_list = this.state.rengo_list.filter(
            (c) => !isLiveGame(c.time_control_parameters, c.width, c.height),
        );

        return (
            <>
                <tr className="challenge-row">
                    <td className="cell">{_("Live:")}</td>
                </tr>
                <this.rengoChallengeManagementList
                    challenge_list={live_list}
                    user={user}
                    key="live"
                />

                <tr className="challenge-row">
                    <td className="cell" colSpan={10}>
                        <hr />
                    </td>
                </tr>

                <tr className="challenge-row">
                    <td className="cell">{_("Correspondence:")}</td>
                </tr>
                <this.rengoChallengeManagementList
                    challenge_list={corr_list}
                    user={user}
                    key="corr"
                />
            </>
        );
    };

    rengoChallengeManagementList = (props: { challenge_list: Challenge[]; user: any }) => (
        <>
            {!this.anyChallengesToShow(props.challenge_list) ? (
                <tr className="ineligible" key="corre-ineligible">
                    <td style={{ textAlign: "center" }}>
                        {
                            this.state.filter.showIneligible
                                ? _(
                                      "(none)",
                                  ) /* translators: There are no challenges in the system, nothing to list here */
                                : _(
                                      "(none available)",
                                  ) /* translators: There are no challenges that this person is eligible for */
                        }
                    </td>
                </tr>
            ) : (
                props.challenge_list.map(
                    (C) =>
                        (shouldDisplayChallenge(C, this.state.filter) || null) && (
                            <React.Fragment key={C.challenge_id}>
                                <this.rengoListItem C={C} user={props.user} />
                                {(this.state.show_in_rengo_management_pane.includes(
                                    C.challenge_id,
                                ) ||
                                    null) && <this.rengoManageListItem C={C} user={props.user} />}
                            </React.Fragment>
                        ),
                )
            )}
        </>
    );

    openRengoChallengePane = (challenge_id: number) => {
        if (!this.state.show_in_rengo_management_pane.includes(challenge_id)) {
            this.setState({
                show_in_rengo_management_pane: [
                    challenge_id,
                    ...this.state.show_in_rengo_management_pane,
                ],
            });
        }
    };

    toggleRengoChallengePane = (challenge_id: number) => {
        if (this.state.show_in_rengo_management_pane.includes(challenge_id)) {
            this.closeChallengeManagementPane(challenge_id);
        } else {
            this.setState({
                show_in_rengo_management_pane: [
                    challenge_id,
                    ...this.state.show_in_rengo_management_pane,
                ],
            });
        }
    };

    closeChallengeManagementPane = (challenge_id: number) => {
        if (this.state.show_in_rengo_management_pane.includes(challenge_id)) {
            this.setState({
                show_in_rengo_management_pane: this.state.show_in_rengo_management_pane.filter(
                    (c) => c !== challenge_id,
                ),
            });
        }
    };

    startOwnRengoChallenge = (challenge: Challenge): Promise<void> => {
        // stop the person from pressing "Start" twice impatiently, while we get around to removing this challenge
        this.closeChallengeManagementPane(challenge.challenge_id);
        return rengo_utils.startOwnRengoChallenge(challenge);
    };

    rengoManageListItem = (props: { C: Challenge; user: any }) => {
        const { C, user } = { ...props };
        return (
            <tr className={"challenge-row rengo-management-row"}>
                <td className="cell" colSpan={10}>
                    <Card className="rengo-management-list-item">
                        <div className="rengo-management-header">
                            <span>{C.name}</span>
                            <div>
                                <i
                                    className="fa fa-lg fa-times-circle-o"
                                    onClick={this.closeChallengeManagementPane.bind(
                                        self,
                                        C.challenge_id,
                                    )}
                                />
                            </div>
                        </div>
                        <RengoManagementPane
                            user={user}
                            challenge_id={C.challenge_id}
                            rengo_challenge_list={this.state.rengo_list}
                            startRengoChallenge={this.startOwnRengoChallenge}
                            cancelChallenge={this.cancelOpenChallenge}
                            withdrawFromRengoChallenge={this.unNominateForRengoChallenge}
                            joinRengoChallenge={rengo_utils.nominateForRengoChallenge}
                            dontShowCancelButton={true}
                        >
                            <RengoTeamManagementPane
                                user={user}
                                challenge_id={C.challenge_id}
                                challenge_list={this.state.rengo_list}
                                moderator={user.is_moderator}
                                show_chat={true}
                                assignToTeam={rengo_utils.assignToTeam}
                                kickRengoUser={rengo_utils.kickRengoUser}
                            />
                        </RengoManagementPane>
                    </Card>
                </td>
            </tr>
        );
    };

    rengoListItem = (props: { C: Challenge; user: any }) => {
        const { C, user } = { ...props };

        const rengo_casual_mode_text: string = C.rengo_casual_mode ? _("Yes") : _("No");
        const rengo_auto_start_text: number | string = C.rengo_auto_start || "-";

        return (
            <tr className={"challenge-row"}>
                <td className={"cell rengo-list-buttons"}>
                    {user.is_moderator && (
                        <button
                            onClick={this.cancelOpenChallenge.bind(this, C)}
                            className="btn danger xs pull-left "
                        >
                            <i className="fa fa-trash" />
                        </button>
                    )}

                    {(C.user_challenge || null) && (
                        <button
                            onClick={this.cancelOpenChallenge.bind(this, C)}
                            className="btn reject xs"
                        >
                            {_("Remove")}
                        </button>
                    )}

                    {((C.eligible &&
                        !C.removed &&
                        !C.user_challenge &&
                        C.rengo_participants.includes(user.id)) ||
                        null) && (
                        <button
                            onClick={this.unNominateForRengoChallenge.bind(this, C)}
                            className="btn danger xs"
                        >
                            {_("Withdraw")}
                        </button>
                    )}

                    <button
                        onClick={this.toggleRengoChallengePane.bind(this, C.challenge_id)}
                        className="btn primary xs"
                    >
                        {C.user_challenge ? _("Manage") : _("View")}
                    </button>

                    {((C.eligible &&
                        !C.removed &&
                        !C.user_challenge &&
                        !C.rengo_participants.includes(user.id)) ||
                        null) && (
                        <button
                            onClick={this.nominateAndShow.bind(this, C)}
                            className="btn success xs"
                        >
                            {_("Join")}
                        </button>
                    )}

                    {this.suspectChallengeIcon(C)}

                    {(((!C.eligible || C.removed) && !C.user_challenge) || null) && (
                        <span className="ineligible" title={C.ineligible_reason}>
                            {_("Can't accept")}
                        </span>
                    )}
                </td>
                <td
                    className="cell"
                    style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}
                >
                    <Player user={this.extractUser(C)} rank={true} />
                </td>
                <td
                    className={
                        "cell " +
                        (C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19)
                            ? "bold"
                            : "")
                    }
                >
                    {C.width}x{C.height}
                </td>
                <td>{shortShortTimeControl(C.time_control_parameters)}</td>
                <td className="cell">{rengo_casual_mode_text}</td>
                <td className="cell">{rengo_auto_start_text}</td>
                <td className="cell">{C.rengo_participants.length}</td>
                <td className="cell">{C.handicap_text}</td>
                <td className="cell">{C.name}</td>
                <td className="cell">
                    {(C.user_challenge || null) && <ChallengeLinkButton uuid={C.uuid} />}
                </td>
            </tr>
        );
    };
}

function challenge_sort(A: Challenge, B: Challenge) {
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

export function time_per_move_challenge_sort(A: Challenge, B: Challenge) {
    const comparison = Math.sign(A.time_per_move - B.time_per_move);

    if (comparison) {
        return comparison;
    }

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

    const createdA = A.created ? new Date(A.created).getTime() : -Infinity;
    const createdB = B.created ? new Date(B.created).getTime() : -Infinity;
    return createdA - createdB;
}
