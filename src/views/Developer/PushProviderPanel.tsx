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
import { del, post, put } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { alert } from "@/lib/swal_config";

import { PushProvider, PushStatus } from "./push_types";
import "./PushProviderPanel.css";

type TextField = "key_id" | "team_id" | "bundle_id" | "url";

interface ProviderForm {
    title: string;
    /** The secret, uploaded as a file and never shown again */
    file?: { name: string; label: string; accept: string };
    /** Filled in from the current settings */
    text: Array<{ name: TextField; label: string }>;
}

/** One provider's state for an application, and the form that sets its credentials or webhook. */
export function PushProviderPanel(props: {
    base: string;
    provider: PushProvider;
    status: PushStatus;
    onStatus: (status: PushStatus) => void;
}): React.ReactElement {
    const { provider, status } = props;
    const url = `${props.base}/${provider}`;
    const current = status[provider];
    const devices = status.devices[provider];
    const form = providerForm(provider);
    const [file, setFile] = React.useState("");
    const [text, setText] = React.useState(() =>
        Object.fromEntries(form.text.map(({ name }) => [name, current?.[name] ?? ""])),
    );
    const [saving, setSaving] = React.useState(false);
    const complete = (!form.file || !!file) && form.text.every(({ name }) => text[name]);

    async function run(request: () => Promise<PushStatus>, confirm?: string) {
        if (confirm && !(await alert.fire({ text: confirm, showCancelButton: true })).value) {
            return;
        }
        setSaving(true);
        try {
            props.onStatus(await request());
        } catch (err) {
            errorAlerter(err);
        } finally {
            setSaving(false);
        }
    }

    function chooseFile(ev: React.ChangeEvent<HTMLInputElement>) {
        setFile("");
        ev.target.files?.[0]?.text().then(setFile).catch(errorAlerter);
    }

    /** Credentials for a different app can't reach the devices registered with the current ones. */
    function forDifferentApp(): boolean {
        if (!current || devices === 0) {
            return false;
        }
        if (provider === "apns") {
            return text.bundle_id !== current.bundle_id;
        }
        if (provider === "fcm") {
            const project_id = projectId(file);
            return project_id !== undefined && project_id !== current.project_id;
        }
        return false;
    }

    function save(rotate_secret: boolean) {
        let confirm: string | undefined;
        if (rotate_secret) {
            confirm = pgettext(
                "Developer page confirmation",
                "Generate a new signing secret? The current one stops working immediately, so your server will reject our requests until it uses the new one.",
            );
        } else if (forDifferentApp()) {
            confirm = interpolate(
                pgettext(
                    "Developer page confirmation",
                    "These credentials are for a different app, so saving them removes the %s registered devices. They register again the next time the app starts. Continue?",
                ),
                [devices],
            );
        }
        const body = { ...text, ...(form.file && { [form.file.name]: file }), rotate_secret };
        void run(() => put(url, body), confirm);
    }

    function remove() {
        const confirm =
            provider === "webhook"
                ? pgettext(
                      "Developer page confirmation",
                      "Remove the webhook? Notifications stop being sent to it, and setting it up again makes a new signing secret.",
                  )
                : pgettext(
                      "Developer page confirmation",
                      "Remove these credentials? Push notifications to this platform stop until you upload new ones.",
                  );
        void run(() => del(url), confirm);
    }

    let state = pgettext("Push credentials state", "Not configured");
    if (current?.paused_at) {
        state = interpolate(pgettext("Push credentials state", "Paused: %s"), [
            current.pause_reason,
        ]);
    } else if (current) {
        state = pgettext("Push credentials state", "Active");
    }

    return (
        <div className="PushProviderPanel">
            <h3>{form.title}</h3>
            <div className="push-state">
                <span className={current?.paused_at ? "paused" : ""}>{state}</span>
                {current?.paused_at && (
                    <button
                        className="xs"
                        disabled={saving}
                        onClick={() => void run(() => post(`${url}/resume`, {}))}
                    >
                        {pgettext("Restart sending push notifications", "Resume")}
                    </button>
                )}
                {current && (
                    <button className="xs reject" disabled={saving} onClick={remove}>
                        {pgettext("Developer page button", "Remove")}
                    </button>
                )}
            </div>
            {provider === "apns" && current && (
                <div>
                    {interpolate(
                        pgettext(
                            "APNs environments (production and/or sandbox) the key works in",
                            "Environments: %s",
                        ),
                        [(current.environments ?? []).join(", ")],
                    )}
                </div>
            )}
            {provider === "fcm" && current && (
                <div>
                    {interpolate(pgettext("FCM credentials", "Project %s, service account %s"), [
                        current.project_id,
                        current.client_email,
                    ])}
                </div>
            )}
            <div>
                {interpolate(
                    provider === "webhook"
                        ? npgettext(
                              "Count of players whose notifications are sent to the webhook",
                              "%s player subscribed",
                              "%s players subscribed",
                              devices,
                          )
                        : npgettext(
                              "Count of registered devices",
                              "%s device",
                              "%s devices",
                              devices,
                          ),
                    [devices],
                )}
                {", "}
                {interpolate(pgettext("Push delivery counts", "last 7 days: %s sent, %s failed"), [
                    status.stats[provider].sent,
                    status.stats[provider].failed,
                ])}
            </div>

            {form.file && (
                <label>
                    {form.file.label}
                    <input type="file" accept={form.file.accept} onChange={chooseFile} />
                </label>
            )}
            {form.text.map(({ name, label }) => (
                <label key={name}>
                    {label}
                    <input
                        value={text[name]}
                        onChange={(ev) => setText({ ...text, [name]: ev.target.value.trim() })}
                    />
                </label>
            ))}
            <div className="push-save">
                <button
                    className="primary"
                    disabled={saving || !complete}
                    onClick={() => save(false)}
                >
                    {pgettext("Developer page button", "Save")}
                </button>
                {provider === "webhook" && current && (
                    <button disabled={saving || !complete} onClick={() => save(true)}>
                        {pgettext("Developer page button", "Generate a new signing secret")}
                    </button>
                )}
            </div>
        </div>
    );
}

function providerForm(provider: PushProvider): ProviderForm {
    switch (provider) {
        case "apns":
            return {
                title: pgettext("Push notification service name", "iOS (APNs)"),
                file: {
                    name: "key",
                    label: pgettext("APNs credential field", "Auth key (.p8 file)"),
                    accept: ".p8",
                },
                text: [
                    { name: "key_id", label: pgettext("APNs credential field", "Key ID") },
                    { name: "team_id", label: pgettext("APNs credential field", "Team ID") },
                    { name: "bundle_id", label: pgettext("APNs credential field", "Bundle ID") },
                ],
            };
        case "fcm":
            return {
                title: pgettext("Push notification service name", "Android (FCM)"),
                file: {
                    name: "service_account",
                    label: pgettext("FCM credential field", "Service account (.json file)"),
                    accept: ".json,application/json",
                },
                text: [],
            };
        case "webhook":
            return {
                title: pgettext("Notification delivery to the app's own server", "Webhook"),
                text: [{ name: "url", label: pgettext("Webhook setting", "Webhook URL (https)") }],
            };
    }
}

function projectId(service_account: string): unknown {
    try {
        return (JSON.parse(service_account) as { project_id?: unknown }).project_id;
    } catch {
        return undefined;
    }
}
