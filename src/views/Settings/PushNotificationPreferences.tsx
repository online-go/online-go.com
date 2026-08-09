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

import { ENABLE_WEB_PUSH } from "@/lib/features";
import { isWebPushSupported, requestNotificationPermission, subscribeToPush } from "@/lib/web_push";
import { _ } from "@/lib/translate";

import { PreferenceLine } from "@/lib/SettingsCommon";

import "./PushNotificationPreferences.css";

export function PushNotificationPreferences(): React.ReactElement | null {
    const supported = isWebPushSupported() && typeof Notification !== "undefined";
    const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">(
        supported ? Notification.permission : "unsupported",
    );
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(false);

    if (!ENABLE_WEB_PUSH) {
        return null;
    }

    async function enableNotifications(): Promise<void> {
        setLoading(true);
        setError(false);

        try {
            const nextPermission = await requestNotificationPermission();
            setPermission(nextPermission);

            if (nextPermission === "granted") {
                await subscribeToPush();
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="PushNotificationPreferences">
            <PreferenceLine title={_("Background notifications")}>
                {permission === "unsupported" && (
                    <span>{_("Background notifications are not supported by your browser.")}</span>
                )}
                {permission === "default" && (
                    <button type="button" onClick={enableNotifications} disabled={loading}>
                        {_("Enable Background Notifications")}
                    </button>
                )}
                {permission === "denied" && (
                    <span>
                        {_("Background notifications are blocked in your browser settings.")}
                    </span>
                )}
                {permission === "granted" && <span>{_("Enabled")}</span>}
            </PreferenceLine>

            {error && (
                <div className="PushNotificationPreferencesError">
                    {_("Unable to enable background notifications.")}
                </div>
            )}
        </div>
    );
}
