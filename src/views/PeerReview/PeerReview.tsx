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
import { useParams } from "react-router-dom";
import { browserHistory } from "@/lib/ogsHistory";
import { useUser } from "@/lib/hooks";
import { _, pgettext } from "@/lib/translate";
import { AvailabilityNotice } from "./AvailabilityNotice";
import { fetchMyProfile } from "./api";
import { QueueTab } from "./QueueTab";
import { FinishedTab } from "./FinishedTab";
import { MyQueueTab } from "./MyQueueTab";
import "./PeerReview.css";

type Tab = "queue" | "finished" | "mine";

/** The peer review area: public queue, finished reviews archive, and a joined reviewer's own queue. */
export function PeerReview(): React.ReactElement {
    const { tab } = useParams<{ tab?: Tab }>();
    const user = useUser();
    const [isReviewer, setIsReviewer] = React.useState(false);
    const [profileChecked, setProfileChecked] = React.useState(false);
    const requested: Tab = tab === "finished" || tab === "mine" ? tab : "queue";
    const selected: Tab =
        requested === "mine" && profileChecked && !isReviewer ? "queue" : requested;

    React.useEffect(() => {
        window.document.title = _("Peer review");
    }, []);

    React.useEffect(() => {
        if (user.anonymous) {
            setIsReviewer(false);
            setProfileChecked(true);
            return;
        }
        let cancelled = false;
        fetchMyProfile()
            .then((profile) => {
                if (!cancelled) {
                    setIsReviewer(profile.active);
                    setProfileChecked(true);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setIsReviewer(false);
                    setProfileChecked(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [user.id, user.anonymous]);

    const select = (t: Tab) => browserHistory.push(`/peer-review/${t}`);
    const tabClass = (t: Tab) => "tab" + (selected === t ? " active" : "");

    return (
        <div className="PeerReview container">
            <div className="tab-head">
                <h2>
                    <i className="fa fa-search-plus" /> {_("Peer review")}
                </h2>
                <div className="tabs-container">
                    <span className={tabClass("queue")} onClick={() => select("queue")}>
                        {pgettext("Peer review tab: the public queue", "Queue")}
                    </span>
                    <span className={tabClass("finished")} onClick={() => select("finished")}>
                        {pgettext(
                            "Peer review tab: archive of finished reviews",
                            "Finished reviews",
                        )}
                    </span>
                    {isReviewer && (
                        <span className={tabClass("mine")} onClick={() => select("mine")}>
                            {pgettext(
                                "Peer review tab: the signed-in reviewer's own queue",
                                "My queue",
                            )}
                        </span>
                    )}
                </div>
            </div>
            <hr />
            <AvailabilityNotice />
            {selected === "queue" && <QueueTab />}
            {selected === "finished" && <FinishedTab />}
            {selected === "mine" && isReviewer && <MyQueueTab />}
        </div>
    );
}
