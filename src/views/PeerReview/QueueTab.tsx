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
import { _, pgettext } from "@/lib/translate";
import { RequestRankCell } from "./RequestRankCell";
import { WaitTime } from "./WaitTime";
import type { PeerReviewRequest } from "./types";
import "./QueueTab.css";

/** The public queue: every open or claimed request, strongest requester first. */
export function QueueTab(): React.ReactElement {
    return (
        <div className="QueueTab">
            <PaginatedTable
                className="peer-review-queue-table"
                name="peer-review-queue"
                method="GET"
                source="peer_review/requests"
                filter={{ state: "open,claimed" }}
                orderBy={["-requester_rank"]}
                pageSizeOptions={[10, 25, 50]}
                columns={[
                    {
                        header: _("Rank"),
                        className: () => "rank",
                        render: (r: PeerReviewRequest) => (
                            <RequestRankCell
                                rank={r.requester_rank}
                                provisional={r.requester_provisional}
                            />
                        ),
                    },
                    {
                        header: _("Requester"),
                        className: () => "player",
                        render: (r: PeerReviewRequest) => (
                            <Player user={r.requester} disableCacheUpdate />
                        ),
                    },
                    {
                        header: _("Game"),
                        className: () => "game",
                        render: (r: PeerReviewRequest) => (
                            <Link to={`/game/${r.game.id}`}>{r.game.name}</Link>
                        ),
                    },
                    {
                        header: _("Waiting"),
                        className: () => "waiting",
                        render: (r: PeerReviewRequest) =>
                            r.state === "claimed" ? (
                                <span className="claimed">
                                    {pgettext("A reviewer has claimed this request", "Claimed")}
                                </span>
                            ) : (
                                <WaitTime since={r.created} />
                            ),
                    },
                    {
                        header: pgettext(
                            "Column: reviewers free to claim / all reviewers covering this rank",
                            "Available reviewers",
                        ),
                        className: () => "reviewers",
                        render: (r: PeerReviewRequest) =>
                            r.reviewers_total === null || r.reviewers_total === undefined
                                ? ""
                                : `${r.reviewers_available ?? 0} / ${r.reviewers_total}`,
                    },
                ]}
            />
        </div>
    );
}
