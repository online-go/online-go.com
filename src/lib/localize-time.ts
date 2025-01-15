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

import { format, parseISO } from "date-fns";
import { getLocale } from "@/lib/date-fns-locale";

export function localize_time_strings(str: string): string {
    try {
        // handle [time="full timestamp"]
        str = str.replace(
            /\[\s*time\s*=\s*["']([0-9a-zA-Z: -]+)["'](format\s*=\s*["']?([a-zA-Z0-9\/ _-]+)["']?)?\]/g,
            (x: string, time: string, fmt?: string) => {
                const date = parseISO(time);

                const zonedDate = date;
                const locale = getLocale();
                return format(zonedDate, fmt || "PPPP p zzz", { locale });
            },
        );

        // handle [date=... time=.. timezone=...]
        str = str.replace(
            /\[\s*date\s*=\s*["']?([0-9]{4}-[0-9]{1,2}-[0-9]{1,2})["']?\s*time\s*=\s*["']?([0-9]{1,2}:[0-9]{1,2}:[0-9]{1,2})["']?\s*timezone\s*=\s*["']?([a-zA-Z0-9\/ _-]+)["']?\s*\s*(format\s*=\s*["']?([a-zA-Z0-9\/ _-]+)["']?)?\]/g,
            (x: string, date: string, time: string, tz: string, y?: string, fmt?: string) => {
                const sourceDate = parseISO(`${date}T${time}`);
                const utcDate = new Date(
                    sourceDate.getTime() - sourceDate.getTimezoneOffset() * 60000,
                );

                const zonedDate = utcDate;
                const locale = getLocale();
                return format(zonedDate, fmt || "PPPP p zzz", { locale });
            },
        );

        return str;
    } catch (e) {
        console.log(e.toString());
        return str;
    }
}
