/*
 * Copyright (C)  Online-Go.com
 */

// See PlayerCards.test.tsx: this import order avoids a circular-import crash.
import * as data from "@/lib/data";
import "@/lib/sockets";

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { act } from "react";
import { GobanController } from "@/lib/GobanController";
import { SGFClock } from "./SGFClock";
import { Clock } from "./Clock";

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
                { black_clock: { main_time: 0, periods_left: 3, period_time_left: 30000 } },
            ],
            [6, 6, 1000, undefined, { white_clock: { main_time: 512000 } }],
        ],
    });
    goban.engine.jumpTo(goban.engine.move_tree.trunk_next!);

    const { container } = render(<SGFClock goban={goban} color="black" />);

    expect(container.querySelector(".main-time")).toBeNull();
    expect(container.querySelector(".period-time")).toHaveTextContent("0:30");
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
                { black_clock: { main_time: 0, moves_left: 4, block_time_left: 260000 } },
            ],
        ],
    });

    const { container } = render(<SGFClock goban={goban} color="black" />);

    expect(container.querySelector(".period-time")).toHaveTextContent("4:20");
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
            [2, 2, 1000, undefined, { black_clock: { main_time: 250000 } }],
            [6, 6, 1000, undefined, { white_clock: { main_time: 240000 } }],
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
        moves: [[2, 2, 1000, undefined, { black_clock: { main_time: 512000 } }]],
    });
    const { container } = render(<SGFClock goban={goban} color="black" />);
    expect(container.querySelector(".main-time")).toHaveTextContent("8:32");

    act(() => {
        goban.engine.cur_move.applyClocks({ black_clock: { main_time: 90000 } });
        goban.emit("review.updated");
    });
    expect(container.querySelector(".main-time")).toHaveTextContent("1:30");
});

test("a game with no recorded clocks shows nothing", () => {
    const goban = finishedGame({ moves: [[2, 2, 1000]] });
    const { container } = render(<SGFClock goban={goban} color="black" />);
    expect(container).toBeEmptyDOMElement();
});

