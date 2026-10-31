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
import { _ } from "@/lib/translate";
import { usePeerReviewAvailability } from "./usePeerReviewAvailability";
import "./AvailabilityNotice.css";

/** One line at the top of the peer review pages saying which mode the feature is in, when it is not simply live. */
export function AvailabilityNotice(): React.ReactElement | null {
    const { loaded, available, live } = usePeerReviewAvailability();
    if (!loaded || live) {
        return null;
    }
    return (
        <div className="AvailabilityNotice">
            {available
                ? _(
                      "Peer review is dark: only moderators and peer review moderators can see and use it.",
                  )
                : _("Peer review is not open yet.")}
        </div>
    );
}
