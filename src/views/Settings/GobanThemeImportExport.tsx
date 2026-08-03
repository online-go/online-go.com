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
import { importGobanTheme, serializeGobanTheme } from "@/lib/goban_theme_json";
import { toast } from "@/lib/toast";
import "./GobanThemeImportExport.css";

const SUCCESS_TOAST_DURATION_MS = 3000;

export function GobanThemeImportExport(): React.ReactElement {
    const [import_open, setImportOpen] = React.useState(false);
    const [import_json, setImportJson] = React.useState("");
    const [manual_copy_json, setManualCopyJson] = React.useState<string | null>(null);
    const [error_message, setErrorMessage] = React.useState<string | null>(null);
    const manual_copy_textarea = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (manual_copy_json !== null) {
            manual_copy_textarea.current?.focus();
            manual_copy_textarea.current?.select();
        }
    }, [manual_copy_json]);

    async function copyTheme(): Promise<void> {
        const json = serializeGobanTheme();
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API unavailable");
            }
            await navigator.clipboard.writeText(json);
            setManualCopyJson(null);
            setErrorMessage(null);
            toast(
                <div>{pgettext("Goban theme JSON clipboard success", "Theme JSON copied.")}</div>,
                SUCCESS_TOAST_DURATION_MS,
            );
        } catch {
            setManualCopyJson(json);
            setErrorMessage(
                pgettext(
                    "Goban theme JSON clipboard fallback",
                    "Copy was blocked by the browser. The JSON has been selected for manual copying.",
                ),
            );
        }
    }

    function openImport(): void {
        setImportOpen(true);
        setImportJson("");
        setManualCopyJson(null);
        setErrorMessage(null);
    }

    function cancelImport(): void {
        setImportOpen(false);
        setImportJson("");
        setErrorMessage(null);
    }

    function importTheme(): void {
        try {
            importGobanTheme(import_json);
            setImportOpen(false);
            setImportJson("");
            setErrorMessage(null);
            toast(
                <div>{pgettext("Goban theme JSON import success", "Theme imported.")}</div>,
                SUCCESS_TOAST_DURATION_MS,
            );
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : pgettext(
                          "Goban theme JSON unknown import error",
                          "The theme JSON could not be imported.",
                      ),
            );
        }
    }

    return (
        <div className="GobanThemeImportExport">
            <div className="theme-import-export-actions">
                <button type="button" onClick={copyTheme}>
                    {pgettext("Copy current goban theme JSON", "Copy theme")}
                </button>
                <button type="button" aria-expanded={import_open} onClick={openImport}>
                    {pgettext("Open goban theme JSON import controls", "Import theme")}
                </button>
            </div>

            {manual_copy_json !== null && (
                <textarea
                    ref={manual_copy_textarea}
                    className="manual-copy-json"
                    value={manual_copy_json}
                    aria-label={pgettext(
                        "Goban theme JSON selected for manual copying",
                        "Theme JSON to copy",
                    )}
                    readOnly
                    spellCheck={false}
                />
            )}

            {import_open && (
                <div className="theme-import-export-content">
                    <textarea
                        value={import_json}
                        aria-label={pgettext(
                            "Goban theme JSON import editor",
                            "Theme JSON to import",
                        )}
                        autoFocus
                        spellCheck={false}
                        onChange={(event) => {
                            setImportJson(event.target.value);
                            setErrorMessage(null);
                        }}
                    />
                    <div className="theme-import-export-actions">
                        <button type="button" onClick={cancelImport}>
                            {pgettext("Cancel goban theme JSON import", "Cancel")}
                        </button>
                        <button type="button" className="primary" onClick={importTheme}>
                            {pgettext("Apply imported goban theme JSON", "Apply theme")}
                        </button>
                    </div>
                </div>
            )}

            {error_message && (
                <small className="theme-import-export-status is-error" role="alert">
                    {error_message}
                </small>
            )}
        </div>
    );
}
