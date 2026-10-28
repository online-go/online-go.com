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
import { put } from "@/lib/requests";
import { getPrintableError } from "@/lib/misc";
import { alert } from "@/lib/swal_config";

import { FcmCredentialsStatus, PushStatus } from "./push_types";
import "./PushCredentialsForm.css";

/** Uploads an application's Firebase service account JSON for FCM. */
export function FcmCredentialsForm(props: {
    base: string;
    current: FcmCredentialsStatus | null;
    device_count: number;
    onSaved: (status: PushStatus) => void;
}): React.ReactElement {
    const [service_account, setServiceAccount] = React.useState("");
    const [project_id, setProjectId] = React.useState("");
    const [file_input_key, setFileInputKey] = React.useState(0);
    const [error, setError] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    function chooseFile(ev: React.ChangeEvent<HTMLInputElement>) {
        const file = ev.target.files?.[0];
        setError("");
        setServiceAccount("");
        setProjectId("");
        if (!file) {
            return;
        }
        file.text()
            .then((text) => {
                let parsed: { project_id?: unknown };
                try {
                    parsed = JSON.parse(text);
                } catch {
                    setError(pgettext("Developer page error", "This file is not valid JSON."));
                    return;
                }
                setServiceAccount(text);
                setProjectId(typeof parsed.project_id === "string" ? parsed.project_id : "");
            })
            .catch((err) => setError(getPrintableError(err) ?? ""));
    }

    async function confirmProjectChange(): Promise<boolean> {
        if (!props.current || props.current.project_id === project_id || props.device_count === 0) {
            return true;
        }
        const { value } = await alert.fire({
            text: interpolate(
                pgettext(
                    "Developer page confirmation",
                    "This service account is for a different Firebase project. Saving it removes the %s registered Android devices. They register again the next time the app starts. Continue?",
                ),
                [props.device_count],
            ),
            showCancelButton: true,
        });
        return !!value;
    }

    async function save() {
        setError("");
        if (!(await confirmProjectChange())) {
            return;
        }
        setSaving(true);
        try {
            props.onSaved(await put(`${props.base}/fcm`, { service_account }));
            setServiceAccount("");
            setProjectId("");
            setFileInputKey(file_input_key + 1);
        } catch (err) {
            setError(getPrintableError(err) ?? "");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="PushCredentialsForm">
            <label>
                {pgettext("FCM credential field", "Service account (.json file)")}
                <input
                    key={file_input_key}
                    type="file"
                    accept=".json,application/json"
                    onChange={chooseFile}
                />
            </label>
            {error && <div className="push-error">{error}</div>}
            <button
                className="primary"
                disabled={saving || !service_account}
                onClick={() => void save()}
            >
                {props.current
                    ? pgettext("Developer page button", "Replace FCM credentials")
                    : pgettext("Developer page button", "Save FCM credentials")}
            </button>
        </div>
    );
}
