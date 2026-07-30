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
import "./GobanThemeImportExport.css";

type Status = { kind: "success" | "error"; message: string } | null;

export function GobanThemeImportExport(): React.ReactElement {
    const [open, setOpen] = React.useState(false);
    const [json, setJson] = React.useState("");
    const [status, setStatus] = React.useState<Status>(null);
    const textarea = React.useRef<HTMLTextAreaElement>(null);

    function toggleOpen(): void {
        setOpen((was_open) => {
            if (!was_open) {
                setJson(serializeGobanTheme());
                setStatus(null);
            }
            return !was_open;
        });
    }

    async function copyJson(): Promise<void> {
        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API unavailable");
            }
            await navigator.clipboard.writeText(json);
            setStatus({
                kind: "success",
                message: pgettext("Goban theme JSON clipboard success", "Theme JSON copied."),
            });
        } catch {
            textarea.current?.focus();
            textarea.current?.select();
            setStatus({
                kind: "error",
                message: pgettext(
                    "Goban theme JSON clipboard fallback",
                    "Copy was blocked by the browser. The JSON has been selected for manual copying.",
                ),
            });
        }
    }

    function importJson(): void {
        try {
            importGobanTheme(json);
            setJson(serializeGobanTheme());
            setStatus({
                kind: "success",
                message: pgettext("Goban theme JSON import success", "Theme imported."),
            });
        } catch (error) {
            setStatus({
                kind: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : pgettext(
                              "Goban theme JSON unknown import error",
                              "The theme JSON could not be imported.",
                          ),
            });
        }
    }

    return (
        <div className="GobanThemeImportExport">
            <button
                type="button"
                className="theme-import-export-toggle"
                aria-expanded={open}
                onClick={toggleOpen}
            >
                <i className={`fa fa-caret-${open ? "down" : "right"}`} />
                <span>
                    {pgettext("Toggle goban theme JSON import/export controls", "Import / export")}
                </span>
            </button>

            {open && (
                <div className="theme-import-export-content">
                    <textarea
                        ref={textarea}
                        value={json}
                        aria-label={pgettext("Goban theme JSON editor", "Goban theme JSON")}
                        spellCheck={false}
                        onChange={(event) => {
                            setJson(event.target.value);
                            setStatus(null);
                        }}
                    />
                    <div className="theme-import-export-actions">
                        <button type="button" onClick={copyJson}>
                            {pgettext("Copy goban theme JSON", "Copy")}
                        </button>
                        <button type="button" className="primary" onClick={importJson}>
                            {pgettext("Import goban theme JSON", "Import")}
                        </button>
                    </div>
                    {status && (
                        <small
                            className={`theme-import-export-status ${status.kind}`}
                            role={status.kind === "error" ? "alert" : "status"}
                        >
                            {status.message}
                        </small>
                    )}
                </div>
            )}
        </div>
    );
}
