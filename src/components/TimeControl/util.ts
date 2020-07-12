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

import * as data from "data";
import { computeAverageMoveTime } from 'goban';
import {_, pgettext, ngettext, interpolate} from "translate";
import {TimeControl, TimeControlTypes} from "./TimeControl";

const times = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12,
    15, 20, 25, 30, 35, 40, 45, 50, 55, 60,
    70, 80, 90,
    105, 120,
    150, 180, 210, 240, 270, 300,
    360, 420, 480, 540, 600,
    900, 1200, 1500, 1800, 2100, 2400, 2700, 3000, 3300, 3600,
    4200, 4800, 5400, 6000, 6600, 7200,
    8100, 9000, 9900, 10800,
    12600, 14400,
    16200, 18000, 19800, 21600,
    25200, 28800, 36000, 43200,
    57600, 72000,
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
        let t1 = Math.floor(t / 60);
        let t2 = t % 60;

        return interpolate(t1 === 1 ? _("1 minute") : _("%s minutes"), [t1]) +
                (t2 ? " " + interpolate(_("%s seconds"), [t2]) : "");
    }
    if (t < 86400) {
        let t1 = Math.floor(t / 3600);
        let t2 = (t % 3600) / 60;

        return interpolate(t1 === 1 ? _("1 hour") : _("%s hours"), [t1]) +
                (t2 ?  (" " + interpolate(_("%s minutes"), [t2])) : "");
    }

    let t1 = Math.floor(t / 86400);
    let t2 = (t % 86400) / 3600;

    return interpolate(t1 === 1 ? _("1 day") : _("%s days"), [t1]) +
            (t2 ?  (" " + interpolate(_("%s hours"), [t2])) : "");
}

const zero = {
    "time": 0,
    "label": _("None"),
};

function gen(min, max) {
    let ret = [];
    for (let i = 0; i < times.length; ++i) {
        if (times[i] >= min && times[i] <= max) {
            ret.push({
                "time": times[i],
                "label": mktime(times[i]),
            });
        }
    }
    return ret;
}

export const time_options = {
    "blitz": {
        "fischer": {
            "initial_time": gen(5, 300),
            "time_increment": gen(1, 10),
            "max_time": gen(5, 300),
        },
        "simple": {
            "per_move": gen(3, 9),
        },
        "canadian": {
            "main_time": [zero].concat(gen(0, 300)),
            "period_time": gen(5, 30),
        },
        "byoyomi": {
            "main_time": [zero].concat(gen(0, 300)),
            "period_time": gen(1, 10),
        },
        "absolute": {
            "total_time": gen(30, 300),
        },
    },
    "live": {
        "fischer": {
            "initial_time": gen(5, 21600),
            "time_increment": gen(1, 1800),
            "max_time": gen(5, 21600),
        },
        "simple": {
            "per_move": gen(3, 3600),
        },
        "canadian": {
            "main_time": [zero].concat(gen(0, 21600)),
            "period_time": gen(5, 3600),
        },
        "byoyomi": {
            "main_time": [zero].concat(gen(0, 21600)),
            "period_time": gen(1, 1800),
        },
        "absolute": {
            "total_time": gen(30, 21600),
        },
    },
    "correspondence": {
        "fischer": {
            "initial_time": gen(86400, 86400 * 28),
            "time_increment": gen(14400, 86400 * 7),
            "max_time": gen(86400, 86400 * 28),
        },
        "simple": {
            "per_move": gen(86400, 86400 * 28),
        },
        "canadian": {
            "main_time": [zero].concat(gen(86400, 86400 * 28)),
            "period_time": gen(86400, 86400 * 28),
        },
        "byoyomi": {
            "main_time": [zero].concat(gen(86400, 86400 * 28)),
            "period_time": gen(86400, 86400 * 28),
        },
        "absolute": {
            "total_time": gen(86400 * 7, 86400 * 28),
        },
    },
};


