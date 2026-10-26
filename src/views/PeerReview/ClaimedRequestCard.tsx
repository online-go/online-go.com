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
import { Link } from "react-router-dom";
import { Player } from "@/components/Player";
import { durationString } from "@/components/TimeControl";
import { errorAlerter } from "@/lib/misc";
import { _, interpolate, pgettext } from "@/lib/translate";
import { requestAction } from "./api";
import { RequestRankCell } from "./RequestRankCell";
import type { PeerReviewRequest } from "./types";
import "./ClaimedRequestCard.css";

interface ClaimedRequestCardProps {
    request: PeerReviewRequest;
    onChanged: () => void;
}

/** One request the reviewer holds: time left, the review link, release and submit. */
export function ClaimedRequestCard({
    request,
    onChanged,
}: ClaimedRequestCardProps): React.ReactElement {
    const [busy, setBusy] = React.useState(false);
    const secondsLeft = request.claim_deadline
        ? Math.max(0, Math.floor((new Date(request.claim_deadline).getTime() - Date.now()) / 1000))
        : 0;
    const act = (action: "release" | "submit") => {
        setBusy(true);
        requestAction(request.id, action)
            .then(onChanged)
            .catch(errorAlerter)
            .finally(() => setBusy(false));
    };
    return (
        <div className="ClaimedRequestCard">
            <div className="who">
                <RequestRankCell
                    rank={request.requester_rank}
                    provisional={request.requester_provisional}
                />{" "}
                <Player user={request.requester} disableCacheUpdate />
            </div>
            <div className="game">
                <Link to={`/game/${request.game.id}`}>{request.game.name}</Link>
            </div>
            <div className="deadline">
                {secondsLeft > 0
                    ? interpolate(_("{{time_left}} left"), {
                          time_left: durationString(secondsLeft),
                      })
                    : _("Deadline passed")}
            </div>
            <div className="buttons">
                {request.review_id && (
                    <Link to={`/review/${request.review_id}`}>
                        {pgettext("Open the OGS review for a claimed request", "Open review")}
                    </Link>
                )}
                <button disabled={busy} onClick={() => act("release")}>
                    {pgettext("Give a claimed request back to the queue", "Release")}
                </button>
                <button className="primary" disabled={busy} onClick={() => act("submit")}>
                    {pgettext("Mark a peer review as finished", "Submit")}
                </button>
            </div>
        </div>
    );
}
