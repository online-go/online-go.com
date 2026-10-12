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

import { socket } from "@/lib/sockets";
import { getUserRating } from "@/lib/rank_utils";
import { BotAllowedClockSettingsV1, BotAllowedClockSettingsV2, BotConfig, User } from "goban";
import EventEmitter from "eventemitter3";
import { interpolate, pgettext } from "./translate";
import type { TimeControl, TimeControlTypes } from "@/components/TimeControl";
import { shortDurationString } from "@/components/TimeControl/util";

interface Events {
    updated: () => void;
}
export interface Bot extends User {
    config: BotConfig;
    disabled?: string; // if not undefined, the string describes why
}

export const bot_event_emitter = new EventEmitter<Events>();
let active_bots: { [id: number]: Bot } = {};
let _bots_list: Bot[] = [];

export function bots() {
    return active_bots;
}
export function bots_list(): Array<Bot> {
    return _bots_list;
}
export function one_bot() {
    for (const k in active_bots) {
        return active_bots[k];
    }
    return null;
}
export function bot_count() {
    return Object.keys(active_bots).length;
}

export interface BotChallengeOptions {
    /** The challenging player's ranking */
    rank: number;
    width: number;
    height: number;
    ranked: boolean;
    handicap: boolean;
    /** Only set when the player picked a custom komi */
    komi?: number;
    time_control: TimeControl;

    /* This will be set by getAcceptableTimeSetting() to match the config
     * version the bot is using */
    _config_version?: number;
}

/** Converts a rank string such as "25k", "3d" or "1p" to a ranking number,
 * the same way gtp2ogs does when it checks `allowed_rank_range`. */
export function botRankNumber(rank: string): number {
    const base = parseInt(rank);
    const suffix = rank[rank.length - 1].toLowerCase();

    if (suffix === "p") {
        return 999;
    }
    if (suffix === "d") {
        return 29 + base;
    }
    return 30 - base;
}

/** Formats a duration in seconds for bot setting messages */
export function botDurationString(seconds: number): string {
    return (
        shortDurationString(seconds).trim() ||
        interpolate(pgettext("Short time (seconds)", "%ss"), [0])
    );
}

function outOfRangeMessage(
    setting: string,
    range: [number, number],
    format: (value: number) => string,
): string {
    return interpolate(
        pgettext(
            "Why a bot can not play with the selected game settings. {{setting}} is the name of a time setting such as 'Main time'.",
            "{{setting}} must be from {{min}} to {{max}}",
        ),
        { setting, min: format(range[0]), max: format(range[1]) },
    );
}

export interface BotTimeSettingRange {
    /** Translated name of the setting, such as "Main time" */
    setting: string;
    range: [number, number];
    format: (value: number) => string;
    /** Reads the setting from a time control of the same system */
    value: (time_control: TimeControl) => number;
}

/** Lists the ranges a bot accepts for each setting of a time control system,
 * or returns null when the bot does not play that system with these
 * settings. */
