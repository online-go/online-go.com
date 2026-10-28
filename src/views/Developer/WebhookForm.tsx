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
import { put } from "@/lib/requests";
import { getPrintableError } from "@/lib/misc";
import { alert } from "@/lib/swal_config";

import { PushStatus, WebhookStatus } from "./push_types";
import "./PushCredentialsForm.css";

/** Sets an application's webhook URL, and shows a newly generated signing secret, once. */
export function WebhookForm(props: {
    base: string;
    current: WebhookStatus | null;
    onSaved: (status: PushStatus) => void;
}): React.ReactElement {
    const [url, setUrl] = React.useState(props.current?.url ?? "");
    const [error, setError] = React.useState("");
    const [saving, setSaving] = React.useState(false);
    const [signing_secret, setSigningSecret] = React.useState("");
    const [copied, setCopied] = React.useState(false);

    async function save(rotate_secret: boolean) {
        setError("");
        if (rotate_secret) {
            const { value } = await alert.fire({
                text: pgettext(
                    "Developer page confirmation",
                    "Generate a new signing secret? The current one stops working immediately, so your server will reject our requests until it uses the new one.",
                ),
                showCancelButton: true,
            });
            if (!value) {
                return;
            }
        }
        setSaving(true);
        try {
            const status: PushStatus = await put(`${props.base}/webhook`, { url, rotate_secret });
            setSigningSecret(status.signing_secret ?? "");
            setCopied(false);
            props.onSaved(status);
        } catch (err) {
            setError(getPrintableError(err) ?? "");
        } finally {
            setSaving(false);
        }
    }

    function copy() {
        navigator.clipboard
            .writeText(signing_secret)
            .then(() => setCopied(true))
            .catch(() => setCopied(false));
    }

    return (
        <div className="PushCredentialsForm">
            <label>
                {pgettext("Webhook setting", "Webhook URL (https)")}
                <input
                    type="url"
                    value={url}
                    placeholder="https://"
                    onChange={(ev) => setUrl(ev.target.value)}
                />
            </label>
            {error && <div className="push-error">{error}</div>}
            <div>
                <button
                    className="primary"
                    disabled={saving || !url}
                    onClick={() => void save(false)}
                >
                    {pgettext("Developer page button", "Save webhook")}
                </button>
                {props.current && (
                    <button disabled={saving || !url} onClick={() => void save(true)}>
                        {pgettext("Developer page button", "Generate a new signing secret")}
                    </button>
                )}
            </div>
            {signing_secret && (
                <div className="webhook-signing-secret">
                    <div>
                        {pgettext(
                            "Developer page: shown once after a webhook signing secret is generated",
                            "Your signing secret. Copy it now: it won't be shown again.",
                        )}
                    </div>
                    <code>{signing_secret}</code>
                    <button className="xs" onClick={copy}>
                        {copied
                            ? pgettext("Copied to the clipboard", "Copied")
                            : pgettext("Copy to the clipboard", "Copy")}
                    </button>
                </div>
            )}
        </div>
    );
}
