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
import { format, formatDistanceToNow, endOfDay, addDays, setDay } from "date-fns";
import { getLocale } from "@/lib/date-fns-locale";
import { _, interpolate } from "@/lib/translate";

interface ServerTimeState {
    time: Date;
}
export class ServerTimeDisplay extends React.Component<{}, ServerTimeState> {
    interval?: ReturnType<typeof setInterval>;

    constructor(props: {}) {
        super(props);
        this.state = {
            time: new Date(),
        };
    }

    componentDidMount() {
        this.interval = setInterval(() => this.tick(), 1000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    tick() {
        this.setState({
            time: new Date(),
        });
    }

    weekendTransitionText() {
        const day = new Date().getUTCDay();

        if (day === 6 || day === 0) {
            /* Saturday or Sunday */
            const midnight_sunday = endOfDay(day === 6 ? addDays(new Date(), 1) : new Date());
            return interpolate(_("Weekend ends {{time_from_now}}"), {
                time_from_now: formatDistanceToNow(midnight_sunday, {
                    addSuffix: true,
                    locale: getLocale(),
                }),
            });
        } else {
            const fridayEnd = endOfDay(setDay(new Date(), 5));
            return interpolate(_("Weekend starts {{time_from_now}}"), {
                time_from_now: formatDistanceToNow(fridayEnd, {
                    addSuffix: true,
                    locale: getLocale(),
                }),
            });
        }
    }

    render() {
        const zonedTime = this.state.time;
        return (
            <div className="server-time-display">
                <div>
                    {interpolate(_("Server Time: {{time}}"), {
                        time: format(zonedTime, "EEEE p zzz", { locale: getLocale() }),
                    })}
                </div>
                <div>{this.weekendTransitionText()}</div>
            </div>
        );
    }
}
