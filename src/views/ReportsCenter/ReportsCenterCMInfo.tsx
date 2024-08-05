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

import React, { useEffect } from "react";
import { format, subDays, startOfWeek as startOfWeekDateFns } from "date-fns";

import { get } from "requests";

import * as data from "data";

import { ResponsiveLine } from "@nivo/line";
import { useUser } from "hooks";
import { PaginatedTable } from "PaginatedTable";
import { Player } from "Player";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";

interface ReportCount {
    date: string;
    escalated: number;
    consensus: number;
    non_consensus: number;
}

interface AggregatedReportsData {
    [reportType: string]: ReportCount[];
}

interface VoteActivityGraphProps {
    vote_data: ReportCount[];
    period: number; // days to show leading up to today
}
/*
function round_date(the_date: Date): Date {
    return new Date(the_date.setHours(0, 0, 0, 0));
}
*/
function startOfWeek(the_date: Date): Date {
    const date = new Date(the_date);
    const day = date.getDay(); // Get current day of week (0 is Sunday)
    const diff = date.getDate() - day; // Calculate difference to the start of the week

    return new Date(date.setDate(diff));
}

const CMVoteActivityGraph = ({ vote_data, period }: VoteActivityGraphProps) => {
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
        const dropCurrentWeek = (data: { x: string; y: number | null }[]) => {
            const newData = [...data];
            if (newData.length > 0) {
                const lastIndex = newData.length - 1;
                newData[lastIndex] = { ...newData[lastIndex], y: null };
            }
            return newData;
        };
        return [
            {
                id: "consensus",
                data: dropCurrentWeek(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.consensus,
                    })),
                ),
            },
            {
                id: "escalated",
                data: dropCurrentWeek(
                    aggregateDataByWeek.map((week) => ({
                        x: week.date,
                        y: week.escalated,
                    })),
                ),
            },
            {
                id: "non-consensus",
                data: dropCurrentWeek(
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
                        tickValues: 6,
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

export function ReportsCenterCMInfo(): JSX.Element {
    const [vote_data, setVoteData] = React.useState<AggregatedReportsData | null>(null);
    const user = useUser();

    // Data fetch
    useEffect(() => {
        const fetchData = async () => {
            const response = await get(`moderation/cm_vote_summary`);
            const fetchedData: AggregatedReportsData = await response;
            setVoteData(fetchedData);
        };

        fetchData().catch((err) => {
            console.error(err);
        });
    }, []);

    if (!vote_data) {
        return <div>Loading...</div>;
    }

    return (
        <Tabs className="ReportsCenterCMInfo">
            <TabList>
                <Tab>Group Outcomes</Tab>
                {user.is_moderator && <Tab>Individual Outcomes</Tab>}
            </TabList>
            <TabPanel>
                {["overall", "escaping", "stalling", "score_cheating"].map((report_type) => (
                    <div key={report_type}>
                        <h3>{report_type}</h3>
                        {vote_data[report_type] ? (
                            <CMVoteActivityGraph vote_data={vote_data[report_type]} period={120} />
                        ) : (
                            "no data"
                        )}
                    </div>
                ))}
            </TabPanel>
            <TabPanel>
                <PaginatedTable
                    pageSize={4} /* Limit aggregation compute load */
                    pageSizeOptions={[1, 4]}
                    className="individual-overview"
                    name="individual-overview"
                    source={"moderation/cm_overview"}
                    columns={[
                        {
                            header: "CM",
                            className: () => "cm-name",
                            render: (X) => <Player user={X.user_id} />,
                        },
                        {
                            header: "summaries",
                            className: () => "votes",
                            render: (X) => (
                                <CMVoteActivityGraph
                                    vote_data={X.vote_data["overall"]}
                                    period={30}
                                />
                            ),
                        },
                    ]}
                />
            </TabPanel>
        </Tabs>
    );
}
