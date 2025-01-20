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
import { useNavigate, useParams } from "react-router-dom";
import { alert } from "@/lib/swal_config";

import { _, pgettext } from "@/lib/translate";
import { get } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import * as DynamicHelp from "react-dynamic-help";
import { useUser } from "@/lib/hooks";
import { LoadingPage } from "@/components/Loading";
import { UIPush } from "@/components/UIPush";
import { EmbeddedChatCard } from "@/components/Chat";

// Spectators are intended to arrive here via an online-league spectate URL that provides
// the Online League match ID

export function OnlineLeagueSpectatorLanding(): React.ReactElement {
    const navigate = useNavigate();
    const { match_id } = useParams();

    /* State */
    const [loading, set_loading] = React.useState(true); // set to false after we have the info about that match they are joining
    const [match, set_match] = React.useState<rest_api.online_league.MatchStatus>();

    const { registerTargetItem } = React.useContext(DynamicHelp.Api);

    const { ref: spectatorWaitMessage } = registerTargetItem("spectator-wait");

    const user = useUser();
    const logged_in = !user.anonymous;

    const jumpToGame = (details: any) => {
        console.log("Jump to game?", details, match);
        if (details.matchId === match?.id) {
            console.log("yes, jumping...");
            navigate(`/game/${details.gameId}`, { replace: true });
        }
    };

    const updateWaitingStatus = (details: any) => {
        if (details.matchId === match?.id && match) {
            set_match({ ...match, black_ready: details.black, white_ready: details.white });
        }
    };

    React.useEffect(() => {
        if (!match) {
            get(`online_league/match/${match_id}`)
                .then((match: rest_api.online_league.MatchStatus) => {
                    if (match.started) {
                        navigate(`/game/${match.game}`, { replace: true });
                    }
                    set_match(match);
                    set_loading(false);
                })
                .catch((err: any) => {
                    alert.close();
                    errorAlerter(err);
                });
        } else {
            //console.log("Nothing to do in OLL useEffect", match);
        }
    }, [match]);

    /* Render */
    return (
        <div id="OnlineLeaguePlayerLanding">
            <h2>{_("Welcome to OGS!")}</h2>

            {(loading || null) && <LoadingPage />}

            {(!loading || null) && (
                <React.Fragment>
                    <h2>{match?.name}</h2>
                    <div className={"match-detail"}>
                        ({match?.league} Match {match?.id})
                    </div>
                    <div className={"match-detail"}>{_("Spectator Waiting Room")}</div>
                </React.Fragment>
            )}

            {((!loading && match) || null) && (
                <div className="unstarted-match">
                    <div ref={spectatorWaitMessage}>
                        {_("You will be taken to the game when it starts...")}
                    </div>
                    <div className="waiting-chat">
                        <EmbeddedChatCard
                            inputPlaceholderText={pgettext(
                                "place holder text in a chat channel input",
                                "Chat while you wait...",
                            )}
                            channel={`ool-landing-${match!.id}`}
                        />
                    </div>
                    {(logged_in || null) && (
                        <React.Fragment>
                            {/* can't show these unless we're logged in 'cause updates don't come */}
                            <div>
                                {_("Black: ")}
                                {match!.black_ready ? (
                                    <i className="fa fa-thumbs-up" />
                                ) : (
                                    _("waiting... ")
                                )}
                            </div>
                            <div>
                                {_("White: ")}
                                {match!.white_ready ? (
                                    <i className="fa fa-thumbs-up" />
                                ) : (
                                    _("waiting...")
                                )}
                            </div>
                        </React.Fragment>
                    )}
                    <UIPush event="online-league-game-commencement" action={jumpToGame} />
                    <UIPush event="online-league-game-waiting" action={updateWaitingStatus} />
                </div>
            )}
        </div>
    );
}
