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
import * as data from "data";
import { _, pgettext } from "translate";
import { get } from "requests";

import { SvgBouncer } from "SvgBouncer";
import { Card } from "material";

import { ChallengeDetailsReviewPane } from "ChallengeDetailsReviewPane";

import { Player } from "Player";
/*
import { LineText } from "misc-ui";
import { errorAlerter, ignore } from "misc";
*/

type Challenge = socket_api.seekgraph_global.Challenge;

// Users are intended to arrive here via a challenge-link URL - those point here.

export function ChallengeLinkLanding(): JSX.Element {
    const user = data.get("user");
    const logged_in = !user.anonymous;

    /* State */
    const [linked_challenge, set_linked_challenge] = React.useState<Challenge>(null);

    const linked_challenge_uuid = new URLSearchParams(location.search).get("linked-challenge");

    if (linked_challenge_uuid && !linked_challenge) {
        get(`challenges/uu-${linked_challenge_uuid}`)
            .then((challenge) => {
                set_linked_challenge(challenge);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    /* Render */
    return (
        <div id="ChallengeLinkLanding">
            {logged_in ? "" : <h2>{_("Welcome to OGS!")}</h2>}

            {(linked_challenge || null) && (
                <Card>
                    <div className="invitation">
                        <span className="invite-text">
                            {pgettext(
                                "The challenger's name and avatar appear on the next line after this",
                                "You have been invited to a game of Go, by",
                            )}
                        </span>
                        <Player icon iconSize={32} user={linked_challenge.user_id} />
                    </div>
                    <hr />
                    <ChallengeDetailsReviewPane challenge={linked_challenge} />
                </Card>
            )}

            {(!linked_challenge || null) && <SvgBouncer />}
        </div>
    );
}