describe("a review's running clock", () => {
    function reviewBoard(config = {}) {
        const goban = new GobanController({
            ...config,
            review_id: 77,
            width: 9,
            height: 9,
            time_control: BYOYOMI,
            moves: [
                [2, 2, 1000, undefined, { black_clock: { main_time: 512000 } }],
                [6, 6, 1000, undefined, { white_clock: { main_time: 500000 } }],
            ],
        } as any).goban;
        goban.engine.jumpTo(goban.engine.last_official_move);
        return goban;
    }

    afterEach(() => {
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    test("on the live move a running clock counts down", () => {
        jest.useFakeTimers();
        const goban = reviewBoard();
        let main_time = 590000;
        jest.spyOn(goban, "getReviewClock").mockImplementation(() => ({
            clock: { main_time },
            on_move: true,
            running: true,
        }));
        const { container } = render(<SGFClock goban={goban} color="black" />);
        expect(container.querySelector(".main-time")).toHaveTextContent("9:50");

        main_time = 589000;
        act(() => {
            jest.advanceTimersByTime(1000);
        });
        expect(container.querySelector(".main-time")).toHaveTextContent("9:49");
    });

    test("a paused clock shows Paused", () => {
        const goban = reviewBoard();
        jest.spyOn(goban, "getReviewClock").mockReturnValue({
            clock: { main_time: 590000 },
            on_move: true,
            running: false,
            pause_state: {},
        });
        const { container } = render(<SGFClock goban={goban} color="black" />);
        expect(container).toHaveTextContent("Paused");
        expect(container.querySelector(".SGFClock")).toHaveClass("paused");
    });

    test.each([
        ["in stone removal", { stone_removal: true } as const],
        ["once the game is over", undefined],
    ])("the player on move has no turn clock %s", (_, pause_state) => {
        const goban = reviewBoard({ game_id: 5 });
        jest.spyOn(goban, "getReviewClock").mockReturnValue({
            clock: { main_time: 590000 },
            on_move: true,
            running: false,
            pause_state,
        });
        const { container } = render(<SGFClock goban={goban} color="black" show_turn_clock />);
        expect(container.querySelector(".TurnClock")).toBeNull();
    });

    test("a clock stopped at the end of the game says nothing", () => {
        const goban = reviewBoard({ game_id: 5 });
        jest.spyOn(goban, "getReviewClock").mockReturnValue({
            clock: { main_time: 590000 },
            on_move: true,
            running: false,
        });
        const { container } = render(<SGFClock goban={goban} color="black" />);
        expect(container.querySelector(".main-time")).toHaveTextContent("9:50");
        expect(container).not.toHaveTextContent("Paused");
    });

    test("away from the live move the stored clock shows", () => {
        const goban = reviewBoard();
        jest.spyOn(goban, "getReviewClock").mockReturnValue({
            clock: { main_time: 590000 },
            on_move: true,
            running: true,
        });
        act(() => {
            goban.engine.jumpTo(goban.engine.move_tree.trunk_next!);
        });
        const { container } = render(<SGFClock goban={goban} color="black" />);
        expect(container.querySelector(".main-time")).toHaveTextContent("8:32");
    });

    test("a board never started looks as today", () => {
        const goban = reviewBoard();
        jest.spyOn(goban, "getReviewClock").mockReturnValue(null);
        const { container } = render(<SGFClock goban={goban} color="black" />);
        expect(container.querySelector(".main-time")).toHaveTextContent("8:32");
        expect(container).not.toHaveTextContent("Paused");
    });
});

describe("a review's running clock looks like the game's", () => {
    const CANADIAN = {
        system: "canadian",
        speed: "live",
        main_time: 600,
        period_time: 300,
        stones_per_period: 5,
        pause_on_weekends: false,
    };
    const FISCHER = {
        system: "fischer",
        speed: "live",
        initial_time: 600,
        time_increment: 30,
        max_time: 1200,
        pause_on_weekends: false,
    };
    const SIMPLE = { system: "simple", speed: "live", per_move: 30, pause_on_weekends: false };
    const ABSOLUTE = {
        system: "absolute",
        speed: "live",
        total_time: 900,
        pause_on_weekends: false,
    };

    beforeEach(() => data.set("user", { anonymous: true } as any));

    /** The clock markup, without the class that names the component */
    function clockHTML(container: HTMLElement): string {
        const clock = container.querySelector(".Clock")!.cloneNode(true) as HTMLElement;
        clock.classList.remove("SGFClock");
        return clock.outerHTML;
    }

    test.each([
        // The review records a clock in main time without its overtime
        [
            "byo-yomi in main time",
            BYOYOMI,
            { main_time: 272000 },
            { main_time: 272000, periods_left: 5, period_time_left: 30000 },
        ],
        [
            "byo-yomi in overtime",
            BYOYOMI,
            { main_time: 0, periods_left: 3, period_time_left: 12000 },
            null,
        ],
        [
            "byo-yomi sudden death",
            BYOYOMI,
            { main_time: 0, periods_left: 1, period_time_left: 12000 },
            null,
        ],
        [
            "canadian in main time",
            CANADIAN,
            { main_time: 100000 },
            { main_time: 100000, moves_left: 5, block_time_left: 300000 },
        ],
        [
            "canadian in overtime",
            CANADIAN,
            { main_time: 0, moves_left: 3, block_time_left: 120000 },
            null,
        ],
        ["fischer", FISCHER, { main_time: 250000 }, null],
        ["simple", SIMPLE, { main_time: 20000 }, null],
        ["absolute", ABSOLUTE, { main_time: 500000 }, null],
    ])("%s", (_, time_control, review_clock, game_clock) => {
        for (const [running, pause_state] of [
            [true, undefined],
            [false, { weekend: true }],
        ] as const) {
            const goban = new GobanController({
                review_id: 77,
                width: 9,
                height: 9,
                time_control,
                moves: [[2, 2, 1000]],
            } as any).goban;
            goban.engine.jumpTo(goban.engine.last_official_move);
            jest.spyOn(goban, "getReviewClock").mockReturnValue({
                clock: review_clock,
                on_move: true,
                running,
                pause_state,
            });
            const review = render(
                <SGFClock goban={goban} color="black" className="in-game-clock" show_turn_clock />,
            );
            const game = render(
                <Clock goban={goban} color="black" className="in-game-clock" show_turn_clock />,
            );
            act(() => {
                goban.emit("clock", {
                    current_player: "black",
                    current_player_id: "1",
                    time_of_last_move: 0,
                    black_clock: game_clock ?? review_clock,
                    white_clock: game_clock ?? review_clock,
                    pause_state,
                } as any);
            });

            expect(clockHTML(review.container)).toEqual(clockHTML(game.container));
            review.unmount();
            game.unmount();
            jest.restoreAllMocks();
        }
    });
});
