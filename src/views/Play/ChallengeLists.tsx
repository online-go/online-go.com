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

import * as rengo_utils from "@/lib/rengo_utils";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext } from "@/lib/translate";
import { Card } from "@/components/material";
import { isLiveGame, shortShortTimeControl, usedForCheating } from "@/components/TimeControl";
import { openGameAcceptModal } from "@/components/GameAcceptModal";
import { errorAlerter, rulesText } from "@/lib/misc";
import { Player } from "@/components/Player";
import { ChallengeLinkButton } from "@/components/ChallengeLinkButton";
import { RengoManagementPane } from "@/components/RengoManagementPane";
import { RengoTeamManagementPane } from "@/components/RengoTeamManagementPane";
import { Challenge, ChallengeFilter, shouldDisplayChallenge } from "@/lib/challenge_utils";
import { useUser } from "@/lib/hooks";
import { alert } from "@/lib/swal_config";
import { PlayContext } from "./PlayContext";
import { anyChallengesToShow } from "./utils";

interface ChallengeListProps {
    list: Challenge[];
    filter: ChallengeFilter;
    is_live_list?: boolean;
}

interface RengoComponentProps {
    list: Challenge[];
    filter: ChallengeFilter;
    show_in_rengo_management_pane: number[];
    challenge?: Challenge;
    rengo_manage_pane_lock: { [id: number]: boolean };
}

