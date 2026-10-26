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
import { errorAlerter } from "@/lib/misc";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext } from "@/lib/translate";
import { fetchQueue, patchProfile, requestAction } from "./api";
import { ClaimedRequestCard } from "./ClaimedRequestCard";
import { RankRangeSlider } from "./RankRangeSlider";
import { RequestRankCell } from "./RequestRankCell";
import { WaitTime } from "./WaitTime";
import type { QueueSort, ReviewerQueue } from "./types";
import "./MyQueueTab.css";

/** A joined reviewer's filtered queue with the slider, sort toggle and claim buttons. */
export function MyQueueTab(): React.ReactElement {
    const [sort, setSort] = React.useState<QueueSort>("rank");
    const [queue, setQueue] = React.useState<ReviewerQueue | null>(null);
    const [error, setError] = React.useState(false);
    const timer = React.useRef<number | null>(null);

    const load = React.useCallback(() => {
        fetchQueue(sort)
            .then((q) => {
                setQueue(q);
                setError(false);
            })
            .catch(() => setError(true));
    }, [sort]);

    React.useEffect(() => {
        load();
    }, [load]);

    React.useEffect(() => {
        return () => {
            if (timer.current !== null) {
                window.clearTimeout(timer.current);
            }
        };
    }, []);

    const onRange = (min: number, max: number) => {
        if (!queue) {
            return;
        }
        setQueue({ ...queue, profile: { ...queue.profile, min_rank: min, max_rank: max } });
        if (timer.current !== null) {
            window.clearTimeout(timer.current);
        }
        timer.current = window.setTimeout(() => {
            patchProfile({ min_rank: min, max_rank: max }).then(load).catch(errorAlerter);
        }, 400);
    };

    const claim = (id: number) => {
        requestAction(id, "claim")
            .then((req) => {
                if (req.review_id) {
                    browserHistory.push(`/review/${req.review_id}`);
                } else {
                    load();
                }
            })
            .catch((err) => {
                errorAlerter(err);
                load();
            });
    };

    if (error) {
        return <div className="MyQueueTab">{_("Could not load your queue.")}</div>;
    }
    if (!queue) {
        return <div className="MyQueueTab" />;
    }
    const { profile } = queue;
    const belowCutoff = profile.allowed_min === null || profile.allowed_max === null;

    return (
        <div className="MyQueueTab">
            {queue.claimed.length > 0 && (
                <div className="claimed">
                    <h3>
                        {pgettext(
                            "Heading over the requests a reviewer holds",
                            "Your active reviews",
                        )}
                    </h3>
                    {queue.claimed.map((r) => (
                        <ClaimedRequestCard key={r.id} request={r} onChanged={load} />
                    ))}
                </div>
            )}
            {belowCutoff ? (
                <p>
                    {_("Your current rank is below the reviewer cutoff, so no requests are shown.")}
                </p>
            ) : (
                <>
                    <div className="controls">
                        <RankRangeSlider
                            min={profile.min_rank}
                            max={profile.max_rank}
                            allowedMin={profile.allowed_min as number}
                            allowedMax={profile.allowed_max as number}
                            onChange={onRange}
                        />
                        <div className="sort">
                            <button
                                className={sort === "rank" ? "primary" : ""}
                                onClick={() => setSort("rank")}
                            >
                                {pgettext("Sort the queue by requester rank", "By rank")}
                            </button>
                            <button
                                className={sort === "wait" ? "primary" : ""}
                                onClick={() => setSort("wait")}
                            >
                                {pgettext("Sort the queue by time waiting", "By wait")}
                            </button>
                        </div>
                    </div>
                    <table className="my-queue-table">
                        <thead>
                            <tr>
                                <th>{_("Rank")}</th>
                                <th>{_("Requester")}</th>
                                <th>{_("Game")}</th>
                                <th>{_("Waiting")}</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {queue.open.length === 0 && (
                                <tr>
                                    <td colSpan={5}>{_("No requests in your range right now.")}</td>
                                </tr>
                            )}
                            {queue.open.map((r) => (
                                <tr key={r.id}>
                                    <td>
                                        <RequestRankCell
                                            rank={r.requester_rank}
                                            provisional={r.requester_provisional}
                                        />
                                    </td>
                                    <td>
                                        <Player user={r.requester} disableCacheUpdate />
                                    </td>
                                    <td>
                                        <Link to={`/game/${r.game.id}`}>{r.game.name}</Link>
                                    </td>
                                    <td>
                                        <WaitTime since={r.created} />
                                    </td>
                                    <td>
                                        <button className="primary" onClick={() => claim(r.id)}>
                                            {pgettext("Take a peer review request", "Claim")}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
}
