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
import moment from "moment";
import { ResponsiveLine } from "@nivo/line";
import * as data from "@/lib/data";
import { _ } from "@/lib/translate";
import { Modal } from "@/components/Modal";

interface Events {}

export interface JosekiPageVisits {
    date: string;
    pageVisits: number;
    explorePageVisits: number;
    playPageVisits: number;
    guestPageVisits: number;
}

interface JosekiStatsModalProperties {
    daily_page_visits: Array<JosekiPageVisits>;
}

function round_date(the_date: Date): Date {
    return new Date(the_date.setHours(0, 0, 0, 0));
}

function StatsChart(props: JosekiStatsModalProperties) {
    const chart_data = [
        {
            id: "Total Page Visits",
            data: props.daily_page_visits.map((day) => ({
                x: round_date(new Date(day.date)),
                y: day.pageVisits,
            })),
        },
        {
            id: "Explore Page Visits",
            data: props.daily_page_visits.map((day) => ({
                x: round_date(new Date(day.date)),
                y: day.explorePageVisits,
            })),
        },
        {
            id: "Play Mode Visits",
            data: props.daily_page_visits.map((day) => ({
                x: round_date(new Date(day.date)),
                y: day.playPageVisits,
            })),
        },
        {
            id: "Guest Visits",
            data: props.daily_page_visits.map((day) => ({
                x: round_date(new Date(day.date)),
                y: day.guestPageVisits,
            })),
        },
    ];

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

    return (
        <ResponsiveLine
            data={chart_data}
            animate
            curve="monotoneX"
            enablePoints={false}
            enableSlices="x"
            axisBottom={{
                format: "%b %g",
                tickValues: "every 3 months",
            }}
            xFormat="time:%Y-%m-%d"
            xScale={{
                format: "%Y-%m-%d",
                precision: "day",
                type: "time",
                useUTC: false,
            }}
            axisLeft={{ tickValues: 6 }}
            margin={{
                bottom: 40,
                left: 60,
                right: 20,
                top: 20,
            }}
            theme={chart_theme}
        />
    );
}

export class JosekiStatsModal extends Modal<Events, JosekiStatsModalProperties, any> {
    render() {
        const start_graph = moment("2020-01-15"); // before this time the data is dodgy
        const today = moment().startOf("day");

        const daily_page_visits = this.props.daily_page_visits
            .filter((day) => moment(day.date) > start_graph && moment(day.date) < today)
            // strip out tiny days, which theoretically shouldn't be there in the first place
            // (I think they get there when two people simultaneously click on a position in the first visit of a day)
            .filter((day) => day.pageVisits > 2);

        return (
            <div className="Modal JosekiStatsModal">
                <div className="header">{_("Joseki Explorer Stats - Daily Position Loads")}</div>
                <div className="daily-visit-results">
                    <StatsChart daily_page_visits={daily_page_visits} />
                </div>
            </div>
        );
    }
}
