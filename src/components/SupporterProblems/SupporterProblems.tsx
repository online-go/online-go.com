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
import { useUser } from "@/lib/hooks";
import { useNotifications } from "../Notifications";
import { notification_manager } from "@/components/Notifications/NotificationManager";
import { Link } from "react-router-dom";
//import * as data from "@/lib/data";

export function SupporterProblems(): React.ReactElement | null {
    const user = useUser();
    const notifications = useNotifications(["supporterExpired"]);

    if (!user || !notifications || notifications.length === 0) {
        return null;
    }

    return (
        <div className="SupporterProblems-container">
            {notifications.map((notification) => {
                return (
                    <div key={notification.id} className="SupporterProblem">
                        {notification.type === "supporterExpired" &&
                            _(
                                "Just a heads-up, your supporter status and AI review subscription has expired. If you'd like to continue receiving AI reviews for your games, as well as the other site supporter benefits, you can sign up again at any time on the supporter page. Thank you for your past patronage, we hope to earn it again in the future!",
                            )}
                        <div className="buttons">
                            <button
                                onClick={() =>
                                    notification_manager.deleteNotification(notification)
                                }
                            >
                                {_("Dismiss")}
                            </button>

                            <Link className="primary btn" to="/supporter">
                                {_("Visit supporter page")}
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
