/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { computeAverageMoveTime } from "goban";
import { _, pgettext, ngettext, interpolate } from "translate";
import { TimeControl, TimeControlTypes } from "./TimeControl";

const times = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    12,
    15,
    20,
    25,
    30,
    35,
    40,
    45,
    50,
    55,
    60,
    70,
    80,
    90,
    105,
    120,
    150,
    180,
    210,
    240,
    270,
    300,
    360,
    420,
    480,
    540,
    600,
    720,
    900,
    1200,
    1500,
    1800,
    2100,
    2400,
    2700,
    3000,
    3300,
    3600,
    4200,
    4800,
    5400,
    6000,
    6600,
    7200,
    8100,
    9000,
    9900,
    10800,
    12600,
    14400,
    16200,
    18000,
    19800,
    21600,
    25200,
    28800,
    36000,
    43200,
    57600,
    72000,
    86400,
    86400 + 43200,
    86400 * 2,
    86400 * 3,
    86400 * 4,
    86400 * 5,
    86400 * 6,
    86400 * 7,
    86400 * 8,
    86400 * 9,
    86400 * 10,
    86400 * 11,
    86400 * 12,
    86400 * 13,
    86400 * 14,
    86400 * 21,
    86400 * 28,
];

function mktime(t) {
    if (t < 60) {
        return interpolate(t === 1 ? _("1 second") : _("%s seconds"), [t]);
    }
    if (t < 3600) {
        const t1 = Math.floor(t / 60);
        const t2 = t % 60;

        return (
            interpolate(t1 === 1 ? _("1 minute") : _("%s minutes"), [t1]) +
            (t2 ? " " + interpolate(_("%s seconds"), [t2]) : "")
        );
    }
    if (t < 86400) {
        const t1 = Math.floor(t / 3600);
        const t2 = (t % 3600) / 60;

        return (
            interpolate(t1 === 1 ? _("1 hour") : _("%s hours"), [t1]) +
            (t2 ? " " + interpolate(_("%s minutes"), [t2]) : "")
        );
    }

    const t1 = Math.floor(t / 86400);
    const t2 = (t % 86400) / 3600;

    return (
        interpolate(t1 === 1 ? _("1 day") : _("%s days"), [t1]) +
        (t2 ? " " + interpolate(_("%s hours"), [t2]) : "")
    );
}

const zero = {
    time: 0,
    label: _("None"),
};

function gen(min, max) {
    const ret = [];
    for (let i = 0; i < times.length; ++i) {
        if (times[i] >= min && times[i] <= max) {
            ret.push({
                time: times[i],
                label: mktime(times[i]),
            });
        }
    }
    return ret;
}

export const time_options = {
    blitz: {
        fischer: {
            initial_time: gen(5, 300),
            time_increment: gen(1, 10),
            max_time: gen(5, 300),
        },
        simple: {
            per_move: gen(3, 9),
        },
        canadian: {
            main_time: [zero].concat(gen(0, 300)),
            period_time: gen(5, 30),
        },
        byoyomi: {
            main_time: [zero].concat(gen(0, 300)),
            period_time: gen(1, 10),
        },
        absolute: {
            total_time: gen(45, 300),
        },
    },
    live: {
        fischer: {
            initial_time: gen(30, 3600 * 4),
            time_increment: gen(10, 1800),
            max_time: gen(30, 3600 * 4),
        },
        simple: {
            per_move: gen(10, 3600),
        },
        canadian: {
            main_time: [zero].concat(gen(30, 3600 * 4)),
            period_time: gen(20, 3600),
        },
        byoyomi: {
            main_time: [zero].concat(gen(30, 3600 * 4)),
            period_time: gen(10, 3600),
        },
        absolute: {
            total_time: gen(600, 14400),
        },
    },
    correspondence: {
        fischer: {
            initial_time: gen(86400, 86400 * 28),
            time_increment: gen(14400, 86400 * 7),
            max_time: gen(86400, 86400 * 28),
        },
        simple: {
            per_move: gen(3600 * 8, 86400 * 28),
        },
        canadian: {
            main_time: [zero].concat(gen(86400, 86400 * 28)),
            period_time: gen(86400, 86400 * 28),
        },
        byoyomi: {
            main_time: [zero].concat(gen(86400, 86400 * 28)),
            period_time: gen(86400, 86400 * 28),
        },
        absolute: {
            total_time: gen(86400 * 7, 86400 * 28),
        },
    },
};

