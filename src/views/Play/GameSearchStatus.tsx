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
import { _, interpolate, npgettext, pgettext } from "@/lib/translate";
import { automatch_manager, AutomatchPreferences } from "@/lib/automatch_manager";
import { del } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { Card } from "@/components/material";
import { timeControlSystemText } from "@/components/TimeControl";
import { useCorrespondenceAutomatchers, useOwnLiveChallenge } from "./hooks";
import "./GameSearchStatus.css";

function correspondenceRequestSummary(request: AutomatchPreferences): string {
    const options = request.size_speed_options.filter((opt) => opt.speed === "correspondence");
    const sizes = [...new Set(options.map((opt) => opt.size))].join(", ");
    const systems = [...new Set(options.map((opt) => timeControlSystemText(opt.system)))].join(
        ", ",
    );
    const ranks = interpolate(
        pgettext(
            "Opponent rank range of a correspondence automatch request, relative to the player's rank",
            "Opponent rank: -{{lower}} to +{{upper}}",
        ),
        { lower: request.lower_rank_diff, upper: request.upper_rank_diff },
    );

    return [sizes, systems, ranks].filter((part) => part).join(" · ");
}

/** Shows the searches the player is waiting on that the play buttons do not
 * already show: their own open live custom game and their correspondence
 * automatch requests. Renders nothing when there are none. */
export function GameSearchStatus(): React.ReactElement | null {
    const own_live_challenge = useOwnLiveChallenge();
    const correspondence_requests = useCorrespondenceAutomatchers();

    if (!own_live_challenge && correspondence_requests.length === 0) {
        return null;
    }

    return (
        <div className="GameSearchStatus" role="status">
            {own_live_challenge && (
                <Card className="search-status-card">
                    <div className="search-status-row">
                        <div className="search-status-text">
                            <div className="search-status-title">
                                {own_live_challenge.rengo
                                    ? pgettext(
                                          "The player created a live rengo game and it has not started yet",
                                          "Waiting for players to join your rengo game",
                                      )
                                    : pgettext(
                                          "The player created a live custom game and nobody has joined it yet",
                                          "Waiting for an opponent to accept your custom game",
                                      )}
                            </div>
                            <div className="search-status-note">
                                {pgettext(
                                    "Why the play buttons are disabled while the player has an open live custom game",
                                    "Cancel it to start a different game.",
                                )}
                            </div>
                        </div>
                        <button
                            className="danger sm"
                            onClick={() => {
                                del(`challenges/${own_live_challenge.challenge_id}`).catch(
                                    errorAlerter,
                                );
                            }}
                        >
                            {pgettext("Cancel challenge", "Cancel")}
                        </button>
                    </div>
                </Card>
            )}

            {correspondence_requests.length > 0 && (
                <Card className="search-status-card">
                    <div className="search-status-title">
                        {npgettext(
                            "Header above the player's correspondence automatch requests",
                            "Searching for a correspondence game",
                            "Searching for correspondence games",
                            correspondence_requests.length,
                        )}
                    </div>
                    <div className="search-status-note">
                        {_(
                            "This can take several minutes. You will be notified when your match has been found.",
                        )}
                    </div>
                    {correspondence_requests.map((request) => (
                        <div className="search-status-row" key={request.uuid}>
                            <span className="search-status-summary">
                                {correspondenceRequestSummary(request)}
                            </span>
                            <button
                                className="danger sm"
                                onClick={() => automatch_manager.cancel(request.uuid)}
                            >
                                {pgettext("Cancel automatch", "Cancel")}
                            </button>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    );
}
