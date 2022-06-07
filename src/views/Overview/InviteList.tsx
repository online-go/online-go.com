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

import { profanity_filter } from "profanity_filter";
import { challenge_text_description } from "ChallengeModal";

import { Card } from "material";
import { FabX } from "material";

import { ChallengeLinkButton } from "ChallengeLinkButton";

export function InviteList(): JSX.Element {
    const [invites, setInvites] = React.useState([]);

    const deleteChallenge = (challenge) => {
        del("challenges/%%", challenge.id)
            .then(() => {
                setInvites(invites.filter((c) => c.id !== challenge.id));
            })
            .catch(errorAlerter);
    };

    React.useEffect(
        () => {
            get("me/challenges/invites", { page_size: 30 })
                .then((res) => {
                    for (const challenge of res.results) {
                        try {
                            challenge.game.time_control_parameters = JSON.parse(
                                challenge.game.time_control_parameters,
                            );
                        } catch (e) {
                            console.log(
                                "parse error - ignoring, assuming it means we already converted this one",
                            );
                        }
                    }
                    setInvites(res.results);
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
                                <div className="fab-section">
                                    <FabX onClick={() => deleteChallenge(challenge)} />
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
