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

import { format, subDays, startOfWeek as startOfWeekDateFns } from "date-fns";

import { dropCurrentPeriod } from "@/lib/misc";
import * as data from "@/lib/data";

import { ResponsiveLine } from "@nivo/line";
import React from "react";

function startOfWeek(the_date: Date): Date {
    return startOfWeekDateFns(the_date, { weekStartsOn: 1 }); // 1 = Monday
}

export interface ReportCount {
    date: string;
    escalated: number;
    consensus: number;
    non_consensus: number;
}

export interface ReportAlignmentCount {
    date: string;
    escalated: number;
    unanimous: number;
    non_unanimous: number;
}

// Hardcoding the vertical axis of all "report count" graphs as the total number helps convey
// the relative number of types of reports.

// TBD: it might be nice if this "max" number was dynamically provided by the server, but
// we are already possibly hitting it hard for these rollups

const EXPECTED_MAX_WEEKLY_CM_REPORTS = 200;
const Y_STEP_SIZE = 40; // must divide nicely into EXPECTED_MAX_WEEKLY_CM_REPORTS

interface CMVoteCountGraphProps {
    vote_data: ReportCount[];
    period: number;
}

export const CMVoteCountGraph = ({
    vote_data,
    period,
}: CMVoteCountGraphProps): React.ReactElement => {
    if (!vote_data) {
        vote_data = [];
    }

    const aggregateDataByWeek = React.useMemo(() => {
        const aggregated: {
            [key: string]: {
                escalated: number;
                consensus: number;
                non_consensus: number;
                total: number;
            };
        } = {};

        vote_data.forEach(({ date, escalated, consensus, non_consensus }) => {
            const weekStart = startOfWeek(new Date(date)).toISOString().slice(0, 10); // Get week start and convert to ISO string for key

            if (!aggregated[weekStart]) {
                aggregated[weekStart] = { escalated: 0, consensus: 0, non_consensus: 0, total: 0 };
            }
            aggregated[weekStart].escalated += escalated;
            aggregated[weekStart].consensus += consensus;
            aggregated[weekStart].non_consensus += non_consensus;
            aggregated[weekStart].total += escalated + consensus + non_consensus;
        });

        return Object.entries(aggregated).map(([date, counts]) => ({
            date,
            ...counts,
        }));
    }, [vote_data]);

    const totals_data = React.useMemo(() => {
        return [
            {
                id: "consensus",
                data: dropCurrentPeriod(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.consensus,
                    })),
                ),
            },
            {
                id: "escalated",
                data: dropCurrentPeriod(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.escalated,
                    })),
                ),
            },
            {
                id: "non-consensus",
                data: dropCurrentPeriod(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.non_consensus,
                    })),
                ),
            },
        ];
    }, [aggregateDataByWeek]);

    const percent_data = React.useMemo(
        () => [
            {
                id: "consensus",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.consensus / week.total,
                })),
            },
            {
                id: "escalated",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.escalated / week.total,
                })),
            },
            {
                id: "non-consensus",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.non_consensus / week.total,
                })),
            },
        ],
        [aggregateDataByWeek],
    );

    const chart_theme =
        data.get("theme") === "light" // (Accessible theme TBD - this assumes accessible is dark for now)
            ? {
                  /* nivo defaults work well with our light theme */
              }
            : {
                  text: { fill: "#FFFFFF" },
                  tooltip: { container: { color: "#111111" } },
                  grid: { line: { stroke: "#444444" } },
              };

    const line_colors = {
        consensus: "rgba(0, 128, 0, 1)", // green
        escalated: "rgba(255, 165, 0, 1)", // orange
        "non-consensus": "rgba(255, 0, 0, 1)", // red
    };

    const percent_line_colours = {
        consensus: "rgba(0, 128, 0, 0.4)",
        escalated: "rgba(255, 165, 0, 0.4)",
        "non-consensus": "rgba(255, 0, 0, 0.4)",
    };

    if (!totals_data[0].data.length) {
        return <div className="aggregate-vote-activity-graph">No activity yet</div>;
    }

    return (
        <div className="aggregate-vote-activity-graph">
            <div className="totals-graph">
                <ResponsiveLine
                    data={totals_data}
                    colors={({ id }) => line_colors[id as keyof typeof line_colors]}
                    animate
                    curve="monotoneX"
                    enablePoints={false}
                    enableSlices="x"
                    axisBottom={{
                        format: "%d %b %g",
                        tickValues: "every week",
                    }}
                    xFormat="time:%Y-%m-%d"
                    xScale={{
                        type: "time",
                        min: format(
                            startOfWeekDateFns(subDays(new Date(), period), { weekStartsOn: 1 }),
                            "yyyy-MM-dd",
                        ),
                        format: "%Y-%m-%d",
                        useUTC: false,
                        precision: "day",
                    }}
                    axisLeft={{
                        tickValues: Array.from(
                            { length: EXPECTED_MAX_WEEKLY_CM_REPORTS / Y_STEP_SIZE + 1 },
                            (_, i) => i * Y_STEP_SIZE,
                        ),
                    }}
                    yScale={{
                        stacked: false,
                        type: "linear",
                        min: 0,
                        max: EXPECTED_MAX_WEEKLY_CM_REPORTS,
                    }}
                    margin={{
                        bottom: 40,
                        left: 60,
                        right: 40,
                        top: 5,
                    }}
                    theme={chart_theme}
                />
            </div>
            <div className="percent-graph">
                <ResponsiveLine
                    areaOpacity={1}
                    enableArea
                    data={percent_data}
                    colors={({ id }) =>
                        percent_line_colours[id as keyof typeof percent_line_colours]
                    }
                    animate
                    curve="monotoneX"
                    enablePoints={false}
                    enableSlices="x"
                    axisBottom={{
                        format: "%d %b %g",
                        tickValues: "every week",
                    }}
                    xFormat="time:%Y-%m-%d"
                    xScale={{
                        type: "time",
                        min: format(
                            startOfWeekDateFns(subDays(new Date(), period), { weekStartsOn: 1 }),
                            "yyyy-MM-dd",
                        ),
                        format: "%Y-%m-%d",
                        useUTC: false,
                        precision: "day",
                    }}
                    axisLeft={{
                        format: (d) => `${Math.round(d * 100)}%`, // Format ticks as percentages
                        tickValues: 6,
                    }}
                    yFormat=" >-.0p"
                    yScale={{
                        stacked: true,
                        type: "linear",
                    }}
                    margin={{
                        bottom: 40,
                        left: 60,
                        right: 40,
                        top: 5,
                    }}
                    theme={chart_theme}
                />
            </div>
        </div>
    );
};

