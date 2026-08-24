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
import React, { useEffect } from "react";
import * as data from "@/lib/data";
import { Bot, bots_list, getAcceptableTimeSetting } from "@/lib/bots";
import * as preferences from "@/lib/preferences";
import { rankString } from "@/lib/rank_utils";
import { _, llm_pgettext, pgettext } from "@/lib/translate";
import { SPEED_OPTIONS } from "@/views/Play/SPEED_OPTIONS";
import { PlayerIcon } from "../PlayerIcon";

type State = {
    challenge: any;
    time_control: any;
    conf: any;
};

type ChallengeModalComputerOpponentsProps = {
    state: State;
    updateBotId: (bot_id: number) => void;
};

export const ChallengeModalComputerOpponents = (props: ChallengeModalComputerOpponentsProps) => {
    interface Category {
        sort_index: number;
        label: string;
        lower_bound: number;
        upper_bound: number;
    }

    const user = data.get("user");
    let available_bots: (Bot & { category?: Category })[] = bots_list().filter((b) => b.id > 0);
    const board_size = `${props.state.challenge.game.width}x${props.state.challenge.game.height}`;

    const categories = [
        {
            sort_index: 1,
            label: pgettext("Bot strength category", "Beginner"),
            lower_bound: -99,
            upper_bound: 10,
        },
        {
            sort_index: 2,
            label: pgettext("Bot strength category", "Intermediate"),
            lower_bound: 10,
            upper_bound: 25,
        },
        {
            sort_index: 3,
            label: pgettext("Bot strength category", "Advanced"),
            lower_bound: 25,
            upper_bound: 99,
        },
    ];
    available_bots = available_bots.filter((b) => {
        const speed_settings = (SPEED_OPTIONS as any)?.[board_size]?.[
            props.state.time_control.speed
        ]?.[props.state.time_control.system];
        if (!speed_settings) {
            return false;
        }

        const settings = {
            rank: user.ranking,
            width: props.state.challenge.game.width ?? -1,
            height: props.state.challenge.game.height ?? -1,
            ranked: true,
            handicap: props.state.challenge.game.handicap !== 0,
            system: props.state.time_control.system,
            speed: props.state.time_control.speed,
            [props.state.time_control.system]: speed_settings,
        };
        const [options, message] = getAcceptableTimeSetting(b, settings);
        if (!options) {
            b.disabled = message || undefined;
        } else if (options && options._config_version && options._config_version === 0) {
            b.disabled = llm_pgettext(
                "Bot is not configured correctly",
                "Bot is not configured correctly",
            );
        } else {
            b.disabled = undefined;
        }

        b.category = categories[0];
        for (const category of categories) {
            if (
                b.ranking &&
                b.ranking > category.lower_bound &&
                b.ranking <= category.upper_bound
            ) {
                b.category = category;
                break;
            }
        }

        return true;
    });

    // testing
    //available_bots = [...available_bots, ...available_bots];
    //available_bots = [...available_bots, ...available_bots];
    //available_bots = [...available_bots, ...available_bots];

    available_bots.sort((a, b) => {
        if (a.category!.sort_index !== b.category!.sort_index) {
            return a.category!.sort_index - b.category!.sort_index;
        }

        if (a.disabled && !b.disabled) {
            return 1;
        }
        if (b.disabled && !a.disabled) {
            return -1;
        }

        return (a.ranking || 0) - (b.ranking || 0);
    });

    const selected_bot_value = available_bots.find((b) => b.id === props.state.conf.bot_id);
    useEffect(() => {
        if (selected_bot_value?.disabled) {
            props.updateBotId(0);
        }
    }, [props.state.conf.bot_id, selected_bot_value?.disabled]);

    if (available_bots.length <= 0) {
        return (
            <div className="no-available-bots">
                {_("No bots available that can play with the selected settings")}
            </div>
        );
    }

    return (
        <div className="bot-categories">
            {categories.map((category) => {
                return (
                    <div key={category.upper_bound} className="bot-category">
                        <h1>{category.label}</h1>

                        <div key={category.upper_bound} className="bot-options">
                            {available_bots
                                //.filter((bot) => !bot.disabled)
                                .filter((bot) => bot.category === category)
                                .map((bot) => {
                                    return (
                                        <div
                                            key={bot.id}
                                            className={
                                                "bot-option" +
                                                (bot.id === selected_bot_value?.id
                                                    ? " selected"
                                                    : "") +
                                                (bot.disabled ? " disabled" : "")
                                            }
                                            onClick={() => {
                                                if (!bot.disabled) {
                                                    props.updateBotId(bot.id);
                                                }
                                            }}
                                        >
                                            <PlayerIcon
                                                user={bot}
                                                size={64}
                                                style={{ width: "48px", height: "48px" }}
                                            />
                                            <span className="username-rank">
                                                <span className="username">{bot.username}</span>
                                                {!preferences.get("hide-ranks") && (
                                                    <span className="rank">
                                                        ({rankString(bot.ranking || 0)})
                                                    </span>
                                                )}
                                            </span>

                                            {bot.disabled && (
                                                <span className="disabled-reason">
                                                    {bot.disabled}
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