export function makeTimeControlParameters(tc: any): TimeControl {
    let tpm = computeAverageMoveTime(tc);
    let speed: TimeControlTypes.TimeControlSpeed = tpm === 0 || tpm > 3600 ? "correspondence" : "live";

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
    if (typeof(time_control) === "object") {
        time_control = time_control.system || time_control.time_control;
    }

    switch (time_control) {
        case "fischer": return _("fischer");
        case "none": return _("none");
        case "simple": return _("simple");
        case "canadian": return _("canadian");
        case "byoyomi": return _("byo-yomi");
        case "absolute": return _("absolute");
    }
    return "[unknown]";
}
function old_computeTimeControl(system, time_per_move) { /* This is old but STILL NEEDED (for archived games)  */
    switch (system) {
        case "simple":
            return {"initial": 0, "per_move": time_per_move, "moves": 0, "max": 0};
        case "fischer":
            return {"initial": time_per_move * 3, "per_move": time_per_move, "moves": 0, "max": Math.min(3600 * 24 * 21, time_per_move * 6)};
        case "canadian":
            return {"initial": Math.min(3600 * 24 * 21, time_per_move * 120), "per_move": time_per_move, "moves": 20, "max": 0};
        case "absolute":
            return {"initial": time_per_move * 180, "per_move": time_per_move, "moves": 0, "max": 0};
        case "none":
            return {"initial": 0, "per_move": 0, "moves": 0, "max": 0};
    }
}
function old_getTimeControlText(time_control_system, time_per_move) { /* This is old but STILL NEEDED (for archived games)  */
    let time_control_text = "";
    let time = old_computeTimeControl(time_control_system, time_per_move);
    switch (time_control_system) {
        case "simple":
            time_control_text = interpolate(_("%s per move"), [durationString(time.per_move)]);
            break;
        case "fischer":
            time_control_text = interpolate(_("%s starting time<br/>plus %s per move<br/> up to a maximum of %s"), [
                                    durationString(time.initial),
                                    durationString(time.per_move),
                                    durationString(time.max)]);
            break;
        case "canadian":
            time_control_text = interpolate(_("%s thinking time<br/>%s per %s moves after that"),
                                    [durationString(time.initial), durationString(Math.min(86400 * 21, time.per_move * time.moves)), time.moves]);
            break;
        case "absolute":
            time_control_text = interpolate(_("%s total play time per player"), [durationString(time.initial)]);
            break;
        case "none":
            $("#time_per_move").attr("disabled", "disabled");
            time_control_text = _("No time limits.");
            break;

    }
    return time_control_text;
}
export function getTimeControlText(time_control_system, time_per_move) {
    return timeControlDescription(time_control_system, time_per_move);
}
export function timeControlDescription(time_control, old_time_per_move?) {
    if (old_time_per_move) {
        return old_getTimeControlText(time_control, old_time_per_move);
    }

    let ret = "";

    switch (time_control && (time_control.system || time_control.time_control)) {
        case "simple":
            ret = interpolate(_("Simple: %s per move."), [durationString(time_control.per_move).toLowerCase()]);
            break;
        case "fischer":
            ret = interpolate(_("Fischer: Clock starts with %s and increments by %s per move up to a maximum of %s."), [
                                    durationString(time_control.initial_time).toLowerCase(),
                                    durationString(time_control.time_increment).toLowerCase(),
                                    durationString(time_control.max_time).toLowerCase()
                                ]);
            break;
        case "byoyomi":
            ret = interpolate(_("Japanese Byo-Yomi: Clock starts with %s main time, followed by %s %s periods."), [
                                    durationString(time_control.main_time).toLowerCase(),
                                    time_control.periods,
                                    durationString(time_control.period_time).toLowerCase()
                                ]);

            break;
        case "canadian":
            ret = interpolate(_("Canadian Byo-Yomi: Clock starts with %s main time, followed by %s per %s stones."), [
                                    durationString(time_control.main_time).toLowerCase(),
                                    durationString(time_control.period_time).toLowerCase(),
                                    time_control.stones_per_period
                                ]);
            break;
        case "absolute":
            ret = interpolate(_("Absolute: %s total play time per player."), [durationString(time_control.total_time).toLowerCase()]);
            break;
        case "none":
            ret = _("No time limits.");
            break;
        default:
            ret = "[No time control description for " + (time_control && (time_control.system || time_control.time_control)) + "]";
            break;
    }

    if (time_control && time_control.pause_on_weekends) {
        ret += " " + _("Pauses on weekends");
    }

    return ret;
}
export function shortTimeControl(time_control) {
    if (typeof(time_control) !== "object") {
        return "~" + durationString(time_control);
    }

    if (time_control === null) {
        return '';
    }

    switch (time_control.system || time_control.time_control) {
        case "simple":
            return interpolate(pgettext("Simple time: <time>/move", "%s/move"), [durationString(time_control.per_move).toLowerCase()]);
        case "fischer":
            return interpolate(pgettext("Fischer time", "%s+%s/move, max %s"), [
                                    durationString(time_control.initial_time).toLowerCase(),
                                    durationString(time_control.time_increment).toLowerCase(),
                                    durationString(time_control.max_time).toLowerCase()
                                ]);
        case "byoyomi":
            return interpolate(pgettext("Japanese Byo-Yomi", "%s+%sx%s"), [
                                    durationString(time_control.main_time).toLowerCase(),
                                    time_control.periods,
                                    durationString(time_control.period_time).toLowerCase().trim()
                                ]);

        case "canadian":
            return interpolate(pgettext("Canadian Byo-Yomi", "%s+%s/%s"), [
                                    durationString(time_control.main_time).toLowerCase(),
                                    durationString(time_control.period_time).toLowerCase(),
                                    time_control.stones_per_period
                                ]);
        case "absolute":
            return durationString(time_control.total_time).toLowerCase();
        case "none":
            return _("None");
        default:
            return "[error: " + (time_control.system || time_control.time_control) + "]";
    }
}
export function shortShortTimeControl(time_control) {
    if (typeof(time_control) !== "object") {
        return "~" + shortDurationString(time_control);
    }

    if (time_control === null) {
        return '';
    }

    switch (time_control.system || time_control.time_control) {
        case "simple":
            return interpolate(pgettext("Simple time: <time>/move", "%s/move"), [shortDurationString(time_control.per_move).toLowerCase()]);
        case "fischer":
            return interpolate(pgettext("Fischer time", "%s+%s up to %s"), [
                                    shortDurationString(time_control.initial_time).toLowerCase(),
                                    shortDurationString(time_control.time_increment).toLowerCase(),
                                    shortDurationString(time_control.max_time).toLowerCase()
                                ]);
        case "byoyomi":
            return interpolate(pgettext("Japanese Byo-Yomi", "%s+%sx%s"), [
                                    shortDurationString(time_control.main_time).toLowerCase(),
                                    time_control.periods,
                                    shortDurationString(time_control.period_time).toLowerCase().trim()
                                ]);
        case "canadian":
            return interpolate(pgettext("Canadian Byo-Yomi", "%s+%s/%s"), [
                                    shortDurationString(time_control.main_time).toLowerCase(),
                                    shortDurationString(time_control.period_time).toLowerCase(),
                                    time_control.stones_per_period
                                ]);
        case "absolute":
            return shortDurationString(time_control.total_time).toLowerCase();
        case "none":
            return _("None");
        default:
            return "[error: " + (time_control.system || time_control.time_control) + "]";
    }
}