export function botTimeSettingRanges(
    bot: Bot,
    system: TimeControl["system"],
    settings?: BotAllowedClockSettingsV1 | BotAllowedClockSettingsV2,
): BotTimeSettingRange[] | null {
    const count = (value: number) => value.toString();

    switch (system) {
        case "simple":
            if (!settings?.simple) {
                return null;
            }
            return [
                {
                    setting: pgettext("Name of a time setting", "Time per move"),
                    range: settings.simple.per_move_time_range,
                    format: botDurationString,
                    value: (tc) => (tc as TimeControlTypes.Simple).per_move,
                },
            ];

        case "fischer": {
            if (!settings?.fischer) {
                return null;
            }
            const initial_time = {
                setting: pgettext("Name of a time setting", "Initial time"),
                format: botDurationString,
                value: (tc: TimeControl) => (tc as TimeControlTypes.Fischer).initial_time,
            };
            const time_increment = {
                setting: pgettext("Name of a time setting", "Time increment"),
                range: settings.fischer.time_increment_range,
                format: botDurationString,
                value: (tc: TimeControl) => (tc as TimeControlTypes.Fischer).time_increment,
            };
            if (bot.config._config_version === 1) {
                // v1 configs compare the initial time against max_time_range
                return [
                    { ...initial_time, range: settings.fischer.max_time_range },
                    time_increment,
                ];
            }
            const fischer = (settings as BotAllowedClockSettingsV2).fischer!;
            return [
                { ...initial_time, range: fischer.initial_time_range },
                {
                    setting: pgettext("Name of a time setting", "Max time"),
                    range: fischer.max_time_range,
                    format: botDurationString,
                    value: (tc) => (tc as TimeControlTypes.Fischer).max_time,
                },
                time_increment,
            ];
        }

        case "byoyomi":
            if (!settings?.byoyomi) {
                return null;
            }
            return [
                {
                    setting: pgettext("Name of a time setting", "Main time"),
                    range: settings.byoyomi.main_time_range,
                    format: botDurationString,
                    value: (tc) => (tc as TimeControlTypes.ByoYomi).main_time,
                },
                {
                    setting: pgettext("Name of a time setting", "Periods"),
                    range: settings.byoyomi.periods_range,
                    format: count,
                    value: (tc) => (tc as TimeControlTypes.ByoYomi).periods,
                },
                {
                    setting: pgettext("Name of a time setting", "Period time"),
                    range: settings.byoyomi.period_time_range,
                    format: botDurationString,
                    value: (tc) => (tc as TimeControlTypes.ByoYomi).period_time,
                },
            ];

        default:
            return null;
    }
}

/** Returns a message that describes the first time setting that is outside
 * the bot's accepted ranges, or null when all of them are inside. */
function timeSettingsProblem(
    bot: Bot,
    time_control: TimeControl,
    settings?: BotAllowedClockSettingsV1 | BotAllowedClockSettingsV2,
): string | null {
    const ranges = botTimeSettingRanges(bot, time_control.system, settings);
    if (!ranges) {
        return pgettext(
            "Unable to find a compatible game setting for bot",
            "Bot cannot play at this speed",
        );
    }

    for (const { setting, range, format, value } of ranges) {
        const v = value(time_control);
        if (v < range[0] || v > range[1]) {
            return outOfRangeMessage(setting, range, format);
        }
    }

    return null;
}

/** Checks if a bot accepts a challenge with the given options. This will
 * return null and a message that tells why if the bot will not accept the
 * challenge, or a BotChallengeOptions object that can be used to create a
 * challenge. This will generally be the same object as the one passed in,
 * however the speed may be changed to match an acceptable bot speed when the
 * bot can accept the requested time setting in a different speed category.
 * (Mostly applicable for bots that don't have the Rapid time setting but do
 * accept games in that speed under the Live category.)
 *
 * The checks follow the ones gtp2ogs does when a challenge arrives. Things
 * that depend on the bot's current state, such as how many games it is
 * playing, can not be checked here.
 *
 * When the bot does not have a config set, we will return the original options but
 * the _config_version will be set to 0, so the caller can exclude the result or not
 * as they see fit.
 * */