interface CMVotingGroupGraphProps {
    vote_data: ReportAlignmentCount[];
    period: number;
}

export const CMVotingGroupGraph = ({
    vote_data,
    period,
}: CMVotingGroupGraphProps): React.ReactElement => {
    if (!vote_data) {
        vote_data = [];
    }

    const aggregateDataByWeek = React.useMemo(() => {
        const aggregated: {
            [key: string]: {
                escalated: number;
                unanimous: number;
                non_unanimous: number;
                total: number;
            };
        } = {};

        vote_data.forEach(({ date, escalated, unanimous, non_unanimous }) => {
            const weekStart = startOfWeek(new Date(date)).toISOString().slice(0, 10); // Get week start and convert to ISO string for key

            if (!aggregated[weekStart]) {
                aggregated[weekStart] = { escalated: 0, unanimous: 0, non_unanimous: 0, total: 0 };
            }
            aggregated[weekStart].escalated += escalated;
            aggregated[weekStart].unanimous += unanimous;
            aggregated[weekStart].non_unanimous += non_unanimous;
            aggregated[weekStart].total += unanimous + non_unanimous;
        });

        return Object.entries(aggregated).map(([date, counts]) => ({
            date,
            ...counts,
        }));
    }, [vote_data]);

    const totals_data = React.useMemo(() => {
        return [
            {
                id: "unanimous",
                data: dropCurrentPeriod(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.unanimous,
                    })),
                ),
            },
            {
                id: "escalated",
                data: dropCurrentPeriod(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.escalated,
                    })),
                ),
            },
            {
                id: "non-unanimous",
                data: dropCurrentPeriod(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.non_unanimous,
                    })),
                ),
            },
        ];
    }, [aggregateDataByWeek]);

    const percent_data = React.useMemo(
        () => [
            {
                id: "unanimous",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.unanimous / week.total,
                })),
            },
            {
                id: "escalated",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.escalated / week.total,
                })),
            },
            {
                id: "non-unanimous",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.non_unanimous / week.total,
                })),
            },
        ],
        [aggregateDataByWeek],
    );

    const chart_theme =
        data.get("theme") === "light" // (Accessible theme TBD - this assumes accessible is dark for now)
            ? {
                  /* nivo defaults work well with our light theme */
              }
            : {
                  text: { fill: "#FFFFFF" },
                  tooltip: { container: { color: "#111111" } },
                  grid: { line: { stroke: "#444444" } },
              };

    const line_colors = {
        unanimous: "rgba(0, 128, 0, 1)", // green
        escalated: "rgba(255, 165, 0, 1)", // orange
        "non-unanimous": "rgba(255, 0, 0, 1)", // red
    };

    if (!totals_data[0].data.length) {
        return <div className="aggregate-vote-activity-graph">No activity yet</div>;
    }

    return (
        <div className="aggregate-vote-activity-graph">
            <div className="totals-graph">
                <ResponsiveLine
                    data={totals_data}
                    colors={({ id }) => line_colors[id as keyof typeof line_colors]}
                    animate
                    curve="monotoneX"
                    enablePoints={false}
                    enableSlices="x"
                    axisBottom={{
                        format: "%d %b %g",
                        tickValues: "every week",
                    }}
                    xFormat="time:%Y-%m-%d"
                    xScale={{
                        type: "time",
                        min: format(
                            startOfWeekDateFns(subDays(new Date(), period), { weekStartsOn: 1 }),
                            "yyyy-MM-dd",
                        ),
                        format: "%Y-%m-%d",
                        useUTC: false,
                        precision: "day",
                    }}
                    axisLeft={{
                        tickValues: Array.from(
                            { length: EXPECTED_MAX_WEEKLY_CM_REPORTS / Y_STEP_SIZE + 1 },
                            (_, i) => i * Y_STEP_SIZE,
                        ),
                    }}
                    yScale={{
                        stacked: false,
                        type: "linear",
                        min: 0,
                        max: EXPECTED_MAX_WEEKLY_CM_REPORTS,
                    }}
                    margin={{
                        bottom: 40,
                        left: 60,
                        right: 40,
                        top: 5,
                    }}
                    theme={chart_theme}
                />
            </div>
            <div className="totals-graph">
                <ResponsiveLine
                    data={percent_data}
                    colors={({ id }) => line_colors[id as keyof typeof line_colors]}
                    animate
                    curve="monotoneX"
                    enablePoints={false}
                    enableSlices="x"
                    axisBottom={{
                        format: "%d %b %g",
                        tickValues: "every week",
                    }}
                    xFormat="time:%Y-%m-%d"
                    xScale={{
                        type: "time",
                        min: format(
                            startOfWeekDateFns(subDays(new Date(), period), { weekStartsOn: 1 }),
                            "yyyy-MM-dd",
                        ),
                        format: "%Y-%m-%d",
                        useUTC: false,
                        precision: "day",
                    }}
                    axisLeft={{
                        format: (d) => `${Math.round(d * 100)}%`, // Format ticks as percentages
                        tickValues: 6,
                    }}
                    yFormat=" >-.0p"
                    yScale={{
                        stacked: false,
                        type: "linear",
                        max: 1,
                    }}
                    margin={{
                        bottom: 40,
                        left: 60,
                        right: 40,
                        top: 5,
                    }}
                    theme={chart_theme}
                />
            </div>
        </div>
    );
};
