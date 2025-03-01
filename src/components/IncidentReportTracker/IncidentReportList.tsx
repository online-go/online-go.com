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
import * as data from "@/lib/data";
import { alert } from "@/lib/swal_config";
import { post } from "@/lib/requests";

import { ignore, errorAlerter } from "@/lib/misc";
import { ReportNotification } from "@/lib/report_util";

import { IncidentReportCard, ActionableReport } from "./IncidentReportCard";

type IncidentReportListProps = {
    reports: ReportNotification[];
    modal?: boolean;
};

// This presents a list of incident reports with a summary and actions.
// It's intended to be built from Report Notifications that we get from the term server via report_manager
export function IncidentReportList({
    reports,
    modal = true,
}: IncidentReportListProps): React.ReactElement | null {
    function hideList() {
        data.set("ui-state.show_incident_list", false);
    }

    // Attach appropriate actions to each report
    const actionableReports: ActionableReport[] = reports.map((report) => {
        const actionableReport = report as ActionableReport;

        if (actionableReport.state !== "resolved") {
            actionableReport.unclaim = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "unclaim" })
                    .then(ignore)
                    .catch(errorAlerter);
            };
            actionableReport.good_report = () => {
                post(`moderation/incident/${report.id}`, {
                    id: report.id,
                    action: "resolve",
                    was_helpful: true,
                })
                    .then(ignore)
                    .catch(errorAlerter);
            };
            actionableReport.bad_report = () => {
                post(`moderation/incident/${report.id}`, {
                    id: report.id,
                    action: "resolve",
                    was_helpful: false,
                })
                    .then(ignore)
                    .catch(errorAlerter);
            };
            actionableReport.steal = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "steal" })
                    .then((res) => {
                        if (res.vanished) {
                            void alert.fire("Report was removed");
                        }
                    })
                    .catch(errorAlerter);
            };
            actionableReport.claim = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "claim" })
                    .then((res) => {
                        if (res.vanished) {
                            void alert.fire("Report was removed");
                        }
                        if (res.already_claimed) {
                            void alert.fire("Report was removed");
                        }
                    })
                    .catch(errorAlerter);
            };
            actionableReport.cancel = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "cancel" })
                    .then(ignore)
                    .catch(errorAlerter);
            };

            actionableReport.set_note = () => {
                void alert
                    .fire({
                        input: "text",
                        inputValue: report.moderator_note || "",
                        showCancelButton: true,
                    })
                    .then(({ value: txt, isConfirmed }) => {
                        if (isConfirmed) {
                            post(`moderation/incident/${report.id}`, {
                                id: report.id,
                                action: "note",
                                note: txt,
                            })
                                .then(ignore)
                                .catch(errorAlerter);
                        }
                    });
            };
        }
        return actionableReport;
    });

    return (
        <div className="IncidentReportList">
            {modal && <div className="IncidentReportList-backdrop" onClick={hideList}></div>}
            <div className={modal ? "IncidentReportList-modal" : "IncidentReportList-plain"}>
                {actionableReports.map((report: ActionableReport, index) => (
                    <IncidentReportCard key={index} report={report} />
                ))}
            </div>
        </div>
    );
}
