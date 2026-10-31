/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 */

import * as data from "@/lib/data";
import "@/lib/sockets";
import * as React from "react";
import { act, render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "@/components/GobanView";
import type { GameLayoutSnapshot } from "@/components/GobanView";
import type { JGOFClockWithTransmitting } from "goban";
import { KibitzStackedPlayerHeader } from "./KibitzStackedPlayerHeader";
import { usesKibitzThinHeader } from "./kibitzThinHeader";

jest.mock("@/components/GobanView", () => ({
    ...jest.requireActual("@/components/GobanView"),
    useGobanViewLayout: () => ({ mode: "stacked" }),
}));

const originalSize = {
    width: window.innerWidth,
    height: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
};

const originalUser = data.get("user");

beforeEach(() => data.set("user", { anonymous: true } as rest_api.UserConfig));

function setSize(width: number, height: number) {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: height });
    Object.defineProperty(document.documentElement, "clientWidth", {
        configurable: true,
        value: width,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
        configurable: true,
        value: height,
    });
    window.dispatchEvent(new Event("resize"));
}

function controller(game_id = 123456, moves: Array<[number, number]> = []) {
    return new GobanController({
        game_id,
        moves,
        players: {
            black: { id: 11, username: "Kuro", rank: 20 },
            white: { id: 22, username: "Shiro", rank: 20 },
        },
        time_control: {
            system: "byoyomi",
            speed: "live",
            main_time: 1200,
            periods: 5,
            period_time: 30,
        },
    });
}

function header(game: GobanController) {
    return (
        <BrowserRouter>
            <GobanControllerContext.Provider value={game}>
                <KibitzStackedPlayerHeader controller={game} estimatingScore={false} />
            </GobanControllerContext.Provider>
        </BrowserRouter>
    );
}

function tick(game: GobanController, overrides: Partial<JGOFClockWithTransmitting> = {}) {
    game.goban.emit("clock", {
        current_player: "black",
        current_player_id: "11",
        time_of_last_move: 1700000000,
        black_clock: { main_time: 754000, periods_left: 5, period_time_left: 30000 },
        white_clock: { main_time: 532000, periods_left: 5, period_time_left: 30000 },
        black_move_transmitting: 0,
        white_move_transmitting: 0,
        ...overrides,
    });
}

afterEach(() => {
    data.set("user", originalUser);
    act(() => setSize(originalSize.width, originalSize.height));
    Object.defineProperty(document.documentElement, "clientWidth", {
        configurable: true,
        value: originalSize.clientWidth,
    });
    Object.defineProperty(document.documentElement, "clientHeight", {
        configurable: true,
        value: originalSize.clientHeight,
    });
    jest.restoreAllMocks();
});

test.each([
    [320, 568, true],
    [375, 900, true],
    [390, 843, true],
    [389, 844, true],
    [390, 844, false],
    [430, 932, false],
    [600, 700, false],
    [844, 390, false],
    [1440, 800, false],
])("selects the header at %i by %i", (width, height, expected) => {
    const layout: GameLayoutSnapshot = {
        width,
        height,
        mode: width < 600 ? "stacked" : "compactHorizontal",
        squashed: false,
        keyboardOpen: false,
    };
    expect(usesKibitzThinHeader(layout)).toBe(expected);
});

test("updates captures and live clocks without putting rules in the strip", () => {
    setSize(375, 667);
    const game = controller();
    game.goban.engine.black_prisoners = 3;
    game.goban.engine.cur_move.state.black_prisoners = 3;
    const { container } = render(header(game));
    act(() => tick(game));
    const black = container.querySelector(".KibitzThinPlayer.black")!;
    expect(black).toHaveTextContent("Kuro");
    expect(black).toHaveTextContent("3 captures");
    expect(black).toHaveTextContent("12:34");
    expect(black).toHaveClass("their-turn");
    expect(container.querySelector(".CompactTurnStones-rules")).toBeNull();

    act(() => {
        game.goban.engine.black_prisoners = 4;
        game.goban.engine.cur_move.state.black_prisoners = 4;
        game.goban.emit("cur_move", game.goban.engine.cur_move);
        tick(game, {
            black_clock: { main_time: 753000, periods_left: 5, period_time_left: 30000 },
        });
    });
    expect(black).toHaveTextContent("4 captures");
    expect(black).toHaveTextContent("12:33");

    act(() =>
        tick(game, { black_clock: { main_time: 0, periods_left: 3, period_time_left: 25000 } }),
    );
    expect(black.querySelector(".period-time")).toHaveTextContent("0:25");
    expect(black.querySelector(".byo-yomi-periods")).toHaveTextContent("(3)");
});

