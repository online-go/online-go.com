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
import { alert } from "swal_config";

import { balanceTeams, unassignPlayers } from "rengo_balancer";
import { _, pgettext } from "translate";
import { errorAlerter } from "misc";

import { Player } from "Player";
import { EmbeddedChatCard } from "Chat";

type Challenge = socket_api.seekgraph_global.Challenge;

interface RengoTeamManagementPaneProps {
    user: rest_api.UserConfig;
    challenge_list: Challenge[];
    challenge_id: number;
    moderator: boolean;
    show_chat: boolean;
    // The following promises signal when the server action is done, for UI update.
    // typing note - we genuinely don't care what the promise return type is, we just use the `then` event
    assignToTeam: (player_id: number, team: string, challenge: Challenge) => Promise<any>;
    kickRengoUser: (player_id: number) => Promise<any>;
    unassignPlayers?: (challenge: Challenge) => Promise<any>;
    balanceTeams?: (challenge: Challenge) => Promise<any>;
}

export function RengoTeamManagementPane(props: RengoTeamManagementPaneProps): JSX.Element {
    const [assignment_pending, setAssignmentPending] = React.useState(false);

    const done = () => {
        setAssignmentPending(false);
    };

    const _assignToTeam = (player_id: number, team: string, challenge: Challenge) => {
        setAssignmentPending(true);
        props.assignToTeam(player_id, team, challenge).then(done).catch(errorAlerter);
    };

    const _kickRengoUser = (player_id: number) => {
        void alert
            .fire({
                text: pgettext(
                    "Confirmation text to remove the selected player from all rengo challenges",
                    "This will kick the person from all rengo challenges, are you sure you want to do this?",
                ),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    setAssignmentPending(true);
                    props
                        .kickRengoUser(player_id)
                        .then(() => done())
                        .catch(errorAlerter);
                }
            });
    };

    const _unassignPlayers = (challenge: Challenge) => {
        setAssignmentPending(true);
        if (!props.unassignPlayers) {
            // Play page is happy to have us just deal with this
            unassignPlayers(challenge).then(done).catch(errorAlerter);
        } else {
            // Overview page needs to know what's going on, so it supplies this
            props.unassignPlayers(challenge).then(done).catch(errorAlerter);
        }
    };

    const _balanceTeams = (challenge: Challenge) => {
        setAssignmentPending(true);
        if (!props.balanceTeams) {
            // Play page is happy to have us just deal with tis
            balanceTeams(challenge).then(done).catch(errorAlerter);
        } else {
            // Overview page needs to know what's going on, so it supplies this
            props.balanceTeams(challenge).then(done).catch(errorAlerter);
        }
    };

    const the_challenge = props.challenge_list.find((c) => c.challenge_id === props.challenge_id);

    // this function should not be called if the user doesn't have a rengo challenge open...
    if (the_challenge === undefined) {
        return (
            <div>
                {"(oops - if you had a rengo challenge open, the details would be showing here!)"}
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

    const our_rengo_challenges = props.challenge_list.filter((c) => c.user_id === props.user.id);

    const own_challenge = our_rengo_challenges.find((c) => c.challenge_id === props.challenge_id);

    const has_assigned_players = black_team.length + white_team.length > 0;

    return (
        <div className="RengoTeamManagementPane">
            <div className={"rengo-admin-container" + (assignment_pending ? " pending" : "")}>
                <div className="rengo-admin-header">{_("Black:")}</div>
                {(black_team.length === 0 || null) && (
                    <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                )}
                {black_team.map((n, i) => (
                    <div className="rengo-assignment-row" key={i}>
                        {(the_challenge.user_challenge || props.moderator || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-lg fa-times-circle-o unassign"
                                    onClick={() => _assignToTeam(n, "none", the_challenge)}
                                />
                                <i
                                    className="fa fa-lg fa-arrow-down"
                                    onClick={() =>
                                        _assignToTeam(n, "rengo_white_team", the_challenge)
                                    }
                                />
                            </React.Fragment>
                        )}
                        {(props.moderator || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-user-times kick"
                                    onClick={() => _kickRengoUser(n)}
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
                        {(the_challenge.user_challenge || props.moderator || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-lg fa-times-circle-o unassign"
                                    onClick={() => _assignToTeam(n, "none", the_challenge)}
                                />
                                <i
                                    className="fa fa-lg fa-arrow-up"
                                    onClick={() =>
                                        _assignToTeam(n, "rengo_black_team", the_challenge)
                                    }
                                />
                            </React.Fragment>
                        )}
                        {(props.moderator || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-user-times kick"
                                    onClick={() => _kickRengoUser(n)}
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
                        {(the_challenge.user_challenge || props.moderator || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-lg fa-arrow-up black"
                                    onClick={() =>
                                        _assignToTeam(n, "rengo_black_team", the_challenge)
                                    }
                                />
                                <i
                                    className="fa fa-lg fa-arrow-up white"
                                    onClick={() =>
                                        _assignToTeam(n, "rengo_white_team", the_challenge)
                                    }
                                />
                            </React.Fragment>
                        )}
                        {(props.moderator || null) && (
                            <React.Fragment>
                                <i
                                    className="fa fa-user-times kick"
                                    onClick={() => _kickRengoUser(n)}
                                />
                            </React.Fragment>
                        )}
                        <Player user={n} rank={true} key={i} />
                    </div>
                ))}

                {(own_challenge || props.moderator || null) && (
                    <div className="rengo-balancer-buttons">
                        {has_assigned_players ? (
                            <button
                                className="sm"
                                onClick={() => _unassignPlayers(the_challenge)}
                                disabled={!has_assigned_players}
                            >
                                {_("Unassign players")}
                            </button>
                        ) : (
                            <button
                                className="sm"
                                onClick={() => _balanceTeams(the_challenge)}
                                disabled={has_assigned_players}
                            >
                                {_("Balance teams")}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {props.show_chat && (
                <div className="rengo-challenge-chat">
                    <EmbeddedChatCard channel={`rengo-challenge-${the_challenge.challenge_id}`} />
                </div>
            )}
        </div>
    );
}
