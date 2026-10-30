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

import { pgettext } from "@/lib/translate";
import { get } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { useUser } from "@/lib/hooks";

import { ApiClient } from "./push_types";
import { PushAppPanel } from "./PushAppPanel";

/** Lets the owners of OAuth applications set up push notifications and webhooks for them. */
export function PushNotificationsSection(): React.ReactElement {
    const user = useUser();
    const [apps, setApps] = React.useState<ApiClient[] | null>(null);

    React.useEffect(() => {
        if (user.anonymous) {
            return;
        }
        get("me/api_clients")
            .then((res: { results: ApiClient[] }) => setApps(res.results))
            .catch(errorAlerter);
    }, [user.id, user.anonymous]);

    return (
        <div className="PushNotificationsSection">
            <h1>{pgettext("Developer page section heading", "Push notifications")}</h1>
            <p>
                {pgettext(
                    "Developer page: explains push notification support for third party apps",
                    "Mobile apps can receive OGS notifications as push notifications. Upload your app's APNs (iOS) and FCM (Android) credentials below. Your app registers each install by sending its device token and your application's client ID to /api/v1/me/push_devices.",
                )}
            </p>
            <p>
                <a
                    href="https://github.com/online-go/online-go.com/blob/main/docs/push-notifications.md"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {pgettext(
                        "Developer page link to the push notification setup guide",
                        "How to set up push notifications for your app",
                    )}
                </a>
            </p>
            {user.anonymous && (
                <p>
                    {pgettext(
                        "Developer page",
                        "Sign in to manage push notifications for your applications.",
                    )}
                </p>
            )}
            {apps?.length === 0 && (
                <p>
                    {pgettext(
                        "Developer page",
                        "You have no applications. Create one in the OAuth2 Application Manager first.",
                    )}
                </p>
            )}
            {apps?.map((app) => (
                <PushAppPanel key={app.id} app={app} />
            ))}
        </div>
    );
}
