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
import { useNavigate, useParams } from "react-router-dom";
import { useUser, useRefresh } from "@/lib/hooks";
import { report_categories, ReportDescription } from "@/components/Report";
import { report_manager } from "@/lib/report_manager";
import Select from "react-select";
import { _ } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import { community_mod_has_power } from "@/lib/report_util";

import { ViewReport } from "./ViewReport";
import { ReportsCenterSettings } from "./ReportsCenterSettings";
import { ReportsCenterHistory } from "./ReportsCenterHistory";
import { ReportsCenterCMDashboard } from "./ReportsCenterCMDashboard";
import { ReportsCenterCMHistory } from "./ReportsCenterCMHistory";
import { IncidentReportList } from "@/components/IncidentReportTracker";

interface OtherView {
    special: string;
    title: string;
    show_cm: boolean;
    show_all: boolean;
}

const categories: (ReportDescription | OtherView)[] = [
    {
        type: "all",
        title: "All",
        description: "",
    } as ReportDescription | OtherView,
]
    .concat(report_categories)
    .concat([
        {
            type: "appeal",
            title: "Appeals",
            description: "",
        },
    ])
    .concat([
        { special: "hr", title: "", show_cm: true, show_all: false },
        { special: "history", title: "History", show_cm: true, show_all: false },
        { special: "cm", title: "Community Moderation", show_cm: true, show_all: true },
        { special: "my_reports", title: "My Own Reports", show_cm: true, show_all: true },
        { special: "settings", title: "Settings", show_cm: false, show_all: false },
    ]);

const category_priorities: { [type: string]: number } = {};
for (let i = 0; i < report_categories.length; ++i) {
    category_priorities[report_categories[i].type] = i;
}

