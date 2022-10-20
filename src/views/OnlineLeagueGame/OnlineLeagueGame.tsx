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
import { useNavigate, useParams, Link } from "react-router-dom";
import { alert } from "swal_config";

import { _, interpolate } from "translate";
import { get } from "requests";
import { errorAlerter } from "misc";
import { useUser } from "hooks";

import { LoadingPage } from "Loading";
import { UIPush } from "UIPush";

// Users are intended to arrive here via an online-league spectate URL that provides
// the Online League challenge ID

export function OnlineLeagueGame(): JSX.Element {
    const navigate = useNavigate();
    const { game_id: linked_challenge_id } = useParams();

    /* State */
    const [loading, set_loading] = React.useState(true);
    const [target_match, set_target_match] =
        React.useState<rest_api.online_league.MatchDetails>(null);

    const jumpToGame = (details) => {
        console.log("OOL Game started...", details);
        const { matchId, gameId } = details;
        if (matchId === target_match.id) {
            navigate(`/game/${gameId}`, { replace: true });
        } else {
            console.log("... but it's not the one we're after.");
        }
    };

    /* Fetch related game info */
    React.useEffect(
        () => {
            get(`online_league/match/${linked_challenge_id}`)
                .then((match: rest_api.online_league.MatchDetails) => {
                    if (match.game && match.started) {
                        navigate(`/game/${match.game}`, { replace: true });
                    } else {
                        set_target_match(match);
                        console.log("Watching for", match);
                        set_loading(false);
                    }
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
        <div id="OnlineLeagueGame">
            {(loading || null) && <LoadingPage />}
            {(!loading || null) && (
                <div className="unstarted-match">
                    <h2>
                        {target_match.league} Match {target_match.id}
                    </h2>
                    <div>{_("That game hasn't started yet!")}</div>
                    <div>{_("... stay on this page to be taken to the game when it starts.")}</div>
                    <LoadingPage slow /> {/* persuade them that there is life :) */}
                    <UIPush event="online-league-game-commencement" action={jumpToGame} />
                    {(!logged_in || null) && (
                        <div className="membership-drive">
                            <Link to={`/sign-in#${window.location.pathname}`}>
                                {_("Log in or sign up")}
                            </Link>
                            <span>
                                {interpolate(
                                    _("{{login}} to be taken to the game when it starts"),
                                    { login: "" },
                                )}
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
