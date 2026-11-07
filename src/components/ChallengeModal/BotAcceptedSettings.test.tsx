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
import { render, screen } from "@testing-library/react";
import { BotConfigV1, BotConfigV2 } from "goban";
import { Bot } from "@/lib/bots";
import { TimeControl } from "@/components/TimeControl";
import { BotAcceptedSettings } from "./BotAcceptedSettings";

jest.mock("@/lib/sockets", () => ({
    socket: { on: jest.fn(), off: jest.fn(), send: jest.fn() },
}));

describe("BotAcceptedSettings", () => {
    it("shows the live ranges for rapid games of v1 bots", () => {
        const bot = {
            id: 1,
            username: "TestBot",
            config: {
                _config_version: 1,
                allowed_time_control_systems: ["simple"],
                allowed_board_sizes: [19],
                allowed_rapid_settings: {},
                allowed_live_settings: { simple: { per_move_time_range: [10, 60] } },
                allow_ranked: true,
                allow_unranked: true,
                allow_ranked_handicap: true,
                allow_unranked_handicap: true,
            } as BotConfigV1,
        } as Bot;
        const rapid: TimeControl = {
            system: "simple",
            speed: "rapid",
            per_move: 30,
            pause_on_weekends: false,
        };

        render(<BotAcceptedSettings bot={bot} time_control={rapid} />);

        expect(screen.getByText("Time per move: 10s to 1m")).toBeInTheDocument();
    });

    it("shows a board size range", () => {
        render(
            <BotAcceptedSettings
                bot={botWithBoardSizes({ width_range: [9, 19], height_range: [9, 19] })}
                time_control={rapidTimeControl()}
            />,
        );

        expect(screen.getByText("9x9 to 19x19")).toBeInTheDocument();
    });

    it("shows a fixed board size range as one size", () => {
        render(
            <BotAcceptedSettings
                bot={botWithBoardSizes({ width_range: [19, 19], height_range: [19, 19] })}
                time_control={rapidTimeControl()}
            />,
        );

        expect(screen.getByText("19x19")).toBeInTheDocument();
    });

    it.each([
        ["short range", { width_range: [9], height_range: [9, 19] }],
        ["string endpoint", { width_range: ["9", 19], height_range: [9, 19] }],
        ["reversed range", { width_range: [19, 9], height_range: [9, 19] }],
        ["NaN endpoint", { width_range: [Number.NaN, 19], height_range: [9, 19] }],
    ])("shows a readable fallback for a %s", (_label, sizes) => {
        render(
            <BotAcceptedSettings
                bot={botWithBoardSizes(sizes)}
                time_control={rapidTimeControl()}
            />,
        );

        expect(screen.getByText("Bot has an unsupported board size setting")).toBeInTheDocument();
        expect(screen.queryByText(/\[object Object\]/)).not.toBeInTheDocument();
    });

    it("uses live settings when v1 rapid settings omit a time system", () => {
        const bot = {
            id: 1,
            username: "TestBot",
            config: {
                _config_version: 1,
                allowed_time_control_systems: ["simple", "fischer"],
                allowed_board_sizes: [19],
                allowed_rapid_settings: { simple: { per_move_time_range: [5, 20] } },
                allowed_live_settings: {
                    simple: { per_move_time_range: [10, 60] },
                    fischer: { max_time_range: [60, 600], time_increment_range: [5, 30] },
                },
                allow_ranked: true,
                allow_unranked: true,
                allow_ranked_handicap: true,
                allow_unranked_handicap: true,
            } as BotConfigV1,
        } as Bot;
        const rapid: TimeControl = {
            system: "simple",
            speed: "rapid",
            per_move: 30,
            pause_on_weekends: false,
        };

        render(<BotAcceptedSettings bot={bot} time_control={rapid} />);

        expect(screen.getByText("Time per move: 5s to 20s")).toBeInTheDocument();
        expect(
            screen.getByText("Initial time: 1m to 10m, Time increment: 5s to 30s"),
        ).toBeInTheDocument();
    });

    it("does not show an initial time range for a v2 Fischer bot", () => {
        render(
            <BotAcceptedSettings
                bot={v2FischerBot({
                    initial_time_range: [10, 3600],
                    max_time_range: [5, 7200],
                    time_increment_range: [10, 300],
                })}
                time_control={liveFischer()}
            />,
        );

        expect(
            screen.getByText("Max time: 5s to 2h, Time increment: 10s to 5m"),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Initial time/)).not.toBeInTheDocument();
    });

    it("skips a time or komi row whose range is not a finite ordered pair", () => {
        render(
            <BotAcceptedSettings
                bot={v2Bot({
                    allowed_time_control_systems: ["fischer", "byoyomi"],
                    allowed_live_settings: {
                        fischer: {
                            initial_time_range: [10, 3600],
                            time_increment_range: [10, 300],
                        },
                        byoyomi: {
                            main_time_range: [60, 1200],
                            period_time_range: [10, 60],
                            periods_range: [10, 1],
                        },
                    },
                    allowed_komi_range: [Number.NaN, 7.5],
                })}
                time_control={liveFischer()}
            />,
        );

        expect(screen.getByText("19x19")).toBeInTheDocument();
        expect(screen.getByText("Time increment: 10s to 5m")).toBeInTheDocument();
        expect(
            screen.getByText("Main time: 1m to 20m, Period time: 10s to 1m"),
        ).toBeInTheDocument();
        expect(screen.queryByText(/Max time/)).not.toBeInTheDocument();
        expect(screen.queryByText(/Periods/)).not.toBeInTheDocument();
        expect(screen.queryByText("Komi")).not.toBeInTheDocument();
        expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    });
});

function liveFischer(): TimeControl {
    return {
        system: "fischer",
        speed: "live",
        initial_time: 2 * 3600,
        max_time: 2 * 3600,
        time_increment: 10,
        pause_on_weekends: false,
    };
}

function v2FischerBot(fischer: {
    initial_time_range?: [number, number];
    max_time_range?: [number, number];
    time_increment_range?: [number, number];
}): Bot {
    return v2Bot({
        allowed_time_control_systems: ["fischer"],
        allowed_live_settings: { fischer },
    });
}

function v2Bot(config: Record<string, unknown>): Bot {
    return {
        id: 1,
        username: "TestBot",
        config: {
            _config_version: 2,
            allowed_time_control_systems: ["simple"],
            allowed_board_sizes: [19],
            allow_ranked: true,
            allow_unranked: true,
            allow_ranked_handicap: true,
            allow_unranked_handicap: true,
            ...config,
        } as unknown as BotConfigV2,
    } as Bot;
}

function rapidTimeControl(): TimeControl {
    return {
        system: "simple",
        speed: "rapid",
        per_move: 30,
        pause_on_weekends: false,
    };
}

function botWithBoardSizes(allowed_board_sizes: unknown): Bot {
    return {
        id: 1,
        username: "TestBot",
        config: {
            _config_version: 2,
            allowed_time_control_systems: ["simple"],
            allowed_board_sizes,
            allow_ranked: true,
            allow_unranked: true,
            allow_ranked_handicap: true,
            allow_unranked_handicap: true,
        } as unknown as BotConfigV2,
    } as Bot;
}
