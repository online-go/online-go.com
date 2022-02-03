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
import { _ } from "translate";

import { Player } from "Player";
import { EmbeddedChatCard } from "Chat";

type Challenge = socket_api.seekgraph_global.Challenge;

interface RengoTeamManagementPaneProps {
    challenge_list: Challenge[];
    challenge_id: number;
    moderator: boolean;
    show_chat: boolean;
    assignToTeam: (player_id: number, team: string, challenge: Challenge, done: () => void) => void;
}

interface RengoTeamManagementPaneState {
    assignment_pending: boolean;
}

export class RengoTeamManagementPane extends React.PureComponent<
    RengoTeamManagementPaneProps,
    RengoTeamManagementPaneState
> {
    constructor(props) {
        super(props);
        this.state = {
            assignment_pending: false,
        };
    }

    done = () => {
        //console.log("assign done called... ap", this.state.assignment_pending, this.props.challenge_id);
        this.setState({ assignment_pending: false });
    };

    _assignToTeam = (player_id: number, team: string, challenge: Challenge) => {
        this.setState({ assignment_pending: true });
        this.props.assignToTeam(player_id, team, challenge, this.done.bind(self));
    };

    render = () => {
        const the_challenge = this.props.challenge_list.find(
            (c) => c.challenge_id === this.props.challenge_id,
        );

        // this function should not be called if the user doesn't have a rengo challenge open...
        if (the_challenge === undefined) {
            return (
                <div>
                    {_(
                        "(oops - if you had a rengo challenge open, the details would be showing here!)",
                    )}
                </div>
            );
        }

        const nominees = the_challenge["rengo_nominees"];
        const black_team = the_challenge["rengo_black_team"];
        const white_team = the_challenge["rengo_white_team"];

        if (nominees.length + black_team.length + white_team.length === 0) {
            // This should be at most transitory, since the creator is added as a player on creation!
            return <div className="no-rengo-players-to-admin">{_("(none yet - standby!)")}</div>;
        }

        return (
            <div className="RengoTeamManagementPane">
                <div
                    className={
                        "rengo-admin-container" + (this.state.assignment_pending ? " pending" : "")
                    }
                >
                    <div className="rengo-admin-header">{_("Black:")}</div>
                    {(black_team.length === 0 || null) && (
                        <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                    )}
                    {black_team.map((n, i) => (
                        <div className="rengo-assignment-row" key={i}>
                            {(the_challenge.user_challenge || this.props.moderator || null) && (
                                <React.Fragment>
                                    <i
                                        className="fa fa-lg fa-times-circle-o unassign"
                                        onClick={this._assignToTeam.bind(
                                            self,
                                            n,
                                            "none",
                                            the_challenge,
                                        )}
                                    />
                                    <i
                                        className="fa fa-lg fa-arrow-down"
                                        onClick={this._assignToTeam.bind(
                                            self,
                                            n,
                                            "rengo_white_team",
                                            the_challenge,
                                        )}
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
                            {(the_challenge.user_challenge || this.props.moderator || null) && (
                                <React.Fragment>
                                    <i
                                        className="fa fa-lg fa-times-circle-o unassign"
                                        onClick={this._assignToTeam.bind(
                                            self,
                                            n,
                                            "none",
                                            the_challenge,
                                        )}
                                    />
                                    <i
                                        className="fa fa-lg fa-arrow-up"
                                        onClick={this._assignToTeam.bind(
                                            self,
                                            n,
                                            "rengo_black_team",
                                            the_challenge,
                                        )}
                                    />
                                </React.Fragment>
                            )}
                            <Player user={n} rank={true} key={i} />
                        </div>
                    ))}

                    <div className="rengo-admin-header">{_("Unassigned:")}</div>
                    {(nominees.length === 0 || null) && (
                        <div className="no-rengo-players-to-admin">{_("(none left)")}</div>
                    )}
                    {nominees.map((n, i) => (
                        <div className="rengo-assignment-row" key={i}>
                            {(the_challenge.user_challenge || this.props.moderator || null) && (
                                <React.Fragment>
                                    <i
                                        className="fa fa-lg fa-arrow-up black"
                                        onClick={this._assignToTeam.bind(
                                            self,
                                            n,
                                            "rengo_black_team",
                                            the_challenge,
                                        )}
                                    />
                                    <i
                                        className="fa fa-lg fa-arrow-up white"
                                        onClick={this._assignToTeam.bind(
                                            self,
                                            n,
                                            "rengo_white_team",
                                            the_challenge,
                                        )}
                                    />
                                </React.Fragment>
                            )}
                            <Player user={n} rank={true} key={i} />
                        </div>
                    ))}
                </div>
                {this.props.show_chat && (
                    <div className="rengo-challenge-chat">
                        <EmbeddedChatCard
                            channel={`rengo-challenge-${the_challenge.challenge_id}`}
                        />
                    </div>
                )}
            </div>
        );
    };
}
