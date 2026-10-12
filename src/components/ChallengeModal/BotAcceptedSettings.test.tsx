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
import { BotConfigV2 } from "goban";
import { Bot } from "@/lib/bots";
import { TimeControl } from "@/components/TimeControl";
import { BotAcceptedSettings } from "./BotAcceptedSettings";

jest.mock("@/lib/sockets", () => ({
    socket: { on: jest.fn(), off: jest.fn(), send: jest.fn() },
}));

const bot = {
    id: 1,
    username: "TestBot",
    config: {
        _config_version: 2,
        hidden: false,
        bot_id: 1,
        username: "TestBot",
        allowed_time_control_systems: ["byoyomi", "fischer"],
        allowed_board_sizes: [9, 19],
        allowed_live_settings: {
            byoyomi: {
                main_time_range: [60, 1200],
                period_time_range: [10, 60],
                periods_range: [1, 10],
            },
        },
        allow_ranked: true,
        allow_unranked: false,
        allowed_rank_range: ["25k", "9d"],
        allow_ranked_handicap: false,
        allow_unranked_handicap: true,
        allowed_komi_range: [-10, 10],
    } as BotConfigV2,
} as Bot;

const time_control: TimeControl = {
    system: "byoyomi",
    speed: "live",
    main_time: 600,
    period_time: 30,
    periods: 5,
    periods_min: 1,
    periods_max: 10,
    pause_on_weekends: false,
};

describe("BotAcceptedSettings", () => {
    it("lists what the bot accepts at the selected speed", () => {
        render(<BotAcceptedSettings bot={bot} time_control={time_control} />);

        expect(screen.getByText("9x9, 19x19")).toBeInTheDocument();
        expect(screen.getByText("Ranked only")).toBeInTheDocument();
        expect(screen.getByText("Unranked games only")).toBeInTheDocument();
        expect(screen.getByText("-10 to 10")).toBeInTheDocument();
        expect(screen.getByText("25k to 9d")).toBeInTheDocument();
        expect(
            screen.getByText("Main time: 1m to 20m, Periods: 1 to 10, Period time: 10s to 1m"),
        ).toBeInTheDocument();
        expect(screen.getByText("Not at this speed")).toBeInTheDocument();
    });

    it("renders nothing for a bot without a configuration", () => {
        const { container } = render(
            <BotAcceptedSettings
                bot={{ ...bot, config: { _config_version: 0 } } as Bot}
                time_control={time_control}
            />,
        );
        expect(container).toBeEmptyDOMElement();
    });
});
