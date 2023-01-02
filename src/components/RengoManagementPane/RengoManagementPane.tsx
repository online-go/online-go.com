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
import * as DynamicHelp from "react-dynamic-help";

import { _, pgettext, interpolate } from "translate";

interface RengoManagementPaneProperties {
    user: rest_api.UserConfig;
    challenge_id: number;
    rengo_challenge_list: any[];

    startRengoChallenge: (challenge: any) => Promise<void>;
    cancelChallenge: (challenge: any) => void;
    withdrawFromRengoChallenge: (challenge: any) => void;
    joinRengoChallenge: (challenge: any) => void;
    dontShowCancelButton?: boolean;
    children: React.ReactNode; // intended for team management pane, which receives different props, direct from our parent
}

/** This Pane is designed to manage a challenge identified by `id`,
 * picked out of a supplied list of challenges
 * */

export function RengoManagementPane(props: RengoManagementPaneProperties): JSX.Element {
    const { registerTargetItem } = React.useContext(DynamicHelp.Api);

    const { ref: rengoManagementPane } = registerTargetItem("active-rengo-management-pane");

    const rengoReadyToStart = (challenge): boolean => {
        return (
            challenge.rengo_black_team.length &&
            challenge.rengo_white_team.length &&
            challenge.rengo_black_team.length + challenge.rengo_white_team.length > 2
        );
    };

    const the_challenge = props.rengo_challenge_list.find(
        (c) => c.challenge_id === props.challenge_id,
    );

    if (!the_challenge) {
        return <div></div>;
    }

    const our_rengo_challenges = props.rengo_challenge_list.filter(
        (c) => c.user_id === props.user.id,
    );
    const own_challenge = our_rengo_challenges.find((c) => c.challenge_id === props.challenge_id);
    const participating = the_challenge.rengo_participants.includes(props.user.id);
    const challenge_ready_to_start = rengoReadyToStart(the_challenge);

    const auto_start_remaining =
        the_challenge.rengo_auto_start -
        the_challenge.rengo_black_team.length -
        the_challenge.rengo_white_team.length;

    return (
        <div className="RengoManagementPane" ref={rengoManagementPane}>
            {!the_challenge.rengo_auto_start && (
                <div className="rengo-challenge-status">
                    {own_challenge && challenge_ready_to_start
                        ? _("Waiting for your decision to start...")
                        : challenge_ready_to_start
                        ? _("Waiting for organiser to start...")
                        : _("Waiting for Rengo players...")}
                </div>
            )}
            {!!the_challenge.rengo_auto_start && (
                <div className="auto-start-status">
                    {interpolate(_("Game auto-starts when {{auto_start_remaining}} more join..."), {
                        auto_start_remaining,
                    })}
                </div>
            )}
            {
                // is the team management pane
                React.Children.only(props.children)
            }
            <div className="rengo-challenge-buttons">
                {(own_challenge || props.user.is_moderator || null) && (
                    <React.Fragment>
                        {!props.dontShowCancelButton ? (
                            <button
                                className="danger sm"
                                onClick={() => props.cancelChallenge(the_challenge)}
                            >
                                {_("Cancel challenge")}
                            </button>
                        ) : (
                            <span />
                        )}

                        <button
                            className="success sm"
                            onClick={() => props.startRengoChallenge(the_challenge)}
                            disabled={!challenge_ready_to_start}
                        >
                            {pgettext("Start game", "Start")}
                        </button>
                    </React.Fragment>
                )}
                {(!own_challenge || null) && (
                    <button
                        onClick={() => props.withdrawFromRengoChallenge(the_challenge)}
                        className="btn danger sm"
                        disabled={!participating}
                    >
                        {_("Withdraw")}
                    </button>
                )}
                {(!participating || null) && (
                    <button
                        onClick={() => props.joinRengoChallenge(the_challenge)}
                        className="btn success sm"
                    >
                        {_("Join")}
                    </button>
                )}
            </div>
        </div>
    );
}
