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

export function ReportChecklist({
    results,
    onToggle,
}: ReportChecklistProps): React.ReactElement | null {
    if (results.length === 0) {
        return null;
    }

    return (
        <div className="ReportChecklist">
            <div className="checklist-heading">
                {pgettext("Heading above the report submission checklist", "Before you can submit")}
            </div>
            <ul>
                {results.map((result) => (
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
                                    "We could not check this. You can still submit your report.",
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
