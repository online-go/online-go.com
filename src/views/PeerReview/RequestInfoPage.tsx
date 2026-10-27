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
import { Card } from "@/components/material";
import { useUser } from "@/lib/hooks";
import { _ } from "@/lib/translate";
import { AvailabilityNotice } from "./AvailabilityNotice";
import "./RequestInfoPage.css";

/** Explains how to request a peer review and points the player at their finished games. */
export function RequestInfoPage(): React.ReactElement {
    const user = useUser();
    React.useEffect(() => {
        window.document.title = _("Request a peer review");
    }, []);
    return (
        <div className="RequestInfoPage container">
            <h2>{_("Request a peer review")}</h2>
            <AvailabilityNotice />
            <Card>
                <p>
                    {_(
                        "A peer review is a human review of one of your finished games by a stronger volunteer player. Open the game you want reviewed and use the Request peer review button. You can have one request waiting at a time and make one request per week.",
                    )}
                </p>
                {!user.anonymous && <Link to={`/user/view/${user.id}`}>{_("Go to my games")}</Link>}
                <p>
                    <Link to="/peer-review">{_("See the queue")}</Link>
                </p>
            </Card>
        </div>
    );
}
