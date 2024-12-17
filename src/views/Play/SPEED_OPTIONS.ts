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

import moment from "moment";
import { pgettext } from "@/lib/translate";

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
            //time_estimate: "\u223c 4\u2212" + moment.duration(6, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(5, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 5,
                //time_estimate: "~ 4-" + moment.duration(6, "minutes").humanize(),
                time_estimate: "\u223c 4\u2212" + moment.duration(6, "minutes").humanize(),
                max_time: 300,
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 4\u2212" + moment.duration(6, "minutes").humanize(),
            },
        },
        rapid: {
            //time_estimate: "\u223c 7\u2212" + moment.duration(14, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(10, "minutes").humanize(),
            fischer: {
                initial_time: 120,
                time_increment: 7,
                time_estimate: "\u223c 7\u2212" + moment.duration(9, "minutes").humanize(),
                max_time: 1200,
            },
            byoyomi: {
                main_time: 120,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 8\u2212" + moment.duration(14, "minutes").humanize(),
            },
        },
        live: {
            //time_estimate: "\u223c 9\u2212" + moment.duration(17, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(15, "minutes").humanize(),
            fischer: {
                initial_time: 180,
                time_increment: 10,
                time_estimate: "\u223c 9\u2212" + moment.duration(13, "minutes").humanize(),
                max_time: 1800,
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 11\u2212" + moment.duration(17, "minutes").humanize(),
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
            //time_estimate: "\u223c 8\u2212" + moment.duration(10, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(10, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 5,
                time_estimate: "\u223c 8\u2212" + moment.duration(15, "minutes").humanize(),
                max_time: 300,
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 11\u2212" + moment.duration(17, "minutes").humanize(),
            },
        },
        rapid: {
            //time_estimate: "\u223c 16\u2212" + moment.duration(25, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(20, "minutes").humanize(),
            fischer: {
                initial_time: 180,
                time_increment: 7,
                time_estimate: "\u223c 16\u2212" + moment.duration(20, "minutes").humanize(),
                max_time: 1800,
            },
            byoyomi: {
                main_time: 180,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 18\u2212" + moment.duration(25, "minutes").humanize(),
            },
        },
        live: {
            //time_estimate: "\u223c 20\u2212" + moment.duration(35, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(30, "minutes").humanize(),
            fischer: {
                initial_time: 300,
                time_increment: 10,
                time_estimate: "\u223c 20\u2212" + moment.duration(30, "minutes").humanize(),
                max_time: 1800,
            },
            byoyomi: {
                main_time: 600,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 20\u2212" + moment.duration(35, "minutes").humanize(),
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
            //time_estimate: "\u223c 10\u2212" + moment.duration(15, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(15, "minutes").humanize(),
            fischer: {
                initial_time: 30,
                time_increment: 5,
                time_estimate: "\u223c 10\u2212" + moment.duration(15, "minutes").humanize(),
                max_time: 300,
            },
            byoyomi: {
                main_time: 30,
                periods: 5,
                period_time: 10,
                time_estimate: "\u223c 11\u2212" + moment.duration(17, "minutes").humanize(),
            },
        },
        rapid: {
            //time_estimate: "\u223c 21\u2212" + moment.duration(31, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(25, "minutes").humanize(),
            fischer: {
                initial_time: 300,
                time_increment: 7,
                time_estimate: "\u223c 21\u2212" + moment.duration(31, "minutes").humanize(),
                max_time: 3000,
            },
            byoyomi: {
                main_time: 300,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 20\u2212" + moment.duration(35, "minutes").humanize(),
            },
        },
        live: {
            //time_estimate: "\u223c 26\u2212" + moment.duration(52, "minutes").humanize(),
            time_estimate: "\u223c " + moment.duration(40, "minutes").humanize(),
            fischer: {
                initial_time: 600,
                time_increment: 10,
                time_estimate: "\u223c 26\u2212" + moment.duration(52, "minutes").humanize(),
                max_time: 3600,
            },
            byoyomi: {
                main_time: 1200,
                periods: 5,
                period_time: 30,
                time_estimate: "\u223c 28\u2212" + moment.duration(49, "minutes").humanize(),
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
