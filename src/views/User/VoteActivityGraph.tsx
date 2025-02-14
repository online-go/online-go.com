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

import React, { useEffect, useState } from "react";

import { get } from "@/lib/requests";
import * as data from "@/lib/data";
import { ResponsiveLine, Serie } from "@nivo/line"; // cspell: ignore Serie
import { dropCurrentPeriod } from "@/lib/misc";

interface VoteCountPerDay {
    date: string; // assuming the date is returned as a string, e.g., "2024-03-17"
    count: number;
}

interface ModeratorVoteCountData {
    counts: VoteCountPerDay[];
    moderator_id: number;
}

interface VoteActivityGraphProps {
    vote_data: ModeratorVoteCountData;
}

function startOfWeek(the_date: Date): Date {
    const date = new Date(the_date);
    const day = date.getDay(); // Get current day of week (0 is Sunday)
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
}

const VoteActivityGraph = ({ vote_data }: VoteActivityGraphProps) => {
    const chart_data = React.useMemo(() => {
        const aggregatedByWeek: {
            [key: string]: number;
        } = {};

        // Note: The vote_data.counts array is sorted by date in the backend
        vote_data.counts.forEach((day) => {
            const weekStart = startOfWeek(new Date(day.date)).toISOString().slice(0, 10); // Format as YYYY-MM-DD
            if (!aggregatedByWeek[weekStart]) {
                aggregatedByWeek[weekStart] = 0;
            }
            aggregatedByWeek[weekStart] += day.count;
        });

        const min_date = new Date("2024-02-01");
        const data = Object.entries(aggregatedByWeek)
            .filter(([date, _count]) => new Date(date) >= min_date)
            .map(([date, count]) => ({
                x: date, // x-axis will use the week start date
                y: count, // y-axis will use the aggregated count
            }));

        const completed_weeks = dropCurrentPeriod(data);
        const current_week = data.pop();

        return [
            {
                id: "weekly_votes",
                data: completed_weeks,
            },
            {
                id: "current_week",
                data: [current_week],
            },
        ];
    }, [vote_data]);

    const chart_theme =
        data.get("theme") === "light" // (Accessible theme TBD - this assumes accessible is dark for now)
            ? {
                  grid: { line: { stroke: "#bbbbbb" } },
              }
            : {
                  text: { fill: "#bbbbbb" },
                  tooltip: { container: { color: "#111111" } },
                  grid: { line: { stroke: "#444444" } },
              };

    if (!chart_data[0].data.length) {
        return <div>No activity yet</div>;
    }

    const line_colors = {
        weekly_votes: "rgba(230,183,151, 1)", // matches default in pie charts
        current_week: "rgba(55, 200, 67, 1)", // visually matches nearby green on the page
    };

    return (
        <div className="vote-activity-graph">
            <ResponsiveLine
                data={chart_data as Serie[]}
                animate
                curve="monotoneX"
                enablePoints={true}
                colors={({ id }) => line_colors[id as keyof typeof line_colors]}
                enableSlices="x"
                axisBottom={{
                    format: "%b",
                    tickValues: "every month",
                }}
                xFormat="time:%Y-%m-%d"
                xScale={{
                    min: "2024-02-01",
                    format: "%Y-%m-%d",
                    precision: "day",
                    type: "time",
                    useUTC: false,
                }}
                enableGridX={false}
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

interface UserVoteActivityGraphProps {
    user_id: number;
}

export function UserVoteActivityGraph({ user_id }: UserVoteActivityGraphProps): React.ReactElement {
    const [vote_data, setVoteData] = useState<ModeratorVoteCountData | null>(null);

    // Data fetch
    useEffect(() => {
        const fetchData = async () => {
            const response = await get(`players/${user_id}/moderation?aggregate_by=day`);
            const fetchedData: ModeratorVoteCountData = await response;
            setVoteData(fetchedData);
        };

        fetchData().catch((err) => {
            console.error(err);
        });
    }, [user_id]);

    if (!vote_data) {
        return <div>Loading...</div>;
    }
    return <VoteActivityGraph vote_data={vote_data} />;
}