export function ReportsCenter(): React.ReactElement | null {
    const user = useUser();
    const navigateTo = useNavigate();
    const refresh = useRefresh();
    const params = useParams<"category" | "report_id">();
    const report_id = parseInt(params["report_id"] || "0");
    const category = params["category"] || "all";

    let [report_quota] = usePreference("moderator.report-quota");
    if (!user.is_moderator && !user.moderator_powers) {
        report_quota = 0;
    }

    const reports = report_manager.getEligibleReports();

    const counts: any = {};
    for (const report of reports) {
        counts[report.report_type] = (counts[report.report_type] || 0) + 1;
        counts["all"] = (counts["all"] || 0) + 1;
    }

    React.useEffect(() => {
        // update our counts as they stream in
        report_manager.on("update", refresh);
        return () => {
            report_manager.off("update", refresh);
        };
    }, []);

    React.useEffect(() => {
        if (!category) {
            navigateTo("/reports-center/all");
            return;
        }

        const setToFirstAvailableReport = () => {
            if (!report_id) {
                const reports = report_manager.getEligibleReports();

                if (reports.length) {
                    for (let i = 0; i < reports.length; ++i) {
                        if (reports[i].report_type === category || category === "all") {
                            navigateTo(`/reports-center/${category}/${reports[i].id}`, {
                                replace: true,
                            });
                            return;
                        }
                    }
                }
            }
        };

        setToFirstAvailableReport();

        const syncToFirstAvailableReportIfNotSelected = () => {
            if (!report_id) {
                setToFirstAvailableReport();
            }
        };

        report_manager.on("update", syncToFirstAvailableReportIfNotSelected);
        return () => {
            report_manager.off("update", syncToFirstAvailableReportIfNotSelected);
        };
    }, [category, report_id]);

    const setCategory = React.useCallback((category: string) => {
        navigateTo(`/reports-center/${category}`);
    }, []);

    const selectReport = (report_id: number) => {
        if (report_id) {
            navigateTo(`/reports-center/${category}/${report_id}`);
        } else {
            navigateTo(`/reports-center/${category}`);
        }
    };

    const visible_categories = user.is_moderator
        ? categories
        : user.moderator_powers
          ? // community moderators supported report types
            categories.filter(
                (category) =>
                    ("special" in category && category.show_cm) ||
                    (!("special" in category) &&
                        community_mod_has_power(user.moderator_powers, category.type)),
            )
          : categories.filter((category) => "special" in category && category.show_all);

    const my_reports = report_manager
        .getEligibleReports()
        .filter((report) => report.reporting_user.id === user.id);

    return (
        <div className="ReportsCenter container">
            <h2 className="page-title">
                <i className="fa fa-exclamation-triangle"></i>
                {_("Reports Center")}
            </h2>

            {!!report_quota && (
                <div className="progress" style={{ minWidth: "10rem" }}>
                    <div
                        className="progress-bar primary"
                        style={{
                            width: `${
                                report_manager.getReportsLeftUntilGoal() <= 0
                                    ? 100
                                    : (Math.min(
                                          report_quota,
                                          report_manager.getHandledTodayCount(),
                                      ) /
                                          report_quota) *
                                      100
                            }%`,
                        }}
                    >
                        {report_manager.getReportsLeftUntilGoal() <= 0
                            ? "All done, thank you!"
                            : report_manager.getHandledTodayCount() || ""}
                    </div>

                    {report_manager.getReportsLeftUntilGoal() > 0 && (
                        <div
                            className="progress-bar empty"
                            style={{
                                width: `${
                                    (report_manager.getReportsLeftUntilGoal() / report_quota) * 100
                                }%`,
                            }}
                        >
                            {report_manager.getHandledTodayCount() === 0
                                ? "Daily report goal: " + report_quota
                                : ""}
                        </div>
                    )}
                </div>
            )}

            <div id="ReportsCenterContainer">
                <div id="ReportsCenterCategoryList">
                    {visible_categories.map((report_type, idx): React.ReactElement | null => {
                        if ("type" in report_type) {
                            const ct = counts[report_type.type] || 0;
                            return (
                                <div
                                    key={report_type.type}
                                    className={
                                        "Category " +
                                        (ct > 0 ? "active" : "") +
                                        (category === report_type.type ? " selected" : "")
                                    }
                                    title={report_type.title}
                                    onClick={() => setCategory(report_type.type)}
                                >
                                    <span className="title">{report_type.title}</span>
                                    {/*
                                    <span className={"count " + (ct > 0 ? "active" : "")}>
                                        {ct > 0 ? `(${ct})` : ""}
                                    </span>
                                    */}
                                </div>
                            );
                        }
                        if ("special" in report_type) {
                            switch (report_type.special) {
                                case "hr":
                                    return <hr key={idx} />;
                                case "settings":
                                case "history":
                                case "cm":
                                case "my_reports":
                                    return (
                                        <div
                                            key={report_type.special}
                                            className={
                                                "Category " +
                                                (category === report_type.special
                                                    ? " selected"
                                                    : "")
                                            }
                                            title={report_type.title}
                                            onClick={() => setCategory(report_type.special)}
                                        >
                                            <span className="title">{report_type.title}</span>
                                        </div>
                                    );
                            }
                        }

                        return null;
                    })}
                </div>
                <Select
                    id="ReportsCenterCategoryDropdown"
                    className="reports-center-category-option-select"
                    classNamePrefix="ogs-react-select"
                    value={
                        categories.filter(
                            (opt: any) => opt.type === category || opt.special === category,
                        )[0]
                    }
                    getOptionValue={(data: any) => data.type || data.special}
                    onChange={(data: any) => setCategory(data.type || data.special)}
                    options={visible_categories.filter((opt: any) => opt.special !== "hr")}
                    isClearable={false}
                    isSearchable={false}
                    blurInputOnSelect={true}
                    components={{
                        Option: ({ innerRef, innerProps, isFocused, isSelected, data }) => (
                            <div
                                ref={innerRef}
                                {...innerProps}
                                className={
                                    "reports-center-category " +
                                    (isFocused ? "focused " : "") +
                                    (isSelected ? "selected" : "")
                                }
                            >
                                {data.title}{" "}
                                {/*
                                "type" in data && counts[data.type] > 0
                                    ? `(${counts[data.type] || 0})`
                                    : ""
                                */}
                            </div>
                        ),
                        SingleValue: ({ innerProps, data }) => (
                            <span {...innerProps} className="reports-center-category">
                                {data.title}{" "}
                                {/*
                                "type" in data && counts[data.type] > 0
                                    ? `(${counts[data.type] || 0})`
                                    : ""
                                */}
                            </span>
                        ),
                        ValueContainer: ({ children }) => (
                            <div className="reports-center-category-container">{children}</div>
                        ),
                    }}
                />

                {category === "settings" ? (
                    <ReportsCenterSettings />
                ) : category === "history" ? (
                    user.moderator_powers ? (
                        <ReportsCenterCMHistory />
                    ) : (
                        <ReportsCenterHistory />
                    )
                ) : category === "cm" ? (
                    <ReportsCenterCMDashboard />
                ) : category === "my_reports" ? (
                    <IncidentReportList reports={my_reports} modal={false} />
                ) : category === "hr" ? null : (
                    <ViewReport
                        reports={
                            category === "all"
                                ? reports
                                : reports.filter((x) => x.report_type === category)
                        }
                        onChange={selectReport}
                        report_id={report_id}
                    />
                )}
            </div>
        </div>
    );
}