export function ChallengeList({
    filter,
    list,
    is_live_list,
}: ChallengeListProps): (React.ReactElement | null)[] | React.ReactElement {
    const ctx = React.useContext(PlayContext);
    const user = useUser();

    const timeControlClassName = (config: any) => {
        // This appears to be bolding live games compared to blitz?
        const isBold = is_live_list && (config.time_per_move > 3600 || config.time_per_move === 0);
        return "cell " + (isBold ? "bold" : "");
    };

    if (!anyChallengesToShow(filter, list)) {
        return (
            <div className="ineligible">
                {
                    filter.showIneligible
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

    const acceptOpenChallenge = (challenge: Challenge) => {
        if (user.anonymous) {
            void alert.fire(_("Please sign in first"));
            return;
        }

        openGameAcceptModal(challenge)
            .then((challenge) => {
                browserHistory.push(`/game/${challenge.game_id}`);
                //window['openGame'](obj.game);_
                ctx.unfreezeChallenges();
            })
            .catch(errorAlerter);
    };

    return list.map((C) =>
        shouldDisplayChallenge(C, filter) ? (
            <div key={C.challenge_id} className={"challenge-row"}>
                <span className={"cell"} style={{ textAlign: "center" }}>
                    {user.is_moderator && (
                        <button
                            onClick={() => ctx.cancelOpenChallenge(C)}
                            className="btn reject xs pull-left "
                        >
                            <i className="fa fa-trash" />
                        </button>
                    )}

                    {((C.eligible && !C.removed) || null) && (
                        <button onClick={() => acceptOpenChallenge(C)} className="btn success xs">
                            {_("Accept")}
                        </button>
                    )}

                    {(C.user_challenge || null) && (
                        <button
                            onClick={() => ctx.cancelOpenChallenge(C)}
                            className="btn danger xs"
                        >
                            {_("Cancel")}
                        </button>
                    )}

                    <SuspectChallengeIcon challenge={C} />

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
                    <Player user={extractUser(C)} rank={true} />
                </span>
                <span
                    className={
                        "cell " +
                        (C.width !== C.height || (C.width !== 9 && C.width !== 13 && C.width !== 19)
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
                <span className="cell">{C.komi_text}</span>
                <span className="cell">{C.name}</span>
                <span className="cell">{rulesText(C.rules)}</span>
                <span className="cell">
                    {(C.user_challenge || null) && <ChallengeLinkButton uuid={C.uuid} />}
                </span>
            </div>
        ) : null,
    );
}

export function CellBreaks({ width }: { width: number }): React.ReactElement[] {
    const result: React.ReactElement[] = [];
    for (let i = 0; i < width; ++i) {
        result.push(<span key={i} className="cell break"></span>);
    }
    return result;
}

export function ChallengeListHeaders(): React.ReactElement {
    return (
        <div className="challenge-row">
            <span className="head">{/* buttons */}</span>
            <span className="head">{_("Player")}</span>
            {/* <span className="head">{_("Rank")}</span> */}
            <span className="head">{_("Size")}</span>
            <span className="head time-control-header">{_("Time")}</span>
            <span className="head">{_("Ranked")}</span>
            <span className="head">{_("Handicap")}</span>
            <span className="head">{_("Komi")}</span>
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

export function RengoListHeaders(): React.ReactElement {
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
                <td className="head">{_("Komi")}</td>
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

export function RengoList(props: RengoComponentProps): React.ReactElement {
    const filter = props.filter;
    const list = props.list;

    if (!anyChallengesToShow(filter, list)) {
        return (
            <tr key="none-available">
                <td colSpan={9}>
                    <div className="ineligible">
                        {
                            filter.showIneligible
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

    const live_list = list.filter((c) => isLiveGame(c.time_control_parameters, c.width, c.height));
    const corr_list = list.filter((c) => !isLiveGame(c.time_control_parameters, c.width, c.height));

    return (
        <>
            <tr className="challenge-row">
                <td className="cell">{_("Live:")}</td>
            </tr>
            <RengoChallengeManagementList {...props} list={live_list} key="live" />

            <tr className="challenge-row">
                <td className="cell" colSpan={10}>
                    <hr />
                </td>
            </tr>

            <tr className="challenge-row">
                <td className="cell">{_("Correspondence:")}</td>
            </tr>
            <RengoChallengeManagementList {...props} list={corr_list} key="corr" />
        </>
    );
}

function RengoChallengeManagementList(props: RengoComponentProps): React.ReactElement {
    const filter = props.filter;
    const list = props.list;

    return (
        <>
            {!anyChallengesToShow(filter, list) ? (
                <tr className="ineligible" key="correspondence-ineligible">
                    <td style={{ textAlign: "center" }}>
                        {
                            filter.showIneligible
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
                list.map(
                    (C) =>
                        (shouldDisplayChallenge(C, filter) || null) && (
                            <React.Fragment key={C.challenge_id}>
                                <RengoListItem {...props} challenge={C} />
                                {(props.show_in_rengo_management_pane.includes(C.challenge_id) ||
                                    null) && <RengoManageListItem {...props} challenge={C} />}
                            </React.Fragment>
                        ),
                )
            )}
        </>
    );
}

function RengoManageListItem(props: RengoComponentProps): React.ReactElement {
    const challenge = props.challenge;
    const user = useUser();
    const ctx = React.useContext(PlayContext);

    if (!challenge) {
        throw new Error("No challenge provided");
    }

    const startOwnRengoChallenge = (challenge: Challenge): Promise<void> => {
        // stop the person from pressing "Start" twice impatiently, while we get around to removing this challenge
        ctx.closeChallengeManagementPane(challenge.challenge_id);
        return rengo_utils.startOwnRengoChallenge(challenge);
    };

    return (
        <tr className={"challenge-row rengo-management-row"}>
            <td className="cell" colSpan={10}>
                <Card className="rengo-management-list-item">
                    <div className="rengo-management-header">
                        <span>{challenge.name}</span>
                        <div>
                            <i
                                className="fa fa-lg fa-times-circle-o"
                                onClick={() =>
                                    ctx.closeChallengeManagementPane.bind(challenge.challenge_id)
                                }
                            />
                        </div>
                    </div>
                    <RengoManagementPane
                        challenge_id={challenge.challenge_id}
                        rengo_challenge_list={props.list}
                        startRengoChallenge={startOwnRengoChallenge}
                        cancelChallenge={ctx.cancelOpenRengoChallenge}
                        withdrawFromRengoChallenge={ctx.unNominateForRengoChallenge}
                        joinRengoChallenge={rengo_utils.nominateForRengoChallenge}
                        dontShowCancelButton={true}
                        lock={props.rengo_manage_pane_lock[challenge.challenge_id]}
                    >
                        <RengoTeamManagementPane
                            challenge_id={challenge.challenge_id}
                            challenge_list={props.list}
                            moderator={user.is_moderator}
                            show_chat={true}
                            assignToTeam={rengo_utils.assignToTeam}
                            kickRengoUser={rengo_utils.kickRengoUser}
                            locked={props.rengo_manage_pane_lock[challenge.challenge_id]}
                            lock={(lock: boolean) => ctx.setPaneLock(challenge.challenge_id, lock)}
                        />
                    </RengoManagementPane>
                </Card>
            </td>
        </tr>
    );
}

function RengoListItem(props: RengoComponentProps): React.ReactElement {
    const ctx = React.useContext(PlayContext);
    const challenge = props.challenge;
    const user = useUser();

    if (!challenge) {
        throw new Error("No challenge provided");
    }

    const rengo_casual_mode_text: string = challenge.rengo_casual_mode ? _("Yes") : _("No");
    const rengo_auto_start_text: number | string = challenge.rengo_auto_start || "-";

    const nominateAndShow = (challenge: Challenge) => {
        ctx.toggleRengoChallengePane(challenge.challenge_id);
        rengo_utils.nominateForRengoChallenge(challenge).catch(errorAlerter);
    };

    return (
        <tr className={"challenge-row"}>
            <td className={"cell rengo-list-buttons"}>
                {user.is_moderator && (
                    <button
                        onClick={() => ctx.cancelOpenRengoChallenge(challenge)}
                        className="btn reject xs pull-left "
                    >
                        <i className="fa fa-trash" />
                    </button>
                )}

                {(challenge.user_challenge || null) && (
                    <button
                        onClick={() => ctx.cancelOpenRengoChallenge(challenge)}
                        className="btn danger xs"
                    >
                        {_("Cancel")}
                    </button>
                )}

                {((challenge.eligible &&
                    !challenge.removed &&
                    !challenge.user_challenge &&
                    challenge.rengo_participants.includes(user.id)) ||
                    null) && (
                    <button
                        onClick={() => ctx.unNominateForRengoChallenge(challenge)}
                        className="btn danger xs"
                    >
                        {_("Withdraw")}
                    </button>
                )}

                <button
                    onClick={() => ctx.toggleRengoChallengePane(challenge.challenge_id)}
                    className="btn primary xs"
                >
                    {challenge.user_challenge ? _("Manage") : _("View")}
                </button>

                {((challenge.eligible &&
                    !challenge.removed &&
                    !challenge.user_challenge &&
                    !challenge.rengo_participants.includes(user.id)) ||
                    null) && (
                    <button onClick={() => nominateAndShow(challenge)} className="btn success xs">
                        {_("Join")}
                    </button>
                )}

                <SuspectChallengeIcon challenge={challenge} />

                {(((!challenge.eligible || challenge.removed) && !challenge.user_challenge) ||
                    null) && (
                    <span className="ineligible" title={challenge.ineligible_reason}>
                        {_("Can't accept")}
                    </span>
                )}
            </td>
            <td
                className="cell"
                style={{ textAlign: "left", maxWidth: "10em", overflow: "hidden" }}
            >
                <Player user={extractUser(challenge)} rank={true} />
            </td>
            <td
                className={
                    "cell " +
                    (challenge.width !== challenge.height ||
                    (challenge.width !== 9 && challenge.width !== 13 && challenge.width !== 19)
                        ? "bold"
                        : "")
                }
            >
                {challenge.width}x{challenge.height}
            </td>
            <td>{shortShortTimeControl(challenge.time_control_parameters)}</td>
            <td className="cell">{rengo_casual_mode_text}</td>
            <td className="cell">{rengo_auto_start_text}</td>
            <td className="cell">{challenge.rengo_participants.length}</td>
            <td className="cell">{challenge.handicap_text}</td>
            <td className="cell">{challenge.komi_text}</td>
            <td className="cell">{challenge.name}</td>
            <td className="cell">
                {(challenge.user_challenge || null) && (
                    <ChallengeLinkButton uuid={challenge.uuid} />
                )}
            </td>
        </tr>
    );
}

function extractUser(challenge: Challenge) {
    return {
        id: challenge.user_id,
        username: challenge.username,
        rank: challenge.rank,
        professional: !!challenge.pro,
    };
}

function SuspectChallengeIcon({ challenge }: { challenge: Challenge }): React.ReactElement | null {
    /* Mark eligible suspect games with a warning icon and warning explanation popup.
           We do let users see the warning for their own challenges. */
    const C = challenge;
    return (
        (((C.eligible || C.user_challenge) &&
            !C.removed &&
            (C.komi !== null ||
                usedForCheating(C.time_control_parameters) ||
                (C.handicap !== 0 && C.handicap !== -1))) ||
            null) && (
            <span className="suspect-challenge">
                <i className="cheat-alert fa fa-exclamation-triangle fa-xs" />
                <p className="cheat-alert-tooltip-text">
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
        )
    );
}
