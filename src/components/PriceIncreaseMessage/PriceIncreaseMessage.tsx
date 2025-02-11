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
import * as data from "@/lib/data";
import { _, llm_pgettext } from "@/lib/translate";
import { useUser, useData } from "@/lib/hooks";
import { Link } from "react-router-dom";

interface PriceIncreaseMessageProps {
    noDismiss?: boolean;
}

export function PriceIncreaseMessage({
    noDismiss,
}: PriceIncreaseMessageProps): React.ReactElement | null {
    const user = useUser();
    const [_dismissed] = useData("price-increase-message-dismissed-timestamp", 0);
    const dismissed = noDismiss ? 0 : _dismissed;

    const start_date = new Date("2025-02-01");
    const end_date = new Date("2025-03-01");
    const now = Date.now();

    // Don't show for existing supporters, or if they've dismissed the message
    // - unless they've dismissed it more than 60 days ago. The 60 day is
    // because as time goes on we will have to raise prices to keep up with
    // inflation, so we'll show folks the message every time we increase
    // prices.
    const should_show =
        user &&
        !user.anonymous &&
        !dismissed &&
        (!user.supporter || user.id === 1) &&
        now >= start_date.getTime() &&
        now <= end_date.getTime() &&
        now - dismissed > 1000 * 60 * 60 * 24 * 60; // 60 days

    const close = React.useCallback(() => {
        data.set(
            "price-increase-message-dismissed-timestamp",
            Date.now(),
            data.Replication.REMOTE_OVERWRITES_LOCAL,
        );
    }, []);

    if (!should_show) {
        return null;
    }

    return (
        <div className="PriceIncreaseMessage-container">
            <div className="PriceIncreaseMessage">
                <div className="message">
                    <div className="title">
                        {llm_pgettext(
                            "Do not translate the string OGS, keep OGS as OGS.",
                            "Hello OGS!",
                        )}
                    </div>
                    <div className="body">
                        {llm_pgettext(
                            "A message about the upcoming price increase for the site supporter AI review service. An AI review in this case is is a post game analysis where an AI explores game variations to highlight better moves that could have been made.",
                            "We will be increasing prices for our AI review service on March 1st to keep up with inflation. This will only apply to new subscriptions created on or after that date, so if you would like to lock in a subscription at the current rate, now is your chance!",
                        )}
                    </div>
                </div>

                {!noDismiss && (
                    <div className="buttons">
                        <button onClick={close}>{_("Dismiss")}</button>

                        <Link to="/supporter" className="btn primary">
                            {llm_pgettext(
                                "Learn more about our Site Supporter AI Review plans",
                                "Learn more",
                            )}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