const QUESTIONABLE_SECONDS_PER_MOVE = 4;  // less than this gets flagged as may be cheaty.
const QUESTIONABLE_ABSOLUTE_TIME = 900; // Arguably absolute time cheaters don't use > 10 min.  I've seen reports complaining about abuse at 10min though, so set this a bit higher.

export function usedForCheating(time_control) {
    if (typeof(time_control) !== "object" || time_control === null) {
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
                time_control.period_time / time_control.stones_per_period > QUESTIONABLE_SECONDS_PER_MOVE
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
        case "simple"   : return pgettext("time control system", "simple");
        case "fischer"  : return pgettext("time control system", "fischer");
        case "byoyomi"  : return pgettext("time control system", "byo-yomi");
        case "canadian" : return pgettext("time control system", "canadian byo-yomi");
        case "absolute" : return pgettext("time control system", "absolute");
        case "none"     : return pgettext("time control system", "none");
        default    : return "[error]";
    }
}
export function validateTimeControl(tc: TimeControl): boolean {
   let error = false;

    for (let k in tc) {
        if (typeof(tc[k]) === "number" && isNaN(tc[k])) {
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
            error = error || (tc.period_time / tc.stones_per_period) < 3;
            return !error;
        case "absolute":
            error = error || tc.total_time < 60;
            return !error;
        case "none":
            return !error;
    }
}
export function isLiveGame(time_control) {
    let average_move_time = computeAverageMoveTime(time_control);
    return average_move_time > 0 && average_move_time < 3600;
}

export function fullDurationString(seconds) {
    let weeks = Math.floor(seconds / (86400 * 7)); seconds -= weeks * 86400 * 7;
    let days = Math.floor(seconds / 86400); seconds -= days * 86400;
    let hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60); seconds -= minutes * 60;

    function plurality(num, single, plural) {
        num = Math.round(num);
        if (num > 0) {
            if (num === 1) {
                return num + " " + single;
            }
            return num + " " + plural;
        }
        return "";
    }

    return "" +
        (weeks ? " " + plurality(weeks, _("Week"), _("Weeks")) : "") +
        (days ? " " + plurality(days, _("Day"), _("Days")) : "") +
        (hours ? " " + plurality(hours, _("Hour"), _("Hours")) : "") +
        (minutes ? " " + plurality(minutes, _("Minute"), _("Minutes")) : "") +
        (seconds ? " " + plurality(seconds, _("Second"), _("Seconds")) : "");
}
export function durationString(seconds): string {
    let weeks = Math.floor(seconds / (86400 * 7)); seconds -= weeks * 86400 * 7;
    let days = Math.floor(seconds / 86400); seconds -= days * 86400;
    let hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60); seconds -= minutes * 60;

    function plurality(num, single, plural): string {
        num = Math.round(num);
        if (num > 0) {
            if (num === 1) {
                return " " + num + " " + single;
            }
            return " " + num + " " + plural;
        }
        return "";
    }

    let ret: string = "";
    if (weeks) {
        ret += plurality(weeks, _("Week"), _("Weeks"));
        ret += plurality(days, _("Day"), _("Days"));
    }
    else if (days) {
        ret += plurality(days, _("Day"), _("Days"));
        ret += plurality(hours, _("Hour"), _("Hours"));
    }
    else if (hours) {
        ret += plurality(hours, _("Hour"), _("Hours"));
        ret += plurality(minutes, _("Minute"), _("Minutes"));
    }
    else if (minutes) {
        ret += plurality(minutes, _("Minute"), _("Minutes"));
        ret += plurality(seconds, _("Second"), _("Seconds"));
    }
    else {
        ret += plurality(seconds, _("Second"), _("Seconds"));
    }

    return ret.trim();
}
export function daysOnlyDurationString(seconds): string {
    let days = Math.floor(seconds / 86400);

    let ret: string = "";
    ret += interpolate(_("{{number_of_days}} {{day_or_days_plurality}}"), {number_of_days: days, day_or_days_plurality: ngettext("Day", "Days", days)});
    return ret.trim();
}
export function shortDurationString(seconds) {
    let weeks = Math.floor(seconds / (86400 * 7)); seconds -= weeks * 86400 * 7;
    let days = Math.floor(seconds / 86400); seconds -= days * 86400;
    let hours = Math.floor(seconds / 3600); seconds -= hours * 3600;
    let minutes = Math.floor(seconds / 60); seconds -= minutes * 60;
    seconds = Math.round(seconds * 10) / 10.0;
    return "" +
        (weeks ? " " + interpolate(pgettext("Short time (weeks)", "%swk"), [weeks]) : "") +
        (days ? " " + interpolate(pgettext("Short time (days)", "%sd"), [days]) : "") +
        (hours ? " " + interpolate(pgettext("Short time (hours)", "%sh"), [hours]) : "") +
        (minutes ? " " + interpolate(pgettext("Short time (minutes)", "%sm"), [minutes]) : "") +
        (seconds ? " " + interpolate(pgettext("Short time (seconds)", "%ss"), [seconds]) : "");
}
