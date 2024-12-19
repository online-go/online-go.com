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
import {
    BotAllowedClockSettingsV1,
    BotAllowedClockSettingsV2,
    BotConfig,
    Speed,
    User,
} from "goban";
import EventEmitter from "eventemitter3";
import { TimeControlSystem } from "./types";
import { llm_pgettext } from "./translate";

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

interface BotChallengeOptions {
    rank: number;
    width: number;
    height: number;
    speed: Speed;
    system: TimeControlSystem;
    ranked: boolean;
    handicap: boolean;
    //komi: number;
    byoyomi?: {
        main_time: number;
        period_time: number;
        periods: number;
    };
    fischer?: {
        initial_time: number;
        max_time: number;
        time_increment: number;
    };
    simple?: {
        time_per_move: number;
    };

    /* This will be set by getAcceptableTimeSetting() to match the config
     * version the bot is using */
    _config_version?: number;
}

/** Submit a desirable time setting for a bot. This will return null if the
 * bot is not compatible with the requested time setting, or a BotChallengeOptions
 * object that can be used to create a challenge. This will generally be the same
 * object as the one passed in, however the speed may be changed to match an acceptable
 * bot speed when the bot can accept the requested time setting in a different speed
 * category. (Mostly applicable for bots that don't have the Rapid time setting but
 * do accept games in that speed under either the Blitz or Live category.)
 *
 * When the bot does not have a config set, we will return the original options but
 * the _config_version will be set to 0, so the caller can exclude the result or not
 * as they see fit.
 *
 * The second return value is a string that describes the reason or note associated
 * with the return value (Why the bot can't work with these options, or a note describing
 * the lack of configuration)
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
                llm_pgettext("Unable to find a compatible game setting for bot", "Bot not found"),
            ];
        }

        if (bot.config._config_version === 0) {
            return [
                { ...options, _config_version: 0 },
                llm_pgettext(
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
                    llm_pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot requires a square board",
                    ),
                ];
            }
        } else if (typeof bot.config.allowed_board_sizes === "number") {
            if (options.width !== options.height) {
                return [
                    null,
                    llm_pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot requires a square board",
                    ),
                ];
            }
            if (options.width !== bot.config.allowed_board_sizes) {
                return [
                    null,
                    llm_pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot is unable to play this board size",
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
            // If the bot doesn't accept all board sizes, non square are rejected
            if (options.width !== options.height) {
                return [
                    null,
                    llm_pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot requires a square board",
                    ),
                ];
            }

            let found = false;
            if (Array.isArray(bot.config.allowed_board_sizes)) {
                for (const size of bot.config.allowed_board_sizes) {
                    if (size === options.width) {
                        found = true;
                        break;
                    }
                }
            }
            if (!found) {
                return [
                    null,
                    llm_pgettext(
                        "Unable to find a compatible game setting for bot",
                        "Bot is unable to play this board size",
                    ),
                ];
            }
        }

        /* Check allowed rank */
        function rankNumber(rank: string) {
            if (rank.endsWith("p") || rank.endsWith("p")) {
                return parseInt(rank) + 45;
            } else if (rank.endsWith("d") || rank.endsWith("D")) {
                return parseInt(rank) + 30;
            } else {
                return 30 - parseInt(rank);
            }
        }

        if (
            bot.config?.allowed_rank_range &&
            (options.rank < rankNumber(bot.config?.allowed_rank_range[0]) ||
                options.rank > rankNumber(bot.config?.allowed_rank_range[1]))
        ) {
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot has an unsuitable rank restriction",
                ),
            ];
        }

        /* Check our ranked setting */
        if (options.ranked && !bot.config.allow_ranked) {
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept ranked games",
                ),
            ];
        }
        if (!options.ranked && bot.config.allow_unranked) {
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept unranked games",
                ),
            ];
        }

        /* Check our handicap setting */
        if (options.handicap && options.ranked && !bot.config.allow_ranked_handicap) {
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept ranked games with handicap",
                ),
            ];
        }
        if (options.handicap && !options.ranked && !bot.config.allow_unranked_handicap) {
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Bot doesn't accept unranked games with handicap",
                ),
            ];
        }

        /* Check our komi setting */
        /*
        if (
            options.komi < bot.config.allowed_komi_range[0] ||
            options.komi > bot.config.allowed_komi_range[1]
        ) {
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Komi not accepted",
                ),
            ];
        }
        */

        /* Check our speed settings */

        if (!(options as any)[options.system]) {
            console.error(
                `Caller didn't provide ${options.system} time control system settings`,
                options,
            );
            return [
                null,
                llm_pgettext(
                    "Unable to find a compatible game setting for bot",
                    "Time control system not provided",
                ),
            ];
        }

        function isInRange(
            system: TimeControlSystem,
            settings?: BotAllowedClockSettingsV1 | BotAllowedClockSettingsV2,
        ) {
            if (!settings) {
                return false;
            }

            if (system === "simple") {
                return (
                    settings.simple &&
                    options.simple!.time_per_move >= settings.simple.per_move_time_range[0] &&
                    options.simple!.time_per_move <= settings.simple.per_move_time_range[1]
                );
            }

            if (system === "fischer") {
                if (bot.config._config_version === 1) {
                    // bug in v1 was that max_time_range was used instead of initial_time_range
                    return (
                        settings.fischer &&
                        options.fischer!.initial_time >= settings.fischer.max_time_range[0] &&
                        options.fischer!.initial_time <= settings.fischer.max_time_range[1] &&
                        options.fischer!.time_increment >=
                            settings.fischer.time_increment_range[0] &&
                        options.fischer!.time_increment <= settings.fischer.time_increment_range[1]
                    );
                } else if (bot.config._config_version === 2) {
                    const settingsV2 = settings as BotAllowedClockSettingsV2;
                    return (
                        settingsV2.fischer &&
                        options.fischer!.initial_time >= settingsV2.fischer.initial_time_range[0] &&
                        options.fischer!.initial_time <= settingsV2.fischer.initial_time_range[1] &&
                        options.fischer!.max_time >= settingsV2.fischer.max_time_range[0] &&
                        options.fischer!.max_time <= settingsV2.fischer.max_time_range[1] &&
                        options.fischer!.time_increment >=
                            settingsV2.fischer.time_increment_range[0] &&
                        options.fischer!.time_increment <=
                            settingsV2.fischer.time_increment_range[1]
                    );
                }
            }

            if (system === "byoyomi") {
                return (
                    settings.byoyomi &&
                    options.byoyomi!.main_time >= settings.byoyomi.main_time_range[0] &&
                    options.byoyomi!.main_time <= settings.byoyomi.main_time_range[1] &&
                    options.byoyomi!.period_time >= settings.byoyomi.period_time_range[0] &&
                    options.byoyomi!.period_time <= settings.byoyomi.period_time_range[1] &&
                    options.byoyomi!.periods >= settings.byoyomi.periods_range[0] &&
                    options.byoyomi!.periods <= settings.byoyomi.periods_range[1]
                );
            }

            return false;
        }

        if (isInRange(options.system, bot.config[`allowed_${options.speed}_settings`])) {
            return [{ ...options, _config_version: bot.config._config_version }, null];
        }

        if (bot.config._config_version === 1) {
            // v1 bots didn't have rapid settings, but we map that to live settings on the server
            for (const speed of ["live"] as Speed[]) {
                if (isInRange(options.system, bot.config[`allowed_${speed}_settings`])) {
                    return [
                        { ...options, speed, _config_version: bot.config._config_version },
                        null,
                    ];
                }
            }
        }

        return [
            null,
            llm_pgettext(
                "Unable to find a compatible game setting for bot",
                "Bot cannot play at this speed",
            ),
        ];
    } catch (e) {
        console.error("Error getting acceptable time setting", e);
        return [
            null,
            llm_pgettext(
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
