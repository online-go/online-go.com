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

import { computeAverageMoveTime, JGOFTimeControl } from "goban";
import { _, pgettext, ngettext, interpolate } from "@/lib/translate";
import { TimeControl, TimeControlTypes } from "./TimeControl";

type TimeControlSystem = TimeControlTypes.TimeControlSystem;
type TimeControlSpeed = TimeControlTypes.TimeControlSpeed;
type ValidTimeControlFormats = TimeControl | JGOFTimeControl | number | null | undefined;

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

function format_time(t: number): string {
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

interface LabeledTimeOption {
    time: number;
    label: string;
}

const zero: LabeledTimeOption = {
    time: 0,
    label: _("None"),
};

function gen(min: number, max: number): LabeledTimeOption[] {
    const ret: any[] = [];
    for (let i = 0; i < times.length; ++i) {
        if (times[i] >= min && times[i] <= max) {
            ret.push({
                time: times[i],
                label: format_time(times[i]),
            });
        }
    }
    return ret;
}

export function parseIntWithDefaultValue(
    value: string,
    defaultValue: number,
    min: number,
    max: number,
): number {
    const parsedInt = parseInt(value, 10);

    if (isNaN(parsedInt)) {
        return defaultValue;
    }

    return Math.max(min, Math.min(max, parsedInt));
}

export function timeControlSystemText(system: TimeControlSystem) {
    if (!system) {
        return "[unknown]";
    }

    switch (system.toLowerCase()) {
        case "fischer":
            return _("Fischer");
        case "simple":
            return _("Simple");
        case "byoyomi":
            return _("Byo-Yomi");
        case "canadian":
            return _("Canadian");
        case "absolute":
            return _("Absolute");
        case "none":
            return _("None");
    }
    return "[unknown]";
}

export function timeControlDescription(_time_control: ValidTimeControlFormats) {
    let ret = "";

    if (typeof _time_control === "number") {
        return durationString(_time_control);
    }

    switch (_time_control?.system || (_time_control as any)?.time_control) {
        case "simple":
            {
                const time_control = _time_control as TimeControlTypes.Simple;
                ret = interpolate(_("Simple: %s per move."), [
                    durationString(time_control.per_move),
                ]);
            }
            break;
        case "fischer":
            {
                const time_control = _time_control as TimeControlTypes.Fischer;
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
            }
            break;
        case "byoyomi":
            {
                const time_control = _time_control as TimeControlTypes.ByoYomi;
                ret = interpolate(
                    _(
                        "Japanese Byo-Yomi: Clock starts with %s main time, followed by %s %s periods.",
                    ),
                    [
                        durationString(time_control.main_time),
                        time_control.periods,
                        durationString(time_control.period_time),
                    ],
                );
            }

            break;
        case "canadian":
            {
                const time_control = _time_control as TimeControlTypes.Canadian;
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
            }

            break;
        case "absolute":
            {
                const time_control = _time_control as TimeControlTypes.Absolute;
                ret = interpolate(_("Absolute: %s total play time per player."), [
                    durationString(time_control.total_time),
                ]);
            }
            break;
        case "none":
            ret = _("No time limits.");
            break;
        default:
            {
                const time_control = _time_control;

                ret =
                    "[No time control description for " +
                    (time_control && (time_control.system || (time_control as any).time_control)) +
                    "]";
            }
            break;
    }

    if (_time_control?.pause_on_weekends) {
        ret += " " + _("Pauses on weekends.");
    }

    return ret;
}
export function shortTimeControl(_time_control: ValidTimeControlFormats) {
    if (_time_control === null || _time_control === undefined) {
        return "";
    }
    if (typeof _time_control !== "object") {
        return "~" + durationString(_time_control);
    }
    switch (_time_control.system || (_time_control as any).time_control) {
        case "simple": {
            const time_control = _time_control as TimeControlTypes.Simple;
            return interpolate(pgettext("Simple time: <time>/move", "%s/move"), [
                durationString(time_control.per_move),
            ]);
        }
        case "fischer": {
            const time_control = _time_control as TimeControlTypes.Fischer;
            return interpolate(pgettext("Fischer time", "%s+%s/move, max %s"), [
                durationString(time_control.initial_time),
                durationString(time_control.time_increment),
                durationString(time_control.max_time),
            ]);
        }
        case "byoyomi": {
            const time_control = _time_control as TimeControlTypes.ByoYomi;
            return interpolate(pgettext("Japanese Byo-Yomi", "%s+%sx%s"), [
                durationString(time_control.main_time),
                time_control.periods,
                durationString(time_control.period_time),
            ]);
        }
        case "canadian": {
            const time_control = _time_control as TimeControlTypes.Canadian;
            return interpolate(pgettext("Canadian Byo-Yomi", "%s+%s/%s"), [
                durationString(time_control.main_time),
                durationString(time_control.period_time),
                time_control.stones_per_period,
            ]);
        }
        case "absolute": {
            const time_control = _time_control as TimeControlTypes.Absolute;
            return durationString(time_control.total_time);
        }
        case "none":
            return _("None");
        default: {
            const time_control = _time_control;
            return "[error: " + (time_control.system || (time_control as any).time_control) + "]";
        }
    }
}
export function shortShortTimeControl(_time_control: ValidTimeControlFormats) {
    if (typeof _time_control === "number") {
        return "~" + shortDurationString(_time_control);
    }

    if (_time_control === null || _time_control === undefined) {
        return "";
    }

    switch (_time_control.system || (_time_control as any).time_control) {
        case "simple": {
            const time_control = _time_control as TimeControlTypes.Simple;
            return interpolate(pgettext("Simple time: <time>/move", "%s/move"), [
                shortDurationString(time_control.per_move),
            ]);
        }
        case "fischer": {
            const time_control = _time_control as TimeControlTypes.Fischer;
            return interpolate(pgettext("Fischer time", "%s+%s up to %s"), [
                shortDurationString(time_control.initial_time),
                shortDurationString(time_control.time_increment),
                shortDurationString(time_control.max_time),
            ]);
        }
        case "byoyomi": {
            const time_control = _time_control as TimeControlTypes.ByoYomi;
            return interpolate(pgettext("Japanese Byo-Yomi", "%s+%sx%s"), [
                shortDurationString(time_control.main_time),
                time_control.periods,
                shortDurationString(time_control.period_time),
            ]);
        }
        case "canadian": {
            const time_control = _time_control as TimeControlTypes.Canadian;
            return interpolate(pgettext("Canadian Byo-Yomi", "%s+%s/%s"), [
                shortDurationString(time_control.main_time),
                shortDurationString(time_control.period_time),
                time_control.stones_per_period,
            ]);
        }
        case "absolute": {
            const time_control = _time_control as TimeControlTypes.Absolute;
            return shortDurationString(time_control.total_time);
        }
        case "none":
            return _("None");
        default: {
            const time_control = _time_control;
            return "[error: " + (time_control.system || (time_control as any).time_control) + "]";
        }
    }
}

const QUESTIONABLE_SECONDS_PER_MOVE = 4; // less than this gets flagged as may be cheating.
const QUESTIONABLE_ABSOLUTE_TIME = 900; // Arguably absolute time cheaters don't use > 10 min.  I've seen reports complaining about abuse at 10min though, so set this a bit higher.

export function usedForCheating(_time_control: ValidTimeControlFormats) {
    if (typeof _time_control !== "object" || _time_control === null) {
        return false;
    }

    // either there has to be enough time for the whole game or
    // a sensible ongoing per-move allocation
    switch (_time_control.system || (_time_control as any).time_control) {
        case "simple": {
            const time_control = _time_control as TimeControlTypes.Simple;
            return time_control.per_move < QUESTIONABLE_SECONDS_PER_MOVE;
        }

        case "absolute": {
            const time_control = _time_control as TimeControlTypes.Absolute;
            return time_control.total_time <= QUESTIONABLE_ABSOLUTE_TIME;
        }

        case "canadian": {
            const time_control = _time_control as TimeControlTypes.Canadian;
            return !(
                time_control.main_time > QUESTIONABLE_ABSOLUTE_TIME ||
                time_control.period_time / time_control.stones_per_period >
                    QUESTIONABLE_SECONDS_PER_MOVE
            );
        }

        case "byoyomi": {
            const time_control = _time_control as TimeControlTypes.ByoYomi;
            return !(
                time_control.main_time > QUESTIONABLE_ABSOLUTE_TIME ||
                time_control.period_time > QUESTIONABLE_SECONDS_PER_MOVE
            );
        }

        case "fischer": {
            const time_control = _time_control as TimeControlTypes.Fischer;
            return !(
                time_control.initial_time > QUESTIONABLE_ABSOLUTE_TIME ||
                time_control.time_increment > QUESTIONABLE_SECONDS_PER_MOVE
            );
        }

        case "none":
        default:
            return false;
    }
}

export function lookingAtOurLiveGame(): boolean {
    // Is the current page looking at a game we are live playing in...
    const goban = window.global_goban;
    if (!goban) {
        return false;
    }
    const player_id = goban.config.player_id;

    return !!(
        goban &&
        goban.engine.phase !== "finished" &&
        isLiveGame(goban.engine.time_control, goban.engine.width, goban.engine.height) &&
        player_id &&
        goban.engine.isParticipant(player_id)
    );
}

export function isLiveGame(time_control: ValidTimeControlFormats, w: number, h: number) {
    const speed = classifyGameSpeed(time_control, w, h);
    return speed === "live" || speed === "blitz";
}

export function classifyGameSpeed(
    time_control: ValidTimeControlFormats,
    w: number,
    h: number,
): TimeControlSpeed {
    if (time_control && typeof time_control === "object") {
        const tpm = computeAverageMoveTime(time_control, w, h);
        return tpm === 0 || tpm > 3600 ? "correspondence" : tpm < 10 ? "blitz" : "live";
    }
    if (typeof time_control === "number") {
        const tpm = time_control;
        return tpm === 0 || tpm > 3600 ? "correspondence" : tpm < 10 ? "blitz" : "live";
    }
    throw new Error(`Invalid time control: ${time_control}`);
}

export function durationString(seconds: number): string {
    seconds = Math.round(seconds);
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

export function daysOnlyDurationString(seconds: number): string {
    seconds = Math.round(seconds);
    const days = Math.floor(seconds / 86400);

    let ret = "";
    ret += interpolate(_("{{number_of_days}} {{day_or_days_plurality}}"), {
        number_of_days: days,
        day_or_days_plurality: ngettext("Day", "Days", days),
    });
    return ret.trim();
}
export function shortDurationString(seconds: number) {
    seconds = Math.round(seconds);
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

type Reify<T extends TimeControlSystem> = T extends "fischer"
    ? TimeControlTypes.Fischer
    : T extends "simple"
      ? TimeControlTypes.Simple
      : T extends "canadian"
        ? TimeControlTypes.Canadian
        : T extends "byoyomi"
          ? TimeControlTypes.ByoYomi
          : T extends "absolute"
            ? TimeControlTypes.Absolute
            : T extends "none"
              ? TimeControlTypes.None
              : never;
export type PropertyOf<T extends TimeControlSystem> = keyof Reify<T> & string;

type TimeOption<T extends TimeControlSystem> = {
    [K in PropertyOf<T>]?: LabeledTimeOption[];
};
type TimeOptions = {
    [K in TimeControlSystem]?: TimeOption<K>;
};
type TimeOptionsMap = {
    [K in TimeControlSpeed]: TimeOptions;
};

export function getTimeOptions(
    speed: TimeControlSpeed,
    system: TimeControlSystem,
    property: string, // Difficult to get this typed properly
): LabeledTimeOption[] {
    return (time_options as any)?.[speed]?.[system]?.[property] ?? [];
}

export function getInputRange(
    speed: TimeControlSpeed,
    system: TimeControlSystem,
    property: string,
): [number, number] | null {
    const min = (default_time_settings as any)[speed][system][property + "_min"];
    const max = (default_time_settings as any)[speed][system][property + "_max"];
    if (min != null && max != null) {
        return [min, max];
    }
    return null;
}

export function getDefaultTimeControl<T extends TimeControlSystem>(
    speed: TimeControlSpeed,
    system: T,
): Reify<T> {
    const settings = default_time_settings[speed][system];
    return Object.assign({}, settings, {
        speed: speed,
        system: system,
    }) as unknown as Reify<T>; // hacky but probably necessary
}

export const time_options: TimeOptionsMap = {
    blitz: {
        fischer: {
            initial_time: gen(5, 180),
            time_increment: gen(1, 5),
            max_time: gen(5, 900),
        },
        simple: {
            per_move: gen(3, 4),
        },
        canadian: {
            main_time: [zero].concat(gen(0, 60)),
            period_time: gen(5, 30),
        },
        byoyomi: {
            main_time: [zero].concat(gen(0, 60)),
            period_time: gen(1, 10),
        },
        absolute: {
            total_time: gen(45, 180),
        },
    },
    rapid: {
        fischer: {
            initial_time: gen(30, 300),
            time_increment: gen(6, 10),
            max_time: gen(30, 3600),
        },
        simple: {
            per_move: gen(5, 10),
        },
        canadian: {
            main_time: [zero].concat(gen(30, 300)),
            period_time: gen(20, 300),
        },
        byoyomi: {
            main_time: [zero].concat(gen(30, 300)),
            period_time: gen(10, 30),
        },
        absolute: {
            total_time: gen(180, 600),
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
            per_move: gen(3600 * 12, 86400 * 28),
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

type TimeControlDefaults = { [K in TimeControlSystem]: Omit<Reify<K>, "speed" | "system"> };
type DefaultTimeSettingsMap = { [K in TimeControlSpeed]: TimeControlDefaults };
export const default_time_settings: DefaultTimeSettingsMap = {
    blitz: {
        fischer: {
            initial_time: 30,
            time_increment: 5,
            max_time: 300,
            pause_on_weekends: false,
        },
        byoyomi: {
            main_time: 30,
            period_time: 5,
            periods: 5,
            periods_min: 1,
            periods_max: 10,
            pause_on_weekends: false,
        },
        canadian: {
            main_time: 30,
            period_time: 20,
            stones_per_period: 3,
            stones_per_period_min: 1,
            stones_per_period_max: 10,
            pause_on_weekends: false,
        },
        simple: {
            per_move: 5,
            pause_on_weekends: false,
        },
        absolute: {
            total_time: 300,
            pause_on_weekends: false,
        },
        none: {
            pause_on_weekends: false,
        },
    },
    rapid: {
        fischer: {
            initial_time: 300,
            time_increment: 7,
            max_time: 3600,
            pause_on_weekends: false,
        },
        byoyomi: {
            main_time: 300,
            period_time: 30,
            periods: 5,
            periods_min: 1,
            periods_max: 10,
            pause_on_weekends: false,
        },
        canadian: {
            main_time: 300,
            period_time: 60,
            stones_per_period: 3,
            stones_per_period_min: 1,
            stones_per_period_max: 10,
            pause_on_weekends: false,
        },
        simple: {
            per_move: 10,
            pause_on_weekends: false,
        },
        absolute: {
            total_time: 600,
            pause_on_weekends: false,
        },
        none: {
            pause_on_weekends: false,
        },
    },
    live: {
        fischer: {
            initial_time: 600,
            time_increment: 10,
            max_time: 3600,
            pause_on_weekends: false,
        },
        byoyomi: {
            main_time: 10 * 60,
            period_time: 30,
            periods: 5,
            periods_min: 1,
            periods_max: 300,
            pause_on_weekends: false,
        },
        canadian: {
            main_time: 10 * 60,
            period_time: 180,
            stones_per_period: 10,
            stones_per_period_min: 1,
            stones_per_period_max: 50,
            pause_on_weekends: false,
        },
        simple: {
            per_move: 15,
            pause_on_weekends: false,
        },
        absolute: {
            total_time: 900,
            pause_on_weekends: false,
        },
        none: {
            pause_on_weekends: false,
        },
    },
    correspondence: {
        fischer: {
            initial_time: 3 * 86400,
            time_increment: 86400,
            max_time: 7 * 86400,
            pause_on_weekends: true,
        },
        byoyomi: {
            main_time: 7 * 86400,
            period_time: 1 * 86400,
            periods: 5,
            periods_min: 1,
            periods_max: 300,
            pause_on_weekends: true,
        },
        canadian: {
            main_time: 7 * 86400,
            period_time: 7 * 86400,
            stones_per_period: 10,
            stones_per_period_min: 1,
            stones_per_period_max: 50,
            pause_on_weekends: true,
        },
        simple: {
            per_move: 2 * 86400,
            pause_on_weekends: true,
        },
        absolute: {
            total_time: 28 * 86400,
            pause_on_weekends: true,
        },
        none: {
            pause_on_weekends: false,
        },
    },
};
