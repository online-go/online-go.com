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
import * as ValidUrl from "valid-url";

import {_, pgettext, interpolate} from "translate";
import { Modal, openModal } from "Modal";

interface Events {
}

interface RengoManagementModalProperties {
    challenge_to_manage: any;
    ownPendingChallenges: () => any[];
    joinedPendingChallenges: () => any[];
    readyToStart: (challenge: any) => boolean;
    startRengoChallenge: (challenge: any) => void;
    cancelChallenge: (challenge: any) => void;
    withdrawFromRengoChallenge: (challenge: any) => void;
    joinRengoChallenge: (challenge: any) => void;
    admin_pending: boolean;
}

interface RengoManagementModalState {
}


export class RengoManagementModal extends Modal<Events, RengoManagementModalProperties, RengoManagementModalState> {
    constructor(props) {
        super(props);

        this.state = {

        };
    }

    closeRengoManagementPane = () => {
        this.close();
    };

    render() {
        const the_challenge = this.props.challenge_to_manage;

        const selected_own_rengo_challenge: boolean =
            this.props.ownPendingChallenges().find((c) => (c.challenge_id === the_challenge.challenge_id));

        console.log("selected own", selected_own_rengo_challenge);

        // ... whether to enable the start button
        const own_rengo_challenge_ready_to_start =
            selected_own_rengo_challenge && this.props.readyToStart(the_challenge);

        // ... or tell them it's up to the organiser
        const joined_rengo_challenge_ready_to_start =
                !selected_own_rengo_challenge && this.props.readyToStart(the_challenge);

        // Are they even in this rengo challenge?

        const our_rengo_challenges = this.props.ownPendingChallenges().concat(this.props.joinedPendingChallenges());

        const in_this_rengo_challenge = our_rengo_challenges.find((c) => (c.challenge_id === the_challenge.challenge_id));

        console.log("our challenges", our_rengo_challenges);
        console.log("in this one", in_this_rengo_challenge);

        return(
            <div className='RengoManagementModal'>
                <div className='rengo-management-header'>
                    <span>"{the_challenge.name}"</span>
                    <div>
                        <i className="fa fa-lg fa-times-circle-o"
                            onClick={this.closeRengoManagementPane}/>
                    </div>
                </div>
                <div className='rengo-challenge-status'>
                    {own_rengo_challenge_ready_to_start ? _("Waiting for your decision to start...") :
                        joined_rengo_challenge_ready_to_start ? _("Waiting for organiser to start...") :
                            _("Waiting for Rengo players...")}
                </div>

                <div className={'rengo-admin-container' + (this.props.admin_pending ? " pending" : "")}>
                    {React.Children.only(this.props.children)}
                </div>

                <div className="rengo-challenge-buttons">
          \
                    <div className='automatch-settings'>
                        <button className='danger sm' onClick={this.props.cancelChallenge.bind(self, the_challenge)}>
                            {_("Cancel challenge")}
                        </button>
                    </div>

                    {((selected_own_rengo_challenge) || null) &&
                        <div className='automatch-settings'>
                            <button className='success sm'
                                onClick={this.props.startRengoChallenge.bind(self, the_challenge)}
                                disabled = {!own_rengo_challenge_ready_to_start}
                            >
                                {pgettext("Start game", "Start")}
                            </button>
                        </div>
                    }
                    {(!selected_own_rengo_challenge || null) &&
                        <div className='automatch-settings'>
                            <button onClick={this.props.withdrawFromRengoChallenge.bind(this, the_challenge)} className="btn success xs">
                                {_("Withdraw")}
                            </button>
                        </div>
                    }
                    {(!in_this_rengo_challenge || null) &&
                        <div className='automatch-settings'>
                            <button onClick={this.props.joinRengoChallenge.bind(this, the_challenge)} className="btn success xs">
                                {_("Join")}
                            </button>
                        </div>
                    }
                </div>
            </div>
        );
    }
}
