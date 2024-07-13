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
import * as preferences from "preferences";
import * as data from "data";
import { Link, useNavigate } from "react-router-dom";
import { alert } from "swal_config";
import { pgettext } from "translate";
import { post } from "requests";
import { usePreference } from "preferences";

import { ignore, errorAlerter } from "misc";
import { report_manager } from "report_manager";
import { Report } from "report_util";
import { useRefresh, useUser } from "hooks";
import * as DynamicHelp from "react-dynamic-help";
import { IncidentReportCard } from "./IncidentReportCard";

export function IncidentReportTracker(): JSX.Element | null {
    const user = useUser();
    const navigate = useNavigate();
    const [show_incident_list, setShowIncidentList] = React.useState(false);
    const [normal_ct, setNormalCt] = React.useState(0);
    const [prefer_hidden] = usePreference("hide-incident-reports");
    const [report_quota] = usePreference("moderator.report-quota");
    const refresh = useRefresh();

    const { registerTargetItem, triggerFlow, signalUsed } = React.useContext(DynamicHelp.Api);
    const { ref: incident_report_indicator } = registerTargetItem("incident-report-indicator");
    const { ref: hidden_incident_report_indicator } = registerTargetItem(
        "hidden-incident-report-indicator",
    );
    const { ref: first_report_button, used: reportButtonUsed } =
        registerTargetItem("first-report-button");

    function toggleList() {
        if (user.is_moderator || user.moderator_powers) {
            signalUsed("incident-report-indicator");
            navigate("/reports-center/");
        } else {
            setShowIncidentList(!show_incident_list);
        }
    }

    React.useEffect(() => {
        if (incident_report_indicator && user.moderator_powers) {
            if (normal_ct > 0) {
                triggerFlow("community-moderator-with-reports-intro");
            } else {
                triggerFlow("community-moderator-no-reports-intro");
            }
        }
    }, [incident_report_indicator, prefer_hidden, normal_ct]);

    React.useEffect(() => {
        const onReport = (report: Report) => {
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
        };

        function updateCt(count: number) {
            const user = data.get("user");

            if ((user.is_moderator || user.moderator_powers > 0) && !!report_quota) {
                const handled_today = user.reports_handled_today || 0;
                setNormalCt(Math.max(0, Math.min(count, report_quota - handled_today)));
            } else {
                setNormalCt(count);
            }
        }

        function updateUser() {
            updateCt(
                report_manager.getEligibleReports().filter((r) => r.report_type !== "troll").length,
            );
        }

        data.watch("user", updateUser);
        data.watch("preferences.moderator.report-quota", updateUser);
        data.watch("preferences.show-cm-reports", updateUser);
        report_manager.on("incident-report", onReport);
        report_manager.on("active-count", updateCt);
        report_manager.on("update", refresh);

        return () => {
            report_manager.off("incident-report", onReport);
            report_manager.off("active-count", updateCt);
            report_manager.off("update", refresh);
            data.unwatch("user", updateUser);
            data.unwatch("preferences.moderator.report-quota", updateUser);
            data.unwatch("preferences.show-cm-reports", updateUser);
        };
    }, []);

    const reportButtonClicked = (report_id: number) => {
        reportButtonUsed();
        navigate(`/reports-center/all/${report_id}`);
    };

    if (!user) {
        // Can happen when deleting your account, apparently.
        return null;
    }

    const reports = report_manager.getEligibleReports();
    const hide_indicator = (reports.length === 0 && !user.is_moderator) || prefer_hidden;

    const filtered_reports = reports.filter(
        (report) =>
            !preferences.get("hide-claimed-reports") ||
            report.moderator === null ||
            report.moderator.id === user.id,
    );

    return (
        <>
            {hide_indicator && (
                /* this is a target for a dynamic help popup talking about why this isn't shown,
                so we need it rendered while hidden */
                <div className={"IncidentReportIndicator"} ref={hidden_incident_report_indicator}>
                    <i className={`fa fa-exclamation-triangle`} style={{ visibility: "hidden" }} />
                </div>
            )}
            {!hide_indicator && (
                <div className={"IncidentReportIndicator"} onClick={toggleList}>
                    <i
                        className={`fa fa-exclamation-triangle ${normal_ct > 0 ? "active" : ""}`}
                        ref={incident_report_indicator}
                    />
                    <span className={`count ${normal_ct > 0 ? "active" : ""}`}>{normal_ct}</span>
                </div>
            )}
            {show_incident_list && (
                <div className="IncidentReportTracker">
                    <div className="IncidentReportList-backdrop" onClick={toggleList}></div>
                    <div className="IncidentReportList-results">
                        {(user.is_moderator || null) && (
                            <h1>
                                <Link to="/reports-center/all">Go to the new Reports Center</Link>
                            </h1>
                        )}
                        <hr />
                        {filtered_reports.length === 0 && user.is_moderator && (
                            // note: normal users would see this if they have the last report and cancel it,
                            // that's why we need to filter for only moderators to see it
                            <div>
                                {pgettext(
                                    "Shown to moderators when there are no active reports",
                                    "No reports left, great job team!",
                                )}
                            </div>
                        )}
                        {filtered_reports.map((report: Report, index) => (
                            <IncidentReportCard
                                key={index}
                                report={report}
                                index={index}
                                first_report_button={first_report_button}
                                reportButtonClicked={reportButtonClicked}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
