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
// import { useNavigate } from "react-router-dom";
import { alert } from "swal_config";

//import * as data from "data";
import { useUser } from "hooks";
import { _ } from "translate";
import { get } from "requests";
import { errorAlerter } from "misc";
import { browserHistory } from "ogsHistory";
// import { get_ebi } from "SignIn";
// import cached from "cached";

//import { Card } from "material";
import { LoadingPage } from "Loading";
//import { Player } from "Player";

// type Challenge = socket_api.seekgraph_global.Challenge;

// Users are intended to arrive here via an online-league player invite URL

export function OnlineLeagueLanding(): JSX.Element {
    /* State */
    const [loading, set_loading] = React.useState(true);
    const [logging_in, set_logging_in] = React.useState<boolean>(false);
    const [match, set_match] = React.useState<rest_api.MatchDetails>(null);

    //const [linked_challenge, set_linked_challenge] = React.useState<Challenge>(null);
    //const [logging_in, set_logging_in] = React.useState<boolean>(false);

    //const navigate = useNavigate();

    /* Actions */

    // ... we need to:
    //  - get the linked online league challenge
    //  - create an OGS one if this is the first person to arrive
    //  - start the game if this is the second person to arrive
    // possibly logging in or registering them along with league id along the way...

    const linked_challenge_key = new URLSearchParams(location.search).get("id");
    const side = new URLSearchParams(location.search).get("side");
    //const pending_accepted_challenge = data.get("pending_accepted_challenge");

    React.useEffect(
        () => {
            if (!linked_challenge_key) {
                console.log(
                    "Unexpected arrival at online league landing, without linked challenge player key!",
                );
                browserHistory.push("/");
            }

            get(`online_league/commence?side=${side}&id=${linked_challenge_key}`)
                .then((match: rest_api.MatchDetails) => {
                    set_match(match);
                    set_loading(false);
                    set_logging_in(true);
                    console.log(match);
                })
                .catch((err: any) => {
                    alert.close();
                    errorAlerter(err);
                });
        },
        [
            /* once */
        ],
    );

    const user = useUser();
    const logged_in = !user.anonymous;

    /* Render */
    return (
        <div id="OnlineLeagueLanding">
            <h2>
                {logged_in || logging_in
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {(loading || null) && <LoadingPage />}

            {(!loading || null) && (
                <div className="unstarted-match">
                    <h2>
                        {match.league} Match {match.id}
                    </h2>
                    <div>{_("Waiting for your opponent...")}</div>
                </div>
            )}
        </div>
    );
}
