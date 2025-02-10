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
import { useNavigate } from "react-router-dom";
import { alert } from "@/lib/swal_config";

import * as data from "@/lib/data";
import { useUser } from "@/lib/hooks";
import { _, pgettext, interpolate } from "@/lib/translate";
import { get, put, post } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { browserHistory } from "@/lib/ogsHistory";
import { get_ebi } from "@/views/SignIn";
import cached from "@/lib/cached";

import { Card } from "@/components/material";
import { LoadingPage } from "@/components/Loading";
import { Player } from "@/components/Player";
import { ChallengeDetailsReviewPane } from "@/components/ChallengeDetailsReviewPane";

type Challenge = socket_api.seekgraph_global.Challenge;

// Users are intended to arrive here via a challenge-link URL - those point here.
// This page will display a bouncing OGS logo until the challenge given in search param is loaded.
// From there, the user can accept the game - going via login orn auto-registration if necessary.

export function ChallengeLinkLanding(): React.ReactElement {
    /* State */
    const [linked_challenge, set_linked_challenge] = React.useState<Challenge>();
    const [logging_in, set_logging_in] = React.useState<boolean>(false);

    const navigate = useNavigate();

    /* Actions */

    const doAcceptance = (challenge: Challenge) => {
        void alert.fire({
            text: pgettext(
                "Appears in a dialog while the server is responding",
                "Accepting game...",
            ),
            icon: "info",
            showCancelButton: false,
            showConfirmButton: false,
            allowEscapeKey: false,
        });

        if (challenge.rengo) {
            put(`challenges/${challenge.challenge_id}/join`, {})
                .then(() => {
                    alert.close();
                    if (challenge.invite_only) {
                        navigate("/", { replace: true });
                    } else {
                        navigate(`/play#rengo:${challenge.challenge_id}`, {
                            replace: true,
                        });
                    }
                })
                .catch((err: any) => {
                    alert.close();
                    errorAlerter(err);
                });
        } else {
            post(`challenges/${challenge.challenge_id}/accept`, {})
                .then(() => {
                    alert.close();
                    navigate(`/game/${challenge.game_id}`, { replace: true });
                })
                .catch((err) => {
                    alert.close();
                    errorAlerter(err);
                });
        }
        data.set("pending_accepted_challenge", undefined);
    };

    const accept = () => {
        if (logged_in && linked_challenge) {
            doAcceptance(linked_challenge);
        } else {
            set_logging_in(true);
            // We need to save the challenge info in this way for when we come back after logging in.
            data.set("pending_accepted_challenge", linked_challenge);
            // Go to sign in, and come back to this page ("welcome") after signing in
            navigate("/sign-in#/welcome/accepted", { replace: true });
        }
    };

    const registerAndCommence = () => {
        const new_username_root = pgettext(
            "This needs to be a no-spaces honorific for a guest user",
            "HonouredGuest",
        );

        const new_username =
            new_username_root.replace(/\s+/g, "") + Date.now().toString().slice(-6);

        post("/api/v0/register", {
            username: new_username,
            password: "",
            guest: true,
            email: "",
            ebi: get_ebi(),
        })
            .then((config) => {
                data.set(cached.config, config);
                // This is where we do the page reload required for a new registration
                data.set("pending_accepted_challenge", linked_challenge); // cleared in doAcceptance
                data.set("challenge_link_registration", linked_challenge); // cleared in HelpFlows, after triggering relevant help
                window.location.assign("/welcome/accepted");
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
                browserHistory.push("/");
            }

            if (linked_challenge_uuid && !linked_challenge) {
                get(`challenges/uu-${linked_challenge_uuid}`)
                    .then((challenge: Challenge) => {
                        if (user.anonymous || challenge.user_id !== user.id) {
                            set_linked_challenge(challenge);
                        } else {
                            // If it's their own challenge, send them back to their home page where they will see it
                            void alert
                                .fire({
                                    text: _(
                                        "It looks like you tried to accept your own challenge!",
                                    ),
                                    icon: "warning",
                                    showCancelButton: false,
                                    showConfirmButton: true,
                                    allowEscapeKey: true,
                                })
                                .finally(() => {
                                    browserHistory.push("/");
                                });
                        }
                    })
                    .catch((err) => {
                        void alert
                            .fire({
                                text: _("It appears the invite you clicked on has expired."),
                                icon: "info",
                                showCancelButton: false,
                                showConfirmButton: true,
                                allowEscapeKey: true,
                            })
                            .finally(() => {
                                console.log(err); // we're assuming the cause, this can help us check!
                                browserHistory.push("/");
                            });
                    });
            }
        }
    });

    const user = useUser();
    const logged_in = !user.anonymous;

    const game_type = linked_challenge && linked_challenge.rengo ? _("Rengo") : _("Go");

    /* Render */
    return (
        <div id="ChallengeLinkLanding">
            <h2>
                {logged_in || logging_in
                    ? "" /* this vertical space intentionally left blank! */
                    : _("Welcome to OGS!")}
            </h2>

            {((!linked_challenge && !pending_accepted_challenge) || null) && <LoadingPage />}

            {((linked_challenge && !pending_accepted_challenge) || null) && linked_challenge && (
                <>
                    <Card>
                        <div className="invitation">
                            <span className="invite-text">
                                {interpolate(
                                    pgettext(
                                        "The challenger's name and avatar appear on the next line after this",
                                        "You have been invited to a game of {{game_type}}, by",
                                    ),
                                    { game_type },
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
