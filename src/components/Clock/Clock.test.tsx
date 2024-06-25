/*
 * Copyright (C)  Online-Go.com
 * Copyright (C)  Benjamin P. Jones
 */

import { Clock, prettyTime } from "./Clock";
import * as React from "react";
import { TestGoban } from "goban";
import { act, render } from "@testing-library/react";
import "@testing-library/jest-dom";

test("Byo-yomi with days and hours", () => {
    const goban = new TestGoban({
        time_control: {
            system: "byoyomi",
            speed: "correspondence",
            main_time: 6.048e8,
            periods: 5,
            period_time: 6.048e8,
            pause_on_weekends: false,
        },
    });

    const black_clock = {
        main_time: 0,
        periods_left: 5,
        period_time_left: 5.038e8, // 5 days 20hr
    };
    const white_clock = {
        main_time: 2.16e8, // 2.5 days
        periods_left: 5,
        period_time_left: 6.048e8, // 7 days
    };

    const { container } = render(<Clock goban={goban} color="white" />);
    act(() => {
        // Very hacky way to emit the clock event, but I don't want to start any timers...
        goban.emit("clock", {
            current_player: "black",

            /** Player ID of player to move */
            current_player_id: "12345",
            time_of_last_move: 1700000000,
            black_clock,
            white_clock,
            black_move_transmitting: 0,
            white_move_transmitting: 0,
        });
    });

    expect(container.querySelector(".main-time")).toHaveTextContent("2d 12h");
    expect(container.querySelector(".period-time")).toHaveTextContent("7 Days");
    expect(container.querySelector(".byo-yomi-periods")).toHaveTextContent("(5)");
});

test("prettyTime", () => {
    expect(prettyTime(0)).toBe("0.0");
    expect(prettyTime(5000)).toBe("0:05");
    expect(prettyTime(3.3e5)).toBe("5:30");
    expect(prettyTime(5.4e6)).toBe("1h 30m");
    expect(prettyTime(2.16e7)).toBe("6h 0m");
    expect(prettyTime(1.296e8)).toBe("36h");
    expect(prettyTime(2.16e8)).toBe("2d 12h");
    expect(prettyTime(2.592e8)).toBe("3 Days");
});

test("prettyTime bad input", () => {
    expect(prettyTime(NaN)).toBe("0.0");
    expect(prettyTime(-1)).toBe("0.0");
    expect(prettyTime(Infinity)).toBe("Infinity Days");
});
