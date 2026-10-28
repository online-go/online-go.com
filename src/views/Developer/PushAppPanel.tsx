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
import { get, post } from "@/lib/requests";
import { getPrintableError } from "@/lib/misc";

import { ApiClient, PushStatus, PushTestResult } from "./push_types";
import { PushProviderSummary } from "./PushProviderSummary";
import { ApnsCredentialsForm } from "./ApnsCredentialsForm";
import { FcmCredentialsForm } from "./FcmCredentialsForm";
import "./PushAppPanel.css";

/** Push notification status, credentials and diagnostics for one OAuth application. */
export function PushAppPanel({ app }: { app: ApiClient }): React.ReactElement {
    const base = `me/api_clients/${app.id}/push`;
    const [status, setStatus] = React.useState<PushStatus | null>(null);
    const [error, setError] = React.useState("");
    const [test_results, setTestResults] = React.useState<PushTestResult[] | null>(null);
    const [testing, setTesting] = React.useState(false);
    const [show_errors, setShowErrors] = React.useState(false);

    const refresh = React.useCallback(() => {
        get(base)
            .then((res: PushStatus) => setStatus(res))
            .catch((err) => setError(getPrintableError(err) ?? ""));
    }, [base]);

    React.useEffect(refresh, [refresh]);

    function sendTest() {
        setTesting(true);
        setError("");
        post(`${base}/test`, {})
            .then((res: { results: PushTestResult[] }) => setTestResults(res.results))
            .catch((err) => setError(getPrintableError(err) ?? ""))
            .finally(() => {
                setTesting(false);
                // A test can remove dead device tokens and changes the counts.
                refresh();
            });
    }

    return (
        <div className="PushAppPanel">
            <h2>{app.name}</h2>
            <div>
                {pgettext("OAuth application identifier", "Client ID")}:{" "}
                <code>{app.client_id}</code>
            </div>
            {error && <div className="push-error">{error}</div>}
            {status && (
                <>
                    <PushProviderSummary
                        base={base}
                        provider="apns"
                        title={pgettext("Push notification service name", "iOS (APNs)")}
                        configured={status.apns}
                        details={
                            status.apns && [
                                [pgettext("APNs credential field", "Key ID"), status.apns.key_id],
                                [pgettext("APNs credential field", "Team ID"), status.apns.team_id],
                                [
                                    pgettext("APNs credential field", "Bundle ID"),
                                    status.apns.bundle_id,
                                ],
                            ]
                        }
                        devices={interpolate(
                            pgettext(
                                "Counts of registered iOS devices",
                                "%s devices (%s development builds)",
                            ),
                            [
                                status.devices.apns.production + status.devices.apns.sandbox,
                                status.devices.apns.sandbox,
                            ],
                        )}
                        stats={status.stats.apns}
                        onStatus={setStatus}
                    >
                        <ApnsCredentialsForm
                            base={base}
                            current={status.apns}
                            device_count={
                                status.devices.apns.production + status.devices.apns.sandbox
                            }
                            onSaved={setStatus}
                        />
                    </PushProviderSummary>
                    <PushProviderSummary
                        base={base}
                        provider="fcm"
                        title={pgettext("Push notification service name", "Android (FCM)")}
                        configured={status.fcm}
                        details={
                            status.fcm && [
                                [
                                    pgettext("FCM credential field", "Project ID"),
                                    status.fcm.project_id,
                                ],
                                [
                                    pgettext("FCM credential field", "Service account"),
                                    status.fcm.client_email,
                                ],
                            ]
                        }
                        devices={interpolate(
                            pgettext("Count of registered Android devices", "%s devices"),
                            [status.devices.fcm],
                        )}
                        stats={status.stats.fcm}
                        onStatus={setStatus}
                    >
                        <FcmCredentialsForm
                            base={base}
                            current={status.fcm}
                            device_count={status.devices.fcm}
                            onSaved={setStatus}
                        />
                    </PushProviderSummary>

                    <div className="push-test">
                        <button onClick={sendTest} disabled={testing}>
                            {pgettext("Developer page button", "Send test push")}
                        </button>
                        {test_results?.length === 0 && (
                            <p>
                                {pgettext(
                                    "Developer page: test push found no devices",
                                    "You have no devices registered with this application. Sign in to your app on your own phone, then try again.",
                                )}
                            </p>
                        )}
                        {test_results?.map((result) => (
                            <div key={result.device_id} className="push-test-result">
                                <span>
                                    {result.provider === "apns"
                                        ? pgettext("Mobile platform", "iOS")
                                        : pgettext("Mobile platform", "Android")}
                                    {result.apns_environment === "sandbox" &&
                                        " " +
                                            pgettext(
                                                "Mobile app build type",
                                                "(development build)",
                                            )}
                                </span>
                                <span className={"push-outcome " + result.outcome}>
                                    {result.outcome}
                                </span>
                                <span>{result.detail}</span>
                            </div>
                        ))}
                    </div>

                    <div className="push-recent-errors">
                        <button className="xs" onClick={() => setShowErrors(!show_errors)}>
                            {interpolate(
                                pgettext(
                                    "Developer page: toggles the list of delivery errors",
                                    "Recent errors (%s)",
                                ),
                                [status.recent_errors.length],
                            )}
                        </button>
                        {show_errors &&
                            status.recent_errors.map((e, idx) => (
                                <div key={idx} className="push-recent-error">
                                    <span>{new Date(e.time).toLocaleString()}</span>
                                    <span>{e.provider}</span>
                                    <span className={"push-outcome " + e.outcome}>{e.outcome}</span>
                                    <span>{e.detail}</span>
                                </div>
                            ))}
                    </div>
                </>
            )}
        </div>
    );
}
