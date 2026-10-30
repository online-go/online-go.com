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
import { PaginatedTable } from "@/components/PaginatedTable";
import { Player } from "@/components/Player";
import { _, pgettext } from "@/lib/translate";
import { Honorific } from "./Honorific";
import { RequestRankCell } from "./RequestRankCell";
import type { ReviewerRow, ReviewersOrder } from "./types";
import "./ReviewersTab.css";

/** The public leaderboard of reviewers in the pool. */
export function ReviewersTab(): React.ReactElement {
    const [order, setOrder] = React.useState<ReviewersOrder>("-completed");
    const flip = (asc: ReviewersOrder, desc: ReviewersOrder) =>
        setOrder(order === desc ? asc : desc);
    const arrow = (asc: ReviewersOrder, desc: ReviewersOrder) =>
        order === asc ? " ↑" : order === desc ? " ↓" : "";

    return (
        <div className="ReviewersTab">
            <div className="sort-controls">
                <button
                    className={order.endsWith("completed") ? "primary" : ""}
                    onClick={() => flip("completed", "-completed")}
                >
                    {pgettext("Sort reviewers by reviews completed", "Completed")}
                    {arrow("completed", "-completed")}
                </button>
                <button
                    className={order.endsWith("score") ? "primary" : ""}
                    onClick={() => flip("score", "-score")}
                >
                    {pgettext("Sort reviewers by score", "Score")}
                    {arrow("score", "-score")}
                </button>
                <button
                    className={order.endsWith("rank") ? "primary" : ""}
                    onClick={() => flip("rank", "-rank")}
                >
                    {pgettext("Sort reviewers by OGS rank", "Rank")}
                    {arrow("rank", "-rank")}
                </button>
            </div>
            <PaginatedTable
                key={order}
                className="peer-reviewers-table"
                name="peer-reviewers"
                method="GET"
                source="peer_review/reviewers"
                orderBy={[order]}
                pageSizeOptions={[10, 25, 50]}
                columns={[
                    {
                        header: _("Rank"),
                        className: () => "rank",
                        render: (r: ReviewerRow) => (
                            <RequestRankCell rank={r.rank} professional={r.professional} />
                        ),
                    },
                    {
                        header: _("Reviewer"),
                        className: () => "player",
                        render: (r: ReviewerRow) => <Player user={r.player} disableCacheUpdate />,
                    },
                    {
                        header: pgettext("Column: average rating a reviewer has received", "Score"),
                        className: () => "score",
                        render: (r: ReviewerRow) => (r.score === null ? "–" : r.score.toFixed(1)),
                    },
                    {
                        header: pgettext("Column: reviewer honorific", "Honorific"),
                        className: () => "honorific",
                        render: (r: ReviewerRow) => <Honorific name={r.honorific} />,
                    },
                    {
                        header: pgettext("Column: reviews completed", "Completed"),
                        className: () => "completed",
                        render: (r: ReviewerRow) => r.completed,
                    },
                    {
                        header: pgettext("Column: reviews in progress", "In progress"),
                        className: () => "in-progress",
                        render: (r: ReviewerRow) => r.in_progress,
                    },
                ]}
            />
        </div>
    );
}
