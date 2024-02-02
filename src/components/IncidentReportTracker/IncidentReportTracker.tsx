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
import * as data from "data";
import { useNavigate } from "react-router-dom";
import { alert } from "swal_config";

import { post } from "requests";
import { usePreference } from "preferences";

import { ignore, errorAlerter } from "misc";
import { Report, report_manager, DAILY_REPORT_GOAL } from "report_manager";
import { useRefresh, useUser } from "hooks";
import * as DynamicHelp from "react-dynamic-help";

export function IncidentReportTracker(): JSX.Element | null {
    const user = useUser();
    const navigate = useNavigate();
    const [normal_ct, setNormalCt] = React.useState(0);
    const [prefer_hidden] = usePreference("hide-incident-reports");
    const refresh = useRefresh();

    const { registerTargetItem, triggerFlow, signalUsed } = React.useContext(DynamicHelp.Api);
    const { ref: incident_report_indicator } = registerTargetItem("incident-report-indicator");
    const { ref: hidden_incident_report_indicator } = registerTargetItem(
        "hidden-incident-report-indicator",
    );

    function goToReportCentre() {
        signalUsed("incident-report-indicator");
        navigate("/reports-center/");
    }

    React.useEffect(() => {
        if (incident_report_indicator && user.moderator_powers) {
            if (!prefer_hidden && normal_ct > 0) {
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

            if (user.is_superuser) {
                setNormalCt(count);
                return;
            }

            if (user.is_moderator || user.moderator_powers > 0) {
                const handled_today = user.reports_handled_today || 0;
                setNormalCt(Math.max(0, Math.min(count, DAILY_REPORT_GOAL - handled_today)));
            } else {
                setNormalCt(count);
            }
        }

        function updateUser() {
            updateCt(report_manager.getAvailableReports().length);
        }

        data.watch("user", updateUser);
        report_manager.on("incident-report", onReport);
        report_manager.on("active-count", updateCt);
        report_manager.on("update", refresh);

        return () => {
            report_manager.off("incident-report", onReport);
            report_manager.off("active-count", updateCt);
            report_manager.off("update", refresh);
            data.unwatch("user", updateUser);
        };
    }, []);

    if (!user) {
        // Can happen when deleting your account, apparently.
        return null;
    }

    const reports = report_manager.getAvailableReports();
    const hide_indicator = (reports.length === 0 && !user.is_moderator) || prefer_hidden;

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
                <div className={"IncidentReportIndicator"} onClick={goToReportCentre}>
                    <i
                        className={`fa fa-exclamation-triangle ${normal_ct > 0 ? "active" : ""}`}
                        ref={incident_report_indicator}
                    />
                    <span className={`count ${normal_ct > 0 ? "active" : ""}`}>{normal_ct}</span>
                </div>
            )}
        </>
    );
}