export function makeTimeControlParameters(tc: any): TimeControl {
    const tpm = computeAverageMoveTime(tc);
    const speed: TimeControlTypes.TimeControlSpeed =
        tpm === 0 || tpm > 3600 ? "correspondence" : tpm < 10 ? "blitz" : "live";

    switch (tc.time_control || tc.system) {
        case "fischer":
            return {
                system: "fischer",
                speed: speed,
                initial_time: parseInt(tc.initial_time),
                time_increment: parseInt(tc.time_increment),
                max_time: parseInt(tc.max_time),
                pause_on_weekends: tc.pause_on_weekends,
            };
        case "byoyomi":
            return {
                system: "byoyomi",
                speed: speed,
                main_time: parseInt(tc.main_time),
                period_time: parseInt(tc.period_time),
                periods: parseInt(tc.periods),
                pause_on_weekends: tc.pause_on_weekends,
            };
        case "simple":
            return {
                system: "simple",
                speed: speed,
                per_move: parseInt(tc.per_move),
                pause_on_weekends: tc.pause_on_weekends,
            };
        case "canadian":
            return {
                system: "canadian",
                speed: speed,
                main_time: parseInt(tc.main_time),
                period_time: parseInt(tc.period_time),
                stones_per_period: parseInt(tc.stones_per_period),
                pause_on_weekends: tc.pause_on_weekends,
            };
        case "absolute":
            return {
                system: "absolute",
                speed: speed,
                total_time: parseInt(tc.total_time),
                pause_on_weekends: tc.pause_on_weekends,
            };
        case "none":
            return {
                system: "none",
                speed: "correspondence",
                pause_on_weekends: tc.pause_on_weekends,
            };
    }
    throw new Error(`Invalid time control type: ${tc.system}`);
}
export function timeControlText(time_control) {
    if (typeof time_control === "object") {
        time_control = time_control.system || time_control.time_control;
    }

    switch (time_control) {
        case "fischer":
            return _("fischer");
        case "none":
            return _("none");
        case "simple":
            return _("simple");
        case "canadian":
            return _("canadian");
        case "byoyomi":
            return _("byo-yomi");
        case "absolute":
            return _("absolute");
    }
    return "[unknown]";
}

