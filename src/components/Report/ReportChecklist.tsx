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

import type { ChecklistItemId, ChecklistItemResult } from "@/lib/report_checklist";

import "./ReportChecklist.css";

interface ReportChecklistProps {
    results: ChecklistItemResult[];
    onToggle: (id: ChecklistItemId) => void;
}

/**
 * A satisfied data check is not shown: it taught everything it has to teach by passing
 * without a fuss, and showing a tick just restates something already visible
 * elsewhere in the dialog. A satisfied attestation is kept regardless — it is the
 * reporter's own confirmation, not a fact the system worked out for them, so they
 * should still see it recorded as ticked. This asymmetry is deliberate; the two
 * kinds are not unified into one rule.
 *
 * While any data check is still pending, its per-item row is not shown either. In
 * its place, a single shared "checking" row stands for all of them, so the panel
 * reflows once when the checks resolve rather than once per check, and the reporter
 * still sees why the submit button is disabled while nothing has failed yet.
 * Attestations and already-resolved data checks render alongside that row as usual.
 */
export function ReportChecklist({
    results,
    onToggle,
}: ReportChecklistProps): React.ReactElement | null {
    let showPendingRow = false;
    const rows: ChecklistItemResult[] = [];

    for (const result of results) {
        if (result.state === "pending") {
            showPendingRow = true;
            continue;
        }
        if (result.kind === "data_check" && result.state === "satisfied") {
            continue;
        }
        rows.push(result);
    }

    if (rows.length === 0 && !showPendingRow) {
        return null;
    }

    return (
        <div className="ReportChecklist">
            <div className="checklist-heading">
                {pgettext("Heading above the report submission checklist", "Before you submit")}
            </div>
            <ul>
                {showPendingRow && (
                    <li data-state="pending">
                        <div className="check-row">
                            <span className="marker" aria-hidden="true" />
                            <span className="label-text">
                                {pgettext(
                                    "Report checklist row standing in for all data checks still running",
                                    "Checking…",
                                )}
                            </span>
                        </div>
                    </li>
                )}
                {rows.map((result) => (
                    <li key={result.id} data-checklist-item={result.id} data-state={result.state}>
                        {result.kind === "attestation" ? (
                            <label>
                                <input
                                    type="checkbox"
                                    checked={result.state === "satisfied"}
                                    onChange={() => onToggle(result.id)}
                                />
                                <span className="label-text">{result.label}</span>
                            </label>
                        ) : (
                            <div className="check-row">
                                <span className="marker" aria-hidden="true" />
                                <span className="label-text">{result.label}</span>
                            </div>
                        )}
                        {result.state === "unavailable" && (
                            <div className="detail">
                                {pgettext(
                                    "Shown when a report checklist check could not be run",
                                    "We could not check this, but it will not stop your report.",
                                )}
                            </div>
                        )}
                        {result.state === "actionable" && result.message && (
                            <div className="detail">{result.message}</div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
