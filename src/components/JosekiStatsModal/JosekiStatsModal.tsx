/*
 * Copyright (C) 2012-2017  Online-Go.com
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
import * as moment from "moment";
import { Chart, AxisOptions } from "react-charts";
import * as data from "data";
import { _ } from "translate";
import { Modal } from "Modal";

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

interface DailyPageVisits {
    date: Date;
    visits: number;
}

function round_date(the_date: Date): Date {
    return new Date(the_date.setHours(0, 0, 0, 0));
}

function StatsChart(props: JosekiStatsModalProperties) {
    const chart_data = [
        {
            label: "Total Page Visits",
            data: props.daily_page_visits.map((day) => ({
                date: round_date(new Date(day.date)),
                visits: day.pageVisits,
            })),
        },
        {
            label: "Explore Page Visits",
            data: props.daily_page_visits.map((day) => ({
                date: round_date(new Date(day.date)),
                visits: day.explorePageVisits,
            })),
        },
        {
            label: "Play Mode Visits",
            data: props.daily_page_visits.map((day) => ({
                date: round_date(new Date(day.date)),
                visits: day.playPageVisits,
            })),
        },
        {
            label: "Guest Visits",
            data: props.daily_page_visits.map((day) => ({
                date: round_date(new Date(day.date)),
                visits: day.guestPageVisits,
            })),
        },
    ];
    const primaryAxis = React.useMemo(
        (): AxisOptions<DailyPageVisits> => ({
            getValue: (datum) => {
                //console.log(datum.date);
                return datum.date;
            },
        }),
        [],
    );

    const secondaryAxes = React.useMemo(
        (): AxisOptions<DailyPageVisits>[] => [
            {
                getValue: (datum) => datum.visits,
            },
        ],
        [],
    );

    // Accessible theme TBD - this assumes accessible is dark for now
    const dark_mode = data.get("theme") === "light" ? false : true;

    return <Chart options={{ data: chart_data, primaryAxis, secondaryAxes, dark: dark_mode }} />;
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
