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
import { Card } from "@/components/material";
import { useUser } from "@/lib/hooks";
import { errorAlerter } from "@/lib/misc";
import { browserHistory } from "@/lib/ogsHistory";
import { _, pgettext } from "@/lib/translate";
import { fetchMyProfile, joinPool, patchProfile } from "./api";
import type { PeerReviewerProfile } from "./types";
import "./JoinPage.css";

/** Guidelines and the agree-and-join button; profile controls once joined. */
export function JoinPage(): React.ReactElement {
    const user = useUser();
    const [profile, setProfile] = React.useState<PeerReviewerProfile | null>(null);
    const [loaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        window.document.title = _("Become a peer reviewer");
        if (user.anonymous) {
            setLoaded(true);
            return;
        }
        let cancelled = false;
        fetchMyProfile()
            .then((p) => {
                if (!cancelled) {
                    setProfile(p);
                }
            })
            .catch(() => {
                // 404 means the player has not joined yet.
            })
            .finally(() => {
                if (!cancelled) {
                    setLoaded(true);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [user.id, user.anonymous]);

    const join = () => {
        joinPool()
            .then((p) => {
                setProfile(p);
                browserHistory.push("/peer-review/mine");
            })
            .catch(errorAlerter);
    };
    const setActive = (active: boolean) => {
        patchProfile({ active }).then(setProfile).catch(errorAlerter);
    };

    return (
        <div className="JoinPage container">
            <h2>{_("Become a peer reviewer")}</h2>
            <Card>
                <p>
                    {_(
                        "Peer reviewers volunteer to review games submitted by other players. You pick the requests you want from a queue, review the game on OGS, and submit the review within 48 hours.",
                    )}
                </p>
                <h3>{pgettext("Heading for peer reviewer guidelines", "Guidelines")}</h3>
                <ul>
                    <li>{_("Review games at or below the rank range your own rank allows.")}</li>
                    <li>
                        {_(
                            "Be kind, specific and honest. Point out the moves that mattered and why.",
                        )}
                    </li>
                    <li>
                        {_(
                            "Claim only what you can finish within 48 hours. Release a request if you cannot.",
                        )}
                    </li>
                </ul>
                {user.anonymous ? (
                    <p>{_("Sign in to join the reviewer pool.")}</p>
                ) : !loaded ? null : profile && profile.active ? (
                    <div className="joined">
                        <p>{_("You are a peer reviewer.")}</p>
                        <button
                            className="primary"
                            onClick={() => browserHistory.push("/peer-review/mine")}
                        >
                            {pgettext("Button to open the reviewer's own queue", "Open my queue")}
                        </button>
                        <button className="reject" onClick={() => setActive(false)}>
                            {pgettext("Button to leave the peer reviewer pool", "Leave the pool")}
                        </button>
                    </div>
                ) : profile ? (
                    <button className="primary" onClick={() => setActive(true)}>
                        {pgettext("Button to rejoin the peer reviewer pool", "Rejoin the pool")}
                    </button>
                ) : (
                    <button className="primary" onClick={join}>
                        {pgettext(
                            "Button that accepts the guidelines and joins the pool",
                            "I agree, join the pool",
                        )}
                    </button>
                )}
            </Card>
        </div>
    );
}
