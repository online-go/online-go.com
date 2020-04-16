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
import {Chart} from 'react-charts';

import * as data from "data";

import { _ } from 'translate';
import { Modal, openModal } from "Modal";

declare let swal;

interface Events {
}

interface JosekiStatsModalProperties {
    daily_page_visits: Array<{date: string, pageVisits: number,
        explorePageVisits: number, playPageVisits: number, guestPageVisits: number}>;
}

function StatsChart(props: JosekiStatsModalProperties) {
    const stats_data = React.useMemo(() => (
        [
            {
                label: 'Total Page Visits',
                data: props.daily_page_visits.map(day => ({x: new Date(day.date).setHours(0, 0, 0, 0), y: day.pageVisits}))
            },
            {
                label: 'Explore Page Visits',
                data: props.daily_page_visits.map(day => [new Date(day.date).setHours(0, 0, 0, 0), day.explorePageVisits])
            },
            {
                label: 'Play Mode Visits',
                data: props.daily_page_visits.map(day => [new Date(day.date).setHours(0, 0, 0, 0), day.playPageVisits])
            },
            {
                label: 'Guest Visits',
                data: props.daily_page_visits.map(day => [new Date(day.date).setHours(0, 0, 0, 0), day.guestPageVisits])
            }
        ]), [props]);

    const axes =
        [
            { primary: true, type: 'time', position: 'bottom' },
            { type: 'linear', position: 'left' }
        ];

    const series = {
          showPoints: false
        };

    const label_colour = data.get("theme") === "light" ? false : true;

    return (
        <Chart
            data={stats_data} axes={axes} series={series} tooltip dark={label_colour}
        />
    );
}

export class JosekiStatsModal extends Modal<Events, JosekiStatsModalProperties, any> {

    render() {
        //console.log(this.props.daily_page_visits);
        return (
            <div className="Modal JosekiStatsModal" ref="modal">
                <div className="header">{_("Joseki Explorer Stats - Daily Position Loads")}</div>
                <div className="daily-visit-results">
                    <StatsChart daily_page_visits={this.props.daily_page_visits}/>
                </div>
            </div>
        );
    }
}
