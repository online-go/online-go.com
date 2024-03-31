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
import { get } from "requests";
import * as data from "data";

import { ResponsiveLine } from "@nivo/line";

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

const CMVoteActivityGraph = ({ vote_data }: VoteActivityGraphProps) => {
    const aggregateDataByWeek = React.useMemo(() => {
        const aggregated: {
            [key: string]: { escalated: number; consensus: number; non_consensus: number };
        } = {};

        vote_data.forEach((entry) => {
            const weekStart = startOfWeek(new Date(entry.date)).toISOString().slice(0, 10); // Get week start and convert to ISO string for key
            if (!aggregated[weekStart]) {
                aggregated[weekStart] = { escalated: 0, consensus: 0, non_consensus: 0 };
            }
            aggregated[weekStart].escalated += entry.escalated;
            aggregated[weekStart].consensus += entry.consensus;
            aggregated[weekStart].non_consensus += entry.non_consensus;
        });

        return Object.entries(aggregated).map(([date, counts]) => ({
            date,
            ...counts,
        }));
    }, [vote_data]);

    const chart_data = React.useMemo(
        () => [
            {
                id: "escalated",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.escalated,
                })),
            },
            {
                id: "consensus",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.consensus,
                })),
            },
            {
                id: "non-consensus",
                data: aggregateDataByWeek.map((week) => ({
                    x: week.date,
                    y: week.non_consensus,
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
        consensus: "green",
        "non-consensus": "red",
        escalated: "orange",
    };

    if (!chart_data[0].data.length) {
        return <div className="aggregate-vote-activity-graph">No activity yet</div>;
    }

    return (
        <div className="aggregate-vote-activity-graph">
            <ResponsiveLine
                data={chart_data}
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
                    min: "2023-12-31",
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
    );
};

export function ReportsCenterCMInfo(): JSX.Element {
    const [vote_data, setVoteData] = React.useState<AggregatedReportsData | null>(null);

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
        <div className="ReportsCenterCMInfo">
            {["overall", "escaping", "stalling", "score_cheating"].map((report_type) => (
                <div key={report_type}>
                    <h3>{report_type}</h3>
                    <CMVoteActivityGraph vote_data={vote_data[report_type]} />
                </div>
            ))}
        </div>
    );
}