test("shows small avatars without a disclosure and follows controller changes", () => {
    setSize(375, 667);
    const game = controller();
    const { container, rerender } = render(header(game));
    expect(container.querySelectorAll(".KibitzThinPlayer-avatar .PlayerIcon-32")).toHaveLength(2);
    expect(container.querySelector("button[aria-expanded]")).toBeNull();
    const nextGame = controller(200);
    nextGame.goban.engine.players.black.username = "Next black";
    rerender(header(nextGame));
    expect(container.querySelector(".CompactPlayerHeader")).toBeNull();
    expect(container.querySelector(".KibitzThinPlayer.black")).toHaveTextContent("Next black");
    act(() => tick(nextGame));
    expect(
        container.querySelector(".KibitzThinPlayer.black .KibitzThinPlayer-time"),
    ).toHaveTextContent("12:34");
});

test("keeps capture counts accessible when the full label does not fit", () => {
    setSize(320, 568);
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(100);
    jest.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (
        this: HTMLElement,
    ) {
        return this.classList.contains("KibitzThinPlayer-capture-label") ? 70 : 60;
    });
    const { container } = render(header(controller()));
    const captures = container.querySelector(".KibitzThinPlayer.black .KibitzThinPlayer-captures")!;
    expect(captures).toHaveClass("is-overflowing");
    expect(captures).toHaveAttribute("aria-hidden", "false");
    expect(captures.querySelector(".KibitzThinPlayer-capture-short")).toHaveAttribute(
        "aria-label",
        "0 captures",
    );
    expect(captures.querySelector(".KibitzThinPlayer-capture-short")).toHaveAttribute(
        "aria-hidden",
        "false",
    );
    expect(captures.querySelector(".KibitzThinPlayer-capture-label")).toHaveAttribute(
        "aria-hidden",
        "true",
    );
});

test("keeps Canadian overtime and pause state visible", () => {
    setSize(375, 667);
    const game = controller();
    game.goban.engine.time_control = {
        system: "canadian",
        speed: "live",
        main_time: 1200,
        period_time: 300,
        stones_per_period: 25,
    };
    const { container } = render(header(game));
    act(() =>
        tick(game, {
            black_clock: { main_time: 0, block_time_left: 250000, moves_left: 12 },
            pause_state: { server: true },
        }),
    );
    const black = container.querySelector(".KibitzThinPlayer.black")!;
    expect(black.querySelector(".period-time")).toHaveTextContent("4:10");
    expect(black.querySelector(".period-moves")).toHaveTextContent("12");
    expect(black.querySelector(".KibitzThinPlayer-paused")).toHaveTextContent("Paused");
    expect(black.querySelector(".KibitzThinPlayer-captures")).toHaveAttribute(
        "aria-hidden",
        "true",
    );
    act(() => tick(game));
    expect(black.querySelector(".KibitzThinPlayer-paused")).toBeNull();
});

test("keeps the official turn while browsing an earlier move", () => {
    setSize(375, 667);
    const game = controller(123456, [[3, 3]]);
    const { container } = render(header(game));
    expect(container.querySelector(".KibitzThinPlayer.white")).toHaveClass("their-turn");
    act(() => {
        game.goban.engine.jumpTo(game.goban.engine.move_tree);
        game.goban.emit("cur_move", game.goban.engine.cur_move);
    });
    expect(container.querySelector(".KibitzThinPlayer.white")).toHaveClass("their-turn");
    expect(container.querySelector(".KibitzThinPlayer.black")).not.toHaveClass("their-turn");
});

test("switches at the reference size and keeps the mode while the keyboard is open", () => {
    setSize(390, 844);
    const { container } = render(header(controller()));
    expect(container.querySelector(".CompactPlayerHeader")).toBeInTheDocument();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    act(() => setSize(390, 500));
    expect(container.querySelector(".KibitzThinPlayer")).toBeNull();
    input.remove();
    act(() => setSize(375, 667));
    expect(container.querySelectorAll(".KibitzThinPlayer")).toHaveLength(2);
    act(() => setSize(390, 844));
    expect(container.querySelector(".KibitzThinPlayer")).toBeNull();
});
