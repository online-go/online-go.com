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

import { Toggle } from "@/components/Toggle";
import { ENABLE_WEB_PUSH } from "@/lib/features";
import { isWebPushSupported, requestNotificationPermission, subscribeToPush } from "@/lib/web_push";
import { mockWebPushApi, PushPreferences } from "@/lib/web_push_api";
import { _, pgettext } from "@/lib/translate";

import { PreferenceLine } from "@/lib/SettingsCommon";

import "./PushNotificationPreferences.css";

const preferenceLabels: Array<{ key: keyof PushPreferences; label: string }> = [
    { key: "turn", label: pgettext("Web Push notification preference", "Your turn to play") },
    { key: "time", label: pgettext("Web Push notification preference", "Time running out") },
    {
        key: "challenge",
        label: pgettext("Web Push notification preference", "New challenge or game started"),
    },
];

export function PushNotificationPreferences(): React.ReactElement | null {
    const supported = isWebPushSupported() && typeof Notification !== "undefined";
    const [permission, setPermission] = React.useState<NotificationPermission | "unsupported">(
        supported ? Notification.permission : "unsupported",
    );
    const [preferences, setPreferences] = React.useState<PushPreferences>({
        turn: false,
        time: false,
        challenge: false,
    });
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(false);

    React.useEffect(() => {
        if (permission !== "granted") {
            return;
        }

        void mockWebPushApi
            .getPreferences()
            .then(setPreferences)
            .catch(() => setError(true));
    }, [permission]);

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

    async function updatePreference(key: keyof PushPreferences, value: boolean): Promise<void> {
        const nextPreferences = { ...preferences, [key]: value };
        setPreferences(nextPreferences);

        try {
            await mockWebPushApi.updatePreferences(nextPreferences);
        } catch {
            setError(true);
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

            {permission === "granted" &&
                preferenceLabels.map(({ key, label }) => (
                    <PreferenceLine key={key} title={label}>
                        <Toggle
                            checked={preferences[key]}
                            onChange={(value) => void updatePreference(key, value)}
                        />
                    </PreferenceLine>
                ))}

            {error && (
                <div className="PushNotificationPreferencesError">
                    {_("Unable to update notification settings.")}
                </div>
            )}
        </div>
    );
}
