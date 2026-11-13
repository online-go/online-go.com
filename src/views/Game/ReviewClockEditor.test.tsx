/*
 * Copyright (C)  Online-Go.com
 */

// See PlayerCards.test.tsx: this import order avoids a circular-import crash.
import "@/lib/data";
import "@/lib/sockets";

import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import * as React from "react";
import { GobanController } from "@/lib/GobanController";
import { ReviewClockEditor } from "./ReviewClockEditor";

const ABSOLUTE = {
    system: "absolute",
    speed: "live",
    total_time: 600,
    pause_on_weekends: false,
};

function reviewBoard(time_control: object | null = ABSOLUTE) {
    const goban = new GobanController({
        review_id: 77,
        width: 9,
        height: 9,
        ...(time_control ? { time_control } : {}),
        moves: [
            [2, 2, 1000],
            [6, 6, 1000],
        ],
    } as any).goban;
    const setClock = jest.spyOn(goban, "setReviewNodeClock").mockImplementation(() => {});
    return { goban, setClock };
}

const BYOYOMI = {
    system: "byoyomi",
    speed: "live",
    main_time: 600,
    period_time: 30,
    periods: 5,
    pause_on_weekends: false,
};

function setRow(color: "black" | "white", fields: { time?: string; count?: string }) {
    const row = screen.getByTestId(`review-clock-${color}`);
    if (fields.time !== undefined) {
        fireEvent.change(row.querySelector(".ReviewClockEditor-time")!, {
            target: { value: fields.time },
        });
    }
    if (fields.count !== undefined) {
        fireEvent.change(row.querySelector(".ReviewClockEditor-count")!, {
            target: { value: fields.count },
        });
    }
    return row;
}

test("the controller sets a player's time left", () => {
    const { goban, setClock } = reviewBoard();
    render(<ReviewClockEditor goban={goban} />);

    setRow("white", { time: "1:30" });

    expect(setClock).toHaveBeenCalledWith("white", { main_time: 90000 });
});

test("hours, minutes and seconds are all understood", () => {
    const { goban, setClock } = reviewBoard();
    render(<ReviewClockEditor goban={goban} />);

    setRow("black", { time: "1:02:03" });
    setRow("black", { time: "45" });

    expect(setClock).toHaveBeenNthCalledWith(1, "black", { main_time: 3723000 });
    expect(setClock).toHaveBeenNthCalledWith(2, "black", { main_time: 45000 });
});

test("byo-yomi periods put the clock in overtime", () => {
    const { goban, setClock } = reviewBoard(BYOYOMI);
    render(<ReviewClockEditor goban={goban} />);

    setRow("black", { time: "0:30", count: "3" });

    expect(setClock).toHaveBeenLastCalledWith("black", {
        main_time: 0,
        period_time_left: 30000,
        periods_left: 3,
    });
});

test("canadian stones put the clock in overtime", () => {
    const { goban, setClock } = reviewBoard({
        system: "canadian",
        speed: "live",
        main_time: 0,
        period_time: 300,
        stones_per_period: 5,
        pause_on_weekends: false,
    });
    render(<ReviewClockEditor goban={goban} />);

    setRow("black", { time: "4:20", count: "4" });

    expect(setClock).toHaveBeenLastCalledWith("black", {
        main_time: 0,
        block_time_left: 260000,
        moves_left: 4,
    });
});

test("without an overtime system there is no count to fill in", () => {
    const { goban } = reviewBoard();
    render(<ReviewClockEditor goban={goban} />);
    expect(
        screen.getByTestId("review-clock-black").querySelector(".ReviewClockEditor-count"),
    ).toBeNull();
});

test("a review without a time control has no clocks to edit", () => {
    const { goban } = reviewBoard(null);
    const { container } = render(<ReviewClockEditor goban={goban} />);
    expect(container).toBeEmptyDOMElement();
});

