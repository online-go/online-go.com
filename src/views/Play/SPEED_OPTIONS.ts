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

import { formatDistanceStrict } from "date-fns";
import { pgettext } from "@/lib/translate";

function formatDuration(minutes: number): string {
    const now = new Date();
    const future = new Date(now.getTime() + minutes * 60 * 1000);
    return formatDistanceStrict(future, now);
}

export interface GameSpeedOptions {
    [size: string]: {
        [speed: string]: {
            time_estimate: string;
            fischer: {
                initial_time: number;
                time_increment: number;
                time_estimate: string;
                max_time: number;
            };
            byoyomi?: {
                main_time: number;
                periods: number;
                period_time: number;
                time_estimate: string;
            };
        };
    };
}
export const SPEED_OPTIONS: GameSpeedOptions = {
    "9x9": {
        blitz: {
            time_estimate: "\u223c " + formatDuration(5),
            fischer: {
                initial_time: 30,
                time_increment: 5,
                time_estimate: "\u223c 4\u2212" + formatDuration(6),
                max_time: 300,
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 4\u2212" + formatDuration(6),
            },
        },
        rapid: {
            time_estimate: "\u223c " + formatDuration(10),
            fischer: {
                initial_time: 120,
                time_increment: 7,
                time_estimate: "\u223c 7\u2212" + formatDuration(9),
                max_time: 1200,
            },
            byoyomi: {
                main_time: 120,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 8\u2212" + formatDuration(14),
            },
        },
        live: {
            time_estimate: "\u223c " + formatDuration(15),
            fischer: {
                initial_time: 180,
                time_increment: 10,
                time_estimate: "\u223c 9\u2212" + formatDuration(13),
                max_time: 1800,
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 11\u2212" + formatDuration(17),
            },
        },
        correspondence: {
            time_estimate: pgettext("Game speed: multi-day games", "Daily Correspondence"),
            fischer: {
                initial_time: 86400 * 3,
                time_increment: 86400,
                time_estimate: "",
                max_time: 86400 * 7,
            },
        },
    },
    "13x13": {
        blitz: {
            time_estimate: "\u223c " + formatDuration(10),
            fischer: {
                initial_time: 30,
                time_increment: 5,
                time_estimate: "\u223c 8\u2212" + formatDuration(15),
                max_time: 300,
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 11\u2212" + formatDuration(17),
            },
        },
        rapid: {
            time_estimate: "\u223c " + formatDuration(20),
            fischer: {
                initial_time: 180,
                time_increment: 7,
                time_estimate: "\u223c 16\u2212" + formatDuration(20),
                max_time: 1800,
            },
            byoyomi: {
                main_time: 180,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 18\u2212" + formatDuration(25),
            },
        },
        live: {
            time_estimate: "\u223c " + formatDuration(30),
            fischer: {
                initial_time: 300,
                time_increment: 10,
                time_estimate: "\u223c 20\u2212" + formatDuration(30),
                max_time: 1800,
            },
            byoyomi: {
                main_time: 600,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 20\u2212" + formatDuration(35),
            },
        },
        correspondence: {
            time_estimate: pgettext("Game speed: multi-day games", "Daily Correspondence"),
            fischer: {
                initial_time: 86400 * 3,
                time_increment: 86400,
                time_estimate: "",
                max_time: 86400 * 7,
            },
        },
    },
    "19x19": {
        blitz: {
            time_estimate: "\u223c " + formatDuration(15),
            fischer: {
                initial_time: 30,
                time_increment: 5,
                time_estimate: "\u223c 10\u2212" + formatDuration(15),
                max_time: 300,
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 11\u2212" + formatDuration(17),
            },
        },
        rapid: {
            time_estimate: "\u223c " + formatDuration(25),
            fischer: {
                initial_time: 300,
                time_increment: 7,
                time_estimate: "\u223c 21\u2212" + formatDuration(31),
                max_time: 3000,
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 20\u2212" + formatDuration(35),
            },
        },
        live: {
            time_estimate: "\u223c " + formatDuration(40),
            fischer: {
                initial_time: 600,
                time_increment: 10,
                time_estimate: "\u223c 26\u2212" + formatDuration(52),
                max_time: 3600,
            },
            byoyomi: {
                main_time: 1200,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 28\u2212" + formatDuration(49),
            },
        },
        correspondence: {
            time_estimate: pgettext("Game speed: multi-day games", "Daily Correspondence"),
            fischer: {
                initial_time: 86400 * 3,
                time_increment: 86400,
                time_estimate: "",
                max_time: 86400 * 7,
            },
        },
    },
};
