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
});

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
