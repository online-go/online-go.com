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
import { _, moment, pgettext } from "@/lib/translate";
import { RequestRankCell } from "./RequestRankCell";
import type { PeerReviewRequest } from "./types";
import "./FinishedTab.css";

type FinishedOrder =
    | "-submitted_at"
    | "submitted_at"
    | "-reviewer_rank_at_submit"
    | "reviewer_rank_at_submit";

/** The archive of submitted reviews, with a toggle between completion time and reviewer rank. */
export function FinishedTab(): React.ReactElement {
    const [order, setOrder] = React.useState<FinishedOrder>("-submitted_at");
    const flip = (asc: FinishedOrder, desc: FinishedOrder) => setOrder(order === desc ? asc : desc);

    return (
        <div className="FinishedTab">
            <div className="sort-controls">
                <button
                    className={order.endsWith("submitted_at") ? "primary" : ""}
                    onClick={() => flip("submitted_at", "-submitted_at")}
                >
                    {_("Most recent")}
                    {order === "submitted_at" ? " ↑" : order === "-submitted_at" ? " ↓" : ""}
                </button>
                <button
                    className={order.endsWith("reviewer_rank_at_submit") ? "primary" : ""}
                    onClick={() => flip("reviewer_rank_at_submit", "-reviewer_rank_at_submit")}
                >
                    {pgettext("Sort finished peer reviews by reviewer rank", "Reviewer rank")}
                    {order === "reviewer_rank_at_submit"
                        ? " ↑"
                        : order === "-reviewer_rank_at_submit"
                          ? " ↓"
                          : ""}
                </button>
            </div>
            <PaginatedTable
                key={order}
                className="peer-review-finished-table"
                name="peer-review-finished"
                method="GET"
                source="peer_review/requests"
                filter={{ state: "submitted" }}
                orderBy={[order]}
                pageSizeOptions={[10, 25, 50]}
                columns={[
                    {
                        header: _("Date"),
                        className: () => "date",
                        render: (r: PeerReviewRequest) =>
                            r.submitted_at ? moment(r.submitted_at).format("YYYY-MM-DD") : "",
                    },
                    {
                        header: pgettext(
                            "Rank of the reviewer when they submitted",
                            "Reviewer rank",
                        ),
                        className: () => "rank",
                        render: (r: PeerReviewRequest) =>
                            r.reviewer_rank_at_submit === null ? (
                                ""
                            ) : (
                                <RequestRankCell rank={r.reviewer_rank_at_submit} />
                            ),
                    },
                    {
                        header: _("Reviewer"),
                        className: () => "player",
                        render: (r: PeerReviewRequest) =>
                            r.reviewer ? <Player user={r.reviewer} disableCacheUpdate /> : "",
                    },
                    {
                        header: _("Review"),
                        className: () => "review",
                        render: (r: PeerReviewRequest) =>
                            r.review_id ? (
                                <Link to={`/review/${r.review_id}`}>{r.game.name}</Link>
                            ) : (
                                <span className="removed">{_("review removed")}</span>
                            ),
                    },
                ]}
            />
        </div>
    );
}
