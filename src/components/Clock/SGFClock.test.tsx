/*
 * Copyright (C)  Online-Go.com
 */

// See PlayerCards.test.tsx: this import order avoids a circular-import crash.
import "@/lib/data";
import "@/lib/sockets";

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { act } from "react";
import { GobanController } from "@/lib/GobanController";
import { SGFClock } from "./SGFClock";

const BYOYOMI = {
    system: "byoyomi",
    speed: "live",
    main_time: 600,
    period_time: 30,
    periods: 5,
    pause_on_weekends: false,
};

function finishedGame(config: object) {
    return new GobanController({
        game_id: 4242,
        width: 9,
        height: 9,
        phase: "finished",
        time_control: BYOYOMI,
        ...config,
    } as any).goban;
}

test("a byo-yomi record in overtime shows the period time and periods left", () => {
    const goban = finishedGame({
        moves: [
            [
                2,
                2,
                1000,
                undefined,
                { clock: { main_time: 0, periods_left: 3, period_time_left: 30000 } },
            ],
            [6, 6, 1000, undefined, { clock: { main_time: 512000 } }],
        ],
    });
    goban.engine.jumpTo(goban.engine.move_tree.trunk_next!);

    const { container } = render(<SGFClock goban={goban} color="black" />);

    expect(container.querySelector(".main-time")).toHaveTextContent("0:30");
    expect(container.querySelector(".byo-yomi-periods")).toHaveTextContent("(3)");
});

test("a canadian record in overtime shows the block time and stones left", () => {
    const goban = finishedGame({
        time_control: {
            system: "canadian",
            speed: "live",
            main_time: 0,
            period_time: 300,
            stones_per_period: 5,
            pause_on_weekends: false,
        },
        moves: [
            [
                2,
                2,
                1000,
                undefined,
                { clock: { main_time: 0, moves_left: 4, block_time_left: 260000 } },
            ],
        ],
    });

    const { container } = render(<SGFClock goban={goban} color="black" />);

    expect(container.querySelector(".main-time")).toHaveTextContent("4:20");
    expect(container.querySelector(".period-moves")).toHaveTextContent("4");
});

test("the final position of a finished game shows the clocks at the end", () => {
    const goban = finishedGame({
        time_control: {
            system: "fischer",
            speed: "live",
            initial_time: 300,
            time_increment: 10,
            max_time: 600,
            pause_on_weekends: false,
        },
        moves: [
            [2, 2, 1000, undefined, { clock: { main_time: 250000 } }],
            [6, 6, 1000, undefined, { clock: { main_time: 240000 } }],
        ],
        final_clock: { black: { main_time: 0 }, white: { main_time: 240000 } },
    });

    const { container, rerender } = render(<SGFClock goban={goban} color="black" />);
    expect(container.querySelector(".main-time")).toHaveTextContent("0.0");

    act(() => {
        goban.engine.jumpTo(goban.engine.move_tree.trunk_next!);
        goban.emit("cur_move", goban.engine.cur_move);
    });
    rerender(<SGFClock goban={goban} color="black" />);
    expect(container.querySelector(".main-time")).toHaveTextContent("4:10");
});

test("a clock set on the current review node shows without navigating", () => {
    const goban = finishedGame({
        moves: [[2, 2, 1000, undefined, { clock: { main_time: 512000 } }]],
    });
    const { container } = render(<SGFClock goban={goban} color="black" />);
    expect(container.querySelector(".main-time")).toHaveTextContent("8:32");

    act(() => {
        goban.engine.cur_move.applyClockUpdate({ black: { main_time: 90000 } });
        goban.emit("review.updated");
    });
    expect(container.querySelector(".main-time")).toHaveTextContent("1:30");
});

test("a game with no recorded clocks shows nothing", () => {
    const goban = finishedGame({ moves: [[2, 2, 1000]] });
    const { container } = render(<SGFClock goban={goban} color="black" />);
    expect(container).toBeEmptyDOMElement();
});
