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

import { interpolate, pgettext } from "@/lib/translate";
import { del, get } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { currentWebPushEndpoint, disableWebPush } from "@/lib/web_push";
import { WebPushControl } from "./WebPushControl";
import "./PushDeviceList.css";

interface PushDevice {
    id: number;
    application: { id: number; name: string } | null;
    provider: "apns" | "fcm" | "webhook" | "webpush";
    /* Only given for web push, where it is the browser's endpoint */
    token: string | null;
    label: string | null;
    form_factor: "mobile" | "desktop" | null;
    apns_environment: "production" | "sandbox" | null;
    created_at: string;
    last_seen_at: string;
}

/** The app installs that receive this user's push notifications. */
export function PushDeviceList(): React.ReactElement {
    const [devices, setDevices] = React.useState<PushDevice[] | null>(null);

    const refresh = React.useCallback(() => {
        get("me/push_devices")
            .then((res: { results: PushDevice[] }) => setDevices(res.results))
            .catch(errorAlerter);
    }, []);

    React.useEffect(refresh, [refresh]);

    function remove(device: PushDevice) {
        del(`me/push_devices/${device.id}`)
            .then(async () => {
                /* Removing this browser turns push off here too */
                if (device.token && device.token === (await currentWebPushEndpoint())) {
                    await disableWebPush();
                }
            })
            .then(refresh)
            .catch(errorAlerter);
    }

    return (
        <div className="PushDeviceList">
            <h3>{pgettext("Settings section heading", "Devices receiving push notifications")}</h3>
            <WebPushControl devices={devices} onChange={refresh} />
            {devices?.length === 0 && (
                <div>
                    {pgettext(
                        "Shown when no device has registered for push notifications",
                        "No devices. Turn on push notifications in this browser, or sign in to a mobile app that supports them.",
                    )}
                </div>
            )}
            {devices?.map((device) => (
                <div key={device.id} className="push-device">
                    <span className="push-device-app">
                        {device.application?.name ?? "Online-Go.com"}
                    </span>
                    <span className="push-device-platform">
                        {device.provider === "webpush"
                            ? device.label
                            : device.provider === "webhook"
                              ? pgettext(
                                    "A site that receives the player's notifications on its own server",
                                    "Webhook: receives your notifications on its server",
                                )
                              : device.provider === "apns"
                                ? pgettext("Mobile platform", "iOS")
                                : pgettext("Mobile platform", "Android")}
                        {device.apns_environment === "sandbox" &&
                            " " +
                                pgettext(
                                    "An iOS app built for testing rather than from the App Store",
                                    "(development build)",
                                )}
                    </span>
                    <span className="push-device-last-seen">
                        {interpolate(pgettext("When a device last checked in", "Last seen %s"), [
                            new Date(device.last_seen_at).toLocaleDateString(),
                        ])}
                    </span>
                    <button className="xs" onClick={() => remove(device)}>
                        {pgettext("Stop sending push notifications to a device", "Remove")}
                    </button>
                </div>
            ))}
        </div>
    );
}
