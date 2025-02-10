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
import { alert } from "@/lib/swal_config";

import { rectSortingStrategy } from "@dnd-kit/sortable";
import { MultipleContainers } from "@/components/Sortable/MultipleContainers/MultipleContainers";

import * as rengo_utils from "@/lib/rengo_utils";
import * as rengo_balancer from "@/lib/rengo_balancer";
import { _, pgettext } from "@/lib/translate";
import { errorAlerter } from "@/lib/misc";

import { Player } from "@/components/Player";
import { EmbeddedChatCard } from "@/components/Chat";
import { useUser } from "@/lib/hooks";

type Challenge = socket_api.seekgraph_global.Challenge;
type RengoParticipantsDTO = rest_api.RengoParticipantsDTO;

interface RengoTeamManagementPaneProps {
    challenge_list: Challenge[];
    challenge_id: number;
    moderator: boolean;
    show_chat: boolean;
    locked: boolean; // indication from parent that it's has us locked
    // The following promises signal when the server action is done, for UI update.
    // typing note - we genuinely don't care what the promise return type is, we just use the `then` event
    assignToTeam: (player_id: number, team: string, challenge: Challenge) => Promise<any>;
    kickRengoUser: (player_id: number) => Promise<any>;
    unassignPlayers?: (challenge: Challenge) => Promise<any>;
    balanceTeams?: (challenge: Challenge) => Promise<any>;
    setTeams?: (teams: RengoParticipantsDTO, challenge: Challenge) => Promise<any>;
    lock: (lock: boolean) => void; // we call this to signal that we're busy so don't start the challenge yet
}

export function RengoTeamManagementPane({
    challenge_list,
    challenge_id,
    moderator,
    show_chat,
    locked,
    assignToTeam,
    kickRengoUser,
    // The Play page is happy to have us just deal with these using the rengo_balancer utils
    // Overview page wants to supply it's own, so it knows what's going on.
    unassignPlayers = rengo_balancer.unassignPlayers,
    balanceTeams = rengo_balancer.balanceTeams,
    setTeams = rengo_utils.setTeams,
    lock,
}: RengoTeamManagementPaneProps): React.ReactElement {
    const user = useUser();
    const [assignment_pending, setAssignmentPending] = React.useState(false);
    const [ordering_players, setOrderingPlayers] = React.useState(false);
    const [new_teams, setNewTeams] = React.useState<RengoParticipantsDTO | null>(null);
    const [lock_state, setLockState] = React.useState(false);

    React.useEffect(
        () => {
            const lock_needed = assignment_pending || ordering_players;
            if (lock && lock_state !== lock_needed) {
                lock(lock_needed);
                setLockState(lock_needed);
            }
        } /* always */,
    );

    const done = () => {
        setAssignmentPending(false);
    };

    const _assignToTeam = (player_id: number, team: string, challenge: Challenge) => {
        setAssignmentPending(true);
        assignToTeam(player_id, team, challenge).then(done).catch(errorAlerter);
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
                    kickRengoUser(player_id)
                        .then(() => done())
                        .catch(errorAlerter);
                }
            });
    };

    const _unassignPlayers = (challenge: Challenge) => {
        setAssignmentPending(true);
        unassignPlayers(challenge).then(done).catch(errorAlerter);
    };

    const _balanceTeams = (challenge: Challenge) => {
        setAssignmentPending(true);
        balanceTeams(challenge).then(done).catch(errorAlerter);
    };

    const onSavePlayerOrder = (challenge: Challenge) => {
        if (new_teams) {
            setAssignmentPending(true);
            setTeams(new_teams, challenge).then(done).catch(errorAlerter);
            setOrderingPlayers(false);
        } else {
            errorAlerter("save player order called with no teams");
        }
    };

    const extractTeams = (
        items: any /* should be the type of initial_order, below */,
    ): RengoParticipantsDTO => {
        return {
            challenge: challenge_id,
            rengo_black_team: items["Black:"].map((i: any) => i.id),
            rengo_white_team: items["White:"].map((i: any) => i.id),
            rengo_nominees: items["Unassigned:"].map((i: any) => i.id),
        };
    };

    const playerOrderUpdate = (items: any /* should be the type of initial_order*/) => {
        setNewTeams(extractTeams(items));
    };

    const the_challenge = challenge_list.find((c) => c.challenge_id === challenge_id);

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

    const our_rengo_challenges = challenge_list.filter((c) => c.user_id === user.id);

    const own_challenge = our_rengo_challenges.find((c) => c.challenge_id === challenge_id);

    const has_assigned_players = black_team.length + white_team.length > 0;

    let initial_order;

    if (ordering_players) {
        initial_order = {
            "Black:": black_team.map((id) => ({
                id: id,
                value: <Player user={id} rank={true} key={id} />,
            })),
            "White:": white_team.map((id) => ({
                id: id,
                value: <Player user={id} rank={true} key={id} />,
            })),
            "Unassigned:": nominees.map((id) => ({
                id: id,
                value: <Player user={id} rank={true} key={id} />,
            })),
        };
    }

    return (
        <div className="RengoTeamManagementPane">
            <div className={"rengo-admin-container" + (locked && !lock_state ? " pending" : "")}>
                {ordering_players ? (
                    <MultipleContainers
                        initialItems={initial_order}
                        strategy={rectSortingStrategy}
                        vertical
                        scrollable={true}
                        fixed_containers={true}
                        handle={true}
                        onUpdate={playerOrderUpdate}
                    />
                ) : (
                    <React.Fragment>
                        <div className="rengo-admin-header">{_("Black:")}</div>
                        {(black_team.length === 0 || null) && (
                            <div className="no-rengo-players-to-admin">{_("(none yet)")}</div>
                        )}
                        {black_team.map((n, i) => (
                            <div className="rengo-assignment-row" key={i}>
                                {(the_challenge.user_challenge || moderator || null) && (
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
                                {(moderator || null) && (
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
                                {(the_challenge.user_challenge || moderator || null) && (
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
                                {(moderator || null) && (
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
                                {(the_challenge.user_challenge || moderator || null) && (
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
                                {(moderator || null) && (
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
                    </React.Fragment>
                )}
                {(own_challenge || moderator || null) && (
                    <div className="rengo-balancer-buttons">
                        {ordering_players ? (
                            <>
                                <button
                                    className="sm"
                                    onClick={() => onSavePlayerOrder(the_challenge)}
                                >
                                    {_("Save")}
                                </button>
                                {/* Dont do this:
                                <button className="sm" onClick={() => setOrderingPlayers(false)}>
                                    {_("Cancel")}
                                </button>
                                ... because we need a seek graph update to unlock the pane.
                                They can exit using the "close pane" button */}
                            </>
                        ) : (
                            <>
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
                                <button className="sm" onClick={() => setOrderingPlayers(true)}>
                                    {_("Re-order players")}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {show_chat && (
                <div className="rengo-challenge-chat">
                    <EmbeddedChatCard channel={`rengo-challenge-${the_challenge.challenge_id}`} />
                </div>
            )}
        </div>
    );
}
