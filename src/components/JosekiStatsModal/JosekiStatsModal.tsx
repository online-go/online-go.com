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

import { _ } from 'translate';
import { Modal, openModal } from "Modal";

declare let swal;

interface Events {
}

interface JosekiStatsModalProperties {
    daily_page_visits: Array<{date: string, pageVisits: number}>;
}

export class JosekiStatsModal extends Modal<Events, JosekiStatsModalProperties, any> {
    render() {
        const visits = this.props.daily_page_visits.map((day, index) => (
            <div className="daily-result" key={index}>
                <div className="result-date">{moment(day.date).format("ddd MMM Do")}:</div>
                <div className="result-count">{day.pageVisits}</div>
            </div>
        ));

        return (
            <div className="Modal JosekiStatsModal" ref="modal">
                <div className="header">{_("Joseki Explorer Stats - Daily Page Visits")}</div>
                {visits}
            </div>
        );
    }
}