export function getAcceptableTimeSetting(
    _bot: Bot | number,
    options: BotChallengeOptions,
): [BotChallengeOptions | null, string | null] {
    try {
        const bot: Bot = typeof _bot === "number" ? active_bots[_bot] : _bot;

        if (!bot) {
            return [
                null,
                pgettext("Unable to find a compatible game setting for bot", "Bot not found"),
            ];
        }

        if (bot.config._config_version === 0) {
            return [
                { ...options, _config_version: 0 },
                pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot has no configuration",
                ),
            ];
        }

        /* Check the board size */
        if (bot.config.allowed_board_sizes === "all") {
            // whatever is allowed
        } else if (bot.config.allowed_board_sizes === "square") {
            if (options.width !== options.height) {
                return [
                    null,
                    pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot requires a square board",
                    ),
                ];
            }
        } else if (
            Array.isArray(bot.config.allowed_board_sizes) &&
            bot.config.allowed_board_sizes.length === 1 &&
            bot.config.allowed_board_sizes[0] === 0
        ) {
            // 0 means any board size too..
        } else {
            const allowed_sizes = Array.isArray(bot.config.allowed_board_sizes)
                ? bot.config.allowed_board_sizes
                : [bot.config.allowed_board_sizes];

            if (options.width !== options.height) {
                return [
                    null,
                    pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot requires a square board",
                    ),
                ];
            }

            if (!allowed_sizes.includes(options.width)) {
                return [
                    null,
                    interpolate(
                        pgettext(
                            "Why a bot can not play with the selected board size. {{sizes}} is a list such as '9x9, 19x19'.",
                            "Bot only plays on {{sizes}}",
                        ),
                        { sizes: allowed_sizes.map((size) => `${size}x${size}`).join(", ") },
                    ),
                ];
            }
        }

        /* Check our ranked setting */
        if (options.ranked && !bot.config.allow_ranked) {
            return [
                null,
                pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept ranked games",
                ),
            ];
        }
        if (!options.ranked && !bot.config.allow_unranked) {
            return [
                null,
                pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept unranked games",
                ),
            ];
        }

        /* Check allowed rank. Like gtp2ogs, only ranked games are restricted. */
        const rank_range = bot.config.allowed_rank_range;
        if (
            options.ranked &&
            rank_range &&
            (options.rank < botRankNumber(rank_range[0]) ||
                options.rank > botRankNumber(rank_range[1]))
        ) {
            return [
                null,
                interpolate(
                    pgettext(
                        "Why a bot can not play a ranked game with the player. {{min}} and {{max}} are ranks such as '25k' and '3d'.",
                        "Bot only plays ranked games with players from {{min}} to {{max}}",
                    ),
                    { min: rank_range[0], max: rank_range[1] },
                ),
            ];
        }

        /* Check our handicap setting */
        if (options.handicap && options.ranked && !bot.config.allow_ranked_handicap) {
            return [
                null,
                pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept ranked games with handicap",
                ),
            ];
        }
        if (options.handicap && !options.ranked && !bot.config.allow_unranked_handicap) {
            return [
                null,
                pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept unranked games with handicap",
                ),
            ];
        }

        /* Check our komi setting */
        const komi_range = bot.config.allowed_komi_range;
        if (
            options.komi !== undefined &&
            komi_range &&
            (options.komi < komi_range[0] || options.komi > komi_range[1])
        ) {
            return [
                null,
                outOfRangeMessage(pgettext("Name of a game setting", "Komi"), komi_range, (value) =>
                    value.toString(),
                ),
            ];
        }

        /* Check our time settings */
        const time_control = options.time_control;

        if (!(bot.config.allowed_time_control_systems as string[]).includes(time_control.system)) {
            return [
                null,
                pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept this time control system",
                ),
            ];
        }

        const problem = timeSettingsProblem(
            bot,
            time_control,
            bot.config[`allowed_${time_control.speed}_settings`],
        );
        if (!problem) {
            return [{ ...options, _config_version: bot.config._config_version }, null];
        }

        if (bot.config._config_version === 1 && time_control.speed === "rapid") {
            // v1 bots didn't have rapid settings, but we map that to live settings on the server
            if (!timeSettingsProblem(bot, time_control, bot.config.allowed_live_settings)) {
                return [
                    {
                        ...options,
                        time_control: { ...time_control, speed: "live" },
                        _config_version: bot.config._config_version,
                    },
                    null,
                ];
            }
        }

        return [null, problem];
    } catch (e) {
        console.error("Error getting acceptable time setting", e);
        return [
            null,
            pgettext(
                "Unable to find a compatible game setting for bot",
                "Unable to find a compatible settings",
            ),
        ];
    }
}

(window as any)["bots"] = bots;
(window as any)["bots_list"] = bots_list;
(window as any)["bot_list"] = bots_list;

socket.on("active-bots", (bots) => {
    active_bots = bots;
    _bots_list = [];
    for (const id in bots) {
        _bots_list.push(bots[id]);
    }
    _bots_list.sort((a, b) => getUserRating(a).rating - getUserRating(b).rating);

    bot_event_emitter.emit("updated");
});
