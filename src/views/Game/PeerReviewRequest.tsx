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
import { format_message } from "@/components/Errcode";
import { Player } from "@/components/Player";
import type { MessageId } from "@/lib/messages";
import { errorAlerter, ignore } from "@/lib/misc";
import { alert } from "@/lib/swal_config";
import { _, interpolate, moment, pgettext } from "@/lib/translate";
import { createRequest, fetchGameRequestStatus, requestAction } from "@/views/PeerReview/api";
import type { GameRequestStatus } from "@/views/PeerReview/types";
import { usePeerReviewAvailability } from "@/views/PeerReview/usePeerReviewAvailability";
import { WaitTime } from "@/views/PeerReview/WaitTime";
import "./PeerReviewRequest.css";

interface PeerReviewRequestProps {
    gameId: number;
}

/** On a finished game: the request button, or the player's request status with withdraw and the review link. */
export function PeerReviewRequest({ gameId }: PeerReviewRequestProps): React.ReactElement | null {
    const { available } = usePeerReviewAvailability();
    const [status, setStatus] = React.useState<GameRequestStatus | null>(null);

    const load = React.useCallback(() => {
        fetchGameRequestStatus(gameId).then(setStatus).catch(ignore);
    }, [gameId]);

    React.useEffect(() => {
        if (available) {
            load();
        }
    }, [available, load]);

    if (!available || !status) {
        return null;
    }

    const request = () => {
        alert
            .fire({ text: _("Request a peer review of this game?"), showCancelButton: true })
            .then(({ value: accept }) => {
                if (accept) {
                    createRequest(gameId).then(load).catch(errorAlerter);
                }
            })
            .catch(ignore);
    };
    const withdraw = () => {
        if (!status.request) {
            return;
        }
        const id = status.request.id;
        const doWithdraw = () => {
            requestAction(id, "withdraw").then(load).catch(errorAlerter);
        };
        if (status.request.state !== "claimed") {
            doWithdraw();
            return;
        }
        alert
            .fire({
                text: _("A reviewer is working on this request. Withdraw it anyway?"),
                showCancelButton: true,
            })
            .then(({ value: accept }) => {
                if (accept) {
                    doWithdraw();
                }
            })
            .catch(ignore);
    };

    const req = status.request;
    if (req && (req.state === "open" || req.state === "claimed")) {
        return (
            <div className="PeerReviewRequest">
                {req.state === "open" ? (
                    <span>
                        {pgettext("Peer review request status", "Peer review requested")}{" "}
                        <WaitTime since={req.created} />
                    </span>
                ) : (
                    <span>
                        {pgettext("Peer review request status", "Being reviewed by")}{" "}
                        {req.reviewer && <Player user={req.reviewer} rank disableCacheUpdate />}
                    </span>
                )}
                <button onClick={withdraw}>
                    {pgettext("Withdraw a peer review request", "Withdraw")}
                </button>
            </div>
        );
    }
    if (req && req.state === "submitted") {
        return (
            <div className="PeerReviewRequest">
                {req.review_id ? (
                    <Link to={`/review/${req.review_id}`}>{_("Peer review ready")}</Link>
                ) : (
                    <span>{_("Peer review removed")}</span>
                )}
            </div>
        );
    }
    if (status.may_request) {
        return (
            <div className="PeerReviewRequest">
                <button className="primary" onClick={request}>
                    {pgettext("Button on a finished game", "Request peer review")}
                </button>
            </div>
        );
    }
    const reason =
        status.reason === "peer_review_cooldown" && status.cooldown_until
            ? interpolate(_("You can request another peer review {{when}}"), {
                  when: moment(status.cooldown_until).fromNow(),
              })
            : status.reason
              ? format_message({ message_id: status.reason as MessageId })
              : null;
    return reason ? <div className="PeerReviewRequest reason">{reason}</div> : null;
}
