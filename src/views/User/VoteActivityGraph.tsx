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

import { get } from "requests";
import { AxisOptions, AxisTimeOptions, Chart } from "react-charts";

interface VoteCountPerDay {
    date: string; // assuming the date is returned as a string, e.g., "2024-03-17"
    count: number;
}

interface ModeratorVoteCountData {
    counts: VoteCountPerDay[];
    moderator_id: number;
}

interface VoteActivityGraphProps {
    data: ModeratorVoteCountData;
}

function round_date(the_date: Date): Date {
    return new Date(the_date.setHours(0, 0, 0, 0));
}

const VoteActivityGraph = ({ data }: VoteActivityGraphProps) => {
    const chartData = React.useMemo(
        () => [
            {
                label: "votes",
                data: data?.counts ?? [],
            },
        ],
        [data],
    );

    const primaryAxis: AxisTimeOptions<VoteCountPerDay> = React.useMemo(
        () => ({
            scaleType: "time",
            tickCount: data.counts.length - 1,
            shouldNice: false,
            getValue: (datum: VoteCountPerDay) => {
                console.log(round_date(new Date(datum.date)));
                return round_date(new Date(datum.date));
            },
        }),
        [data],
    );

    const secondaryAxes: AxisOptions<VoteCountPerDay>[] = React.useMemo(
        () => [
            {
                min: 0,
                //formatters: {
                //    scale: (value: number) => Math.round(value).toString(),
                //},
                getValue: (datum: VoteCountPerDay) => {
                    console.log("count:", datum.count);
                    return datum.count;
                },
                elementType: "line",
            },
        ],
        [],
    );

    console.log("chart render", chartData);
    return (
        <div className="vote-activity-graph">
            <Chart options={{ data: chartData, primaryAxis, secondaryAxes, dark: true }} />
        </div>
    );
};

interface UserVoteActivityGraphProps {
    user_id: number;
}

const UserVoteActivityGraph = ({ user_id }: UserVoteActivityGraphProps) => {
    const [data, setData] = useState<ModeratorVoteCountData | null>(null);

    // Data fetch
    useEffect(() => {
        const fetchData = async () => {
            const response = await get(`players/${user_id}/moderation?aggregate_by=day`);
            const fetchedData: ModeratorVoteCountData = await response;
            setData(fetchedData);
        };

        fetchData().catch((err) => {
            console.error(err);
        });
    }, [user_id]);

    if (!data) {
        return <div>Loading...</div>;
    }
    console.log("graph render", data);
    return <VoteActivityGraph data={data} />;
};

export default UserVoteActivityGraph;
