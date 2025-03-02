/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 */

import * as React from "react";
import Select from "react-select";
import { useUser } from "@/lib/hooks";
import { ReportNotification } from "@/lib/report_util";
import { report_manager } from "@/lib/report_manager";
import { _ } from "@/lib/translate";
import * as DynamicHelp from "react-dynamic-help";
import { PlayerCacheEntry } from "@/lib/player_cache";
import { get } from "@/lib/requests";
import { errorAlerter } from "@/lib/misc";
import { ViewReport } from "@/views/ReportsCenter/ViewReport";

interface ViewReportHeaderProps {
    reports: ReportNotification[];
    report_id: number;
    selectReport: (report_id: number) => void;
}

let cached_moderators: PlayerCacheEntry[] = [];

// Provides navigation around a set of report-notifications, with a full view of the current report
// Intended for use by moderators, not for users looking at their own reports
// (Users use IncidentReportsList)
export function ModeratorReportsViewer({
    reports,
    report_id,
    selectReport,
}: ViewReportHeaderProps): React.ReactElement {
    const user = useUser();
    const { registerTargetItem } = React.useContext(DynamicHelp.Api);
    const { ref: ignore_button } = registerTargetItem("ignore-button");

    const current_report = reports.find((r) => r.id === report_id);
    const claimed_by_me = current_report?.moderator?.id === user.id;

    React.useEffect(() => {
        if (cached_moderators.length === 0) {
            get("players/?is_moderator=true&page_size=100")
                .then((res) => {
                    cached_moderators = res.results.sort(
                        (a: PlayerCacheEntry, b: PlayerCacheEntry) => {
                            if (a.id === user.id) {
                                return -1;
                            }
                            if (b.id === user.id) {
                                return 1;
                            }
                            return a.username!.localeCompare(b.username as string);
                        },
                    );
                })
                .catch(errorAlerter);
        }
    }, []);

    const claimReport = () => {
        if (!report_id) {
            return;
        }
        if (user.is_moderator) {
            void report_manager.claim(report_id);
        }
    };

    const next = () => {
        const currentIndex = reports.findIndex((r) => r.id === report_id);
        if (currentIndex + 1 < reports.length) {
            selectReport(reports[currentIndex + 1].id);
        } else {
            selectReport(0);
        }
    };

    const prev = () => {
        const currentIndex = reports.findIndex((r) => r.id === report_id);
        if (currentIndex > 0) {
            selectReport(reports[currentIndex - 1].id);
        }
    };

    const currentIndex = reports.findIndex((r) => r.id === report_id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex + 1 < reports.length;

    if (report_id === 0) {
        return (
            <div id="ViewReport">
                <div className="no-report-selected">All done!</div>
            </div>
        );
    }

    return (
        <div className="ReportsViewer">
            <div className="view-report-header">
                {current_report ? (
                    <Select
                        id="ReportsCenterSelectReport"
                        className="reports-center-category-option-select"
                        classNamePrefix="ogs-react-select"
                        value={reports.filter((r) => r.id === report_id)[0]}
                        getOptionValue={(r) => r.id.toString()}
                        onChange={(r: any) => r && selectReport(r.id)}
                        options={reports}
                        isClearable={false}
                        isSearchable={false}
                        blurInputOnSelect={true}
                        components={{
                            Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                                <div
                                    ref={innerRef}
                                    {...innerProps}
                                    className={
                                        "reports-center-selected-report" +
                                        (isFocused ? "focused " : "") +
                                        (isSelected ? "selected" : "")
                                    }
                                >
                                    {R(data.id)}
                                </div>
                            ),
                            SingleValue: ({ innerProps, data }) => (
                                <span {...innerProps} className="reports-center-selected-report">
                                    {R(data.id)}
                                </span>
                            ),
                            ValueContainer: ({ children }) => (
                                <div className="reports-center-selected-report-container">
                                    {children}
                                </div>
                            ),
                        }}
                    />
                ) : (
                    <span className="historical-report-number">{R(report_id)}</span>
                )}

                <span>
                    <button className={"default" + (hasPrev ? "" : " hide")} onClick={prev}>
                        &lt; Prev
                    </button>

                    <button className={"default" + (hasNext ? "" : " hide")} onClick={next}>
                        Next &gt;
                    </button>

                    {(user.is_moderator || null) &&
                        (current_report?.moderator ? (
                            <>
                                {(current_report.moderator.id === user.id || null) && (
                                    <button
                                        className="danger xs"
                                        onClick={() => {
                                            void report_manager.unclaim(report_id);
                                        }}
                                    >
                                        {_("Unclaim")}
                                    </button>
                                )}
                            </>
                        ) : (
                            <button className="primary" onClick={claimReport}>
                                {_("Claim")}
                            </button>
                        ))}
                    {!claimed_by_me && (
                        // Note that CMs _never_ "claim", so they always see this. Yay.
                        <button
                            className="default"
                            ref={ignore_button}
                            onClick={() => {
                                report_manager.ignore(report_id);
                                next();
                            }}
                        >
                            Ignore
                        </button>
                    )}
                </span>
            </div>
            <ViewReport report_id={report_id} advanceToNextReport={next} />
        </div>
    );
}

function R(id: number): string {
    return "R" + `${id}`.slice(-3);
}
