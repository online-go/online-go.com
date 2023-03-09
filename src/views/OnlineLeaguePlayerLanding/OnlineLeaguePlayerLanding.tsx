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
import { useNavigate, useLocation } from "react-router-dom";
import { alert } from "swal_config";

import * as DynamicHelp from "react-dynamic-help";

import * as data from "data";
import { useUser } from "hooks";
import { _, pgettext } from "translate";
import { get, put } from "requests";
import { errorAlerter } from "misc";
import { browserHistory } from "ogsHistory";

import { LoadingPage } from "Loading";
import { UIPush } from "UIPush";
import { EmbeddedChatCard } from "Chat";

// Users are intended to arrive here via an online-league player invite URL
// They need to have a valid key in that URL.  The assumption is that only the
// correct user has been given the key.

// They get to chat to each other here, in a dedicated channel, and mutually agree when to start.

export function OnlineLeaguePlayerLanding(): JSX.Element {
    const { search: urlparams } = useLocation();

    /* State */
    const [loading, set_loading] = React.useState(true); // set to false after we have the info about that match they are joining
    const [logging_in, set_logging_in] = React.useState<boolean>(false);
    const [im_ready, set_im_ready] = React.useState(false);

    const [match, set_match] = React.useState<rest_api.online_league.MatchStatus>(null);

    const [linked_challenge_key, set_linked_challenge_key] = React.useState(
        new URLSearchParams(urlparams).get("id"),
    );

    const [side, set_side] = React.useState(new URLSearchParams(urlparams).get("side"));

    const navigate = useNavigate();

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: readyButton, used: signalReadyPressed } = registerTargetItem("ready-button");
    const { ref: notReadyButton, used: signalNotReadyPressed } =
        registerTargetItem("not-ready-button");

    // ... we need to:
    //  - get the linked online league match
    //  - tell the server when this player is ready
    // possibly logging in or registering them along with league id along the way...

    const pending_match = data.get("pending_league_match", null);

    const user = useUser();
    const logged_in = !user.anonymous;

    const signThemIn = () => {
        console.log("Helping them sign in");
        data.set("pending_league_match", { ...match, side: side, key: linked_challenge_key });
        // Go to sign in, and come back to this page after signing in
        navigate("/sign-in#/online-league/league-player", { replace: true });
    };

    const signThemUp = () => {
        console.log("Sending them to register");
        data.set("pending_league_match", { ...match, side: side, key: linked_challenge_key });
        navigate("/register#/online-league/league-player", { replace: true });
    };

    const toggleReadiness = () => {
        if (!im_ready) {
            signalReadyPressed();
        } else {
            signalNotReadyPressed();
        }

        put(`online_league/commence?side=${side}&id=${linked_challenge_key}&ready=${!im_ready}`, {})
            .then((matchStatus) => {
                if (matchStatus.started) {
                    console.log("OOL game started!", matchStatus);
                    navigate(`/game/${matchStatus.game}`, { replace: true });
                } else {
                    set_match(matchStatus);
                    console.log("updated match", matchStatus);
                }
            })
            .catch((err) => {
                // Note: some expected use-cases come through here, including a person trying to use the link of a cancelled game
                // The server is expected to provide a sensible error message in those cases.
                alert.close();
                errorAlerter(err);
                navigate("/", { replace: true });
            });

        set_im_ready(!im_ready);
    };

    const jumpToGame = (details) => {
        console.log("Jump to game?", details, match);
        if (details.matchId === match.id) {
            console.log("yes, jumping...");
            navigate(`/game/${details.gameId}`, { replace: true });
        }
    };

    const updateWaitingStatus = (details) => {
        if (details.matchId === match.id) {
            set_match({ ...match, black_ready: details.black, white_ready: details.white });
        }
    };

    React.useEffect(() => {
        // First, see if they arrived back here after we sent them off to log in...
        // ... in which case restore all the info...
        if (logged_in && pending_match && !match) {
            console.log("Logged them in, now getting on with pending match");
            set_match(pending_match);
            set_logging_in(false);
            set_loading(false);
            set_side(pending_match.side);
            set_linked_challenge_key(pending_match.key);
            data.set("pending_league_match", null);
        } else if (!match) {
            if (!linked_challenge_key || !side) {
                console.log(
                    "Unexpected arrival at OnlineLeagueLanding: missing player-key/side params!",
                );
                browserHistory.push("/");
            } else {
                // no matter what, make sure this is clean
                data.set("pending_league_match", null);

                // If they're not logged in, we have to get them logged in before doing anything else
                if (!logged_in && !logging_in) {
                    set_logging_in(true);
                }

                get(`online_league/commence?side=${side}&id=${linked_challenge_key}`)
                    .then((match: rest_api.online_league.MatchStatus) => {
                        set_match(match); // contains match details for later use, and display on login-options screen
                        set_loading(false); // This will cause us to ask them to log in, if necessary
                        set_im_ready(side === "black" ? match.black_ready : match.white_ready);
                    })
                    .catch((err: any) => {
                        alert.close();
                        errorAlerter(err);
                    });
            }
        } else {
            //console.log("Nothing to do in OLL useEffect", logged_in, logging_in, match);
        }
    }, [match, logged_in, logging_in]);

    /* Render */
    return (
        <div id="OnlineLeaguePlayerLanding">
            <h2>
                {logged_in
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {(loading || null) && <LoadingPage />}

            {(!loading || null) && (
                <React.Fragment>
                    <h2>{match.name}</h2>
                    <div className={"match-detail"}>
                        ({match.league} Match {match.id})
                    </div>
                </React.Fragment>
            )}

            {((!logged_in && !loading) || null) && (
                <div className="login-options">
                    <h3>{_("You'll need to be logged in to play this match.")}</h3>
                    <span>
                        {pgettext(
                            "This text is next to a `login` button - if they already have an account, they should log in.",
                            "Already have an account?",
                        )}
                    </span>
                    <button onClick={signThemIn} className="primary">
                        {pgettext("This is the text on a `login` button", "Sign In")}
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

            {((!loading && logged_in && match) || null) && (
                <div className="unstarted-match">
                    <button
                        onClick={toggleReadiness}
                        className={im_ready ? "info" : "primary"}
                        ref={im_ready ? notReadyButton : readyButton}
                    >
                        {im_ready
                            ? pgettext(
                                  "This is on a button they can press to indicate they're not ready to play",
                                  "Wait, I'm not ready!",
                              )
                            : pgettext(
                                  "This is on a button they can press to indicate they are ready for the game to start",
                                  "I'm Ready",
                              )}
                    </button>
                    <div className="waiting-chat">
                        <EmbeddedChatCard
                            inputPlaceholdertText={pgettext(
                                "place holder text in a chat channel input",
                                "Chat while you wait...",
                            )}
                            channel={`ool-landing-${match.id}`}
                        />
                    </div>
                    <div>
                        {_("Black: ")}
                        {match.black_ready ? <i className="fa fa-thumbs-up" /> : _("waiting... ")}
                        {`${
                            side === "black"
                                ? pgettext(
                                      "this text is added after `waiting...` to indicate it's about the user",
                                      " (you)",
                                  )
                                : ""
                        }`}
                    </div>
                    <div>
                        {_("White: ")}
                        {match.white_ready ? <i className="fa fa-thumbs-up" /> : _("waiting...")}
                        {`${
                            side === "white"
                                ? pgettext(
                                      "this text is added after `waiting...` to indicate it's about the user",
                                      " (you)",
                                  )
                                : ""
                        }`}
                    </div>
                    <UIPush event="online-league-game-commencement" action={jumpToGame} />
                    <UIPush event="online-league-game-waiting" action={updateWaitingStatus} />
                </div>
            )}
        </div>
    );
}
