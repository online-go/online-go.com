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
import { _, interpolate, pgettext } from "@/lib/translate";
import {
    Bot,
    BotBoardSizes,
    boardSizeRangeText,
    botTimeSettingRanges,
    isBoardSizeRanges,
    isUnsupportedBoardSizeSetting,
    unsupportedBoardSizeSettingMessage,
} from "@/lib/bots";
import { TimeControl, timeControlSystemText } from "@/components/TimeControl";
import "./BotAcceptedSettings.css";

interface BotAcceptedSettingsProps {
    bot: Bot;
    time_control: TimeControl;
}

function rangeText(min: string, max: string): string {
    if (min === max) {
        return min;
    }
    return interpolate(pgettext("A range of values, such as '1m to 10m'", "{{min}} to {{max}}"), {
        min,
        max,
    });
}

function boardSizesText(sizes: BotBoardSizes): string {
    if (isBoardSizeRanges(sizes)) {
        return boardSizeRangeText(sizes);
    }
    if (sizes === "all" || (Array.isArray(sizes) && sizes.length === 1 && sizes[0] === 0)) {
        return pgettext("A bot accepts every board size", "Any size");
    }
    if (sizes === "square") {
        return pgettext("A bot accepts every square board size", "Any square board");
    }
    if (isUnsupportedBoardSizeSetting(sizes)) {
        return unsupportedBoardSizeSettingMessage();
    }
    return (Array.isArray(sizes) ? sizes : [sizes]).map((size) => `${size}x${size}`).join(", ");
}

function rankedText(allow_ranked: boolean, allow_unranked: boolean): string {
    if (allow_ranked && allow_unranked) {
        return pgettext("A bot accepts ranked and unranked games", "Ranked and unranked");
    }
    if (allow_ranked) {
        return pgettext("A bot accepts only ranked games", "Ranked only");
    }
    return pgettext("A bot accepts only unranked games", "Unranked only");
}

function handicapText(allow_ranked: boolean, allow_unranked: boolean): string {
    if (allow_ranked && allow_unranked) {
        return pgettext("A bot accepts handicap games", "Allowed");
    }
    if (allow_ranked) {
        return pgettext("A bot accepts handicap only in ranked games", "Ranked games only");
    }
    if (allow_unranked) {
        return pgettext("A bot accepts handicap only in unranked games", "Unranked games only");
    }
    return pgettext("A bot does not accept handicap games", "Not allowed");
}

/** Lists the game settings a bot accepts, so the player can pick settings
 * that the bot will not reject. Time settings are shown for the speed of the
 * selected time control. */
export function BotAcceptedSettings({
    bot,
    time_control,
}: BotAcceptedSettingsProps): React.ReactElement | null {
    const config = bot.config;
    if (config?._config_version !== 1 && config?._config_version !== 2) {
        return null;
    }

    // The server always sends v1 allowed_rapid_settings, at least as {}. Use a
    // system's rapid entry when it exists, and otherwise the live entry.
    const time_rows = config.allowed_time_control_systems.map((system) => {
        const v1_rapid = config._config_version === 1 && time_control.speed === "rapid";
        const ranges = v1_rapid
            ? (botTimeSettingRanges(bot, system, config.allowed_rapid_settings) ??
              botTimeSettingRanges(bot, system, config.allowed_live_settings))
            : botTimeSettingRanges(bot, system, config[`allowed_${time_control.speed}_settings`]);
        return {
            system,
            text: ranges
                ? ranges
                      .map(({ setting, range, format }) =>
                          interpolate(
                              pgettext(
                                  "A time setting and the range a bot accepts for it, such as 'Main time: 1m to 10m'",
                                  "{{setting}}: {{range}}",
                              ),
                              { setting, range: rangeText(format(range[0]), format(range[1])) },
                          ),
                      )
                      .join(", ")
                : pgettext(
                      "A bot does not play this time control system at the selected speed",
                      "Not at this speed",
                  ),
        };
    });

    return (
        <dl className="BotAcceptedSettings">
            <dt>{pgettext("Game setting", "Board size")}</dt>
            <dd>{boardSizesText(config.allowed_board_sizes)}</dd>

            <dt>{_("Ranked")}</dt>
            <dd>{rankedText(config.allow_ranked, config.allow_unranked)}</dd>

            <dt>{_("Handicap")}</dt>
            <dd>{handicapText(config.allow_ranked_handicap, config.allow_unranked_handicap)}</dd>

            {config.allowed_komi_range && (
                <>
                    <dt>{_("Komi")}</dt>
                    <dd>
                        {rangeText(
                            config.allowed_komi_range[0].toString(),
                            config.allowed_komi_range[1].toString(),
                        )}
                    </dd>
                </>
            )}

            {config.allowed_rank_range && (
                <>
                    <dt>
                        {pgettext(
                            "The ranks of players a bot plays ranked games with",
                            "Player rank (ranked games)",
                        )}
                    </dt>
                    <dd>{rangeText(config.allowed_rank_range[0], config.allowed_rank_range[1])}</dd>
                </>
            )}

            {time_rows.map(({ system, text }) => (
                <React.Fragment key={system}>
                    <dt>{timeControlSystemText(system)}</dt>
                    <dd>{text}</dd>
                </React.Fragment>
            ))}
        </dl>
    );
}
