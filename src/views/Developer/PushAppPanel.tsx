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

import { interpolate, npgettext, pgettext } from "@/lib/translate";
import { get, post } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";

import { ApiClient, PushProvider, PushStatus } from "./push_types";
import { PushProviderPanel } from "./PushProviderPanel";
import "./PushAppPanel.css";

const PROVIDERS: PushProvider[] = ["apns", "fcm", "webhook"];

/** Push notification and webhook setup, counts and recent errors for one OAuth application. */
export function PushAppPanel({ app }: { app: ApiClient }): React.ReactElement {
    const base = `me/api_clients/${app.id}/push`;
    const [status, setStatus] = React.useState<PushStatus | null>(null);
    const [signing_secret, setSigningSecret] = React.useState("");
    const [test_devices, setTestDevices] = React.useState<number | null>(null);

    const refresh = React.useCallback(() => {
        get(base)
            .then((res: PushStatus) => setStatus(res))
            .catch(errorAlerter);
    }, [base]);

    React.useEffect(refresh, [refresh]);

    function update(res: PushStatus) {
        setStatus(res);
        setSigningSecret(res.signing_secret ?? "");
    }

    function sendTest() {
        post(`${base}/test`, {})
            .then((res: { devices: number }) => {
                setTestDevices(res.devices);
                // The pushes go out on the push workers, then show in the counts and errors
                setTimeout(refresh, 5000);
            })
            .catch(errorAlerter);
    }

    return (
        <div className="PushAppPanel">
            <h2>{app.name}</h2>
            <div>
                {pgettext("OAuth application identifier", "Client ID")}:{" "}
                <code>{app.client_id}</code>
            </div>
            {status && (
                <>
                    {PROVIDERS.map((provider) => (
                        <PushProviderPanel
                            // Saved settings start a fresh form
                            key={provider + (status[provider]?.updated_at ?? "")}
                            base={base}
                            provider={provider}
                            status={status}
                            onStatus={update}
                        />
                    ))}
                    {signing_secret && (
                        <div className="webhook-signing-secret">
                            {pgettext(
                                "Developer page: shown once after a webhook signing secret is generated",
                                "Your signing secret. Copy it now: it won't be shown again.",
                            )}
                            <code>{signing_secret}</code>
                        </div>
                    )}

                    <div className="push-test">
                        <button onClick={sendTest}>
                            {pgettext("Developer page button", "Send test push")}
                        </button>{" "}
                        {test_devices === 0 &&
                            pgettext(
                                "Developer page: test push found no devices",
                                "You have no devices or webhook subscription registered with this application. Sign in to your app on your own phone, or subscribe your own account to the webhook, then try again.",
                            )}
                        {!!test_devices &&
                            interpolate(
                                npgettext(
                                    "Developer page: test push was sent",
                                    "Sent to %s of your devices. Any problem shows under Recent errors.",
                                    "Sent to %s of your devices. Any problems show under Recent errors.",
                                    test_devices,
                                ),
                                [test_devices],
                            )}
                    </div>

                    <details>
                        <summary>
                            {interpolate(
                                pgettext(
                                    "Developer page: toggles the list of delivery errors",
                                    "Recent errors (%s)",
                                ),
                                [status.recent_errors.length],
                            )}
                        </summary>
                        {status.recent_errors.map((e, idx) => (
                            <div key={idx}>
                                {new Date(e.time).toLocaleString()} {e.provider} {e.outcome}:{" "}
                                {e.detail}
                            </div>
                        ))}
                    </details>
                </>
            )}
        </div>
    );
}
