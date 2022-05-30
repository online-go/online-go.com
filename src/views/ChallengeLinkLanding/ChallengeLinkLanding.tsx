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
import swal from "sweetalert2";
import * as data from "data";
import { _, pgettext } from "translate";
import { get, post } from "requests";
import { errorAlerter } from "misc";
import { browserHistory } from "ogsHistory";

import { SvgBouncer } from "SvgBouncer";
import { Card } from "material";

import { Register } from "Register";
import { Player } from "Player";

import { ChallengeDetailsReviewPane } from "ChallengeDetailsReviewPane";

type Challenge = socket_api.seekgraph_global.Challenge;

// Users are intended to arrive here via a challenge-link URL - those point here.
// This page will display a bouncing OGS logo until the challenge given in search param is loaded.
// From there, the user can accept the game - going via login or registration if necessary.

export function ChallengeLinkLanding(): JSX.Element {
    const user = data.get("user");
    const logged_in = !user.anonymous;

    /* State */
    const [linked_challenge, set_linked_challenge] = React.useState<Challenge>(null);
    const [ask_to_login, set_ask_to_login] = React.useState<boolean>(false);

    /* Actions */

    const doAcceptance = () => {
        swal({
            text: "Accepting game...",
            type: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        }).catch(swal.noop);

        post("challenges/%%/accept", linked_challenge.challenge_id, {})
            .then(() => {
                swal.close();
                browserHistory.push(`/game/${linked_challenge.game_id}`);
            })
            .catch((err) => {
                swal.close();
                errorAlerter(err);
            });
    };

    const accept = () => {
        if (logged_in) {
            doAcceptance();
        } else {
            set_ask_to_login(true);
        }
    };

    /* Display Logic */

    // ... we need to get the linked challenge, then display it, then have them accept it,
    // possibly logging in or registering along the way...

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
            <h2>
                {logged_in || ask_to_login
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {(!linked_challenge || null) && <SvgBouncer />}

            {((linked_challenge && !ask_to_login) || null) && (
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
                    <hr />
                    <div className="buttons">
                        <button onClick={accept} className="primary">
                            {_("Accept Game")}
                        </button>
                    </div>
                </Card>
            )}

            {(ask_to_login || null) && (
                <>
                    <span>
                        {pgettext(
                            "The person has to chose to register or log in before commencing a game they just accepted",
                            "Please register or sign in, to commence your game!",
                        )}
                    </span>
                    <Register no_header after_registration={doAcceptance} />
                </>
            )}
        </div>
    );
}
