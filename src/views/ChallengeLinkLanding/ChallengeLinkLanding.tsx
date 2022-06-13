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
import swal from "sweetalert2";
import * as data from "data";
import { useUser } from "hooks";
import { _, pgettext } from "translate";
import { get, put, post } from "requests";
import { errorAlerter } from "misc";
import { browserHistory } from "ogsHistory";
import { get_ebi } from "SignIn";
import cached from "cached";
import * as dynamic_help from "dynamic_help_config";
import { Card } from "material";
import { LoadingPage } from "Loading";
import { Player } from "Player";
import { ChallengeDetailsReviewPane } from "ChallengeDetailsReviewPane";

type Challenge = socket_api.seekgraph_global.Challenge;

// Users are intended to arrive here via a challenge-link URL - those point here.
// This page will display a bouncing OGS logo until the challenge given in search param is loaded.
// From there, the user can accept the game - going via login orn auto-registration if necessary.

export function ChallengeLinkLanding(): JSX.Element {
    /* State */
    const [linked_challenge, set_linked_challenge] = React.useState<Challenge>(null);
    const [logging_in, set_logging_in] = React.useState<boolean>(false);

    const navigate = useNavigate();

    /* Actions */

    const doAcceptance = (challenge: Challenge) => {
        swal({
            text: pgettext(
                "Appears in a dialog while the server is responding",
                "Accepting game...",
            ),
            type: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        }).catch(swal.noop);

        if (challenge.rengo) {
            put("challenges/%%/join", challenge.challenge_id, {})
                .then(() => {
                    swal.close();
                    if (challenge.invite_only) {
                        navigate("/", { replace: true });
                    } else {
                        navigate(`/play#rengo:${challenge.challenge_id}`, { replace: true });
                    }
                    // TBD: activate help item to tell newcomers when the game will actually start
                })
                .catch((err: any) => {
                    swal.close();
                    errorAlerter(err);
                });
        } else {
            post("challenges/%%/accept", challenge.challenge_id, {})
                .then(() => {
                    swal.close();
                    browserHistory.push(`/game/${challenge.game_id}`);
                })
                .catch((err) => {
                    swal.close();
                    errorAlerter(err);
                });
        }
        data.set("pending_accepted_challenge", null);
    };

    const accept = () => {
        if (logged_in) {
            doAcceptance(linked_challenge);
        } else {
            set_logging_in(true);
            // We need to save the challenge info in this way for when we come back after logging in.
            data.set("pending_accepted_challenge", linked_challenge);
            navigate("/sign-in#/welcome/accepted", { replace: true });
        }
    };

    const registerAndCommence = () => {
        const new_username_root = pgettext(
            "This needs to be a no-spaces honorific for a guest user",
            "HonouredGuest",
        );
        // naively uniquify... 6 lsbs of epoch... good enough?
        const new_username =
            new_username_root.replace(/\s+/g, "") + Date.now().toString().slice(-6);

        const initial_password = Date.now().toString(); // They will have to change this, so anything random & unique is OK

        post("/api/v0/register", {
            username: new_username,
            password: initial_password,
            email: "",
            ebi: get_ebi(),
        })
            .then((config) => {
                data.set(cached.config, config);

                dynamic_help.showHelpSet("guest-password-help-set"); // turns on the whole set

                // need to turn these off manually here, because we turn these ones on later...
                dynamic_help.hideHelpSetItem("guest-password-help-set", "username-change-help");
                dynamic_help.hideHelpSetItem(
                    "guest-password-help-set",
                    "profile-button-username-help",
                );
                dynamic_help.hideHelpSetItem(
                    "guest-password-help-set",
                    "profile-page-username-help",
                );

                doAcceptance(linked_challenge);
            })
            // note - no handling at the moment for the hopefully madly-unlikely duplicate username,
            // we just crash and burn here in that case, like any other error.

            .catch((err) => {
                if (err.responseJSON && err.responseJSON.error_code === "banned") {
                    data.set("appeals.banned_user_id", err.responseJSON.banned_user_id);
                    data.set("appeals.jwt", err.responseJSON.jwt);
                    data.set("appeals.ban-reason", err.responseJSON.ban_reason);
                    window.location.pathname = "/appeal";
                    return;
                }

                if (err.responseJSON) {
                    console.log(err.responseJSON);
                    if (err.responseJSON.firewall_action === "COLLECT_VPN_INFORMATION") {
                        window.location.pathname = "/blocked-vpn";
                    } else {
                        errorAlerter(err);
                    }
                } else {
                    errorAlerter(err);
                }
            });
    };

    // ... we need to get the linked challenge, then display it, then have them accept it,
    // possibly logging in or registering them as guest along the way...

    const linked_challenge_uuid = new URLSearchParams(location.search).get("linked-challenge");
    const pending_accepted_challenge = data.get("pending_accepted_challenge");
    const already_accepted = location.pathname.includes("accepted");

    React.useEffect(() => {
        if (already_accepted) {
            if (pending_accepted_challenge) {
                doAcceptance(pending_accepted_challenge);
            }
        } else {
            if (!linked_challenge_uuid) {
                console.log("Unexpected arrival at Welcome, without linked challenge id!");
                window.location.pathname = "/";
            }

            if (linked_challenge_uuid && !linked_challenge) {
                get(`challenges/uu-${linked_challenge_uuid}`)
                    .then((challenge: Challenge) => {
                        if (user.anonymous || challenge.user_id !== user.id) {
                            set_linked_challenge(challenge);
                        } else {
                            // If it's their own challenge, send them back to their home page where they will see it
                            window.location.pathname = "/";
                        }
                    })
                    .catch((err) => {
                        console.log(err);
                        window.location.pathname = "/";
                    });
            }
        }
    });

    const user = useUser();
    const logged_in = !user.anonymous;

    /* Render */
    return (
        <div id="ChallengeLinkLanding">
            <h2>
                {logged_in || logging_in
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {((!linked_challenge && !pending_accepted_challenge) || null) && <LoadingPage />}

            {((linked_challenge && !pending_accepted_challenge) || null) && (
                <>
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
                            {(logged_in || null) && (
                                <button onClick={accept} className="primary">
                                    {_("Accept Game")}
                                </button>
                            )}
                            {(!logged_in || null) && (
                                <>
                                    <button onClick={registerAndCommence} className="primary">
                                        {_("Accept Game")}
                                    </button>
                                    <span>
                                        {pgettext(
                                            "This text is next to the accept game button for someone who is not logged in",
                                            "and play as a Guest",
                                        )}
                                    </span>
                                </>
                            )}
                        </div>
                    </Card>
                    {(!logged_in || null) && (
                        <>
                            <span>Already have an account?</span>
                            <button onClick={accept} className="primary">
                                {_("Sign In")}
                            </button>
                            <span>
                                {pgettext(
                                    "this label is next to the 'sign in' button when a guest is accepting a challenge from a link",
                                    "and accept game",
                                )}
                            </span>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
