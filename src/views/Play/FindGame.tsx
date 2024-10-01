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
import * as data from "@/lib/data";
import * as rengo_utils from "@/lib/rengo_utils";

import { Speed } from "goban";
import { _, pgettext } from "@/lib/translate";
import { isLiveGame } from "@/components/TimeControl";
import { challenge, challengeComputer } from "@/components/ChallengeModal";
import { dup, uuid } from "@/lib/misc";
import { openAutomatchSettings, getAutomatchSettings } from "@/components/AutomatchSettings";
import { automatch_manager, AutomatchPreferences } from "@/lib/automatch_manager";
import { bot_count } from "@/lib/bots";
import { CreatedChallengeInfo } from "@/lib/types";
import { alert } from "@/lib/swal_config";
import { Size } from "@/lib/types";
import { RengoManagementPane } from "@/components/RengoManagementPane";
import { RengoTeamManagementPane } from "@/components/RengoTeamManagementPane";
import { Challenge } from "@/lib/challenge_utils";
import { useData, useRefresh, useUser } from "@/lib/hooks";
import { PlayContext } from "./context";

interface FindGameProps {
    own_rengo_challenges_pending: Challenge[];
    joined_rengo_challenges_pending: Challenge[];
    live_own_challenge_pending: Challenge | undefined;
    live_list: Challenge[];
    rengo_list: Challenge[];
    rengo_manage_pane_lock: { [key: number]: boolean };
}

