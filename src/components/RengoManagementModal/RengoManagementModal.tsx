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


/**** THIS SEEMS TO NOT WORK BECAUSE CHANGES ON PROPS DONT PROPAGATE IN.  TBD: is that right? */

import * as React from "react";
import * as ValidUrl from "valid-url";

import {_, pgettext, interpolate} from "translate";
import { Modal, openModal } from "Modal";
import { RengoManagementPane } from "../RengoManagementPane";

interface Events {
}

interface RengoManagementModalProperties {
    heading: string;
    user_id: number;
    challenge_id: number;
    rengo_challenge_list: any[];

    startRengoChallenge: (challenge: any) => void;
    cancelChallenge: (challenge: any) => void;
    withdrawFromRengoChallenge: (challenge: any) => void;
    joinRengoChallenge: (challenge: any) => void;
}

interface RengoManagementModalState {
}


export class RengoManagementModal extends Modal<Events, RengoManagementModalProperties, RengoManagementModalState> {
    constructor(props) {
        super(props);

        console.error("THIS SEEMS TO NOT WORK BECAUSE CHANGES ON PROPS DONT PROPAGATE IN.  TBD: is that right? ");
        this.state = {
        };
    }

    closeModal = () => {
        this.close();
    };

    _startChallenge = (challenge) => {
        this.props.startRengoChallenge(challenge);
        this.close();
    };

    _cancelChallenge = (challenge) => {
        this.props.cancelChallenge(challenge);
        this.close();
    };

    UNSAFE_componentWillReceiveProps(nextProps) {
        console.log("modal props update" , nextProps);
    }

    render() {
        console.log("modal render", this.props);
        return(
            <div className='Modal RengoManagementModal'>
                <div className='rengo-management-header'>
                    <span>{this.props.heading}</span>
                    <div>
                        <i className="fa fa-lg fa-times-circle-o"
                            onClick={this.closeModal}/>
                    </div>
                </div>
                <RengoManagementPane
                    user_id={this.props.user_id}
                    challenge_id={this.props.challenge_id}
                    rengo_challenge_list={this.props.rengo_challenge_list}

                    startRengoChallenge={this._startChallenge}
                    cancelChallenge={this._cancelChallenge}
                    withdrawFromRengoChallenge={this.props.withdrawFromRengoChallenge}
                    joinRengoChallenge={this.props.joinRengoChallenge}
                >
                    {React.Children.only(this.props.children)  /* intended to be RengoTeamManagementPane */ }
                </RengoManagementPane>
            </div>
        );
    }
}