test("clearing removes the clock", () => {
    const { goban, setClock } = reviewBoard();
    goban.engine.cur_move.black_clock = { main_time: 60000 };
    render(<ReviewClockEditor goban={goban} />);

    fireEvent.click(
        screen.getByTestId("review-clock-black").querySelector(".ReviewClockEditor-clear")!,
    );

    expect(setClock).toHaveBeenCalledWith("black", null);
});

test("a time that can't be read is not sent", () => {
    const { goban, setClock } = reviewBoard();
    render(<ReviewClockEditor goban={goban} />);

    const row = setRow("black", { time: "soon" });

    expect(setClock).not.toHaveBeenCalled();
    expect(row.querySelector(".ReviewClockEditor-time")).toHaveClass("invalid");
});

test("the fields show the clocks of the node being viewed", () => {
    const { goban } = reviewBoard(BYOYOMI);
    goban.engine.move_tree.trunk_next!.black_clock = {
        main_time: 0,
        period_time_left: 30000,
        periods_left: 3,
    };
    goban.engine.jumpTo(goban.engine.move_tree);
    render(<ReviewClockEditor goban={goban} />);
    const time = () =>
        screen
            .getByTestId("review-clock-black")
            .querySelector<HTMLInputElement>(".ReviewClockEditor-time")!;

    expect(time().value).toBe("");

    act(() => {
        goban.engine.jumpTo(goban.engine.move_tree.trunk_next!);
        goban.emit("cur_move", goban.engine.cur_move);
    });
    expect(time().value).toBe("0:30");
    expect(
        screen
            .getByTestId("review-clock-black")
            .querySelector<HTMLInputElement>(".ReviewClockEditor-count")!.value,
    ).toBe("3");
});

test("unrelated review updates keep what is being typed; a clock change refreshes it", () => {
    const { goban } = reviewBoard();
    render(<ReviewClockEditor goban={goban} />);
    const time = () =>
        screen
            .getByTestId("review-clock-black")
            .querySelector<HTMLInputElement>(".ReviewClockEditor-time")!;

    setRow("black", { time: "1:2" });
    act(() => {
        goban.emit("review.updated");
    });
    expect(time().value).toBe("1:2");

    act(() => {
        goban.engine.cur_move.applyClocks({ black_clock: { main_time: 75000 } });
        goban.emit("review.updated");
    });
    expect(time().value).toBe("1:15");
});

test("a node without a clock starts from the last clock set before it", () => {
    const { goban, setClock } = reviewBoard(BYOYOMI);
    const first = goban.engine.move_tree.trunk_next!;
    first.black_clock = { main_time: 0, period_time_left: 30000, periods_left: 3 };
    act(() => {
        goban.engine.jumpTo(first.trunk_next!);
    });
    render(<ReviewClockEditor goban={goban} />);

    const row = screen.getByTestId("review-clock-black");
    expect(row.querySelector<HTMLInputElement>(".ReviewClockEditor-time")!.value).toBe("0:30");
    expect(row.querySelector<HTMLInputElement>(".ReviewClockEditor-count")!.value).toBe("3");
    expect(row).toHaveClass("inherited");
    expect(row.querySelector(".ReviewClockEditor-clear")).toBeDisabled();
    expect(setClock).not.toHaveBeenCalled();
});

test("setting the clock while typing keeps the field as typed", () => {
    const { goban, setClock } = reviewBoard();
    setClock.mockImplementation((color, clock) => {
        goban.engine.cur_move.applyClocks({ [`${color}_clock`]: clock });
        goban.emit("review.updated");
    });
    render(<ReviewClockEditor goban={goban} />);
    const time = screen
        .getByTestId("review-clock-black")
        .querySelector<HTMLInputElement>(".ReviewClockEditor-time")!;

    setRow("black", { time: "1:2" });

    expect(goban.engine.cur_move.black_clock).toEqual({ main_time: 62000 });
    expect(time.isConnected).toBe(true);
    expect(time.value).toBe("1:2");
    expect(screen.getByTestId("review-clock-black")).not.toHaveClass("inherited");
});
