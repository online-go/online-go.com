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
import { del, post } from "@/lib/requests";
import { getPrintableError } from "@/lib/misc";
import { alert } from "@/lib/swal_config";

import {
    ApnsCredentialsStatus,
    FcmCredentialsStatus,
    PushDayStats,
    PushProvider,
    PushStatus,
    WebhookStatus,
} from "./push_types";
import "./PushProviderSummary.css";

interface PushProviderSummaryProps {
    base: string;
    provider: PushProvider;
    title: string;
    configured: ApnsCredentialsStatus | FcmCredentialsStatus | WebhookStatus | null;
    details: Array<[string, string]> | null;
    devices: string;
    stats: PushDayStats[];
    onStatus: (status: PushStatus) => void;
    children: React.ReactNode;
}

/** One push provider's state for an application: credentials, pause state, counts and its form. */
export function PushProviderSummary(props: PushProviderSummaryProps): React.ReactElement {
    const [error, setError] = React.useState("");
    const { configured } = props;
    const today = props.stats[0] ?? { sent: 0, failed: 0 };
    const week = props.stats.reduce(
        (acc, day) => ({ sent: acc.sent + day.sent, failed: acc.failed + day.failed }),
        { sent: 0, failed: 0 },
    );

    function act(request: Promise<PushStatus>) {
        setError("");
        request.then(props.onStatus).catch((err) => setError(getPrintableError(err) ?? ""));
    }

    function remove() {
        void alert
            .fire({
                text:
                    props.provider === "webhook"
                        ? pgettext(
                              "Developer page confirmation",
                              "Remove the webhook? Notifications stop being sent to it, and setting it up again makes a new signing secret.",
                          )
                        : pgettext(
                              "Developer page confirmation",
                              "Remove these credentials? Push notifications to this platform stop until you upload new ones.",
                          ),
                showCancelButton: true,
            })
            .then(({ value: yes }) => {
                if (yes) {
                    act(del(`${props.base}/${props.provider}`));
                }
            });
    }

    let state: string;
    if (!configured) {
        state = pgettext("Push credentials state", "Not configured");
    } else if (configured.paused_at) {
        state = interpolate(pgettext("Push credentials state", "Paused: %s"), [
            configured.pause_reason ?? "",
        ]);
    } else {
        state = pgettext("Push credentials state", "Active");
    }

    return (
        <div className="PushProviderSummary">
            <h3>{props.title}</h3>
            <div className="push-state">
                <span className={configured?.paused_at ? "paused" : ""}>{state}</span>
                {configured?.paused_at && (
                    <button
                        className="xs"
                        onClick={() => act(post(`${props.base}/${props.provider}/resume`, {}))}
                    >
                        {pgettext("Restart sending push notifications", "Resume")}
                    </button>
                )}
                {configured && (
                    <button className="xs reject" onClick={remove}>
                        {props.provider === "webhook"
                            ? pgettext("Developer page button", "Remove webhook")
                            : pgettext("Developer page button", "Remove credentials")}
                    </button>
                )}
            </div>
            {error && <div className="push-error">{error}</div>}
            {configured && (
                <dl>
                    {props.details?.map(([label, value]) => (
                        <React.Fragment key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </React.Fragment>
                    ))}
                    <dt>{pgettext("When credentials were last uploaded", "Updated")}</dt>
                    <dd>{new Date(configured.updated_at).toLocaleString()}</dd>
                </dl>
            )}
            <div>{props.devices}</div>
            <div>
                {interpolate(
                    pgettext(
                        "Push delivery counts",
                        "Today: %s sent, %s failed. Last 7 days: %s sent, %s failed.",
                    ),
                    [today.sent, today.failed, week.sent, week.failed],
                )}
            </div>
            {props.children}
        </div>
    );
}
