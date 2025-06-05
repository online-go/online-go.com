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
import { useNavigate } from "react-router-dom";

import { usePreference } from "@/lib/preferences";

import { report_manager } from "@/lib/report_manager";

import { useRefresh, useUser } from "@/lib/hooks";
import * as DynamicHelp from "react-dynamic-help";
import { IncidentReportList } from "./IncidentReportList";

export function IncidentReportIndicator(): React.ReactElement | null {
    const user = useUser();
    const navigate = useNavigate();
    const [show_incident_list, setShowIncidentList] = React.useState<boolean | undefined>(false);

    const [report_count, setReportCount] = React.useState(0);
    const [prefer_hidden] = usePreference("hide-incident-reports");
    const [prefer_incident_list] = usePreference("moderator.prefer-incident-list");
    const refresh = useRefresh();

    const { registerTargetItem, triggerFlow, signalUsed } = React.useContext(DynamicHelp.Api);
    const { ref: incident_report_indicator, active: incidentReportIndicatorActive } =
        registerTargetItem("incident-report-indicator");

    const { ref: hidden_incident_report_indicator } = registerTargetItem(
        "hidden-incident-report-indicator",
    );

    function toggleList() {
        if (!prefer_incident_list && (user.is_moderator || user.moderator_powers)) {
            signalUsed("incident-report-indicator");
            void navigate("/reports-center/");
        } else {
            data.set("ui-state.show_incident_list", !show_incident_list);
        }
    }

    React.useEffect(() => {
        if (incidentReportIndicatorActive() && user.moderator_powers) {
            if (report_count > 0) {
                triggerFlow("community-moderator-with-reports-intro");
            } else {
                triggerFlow("community-moderator-no-reports-intro");
            }
        }
    }, [incident_report_indicator, prefer_hidden, report_count]);

    React.useEffect(() => {
        function updateCount() {
            setReportCount(report_manager.getNotificationReports().length);
        }

        data.watch("user", updateCount);
        data.watch("preferences.moderator.report-quota", updateCount);
        data.watch("preferences.show-cm-reports", updateCount);

        report_manager.on("active-count", updateCount);
        report_manager.on("update", refresh);

        data.watch("ui-state.show_incident_list", setShowIncidentList);

        return () => {
            report_manager.off("active-count", updateCount);
            report_manager.off("update", refresh);
            data.unwatch("user", updateCount);
            data.unwatch("preferences.moderator.report-quota", updateCount);
            data.unwatch("preferences.show-cm-reports", updateCount);
            data.unwatch("ui-state.show_incident_list", setShowIncidentList);
        };
    }, []);

    if (!user) {
        // Can happen when deleting your account, apparently.
        return null;
    }

    const reports = report_manager.getNotificationReports();
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
                <div className={"IncidentReportIndicator"} onClick={toggleList}>
                    <i
                        className={`fa fa-exclamation-triangle ${report_count > 0 ? "active" : ""}`}
                        ref={incident_report_indicator}
                    />
                    <span className={`count ${report_count > 0 ? "active" : ""}`}>
                        {report_count}
                    </span>
                </div>
            )}
            {!!show_incident_list && <IncidentReportList reports={reports} />}
        </>
    );
}