export function timeControlDescription(time_control) {
    let ret = "";

    switch (time_control && (time_control.system || time_control.time_control)) {
        case "simple":
            ret = interpolate(_("Simple: %s per move."), [durationString(time_control.per_move)]);
            break;
        case "fischer":
            ret = interpolate(
                _(
                    "Fischer: Clock starts with %s and increments by %s per move up to a maximum of %s.",
                ),
                [
                    durationString(time_control.initial_time),
                    durationString(time_control.time_increment),
                    durationString(time_control.max_time),
                ],
            );
            break;
        case "byoyomi":
            ret = interpolate(
                _("Japanese Byo-Yomi: Clock starts with %s main time, followed by %s %s periods."),
                [
                    durationString(time_control.main_time),
                    time_control.periods,
                    durationString(time_control.period_time),
                ],
            );

            break;
        case "canadian":
            ret = interpolate(
                _(
                    "Canadian Byo-Yomi: Clock starts with %s main time, followed by %s per %s stones.",
                ),
                [
                    durationString(time_control.main_time),
                    durationString(time_control.period_time),
                    time_control.stones_per_period,
                ],
            );
            break;
        case "absolute":
            ret = interpolate(_("Absolute: %s total play time per player."), [
                durationString(time_control.total_time),
            ]);
            break;
        case "none":
            ret = _("No time limits.");
            break;
        default:
            ret =
                "[No time control description for " +
                (time_control && (time_control.system || time_control.time_control)) +
                "]";
            break;
    }

    if (time_control && time_control.pause_on_weekends) {
        ret += " " + _("Pauses on weekends");
    }

    return ret;
}
export function shortTimeControl(time_control) {
    if (typeof time_control !== "object") {
        return "~" + durationString(time_control);
    }

    if (time_control === null) {
        return "";
    }

    switch (time_control.system || time_control.time_control) {
        case "simple":
            return interpolate(pgettext("Simple time: <time>/move", "%s/move"), [
                durationString(time_control.per_move),
            ]);
        case "fischer":
            return interpolate(pgettext("Fischer time", "%s+%s/move, max %s"), [
                durationString(time_control.initial_time),
                durationString(time_control.time_increment),
                durationString(time_control.max_time),
            ]);
        case "byoyomi":
            return interpolate(pgettext("Japanese Byo-Yomi", "%s+%sx%s"), [
                durationString(time_control.main_time),
                time_control.periods,
                durationString(time_control.period_time),
            ]);

        case "canadian":
            return interpolate(pgettext("Canadian Byo-Yomi", "%s+%s/%s"), [
                durationString(time_control.main_time),
                durationString(time_control.period_time),
                time_control.stones_per_period,
            ]);
        case "absolute":
            return durationString(time_control.total_time);
        case "none":
            return _("None");
        default:
            return "[error: " + (time_control.system || time_control.time_control) + "]";
    }
}
export function shortShortTimeControl(time_control) {
    if (typeof time_control !== "object") {
        return "~" + shortDurationString(time_control);
    }

    if (time_control === null) {
        return "";
    }

    switch (time_control.system || time_control.time_control) {
        case "simple":
            return interpolate(pgettext("Simple time: <time>/move", "%s/move"), [
                shortDurationString(time_control.per_move),
            ]);
        case "fischer":
            return interpolate(pgettext("Fischer time", "%s+%s up to %s"), [
                shortDurationString(time_control.initial_time),
                shortDurationString(time_control.time_increment),
                shortDurationString(time_control.max_time),
            ]);
        case "byoyomi":
            return interpolate(pgettext("Japanese Byo-Yomi", "%s+%sx%s"), [
                shortDurationString(time_control.main_time),
                time_control.periods,
                shortDurationString(time_control.period_time),
            ]);
        case "canadian":
            return interpolate(pgettext("Canadian Byo-Yomi", "%s+%s/%s"), [
                shortDurationString(time_control.main_time),
                shortDurationString(time_control.period_time),
                time_control.stones_per_period,
            ]);
        case "absolute":
            return shortDurationString(time_control.total_time);
        case "none":
            return _("None");
        default:
            return "[error: " + (time_control.system || time_control.time_control) + "]";
    }
}

const QUESTIONABLE_SECONDS_PER_MOVE = 4; // less than this gets flagged as may be cheaty.
const QUESTIONABLE_ABSOLUTE_TIME = 900; // Arguably absolute time cheaters don't use > 10 min.  I've seen reports complaining about abuse at 10min though, so set this a bit higher.

export function usedForCheating(time_control) {
    if (typeof time_control !== "object" || time_control === null) {
        return false;
    }

    // either there has to be enough time for the whole game or
    // a sensible ongoing per-move allocation
    switch (time_control.system || time_control.time_control) {
        case "simple":
            return time_control.per_move < QUESTIONABLE_SECONDS_PER_MOVE;

        case "absolute":
            return time_control.total_time <= QUESTIONABLE_ABSOLUTE_TIME;

        case "canadian":
            return !(
                time_control.main_time > QUESTIONABLE_ABSOLUTE_TIME ||
                time_control.period_time / time_control.stones_per_period >
                    QUESTIONABLE_SECONDS_PER_MOVE
            );

        case "byoyomi":
            return !(
                time_control.main_time > QUESTIONABLE_ABSOLUTE_TIME ||
                time_control.period_time > QUESTIONABLE_SECONDS_PER_MOVE
            );

        case "fischer":
            return !(
                time_control.initial_time > QUESTIONABLE_ABSOLUTE_TIME ||
                time_control.time_increment > QUESTIONABLE_SECONDS_PER_MOVE
            );

        case "none":
        default:
            return false;
    }
}

