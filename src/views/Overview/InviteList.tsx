/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { errorAlerter } from "misc";
import { pgettext } from "translate";
import { del, get } from "requests";
import { useUser } from "hooks";
import { dup } from "misc";

import { popover } from "popover";
import { profanity_filter } from "profanity_filter";
import { challenge_text_description } from "ChallengeModal";

import { Card } from "material";
import { FabX } from "material";

import { ChallengeLinkButton } from "ChallengeLinkButton";
import { RengoManagementPane } from "RengoManagementPane";

type ChallengeDTO = rest_api.OpenChallengeDTO;

export function InviteList(): JSX.Element {
    const [invites, setInvites] = React.useState<ChallengeDTO[]>([]);

    const manage_button = React.useRef();

    const deleteChallenge = (challenge) => {
        del("challenges/%%", challenge.id)
            .then(() => {
                setInvites(invites.filter((c) => c.id !== challenge.id));
            })
            .catch(errorAlerter);
    };

    const user = useUser();

    const showRengoManagementPane = (challenge: ChallengeDTO) => {
        const challenge_details = popover({
            elt: (
                <RengoManagementPane
                    challenge_id={challenge.id}
                    user={user}
                    rengo_challenge_list={[challenge]}
                ></RengoManagementPane>
            ),
            below: manage_button.current,
            animate: true,
            minWidth: 180,
            container_class: "rengo-management-pane-container",
        });
    };

    React.useEffect(
        () => {
            get("me/challenges/invites", { page_size: 30 })
                .then((res) => {
                    const invite_list = dup<ChallengeDTO[]>(res.results);
                    for (const challenge of invite_list) {
                        try {
                            challenge.game.time_control_parameters = JSON.parse(
                                challenge.game.time_control_parameters as string,
                            );
                        } catch (e) {
                            console.log(e);
                        }
                    }
                    setInvites(invite_list);
                })
                .catch((err) => {
                    console.error("Error receiving invite list:", err);
                });
        },
        [] /* run once */,
    );

    /* render */
    return (
        <div className="InviteList">
            {invites.length > 0 && (
                <h2>
                    {pgettext(
                        "The list of this person's current invite-only challenges",
                        "Your Open Invites",
                    )}
                </h2>
            )}
            <div className="challenge-cards">
                {invites.map((challenge) => {
                    return (
                        <Card key={challenge.id}>
                            <div className="name-and-buttons">
                                <div className="name">
                                    <h4>{profanity_filter(challenge.game.name)}</h4>
                                    <ChallengeLinkButton uuid={challenge.uuid} />
                                </div>
                                <div className="fab-section" ref={manage_button}>
                                    {(challenge.game.rengo && null) || (
                                        <button
                                            className="primary sm"
                                            onClick={() => showRengoManagementPane(challenge)}
                                        >
                                            {challenge.challenger.id === user.id
                                                ? pgettext(
                                                      "Manage rengo teams in a challenge",
                                                      "Manage",
                                                  )
                                                : pgettext(
                                                      "Look at rengo teams in a challenge",
                                                      "View",
                                                  )}
                                        </button>
                                    )}
                                    {(challenge.challenger.id === user.id || null) && (
                                        <FabX onClick={() => deleteChallenge(challenge)} />
                                    )}
                                </div>
                            </div>
                            <div>{challenge_text_description(challenge)}</div>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
