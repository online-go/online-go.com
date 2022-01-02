/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import { _, interpolate } from "translate";

interface ServerTimeState {
    time: moment.Moment;
}
export class ServerTimeDisplay extends React.Component<{}, ServerTimeState> {
    intervalID;

    constructor(props) {
        super(props);
        this.state = {
            time: moment().utcOffset(0),
        };
    }

    componentDidMount() {
        this.intervalID = setInterval(() => this.tick(), 1000);
    }

    componentWillUnmount() {
        clearInterval(this.intervalID);
    }

    tick() {
        this.setState({
            time: moment().utcOffset(0),
        });
    }

    weekendTransitionText() {
        const day = new Date().getUTCDay();

        if (day === 6 || day === 0) {
            /* Saturday or Sunday */
            const midnight_sunday =
                day === 6
                    ? moment().utcOffset(0).add(1, "day").endOf("day")
                    : moment().utcOffset(0).endOf("day");
            return interpolate(_("Weekend ends {{time_from_now}}"), {
                time_from_now: midnight_sunday.fromNow(),
            });
        } else {
            return interpolate(_("Weekend starts {{time_from_now}}"), {
                time_from_now: moment()
                    .utcOffset(0)
                    .isoWeekday(5)
                    .endOf("day")
                    .fromNow(),
            });
        }
    }

    render() {
        return (
            <div className="server-time-display">
                <div>
                    {interpolate(_("Server Time: {{time}}"), {
                        time: this.state.time.format("dddd LTS z"),
                    })}
                </div>
                <div>{this.weekendTransitionText()}</div>
            </div>
        );
    }
}