export function timeControlSystemText(system) {
    switch (system) {
        case "simple":
            return pgettext("time control system", "simple");
        case "fischer":
            return pgettext("time control system", "fischer");
        case "byoyomi":
            return pgettext("time control system", "byo-yomi");
        case "canadian":
            return pgettext("time control system", "canadian byo-yomi");
        case "absolute":
            return pgettext("time control system", "absolute");
        case "none":
            return pgettext("time control system", "none");
        default:
            return "[error]";
    }
}
export function validateTimeControl(tc: TimeControl): boolean {
    let error = false;

    for (const k in tc) {
        if (typeof tc[k] === "number" && isNaN(tc[k])) {
            return false;
        }
    }

    switch (tc.system) {
        case "fischer":
            error = error || tc.initial_time < 10;
            error = error || tc.time_increment < 3;
            error = error || tc.max_time < 10;
            return !error;
        case "byoyomi":
            error = error || tc.main_time < 0;
            error = error || tc.period_time < 3;
            error = error || tc.periods < 1;
            return !error;
        case "simple":
            error = error || tc.per_move < 3;
            return !error;
        case "canadian":
            error = error || tc.main_time < 0;
            error = error || tc.period_time < 3;
            error = error || tc.stones_per_period < 1;
            error = error || tc.period_time / tc.stones_per_period < 3;
            return !error;
        case "absolute":
            error = error || tc.total_time < 60;
            return !error;
        case "none":
            return !error;
    }
}
export function isLiveGame(time_control) {
    const average_move_time = computeAverageMoveTime(time_control);
    return average_move_time > 0 && average_move_time < 3600;
}

export function durationString(seconds: number): string {
    const weeks = Math.floor(seconds / (86400 * 7));
    seconds -= weeks * 86400 * 7;
    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    const coarse_fine_time_template = pgettext(
        'Duration strings using two units (e.g. "1 week 3 days", "2 hours 45 minutes"). This is localizable because some languages may need to change the order of the coarse and fine times.',
        "{{coarse}} {{fine}}",
    );
    const weeks_string = ngettext("%s week", "%s weeks", weeks);
    const days_string = ngettext("%s day", "%s days", days);
    const hours_string = ngettext("%s hour", "%s hours", hours);
    const minutes_string = ngettext("%s minute", "%s minutes", minutes);
    const seconds_string = ngettext("%s second", "%s seconds", seconds);

    const coarsest_to_finest: { value: number; template: string }[] = [
        { value: weeks, template: weeks_string },
        { value: days, template: days_string },
        { value: hours, template: hours_string },
        { value: minutes, template: minutes_string },
        { value: seconds, template: seconds_string },
    ];

    for (let i = 0; i < coarsest_to_finest.length - 1; i++) {
        const coarse = coarsest_to_finest[i];
        const fine = coarsest_to_finest[i + 1];

        if (!coarse.value) {
            continue;
        }

        if (fine.value) {
            return interpolate(coarse_fine_time_template, {
                coarse: interpolate(coarse.template, [coarse.value]),
                fine: interpolate(fine.template, [fine.value]),
            });
        }
        return interpolate(coarse.template, [coarse.value]);
    }

    return interpolate(seconds_string, [seconds]);
}

export function daysOnlyDurationString(seconds): string {
    const days = Math.floor(seconds / 86400);

    let ret = "";
    ret += interpolate(_("{{number_of_days}} {{day_or_days_plurality}}"), {
        number_of_days: days,
        day_or_days_plurality: ngettext("Day", "Days", days),
    });
    return ret.trim();
}
export function shortDurationString(seconds) {
    const weeks = Math.floor(seconds / (86400 * 7));
    seconds -= weeks * 86400 * 7;
    const days = Math.floor(seconds / 86400);
    seconds -= days * 86400;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;
    seconds = Math.round(seconds * 10) / 10.0;
    return (
        "" +
        (weeks ? " " + interpolate(pgettext("Short time (weeks)", "%swk"), [weeks]) : "") +
        (days ? " " + interpolate(pgettext("Short time (days)", "%sd"), [days]) : "") +
        (hours ? " " + interpolate(pgettext("Short time (hours)", "%sh"), [hours]) : "") +
        (minutes ? " " + interpolate(pgettext("Short time (minutes)", "%sm"), [minutes]) : "") +
        (seconds ? " " + interpolate(pgettext("Short time (seconds)", "%ss"), [seconds]) : "")
    );
}