export function FindGame(props: FindGameProps): JSX.Element {
    const ctx = React.useContext(PlayContext);
    const refresh = useRefresh();
    const [automatch_size_options, setAutomatchSizeOptions] = useData("automatch.size_options", [
        "9x9",
        "13x13",
        "19x19",
    ]);
    const [correspondence_spinner, setCorrespondenceSpinner] = React.useState(false);

    React.useEffect(() => {
        automatch_manager.on("entry", refresh);
        automatch_manager.on("start", refresh);
        automatch_manager.on("cancel", refresh);

        return () => {
            automatch_manager.off("entry", refresh);
            automatch_manager.off("start", refresh);
            automatch_manager.off("cancel", refresh);
        };
    }, []);

    const size_enabled = (size: Size) => {
        return automatch_size_options.indexOf(size) >= 0;
    };

    const own_live_rengo_challenge = props.own_rengo_challenges_pending.find((c) =>
        isLiveGame(c.time_control_parameters, c.width, c.height),
    );
    const joined_live_rengo_challenge = props.joined_rengo_challenges_pending.find((c) =>
        isLiveGame(c.time_control_parameters, c.width, c.height),
    );

    const rengo_challenge_to_show = own_live_rengo_challenge || joined_live_rengo_challenge;

    const user = useUser();
    const anon = user.anonymous;
    const warned = user.has_active_warning_flag;

    const cancelActiveAutomatch = () => {
        if (automatch_manager.active_live_automatcher) {
            automatch_manager.cancel(automatch_manager.active_live_automatcher.uuid);
        }
        refresh();
    };

    const cancelOwnChallenges = (challenge_list: Challenge[]) => {
        challenge_list.forEach((c) => {
            if (c.user_challenge) {
                ctx.cancelOpenChallenge(c);
            }
        });
    };

    const toggleSize = (size: Size) => {
        let size_options = dup(automatch_size_options);
        if (size_options.indexOf(size) >= 0) {
            size_options = size_options.filter((x) => x !== size);
        } else {
            size_options.push(size);
        }
        if (size_options.length === 0) {
            size_options.push("19x19");
        }
        setAutomatchSizeOptions(size_options);
    };

    const findMatch = (speed: Speed) => {
        if (data.get("user").anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        const settings = getAutomatchSettings(speed);
        const preferences: AutomatchPreferences = {
            uuid: uuid(),
            size_speed_options: automatch_size_options.map((size) => {
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
        refresh();

        if (speed === "correspondence") {
            setCorrespondenceSpinner(true);
        }
    };

    const dismissCorrespondenceSpinner = () => {
        setCorrespondenceSpinner(false);
    };

    const newComputerGame = () => {
        if (bot_count() === 0) {
            void alert.fire(_("Sorry, all bots seem to be offline, please try again later."));
            return;
        }
        challengeComputer();
    };

    const newCustomGame = () => {
        const challengeCreated = (c: CreatedChallengeInfo) => {
            if (c.rengo && !c.live) {
                ctx.toggleRengoChallengePane(c.challenge_id);
            }
        };

        challenge(undefined, undefined, undefined, undefined, challengeCreated);
    };

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
                    <button className="danger sm" onClick={cancelActiveAutomatch}>
                        {pgettext("Cancel automatch", "Cancel")}
                    </button>
                </div>
            </div>
        );
    } else if (props.live_own_challenge_pending) {
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
                        onClick={() => cancelOwnChallenges(props.live_list)}
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
                    challenge_id={rengo_challenge_to_show.challenge_id}
                    rengo_challenge_list={props.rengo_list}
                    startRengoChallenge={rengo_utils.startOwnRengoChallenge}
                    cancelChallenge={ctx.cancelOpenRengoChallenge}
                    withdrawFromRengoChallenge={ctx.unNominateForRengoChallenge}
                    joinRengoChallenge={rengo_utils.nominateForRengoChallenge}
                    lock={props.rengo_manage_pane_lock[rengo_challenge_to_show.challenge_id]}
                >
                    <RengoTeamManagementPane
                        challenge_id={rengo_challenge_to_show.challenge_id}
                        challenge_list={props.rengo_list}
                        moderator={user.is_moderator}
                        show_chat={false}
                        assignToTeam={rengo_utils.assignToTeam}
                        kickRengoUser={rengo_utils.kickRengoUser}
                        locked={props.rengo_manage_pane_lock[rengo_challenge_to_show.challenge_id]}
                        lock={(lock: boolean) =>
                            ctx.setPaneLock(rengo_challenge_to_show.challenge_id, lock)
                        }
                    />
                </RengoManagementPane>
            </div>
        );
    } else if (correspondence_spinner) {
        return (
            <div className="automatch-container">
                <div className="automatch-header">{_("Finding you a game...")}</div>
                <div className="automatch-settings-corr">
                    {_(
                        'This can take several minutes. You will be notified when your match has been found. To view or cancel your automatch requests, please see the list below labeled "Your Automatch Requests".',
                    )}
                </div>
                <div className="automatch-row-container">
                    <button className="primary" onClick={dismissCorrespondenceSpinner}>
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
                            onClick={() => toggleSize("9x9")}
                        >
                            9x9
                        </button>
                        <button
                            className={size_enabled("13x13") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("13x13")}
                        >
                            13x13
                        </button>
                        <button
                            className={size_enabled("19x19") ? "primary sm" : "sm"}
                            onClick={() => toggleSize("19x19")}
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
                            onClick={() => findMatch("blitz")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-bolt" /> {_("Blitz")}
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~10s per move")}
                                </span>
                            </div>
                        </button>
                        <button
                            className="primary"
                            onClick={() => findMatch("live")}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-clock-o" /> {_("Normal")}
                                <span className="time-per-move">
                                    {pgettext("Automatch average time per move", "~30s per move")}
                                </span>
                            </div>
                        </button>
                    </div>
                    <div className="automatch-row">
                        <button
                            className="primary"
                            onClick={newComputerGame}
                            disabled={anon || warned}
                        >
                            <div className="play-button-text-root">
                                <i className="fa fa-desktop" /> {_("Computer")}
                                <span className="time-per-move"></span>
                            </div>
                        </button>
                        <button
                            className="primary"
                            onClick={() => findMatch("correspondence")}
                            disabled={anon || warned}
                        >
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
                        <button
                            className="primary"
                            onClick={newCustomGame}
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
