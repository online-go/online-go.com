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

import * as moment from "moment-timezone";

export function localize_time_strings(str: string): string {
    //console.log(momenttz);
    try {
        // handle [time="full timestamp"]
        str = str.replace(
            /\[\s*time\s*=\s*["']([0-9a-zA-Z: -]+)["'](format\s*=\s*["']?([a-zA-Z0-9\/ _-]+)["']?)?\]/g,
            (x: string, time: string, fmt?: string) => {
                const t = moment(time).tz(moment.tz.guess());
                return t.format(fmt || "LLLL Z z");
                //return t.format(fmt || "LLLL Z z");
                //return t.format(fmt || "LLLL Z z");
                //return momenttz.tz(`${date} ${time}`, tz).local().format(fmt || "LLLL");
            },
        );

        // handle [date=... time=.. timezone=...]
        str = str.replace(
            /\[\s*date\s*=\s*["']?([0-9]{4}-[0-9]{1,2}-[0-9]{1,2})["']?\s*time\s*=\s*["']?([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})["']?\s*timezone\s*=\s*["']?([a-zA-Z0-9\/ _-]+)["']?\s*\s*(format\s*=\s*["']?([a-zA-Z0-9\/ _-]+)["']?)?\]/g,
            (
                x: string,
                date: string,
                time: string,
                tz: string,
                y?: string,
                fmt?: string,
            ) => {
                const t = moment
                    .tz(`${date} ${time}`, tz)
                    .tz(moment.tz.guess());
                return t.format(fmt || "LLLL Z z");
                //return momenttz.tz(`${date} ${time}`, tz).local().format(fmt || "LLLL");
            },
        );

        return str;
    } catch (e) {
        console.log(e.toString());
        return str;
    }
}
