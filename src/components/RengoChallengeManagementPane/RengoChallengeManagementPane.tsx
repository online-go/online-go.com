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
import { _, pgettext, interpolate } from "translate";

import * as data from "data";

import { Player } from "Player";

interface RengoChallengeManagementPaneProps {
    the_challenge: any;
    assignToTeam: (
        player_id: number,
        team: string,
        challenge: any) => void;
}

interface RengoChallengeManagementPaneState {

}

export class RengoChallengeManagementPane extends React.PureComponent<
    RengoChallengeManagementPaneProps,
    RengoChallengeManagementPaneState> {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    render = () => {

        const the_challenge = this.props.the_challenge;

        // this function should not be called if the user doesn't have a rengo challenge open...
        if (the_challenge === undefined) {
            return <div>{_("(oops - if you had a rengo challenge open, the details would be showing here!)")}</div>;
        }

        const nominees = the_challenge['rengo_nominees'];
        const black_team = the_challenge['rengo_black_team'];
        const white_team = the_challenge['rengo_white_team'];

        if (nominees.length + black_team.length + white_team.length === 0) {
            // This should be at most transitory, since the creator is added as a player on creation!
            return <div className="no-rengo-players-to-admin">{_("(none yet - standby!)")}</div>;
        }

        return (
            <div className="RengoChallengeManagementPane">
                <div className='rengo-admin-header'>
                    {_("Black:")}
                </div>
                {(black_team.length === 0 || null) &&
                    <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                }
                {black_team.map((n, i) => (
                    <div className='rengo-assignment-row' key={i}>
                        {(the_challenge.user_challenge || null) &&
                            <React.Fragment>
                                <i className="fa fa-lg fa-times-circle-o unassign"
                                    onClick={this.props.assignToTeam.bind(self, n, 'none', the_challenge)}/>
                                <i className="fa fa-lg fa-arrow-down"
                                    onClick={this.props.assignToTeam.bind(self, n, 'rengo_white_team', the_challenge)}/>
                            </React.Fragment>
                        }
                        <Player user={n} rank={true} key={i}/>
                    </div>
                ))}

                <div className='rengo-admin-header'>
                    {_("White:")}
                </div>
                {(white_team.length === 0 || null) &&
                    <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                }
                {white_team.map((n, i) => (
                    <div className='rengo-assignment-row' key={i}>
                        {(the_challenge.user_challenge || null) &&
                            <React.Fragment>
                                <i className="fa fa-lg fa-times-circle-o unassign"
                                    onClick={this.props.assignToTeam.bind(self, n, 'none', the_challenge)}/>
                                <i className="fa fa-lg fa-arrow-up"
                                    onClick={this.props.assignToTeam.bind(self, n, 'rengo_black_team', the_challenge)}/>
                            </React.Fragment>
                        }
                        <Player user={n} rank={true} key={i}/>
                    </div>
                ))}

                <div className='rengo-admin-header'>
                    {_("Unassigned:")}
                </div>
                {(nominees.length === 0 || null) &&
                    <div className="no-rengo-players-to-admin">{_("(none left)")}</div>
                }
                {nominees.map((n, i) => (
                    <div className='rengo-assignment-row' key={i}>
                        {(the_challenge.user_challenge || null) &&
                            <React.Fragment>
                                <i className="fa fa-lg fa-arrow-up black"
                                    onClick={this.props.assignToTeam.bind(self, n, 'rengo_black_team', the_challenge)}/>
                                <i className="fa fa-lg fa-arrow-up white"
                                    onClick={this.props.assignToTeam.bind(self, n, 'rengo_white_team', the_challenge)}/>
                            </React.Fragment>
                        }
                        <Player user={n} rank={true} key={i}/>
                    </div>
                ))}
            </div>
        );
    };
}

