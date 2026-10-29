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
import { errorAlerter } from "@/lib/misc";
import { disableWebPush, enableWebPush, formFactor, webPushState } from "@/lib/web_push";
import type { WebPushState } from "@/lib/web_push";

interface WebPushControlProps {
    devices: { provider: string; application: { name: string } | null }[] | null;
    onChange: () => void;
}

/** Turns push notifications on or off for the browser the player is using. */
export function WebPushControl({ devices, onChange }: WebPushControlProps): React.ReactElement {
    const [state, setState] = React.useState<WebPushState | null>(null);

    const readState = React.useCallback(() => {
        webPushState().then(setState).catch(errorAlerter);
    }, []);

    React.useEffect(readState, [readState]);

    /* enableWebPush has to run straight from the click, so nothing is awaited first */
    function change(action: () => Promise<void>) {
        action()
            .catch(errorAlerter)
            .finally(() => {
                readState();
                onChange();
            });
    }

    const native_apps = Array.from(
        new Set(
            (devices ?? [])
                .filter((d) => d.provider === "apns" || d.provider === "fcm")
                .map((d) => d.application?.name ?? ""),
        ),
    );

    return (
        <div className="WebPushControl">
            {state === "on" && (
                <>
                    <span>
                        {pgettext(
                            "Shown when this browser receives push notifications",
                            "Push notifications are on in this browser",
                        )}
                    </span>
                    <button className="xs" onClick={() => change(disableWebPush)}>
                        {pgettext("Stop push notifications in this browser", "Turn off")}
                    </button>
                </>
            )}
            {state === "off" && (
                <>
                    {formFactor() === "mobile" && native_apps.length > 0 && (
                        <div className="web-push-warning">
                            {interpolate(
                                pgettext(
                                    "Warns that a mobile app already sends push notifications. %s is the app names",
                                    "You already get notifications through %s on a mobile device. Turning this on too will double them up.",
                                ),
                                [native_apps.join(", ")],
                            )}
                        </div>
                    )}
                    <button onClick={() => change(enableWebPush)}>
                        {pgettext(
                            "Start push notifications in this browser",
                            "Turn on push notifications in this browser",
                        )}
                    </button>
                </>
            )}
            {state === "blocked" && (
                <span>
                    {pgettext(
                        "Shown when the browser has denied OGS permission to notify",
                        "Your browser is blocking notifications from OGS. Allow them in its site settings to turn this on.",
                    )}
                </span>
            )}
            {state === "unsupported" && (
                <span>
                    {pgettext(
                        "Shown when the browser has no push notification support",
                        "This browser can't receive push notifications.",
                    )}
                </span>
            )}
            {state === "needs-home-screen" && (
                <span>
                    {pgettext(
                        "Shown on iPhone and iPad, where push needs the site on the home screen",
                        "To get notifications on this device, add OGS to your home screen (Share → Add to Home Screen), then open it from there.",
                    )}
                </span>
            )}
        </div>
    );
}
