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
import { fireEvent, render, screen } from "@testing-library/react";
import { BotConfigV2 } from "goban";
import { Bot } from "@/lib/bots";
import { TimeControl } from "@/components/TimeControl";
import { BotSettingsModal } from "./BotSettingsModal";

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
        allowed_time_control_systems: ["byoyomi"],
        allowed_board_sizes: [19],
        allowed_live_settings: {
            byoyomi: {
                main_time_range: [60, 1200],
                period_time_range: [10, 60],
                periods_range: [1, 10],
            },
        },
        allow_ranked: true,
        allow_unranked: true,
        allow_ranked_handicap: true,
        allow_unranked_handicap: true,
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

describe("BotSettingsModal", () => {
    it("shows what the bot accepts", () => {
        render(<BotSettingsModal bot={bot} time_control={time_control} />);

        expect(screen.getByText("TestBot accepts")).toBeInTheDocument();
        expect(screen.getByText("19x19")).toBeInTheDocument();
    });

    it("closes on Escape without passing the key to the modal below it", () => {
        const onClose = jest.fn();
        const below = jest.fn();
        document.body.addEventListener("keydown", below);

        render(<BotSettingsModal bot={bot} time_control={time_control} onClose={onClose} />);
        fireEvent.keyDown(document.body, { key: "Escape", keyCode: 27 });

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(below).not.toHaveBeenCalled();
        document.body.removeEventListener("keydown", below);
    });
});
