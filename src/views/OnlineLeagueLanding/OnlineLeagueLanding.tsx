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
import { useNavigate } from "react-router-dom";
import { alert } from "swal_config";

import * as data from "data";
import { useUser } from "hooks";
import { _, pgettext } from "translate";
import { get, put } from "requests";
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
    const [match, set_match] = React.useState<rest_api.online_league.MatchStatus>(null);

    //const [linked_challenge, set_linked_challenge] = React.useState<Challenge>(null);
    //const [logging_in, set_logging_in] = React.useState<boolean>(false);

    const navigate = useNavigate();

    /* Actions */

    const signThemIn = () => {
        console.log("Helping them sign in");
        set_logging_in(true);
        data.set("pending_league_match", match);
        // Go to sign in, and come back to this page after signing in
        navigate("/sign-in#/online-league/league-player", { replace: true });
    };

    const signThemUp = () => {
        console.log("Sending them to register");
        set_logging_in(true);
        data.set("pending_league_match", match);
    };

    // ... we need to:
    //  - get the linked online league challenge
    //  - create an OGS one if this is the first person to arrive
    //  - start the game if this is the second person to arrive
    // possibly logging in or registering them along with league id along the way...

    const linked_challenge_key = new URLSearchParams(location.search).get("id");
    const side = new URLSearchParams(location.search).get("side");

    const pending_match = data.get("pending_league_match", null);

    const user = useUser();
    const logged_in = !user.anonymous;

    React.useEffect(() => {
        console.log("*** OLL effect...");
        if (logged_in && linked_challenge_key && side && !match) {
            // easiest case: they are logged in already!

            // no matter what, make sure this is clean
            // (defend against wierd user reloads, stale data whatever...)
            data.set("pending_league_match", null);

            console.log("Logged-in user arrived!  Sending PUT...");
            put(`online_league/commence?side=${side}&id=${linked_challenge_key}`, {})
                .then((match) => {
                    set_loading(false);
                    set_match(match);
                    console.log("updated match", match);
                })
                .catch((err) => {
                    alert.close();
                    errorAlerter(err);
                });
        } else if (logged_in && pending_match && !match) {
            // This means that they arrived back here after logging in...
            console.log("Logged them in, now getting on with pending match");
            set_match(pending_match);
        } else if (logged_in && match && pending_match) {
            data.set("pending_league_match", null);
            console.log("sending PUT");
            put(`online_league/commence?side=${match.side}&id=${match.player_key}`, {})
                .then((match) => {
                    set_loading(false);
                    set_match(match);
                    console.log("updated match", match);
                })
                .catch((err) => {
                    alert.close();
                    errorAlerter(err);
                });
        } else if (!logged_in && !logging_in) {
            // no matter what, make sure this is clean
            data.set("pending_league_match", null);

            if (!linked_challenge_key || !side) {
                console.log(
                    "Unexpected arrival at OnlineLeagueLanding: missing player-key/side params!",
                );
                browserHistory.push("/");
            }

            set_logging_in(true);

            // This is needed simply to display the match information on the login options page
            // It also makes it handy to store and forward the relevant information (via `data`) to use
            // when they come back afeter login.
            get(`online_league/commence?side=${side}&id=${linked_challenge_key}`)
                .then((match: rest_api.online_league.MatchStatus) => {
                    set_match(match); // contains match details for later use, and display on login options screen
                    set_loading(false); // This will cause us to ask them to log in, if necessary
                    console.log(match);
                })
                .catch((err: any) => {
                    alert.close();
                    errorAlerter(err);
                });
        } else {
            console.log("Nothing to do in OLL useEffect", logged_in, logging_in, match);
        }
    }, [match, logged_in, logging_in]);

    console.log("*** OLL render....", match);
    /* Render */
    return (
        <div id="OnlineLeagueLanding">
            <h2>
                {logged_in
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {(loading || null) && <LoadingPage />}

            {(!loading || null) && (
                <h2>
                    {match.league} Match {match.id}
                </h2>
            )}

            {((!logged_in && !loading) || null) && (
                <div className="login-options">
                    <h3>{_("You'll need to be logged in to play this match.")}</h3>
                    <span>{_("Already have an account?")}</span>
                    <button onClick={signThemIn} className="primary">
                        {_("Sign In")}
                    </button>

                    <span>
                        {pgettext(
                            "We are asking a guest if they need an OGS account (they might already have one)",
                            "Need an account?",
                        )}
                    </span>
                    <button onClick={signThemUp} className="primary">
                        {pgettext(
                            "This button takes them to the OGS registration page",
                            "Register",
                        )}
                    </button>
                </div>
            )}

            {((!loading && logged_in) || null) && (
                <div className="unstarted-match">
                    <div>{_("Waiting for your opponent...")}</div>
                </div>
            )}
        </div>
    );
}
