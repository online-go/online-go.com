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
import { PaginatedTable } from "@/components/PaginatedTable";
import { Player } from "@/components/Player";
import { ignore } from "@/lib/misc";
import { _, moment, pgettext } from "@/lib/translate";
import { markFeedbackDelivered } from "./api";
import { RequestRankCell } from "./RequestRankCell";
import { StarRating } from "./StarRating";
import type { CompletedReview } from "./types";
import "./CompletedReviewsSection.css";

/** The reviewer's submitted reviews with the requester's rating and private text. Rendering undelivered feedback delivers it. */
export function CompletedReviewsSection(): React.ReactElement {
    const delivered = React.useRef<Set<number>>(new Set());
    const groom = (rows: CompletedReview[]) => {
        for (const r of rows) {
            if (r.feedback && !r.feedback.delivered && !delivered.current.has(r.id)) {
                delivered.current.add(r.id);
                markFeedbackDelivered(r.id).catch(ignore);
            }
        }
        return rows;
    };
    return (
        <div className="CompletedReviewsSection">
            <h3>
                {pgettext("Heading over a reviewer's finished peer reviews", "Completed reviews")}
            </h3>
            <PaginatedTable
                className="completed-reviews-table"
                name="peer-review-completed"
                method="GET"
                source="peer_review/reviewers/me/completed"
                pageSizeOptions={[10, 25]}
                groom={groom}
                columns={[
                    {
                        header: _("Date"),
                        className: () => "date",
                        render: (r: CompletedReview) =>
                            r.submitted_at ? moment(r.submitted_at).format("YYYY-MM-DD") : "",
                    },
                    {
                        header: _("Requester"),
                        className: () => "player",
                        render: (r: CompletedReview) => (
                            <>
                                <RequestRankCell
                                    rank={r.requester_rank}
                                    provisional={r.requester_provisional}
                                />{" "}
                                <Player user={r.requester} disableCacheUpdate />
                            </>
                        ),
                    },
                    {
                        header: _("Review"),
                        className: () => "review",
                        render: (r: CompletedReview) =>
                            r.review_id ? (
                                <Link to={`/review/${r.review_id}`}>{r.game.name}</Link>
                            ) : (
                                <span>{r.game.name}</span>
                            ),
                    },
                    {
                        header: pgettext("Column: the requester's rating of the review", "Rating"),
                        className: () => "rating",
                        render: (r: CompletedReview) =>
                            !r.feedback ? (
                                <span className="muted">{_("Awaiting feedback")}</span>
                            ) : r.feedback.none_provided ? (
                                <span className="muted">{_("No feedback given")}</span>
                            ) : (
                                <>
                                    <StarRating value={r.feedback.score} readOnly />
                                    {r.feedback.text && (
                                        <div className="text">{r.feedback.text}</div>
                                    )}
                                </>
                            ),
                    },
                ]}
            />
        </div>
    );
}
