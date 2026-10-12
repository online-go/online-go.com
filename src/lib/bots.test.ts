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

import { BotConfigV1, BotConfigV2 } from "goban";
import { TimeControl } from "@/components/TimeControl";
import { Bot, BotChallengeOptions, botRankNumber, getAcceptableTimeSetting } from "./bots";

jest.mock("@/lib/sockets", () => ({
    socket: { on: jest.fn(), off: jest.fn(), send: jest.fn() },
}));

const live_byoyomi: TimeControl = {
    system: "byoyomi",
    speed: "live",
    main_time: 600,
    period_time: 30,
    periods: 5,
    periods_min: 1,
    periods_max: 10,
    pause_on_weekends: false,
};

const live_fischer: TimeControl = {
    system: "fischer",
    speed: "live",
    initial_time: 600,
    time_increment: 10,
    max_time: 1200,
    pause_on_weekends: false,
};

const clock_v2 = {
    byoyomi: {
        main_time_range: [60, 1200] as [number, number],
        period_time_range: [10, 60] as [number, number],
        periods_range: [1, 10] as [number, number],
    },
    fischer: {
        initial_time_range: [60, 1200] as [number, number],
        max_time_range: [60, 1800] as [number, number],
        time_increment_range: [5, 30] as [number, number],
    },
};

function makeBot(config: Partial<BotConfigV2> = {}): Bot {
    return {
        id: 1,
        username: "TestBot",
        ranking: 20,
        config: {
            _config_version: 2,
            hidden: false,
            bot_id: 1,
            username: "TestBot",
            allowed_time_control_systems: ["byoyomi", "fischer"],
            allowed_board_sizes: [9, 13, 19],
            allowed_live_settings: clock_v2,
            allow_ranked: true,
            allow_unranked: true,
            allowed_rank_range: ["30k", "9d"],
            allow_ranked_handicap: true,
            allow_unranked_handicap: true,
            allowed_komi_range: [-10, 10],
            ...config,
        } as BotConfigV2,
    } as Bot;
}

function options(fields: Partial<BotChallengeOptions> = {}): BotChallengeOptions {
    return {
        rank: 20,
        width: 19,
        height: 19,
        ranked: true,
        handicap: false,
        time_control: live_byoyomi,
        ...fields,
    };
}

describe("botRankNumber", () => {
    it("matches the ranking numbers gtp2ogs uses", () => {
        expect(botRankNumber("30k")).toBe(0);
        expect(botRankNumber("1k")).toBe(29);
        expect(botRankNumber("1d")).toBe(30);
        expect(botRankNumber("9D")).toBe(38);
        expect(botRankNumber("1p")).toBe(999);
    });
});

describe("getAcceptableTimeSetting", () => {
    it("accepts settings inside every range", () => {
        const [result, message] = getAcceptableTimeSetting(makeBot(), options());
        expect(result).not.toBeNull();
        expect(message).toBeNull();
    });

    it("accepts unranked games when the bot allows them", () => {
        const [result] = getAcceptableTimeSetting(makeBot(), options({ ranked: false }));
        expect(result).not.toBeNull();
    });

    it("rejects unranked games when the bot does not allow them", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot({ allow_unranked: false }),
            options({ ranked: false }),
        );
        expect(result).toBeNull();
        expect(message).toBe("Bot doesn't accept unranked games");
    });

    it("checks the time control the player picked and names the range", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot(),
            options({ time_control: { ...live_byoyomi, main_time: 3600 } }),
        );
        expect(result).toBeNull();
        expect(message).toBe("Main time must be from 1m to 20m");
    });

    it("checks the fischer max time", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot(),
            options({ time_control: { ...live_fischer, max_time: 3600 } }),
        );
        expect(result).toBeNull();
        expect(message).toBe("Max time must be from 1m to 30m");
    });

    it("rejects a time control system the bot does not play", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot({ allowed_time_control_systems: ["fischer"] }),
            options(),
        );
        expect(result).toBeNull();
        expect(message).toBe("Bot doesn't accept this time control system");
    });

    it("rejects a speed the bot has no settings for", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot(),
            options({ time_control: { ...live_byoyomi, speed: "blitz" } }),
        );
        expect(result).toBeNull();
        expect(message).toBe("Bot cannot play at this speed");
    });

    it("lists the board sizes the bot plays", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot(),
            options({ width: 15, height: 15 }),
        );
        expect(result).toBeNull();
        expect(message).toBe("Bot only plays on 9x9, 13x13, 19x19");
    });

    it("lets a 1d player play a bot whose rank range starts at 1d", () => {
        const [result] = getAcceptableTimeSetting(
            makeBot({ allowed_rank_range: ["1d", "9d"] }),
            options({ rank: 30 }),
        );
        expect(result).not.toBeNull();
    });

    it("applies the rank range only to ranked games", () => {
        const bot = makeBot({ allowed_rank_range: ["1d", "9d"] });

        const [ranked, message] = getAcceptableTimeSetting(bot, options({ rank: 20 }));
        expect(ranked).toBeNull();
        expect(message).toBe("Bot only plays ranked games with players from 1d to 9d");

        const [unranked] = getAcceptableTimeSetting(bot, options({ rank: 20, ranked: false }));
        expect(unranked).not.toBeNull();
    });

    it("checks a custom komi", () => {
        const [result, message] = getAcceptableTimeSetting(makeBot(), options({ komi: 15.5 }));
        expect(result).toBeNull();
        expect(message).toBe("Komi must be from -10 to 10");

        const [inside] = getAcceptableTimeSetting(makeBot(), options({ komi: 6.5 }));
        expect(inside).not.toBeNull();
    });

    it("rejects handicap when the bot does not allow it", () => {
        const [result, message] = getAcceptableTimeSetting(
            makeBot({ allow_ranked_handicap: false }),
            options({ handicap: true }),
        );
        expect(result).toBeNull();
        expect(message).toBe("Bot doesn't accept ranked games with handicap");
    });

    it("plays rapid games with live settings for v1 bots", () => {
        const bot = makeBot();
        bot.config = {
            ...(bot.config as BotConfigV2),
            _config_version: 1,
            allowed_live_settings: {
                byoyomi: clock_v2.byoyomi,
                fischer: { max_time_range: [60, 1800], time_increment_range: [5, 30] },
            },
        } as BotConfigV1;

        const [result] = getAcceptableTimeSetting(
            bot,
            options({ time_control: { ...live_byoyomi, speed: "rapid" } }),
        );
        expect(result?.time_control.speed).toBe("live");
    });
});
