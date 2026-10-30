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

function makeBot(
    config: Partial<Omit<BotConfigV2, "allowed_board_sizes">> & {
        allowed_board_sizes?:
            | BotConfigV2["allowed_board_sizes"]
            | { width_range: [number, number]; height_range: [number, number] };
    } = {},
): Bot {
    return {
        id: 1,
        username: "TestBot",
        config: {
            _config_version: 2,
            hidden: false,
            bot_id: 1,
            username: "TestBot",
            allowed_time_control_systems: ["byoyomi", "fischer"],
            allowed_board_sizes: [19],
            allowed_live_settings: {
                byoyomi: {
                    main_time_range: [60, 1200],
                    period_time_range: [10, 60],
                    periods_range: [1, 10],
                },
                fischer: {
                    initial_time_range: [60, 1200],
                    max_time_range: [60, 1800],
                    time_increment_range: [5, 30],
                },
            },
            allow_ranked: true,
            allow_unranked: true,
            allow_ranked_handicap: true,
            allow_unranked_handicap: true,
            allowed_komi_range: [-10, 10],
            ...config,
        } as BotConfigV2,
    } as Bot;
}

function makeBotWithBoardSizes(allowed_board_sizes: unknown): Bot {
    const bot = makeBot();
    return {
        ...bot,
        config: { ...bot.config, allowed_board_sizes } as unknown as BotConfigV2,
    };
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
    it("checks unranked games against allow_unranked", () => {
        const [allowed] = getAcceptableTimeSetting(makeBot(), options({ ranked: false }));
        expect(allowed).not.toBeNull();

        const [rejected, message] = getAcceptableTimeSetting(
            makeBot({ allow_unranked: false }),
            options({ ranked: false }),
        );
        expect(rejected).toBeNull();
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

    it("applies the rank range only to ranked games", () => {
        const bot = makeBot({ allowed_rank_range: ["1d", "9d"] });

        const [one_kyu, message] = getAcceptableTimeSetting(bot, options({ rank: 29 }));
        expect(one_kyu).toBeNull();
        expect(message).toBe("Bot only plays ranked games with players from 1d to 9d");

        const [one_dan] = getAcceptableTimeSetting(bot, options({ rank: 30 }));
        expect(one_dan).not.toBeNull();

        const [unranked] = getAcceptableTimeSetting(bot, options({ rank: 29, ranked: false }));
        expect(unranked).not.toBeNull();
    });

    it("checks a custom komi", () => {
        const [result, message] = getAcceptableTimeSetting(makeBot(), options({ komi: 15.5 }));
        expect(result).toBeNull();
        expect(message).toBe("Komi must be from -10 to 10");

        const [inside] = getAcceptableTimeSetting(makeBot(), options({ komi: 6.5 }));
        expect(inside).not.toBeNull();
    });

    it("accepts boards inside an inclusive width and height range", () => {
        const bot = makeBot({
            allowed_board_sizes: {
                width_range: [9, 19],
                height_range: [13, 25],
            },
        });

        for (const size of [
            { width: 9, height: 13 },
            { width: 19, height: 25 },
            { width: 9, height: 25 },
            { width: 19, height: 13 },
            { width: 13, height: 13 },
            { width: 19, height: 19 },
        ]) {
            const [allowed, message] = getAcceptableTimeSetting(bot, options(size));
            expect(message).toBeNull();
            expect(allowed).not.toBeNull();
        }
    });

    it("rejects boards outside a size range with a readable message", () => {
        const bot = makeBot({
            allowed_board_sizes: {
                width_range: [9, 19],
                height_range: [13, 25],
            },
        });

        const [too_small, small_message] = getAcceptableTimeSetting(
            bot,
            options({ width: 5, height: 5 }),
        );
        expect(too_small).toBeNull();
        expect(small_message).toBe("Bot only plays on 9x13 to 19x25");

        const [too_wide, wide_message] = getAcceptableTimeSetting(
            bot,
            options({ width: 20, height: 19 }),
        );
        expect(too_wide).toBeNull();
        expect(wide_message).toBe("Bot only plays on 9x13 to 19x25");

        const [too_short, short_message] = getAcceptableTimeSetting(
            bot,
            options({ width: 9, height: 12 }),
        );
        expect(too_short).toBeNull();
        expect(short_message).toBe("Bot only plays on 9x13 to 19x25");
    });

    it("describes a size range with equal ends as one board size", () => {
        const bot = makeBot({
            allowed_board_sizes: {
                width_range: [19, 19],
                height_range: [19, 19],
            },
        });

        const [rejected, message] = getAcceptableTimeSetting(
            bot,
            options({ width: 13, height: 13 }),
        );
        expect(rejected).toBeNull();
        expect(message).toBe("Bot only plays on 19x19");

        const [allowed] = getAcceptableTimeSetting(bot, options({ width: 19, height: 19 }));
        expect(allowed).not.toBeNull();
    });

    it.each([
        ["short range", { width_range: [9], height_range: [9, 19] }],
        ["string endpoint", { width_range: ["9", 19], height_range: [9, 19] }],
        ["reversed range", { width_range: [19, 9], height_range: [9, 19] }],
        ["NaN endpoint", { width_range: [Number.NaN, 19], height_range: [9, 19] }],
    ])("rejects a %s with a readable message", (_label, allowed_board_sizes) => {
        const [rejected, message] = getAcceptableTimeSetting(
            makeBotWithBoardSizes(allowed_board_sizes),
            options(),
        );
        expect(rejected).toBeNull();
        expect(message).toBe("Bot has an unsupported board size setting");
    });

    it("plays rapid games with live settings for v1 bots", () => {
        const bot = makeBot();
        bot.config = { ...bot.config, _config_version: 1 } as BotConfigV1;

        const [result] = getAcceptableTimeSetting(
            bot,
            options({ time_control: { ...live_byoyomi, speed: "rapid" } }),
        );
        expect(result?.time_control.speed).toBe("live");
    });
});
