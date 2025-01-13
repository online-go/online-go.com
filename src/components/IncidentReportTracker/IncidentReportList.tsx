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
import { Report } from "@/lib/report_util";

import { IncidentReportCard } from "./IncidentReportCard";

// Define a type for the props
type IncidentReportListProps = {
    reports: Report[];
    modal?: boolean;
};

export function IncidentReportList({
    reports,
    modal = true,
}: IncidentReportListProps): React.ReactElement | null {
    function hideList() {
        data.set("ui-state.show_incident_list", false);
    }

    // Attach appropriate actions to each report
    reports.forEach((report) => {
        if (report.state !== "resolved") {
            report.unclaim = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "unclaim" })
                    .then(ignore)
                    .catch(errorAlerter);
            };
            report.good_report = () => {
                post(`moderation/incident/${report.id}`, {
                    id: report.id,
                    action: "resolve",
                    was_helpful: true,
                })
                    .then(ignore)
                    .catch(errorAlerter);
            };
            report.bad_report = () => {
                post(`moderation/incident/${report.id}`, {
                    id: report.id,
                    action: "resolve",
                    was_helpful: false,
                })
                    .then(ignore)
                    .catch(errorAlerter);
            };
            report.steal = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "steal" })
                    .then((res) => {
                        if (res.vanished) {
                            void alert.fire("Report was removed");
                        }
                    })
                    .catch(errorAlerter);
            };
            report.claim = () => {
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
            report.cancel = () => {
                post(`moderation/incident/${report.id}`, { id: report.id, action: "cancel" })
                    .then(ignore)
                    .catch(errorAlerter);
            };

            report.set_note = () => {
                void alert
                    .fire({
                        input: "text",
                        inputValue: report.moderator_note,
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
    });

    return (
        <div className="IncidentReportList">
            {modal && <div className="IncidentReportList-backdrop" onClick={hideList}></div>}
            <div className={modal ? "IncidentReportList-modal" : "IncidentReportList-plain"}>
                {reports.map((report: Report, index) => (
                    <IncidentReportCard key={index} report={report} />
                ))}
            </div>
        </div>
    );
}
