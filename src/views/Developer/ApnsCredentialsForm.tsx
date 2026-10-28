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

import { ApnsCredentialsStatus, PushStatus } from "./push_types";
import "./PushCredentialsForm.css";

/** Uploads an application's APNs auth key (.p8) with its key, team and bundle IDs. */
export function ApnsCredentialsForm(props: {
    base: string;
    current: ApnsCredentialsStatus | null;
    device_count: number;
    onSaved: (status: PushStatus) => void;
}): React.ReactElement {
    const [key, setKey] = React.useState("");
    const [key_id, setKeyId] = React.useState(props.current?.key_id ?? "");
    const [team_id, setTeamId] = React.useState(props.current?.team_id ?? "");
    const [bundle_id, setBundleId] = React.useState(props.current?.bundle_id ?? "");
    const [file_input_key, setFileInputKey] = React.useState(0);
    const [error, setError] = React.useState("");
    const [saving, setSaving] = React.useState(false);

    function chooseFile(ev: React.ChangeEvent<HTMLInputElement>) {
        const file = ev.target.files?.[0];
        if (file) {
            file.text()
                .then(setKey)
                .catch((err) => setError(getPrintableError(err) ?? ""));
        }
    }

    async function confirmBundleChange(): Promise<boolean> {
        if (!props.current || props.current.bundle_id === bundle_id || props.device_count === 0) {
            return true;
        }
        const { value } = await alert.fire({
            text: interpolate(
                pgettext(
                    "Developer page confirmation",
                    "Changing the bundle ID removes the %s registered iOS devices. They register again the next time the app starts. Continue?",
                ),
                [props.device_count],
            ),
            showCancelButton: true,
        });
        return !!value;
    }

    async function save() {
        setError("");
        if (!(await confirmBundleChange())) {
            return;
        }
        setSaving(true);
        try {
            props.onSaved(await put(`${props.base}/apns`, { key, key_id, team_id, bundle_id }));
            setKey("");
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
                {pgettext("APNs credential field", "Auth key (.p8 file)")}
                <input key={file_input_key} type="file" accept=".p8" onChange={chooseFile} />
            </label>
            <label>
                {pgettext("APNs credential field", "Key ID")}
                <input value={key_id} onChange={(ev) => setKeyId(ev.target.value.trim())} />
            </label>
            <label>
                {pgettext("APNs credential field", "Team ID")}
                <input value={team_id} onChange={(ev) => setTeamId(ev.target.value.trim())} />
            </label>
            <label>
                {pgettext("APNs credential field", "Bundle ID")}
                <input value={bundle_id} onChange={(ev) => setBundleId(ev.target.value.trim())} />
            </label>
            {error && <div className="push-error">{error}</div>}
            <button
                className="primary"
                disabled={saving || !key || !key_id || !team_id || !bundle_id}
                onClick={() => void save()}
            >
                {props.current
                    ? pgettext("Developer page button", "Replace APNs credentials")
                    : pgettext("Developer page button", "Save APNs credentials")}
            </button>
        </div>
    );
}
