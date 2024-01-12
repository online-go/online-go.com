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
import { useUser, useRefresh } from "hooks";
import { CommunityModeratorReportTypes, report_categories, ReportDescription } from "Report";
import { report_manager, DAILY_REPORT_GOAL } from "report_manager";
import Select from "react-select";
import { _ } from "translate";
import { ViewReport } from "./ViewReport";
import { ReportsCenterSettings } from "./ReportsCenterSettings";
import { ReportsCenterHistory } from "./ReportsCenterHistory";

interface OtherView {
    special: string;
    title: string;
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
        { special: "hr", title: "" },
        { special: "history", title: "History" },
        { special: "settings", title: "Settings" },
    ]);

const category_priorities: { [type: string]: number } = {};
for (let i = 0; i < report_categories.length; ++i) {
    category_priorities[report_categories[i].type] = i;
}

export function ReportsCenter(): JSX.Element | null {
    const user = useUser();
    const navigateTo = useNavigate();
    const refresh = useRefresh();
    const params = useParams<"category" | "report_id">();
    const report_id = parseInt(params["report_id"] || "0");
    const category = params["category"] || "all";

    const reports = report_manager.getAvailableReports();
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
                const reports = report_manager.getAvailableReports();

                if (reports.length) {
                    for (let i = 0; i < reports.length; ++i) {
                        if (reports[i].report_type === category || category === "all") {
                            navigateTo(`/reports-center/${category}/${reports[i].id}`);
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

    if (!user.is_moderator && !user.moderator_powers) {
        return null;
    }

    const selectReport = (report_id: number) => {
        if (report_id) {
            navigateTo(`/reports-center/${category}/${report_id}`);
        } else {
            navigateTo(`/reports-center/${category}`);
        }
    };

    const visible_categories = user.is_moderator
        ? categories
        : // community moderators supported report types
          report_categories.filter((category) =>
              CommunityModeratorReportTypes.includes(category.type),
          );

    return (
        <div className="ReportsCenter container">
            <h2 className="page-title">
                <i className="fa fa-exclamation-triangle"></i>
                {_("Reports Center")}
            </h2>

            {user.is_moderator && (
                <div className="progress" style={{ minWidth: "10rem" }}>
                    <div
                        className="progress-bar primary"
                        style={{
                            width: `${
                                report_manager.getReportsLeftUntilGoal() <= 0
                                    ? 100
                                    : (Math.min(
                                          DAILY_REPORT_GOAL,
                                          report_manager.getHandledTodayCount(),
                                      ) /
                                          DAILY_REPORT_GOAL) *
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
                                    (report_manager.getReportsLeftUntilGoal() / DAILY_REPORT_GOAL) *
                                    100
                                }%`,
                            }}
                        >
                            {report_manager.getHandledTodayCount() === 0
                                ? "Daily report goal: " + DAILY_REPORT_GOAL
                                : ""}
                        </div>
                    )}
                </div>
            )}

            <div id="ReportsCenterContainer">
                <div id="ReportsCenterCategoryList">
                    {visible_categories.map((report_type, idx): JSX.Element | null => {
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
                    options={categories.filter((opt: any) => opt.special !== "hr")}
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
                    <ReportsCenterHistory />
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
