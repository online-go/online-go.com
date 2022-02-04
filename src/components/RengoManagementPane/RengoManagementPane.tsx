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

import { interpolate } from "goban";
import * as React from "react";

import { _, pgettext } from "translate";

interface RengoManagementPaneProperties {
    user: rest_api.UserConfig;
    challenge_id: number;
    rengo_challenge_list: any[];

    startRengoChallenge: (challenge: any) => void;
    cancelChallenge: (challenge: any) => void;
    withdrawFromRengoChallenge: (challenge: any) => void;
    joinRengoChallenge: (challenge: any) => void;
    dontShowCancelButton?: boolean;
}

interface RengoManagementPaneState {}

export class RengoManagementPane extends React.PureComponent<
    RengoManagementPaneProperties,
    RengoManagementPaneState
> {
    constructor(props: RengoManagementPaneProperties) {
        super(props);

        this.state = {};
    }

    rengoReadyToStart = (challenge): boolean => {
        return (
            challenge.rengo_black_team.length &&
            challenge.rengo_white_team.length &&
            challenge.rengo_black_team.length + challenge.rengo_white_team.length > 2
        );
    };

    render() {
        const the_challenge = this.props.rengo_challenge_list.find(
            (c) => c.challenge_id === this.props.challenge_id,
        );

        const our_rengo_challenges = this.props.rengo_challenge_list.filter(
            (c) => c.user_id === this.props.user.id,
        );
        const own_challenge = our_rengo_challenges.find(
            (c) => c.challenge_id === this.props.challenge_id,
        );
        const participating = the_challenge.rengo_participants.includes(this.props.user.id);
        const challenge_ready_to_start = this.rengoReadyToStart(the_challenge);

        const auto_start_remaining =
            the_challenge.rengo_auto_start -
            the_challenge.rengo_black_team.length -
            the_challenge.rengo_white_team.length;

        return (
            <div className="RengoManagementPane">
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
                        {interpolate(
                            _("Game auto-starts when {{auto_start_remaining}} more join..."),
                            {
                                auto_start_remaining,
                            },
                        )}
                    </div>
                )}
                {
                    // this is the team management pane
                    React.Children.only(this.props.children)
                }
                <div className="rengo-challenge-buttons">
                    {(own_challenge || this.props.user.is_moderator || null) && (
                        <React.Fragment>
                            {!this.props.dontShowCancelButton ? (
                                <button
                                    className="danger sm"
                                    onClick={this.props.cancelChallenge.bind(self, the_challenge)}
                                >
                                    {_("Cancel challenge")}
                                </button>
                            ) : (
                                <span />
                            )}

                            <button
                                className="success sm"
                                onClick={this.props.startRengoChallenge.bind(self, the_challenge)}
                                disabled={!challenge_ready_to_start}
                            >
                                {pgettext("Start game", "Start")}
                            </button>
                        </React.Fragment>
                    )}
                    {(!own_challenge || null) && (
                        <button
                            onClick={this.props.withdrawFromRengoChallenge.bind(
                                this,
                                the_challenge,
                            )}
                            className="btn danger sm"
                            disabled={!participating}
                        >
                            {_("Withdraw")}
                        </button>
                    )}
                    {(!participating || null) && (
                        <button
                            onClick={this.props.joinRengoChallenge.bind(this, the_challenge)}
                            className="btn success sm"
                        >
                            {_("Join")}
                        </button>
                    )}
                </div>
            </div>
        );
    }
}
