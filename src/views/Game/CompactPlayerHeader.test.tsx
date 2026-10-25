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

// See the note in PlayerCards.test.tsx: importing these two in this order
// anchors the sockets/data module cycle that the player card pulls in.
import "@/lib/data";
import "@/lib/sockets";

import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { GobanController } from "@/lib/GobanController";
import { CompactPlayerHeader } from "./CompactPlayerHeader";
import { GobanControllerContext } from "./goban_context";

function renderHeader(config: Record<string, unknown>, headerController?: GobanController) {
    const controller = new GobanController({
        game_id: 123456,
        players: {
            black: { id: 11, username: "blackie", rank: 20 },
            white: { id: 22, username: "whitey", rank: 20 },
        },
        ...config,
    } as ConstructorParameters<typeof GobanController>[0]);

    const result = render(
        <Router>
            <GobanControllerContext.Provider value={controller}>
                <CompactPlayerHeader
                    historical_black={null}
                    historical_white={null}
                    estimating_score={false}
                    controller={headerController}
                />
            </GobanControllerContext.Provider>
        </Router>,
    );
    return { ...result, controller };
}

describe("CompactPlayerHeader", () => {
    test("closes the score breakdown on a tap anywhere on the screen", () => {
        const { container, controller } = renderHeader({ komi: 6.5 });
        const goban = controller.goban;
        const player_score = {
            total: 0,
            stones: 0,
            territory: 0,
            prisoners: 0,
            scoring_positions: "",
            handicap: 0,
            komi: 0,
        };
        jest.spyOn(goban.engine, "computeScore").mockReturnValue({
            black: player_score,
            white: { ...player_score, komi: 6.5 },
        });
        jest.spyOn(goban, "showScores").mockImplementation(() => undefined);
        const score = container.querySelector(".white.player-container .has-score-details");
        expect(screen.queryByTestId("compact-score-backdrop")).toBeNull();

        fireEvent.click(score as Element);
        expect(score).toHaveClass("show-score-breakdown");

        fireEvent.click(screen.getByTestId("compact-score-backdrop"));
        expect(score).not.toHaveClass("show-score-breakdown");
        expect(screen.queryByTestId("compact-score-backdrop")).toBeNull();
    });

    test("shows the komi under the rule set instead of on white's card", () => {
        const { container } = renderHeader({ komi: 6.5 });
        expect(container.querySelector(".CompactTurnStones-komi")).toHaveTextContent("Komi 6.5");
        expect(container.querySelector(".white.player-container .komi")).toBeNull();
    });

    test("shows a card for each player", () => {
        const { container } = renderHeader({});
        expect(container.querySelector(".black.player-container")).toBeInTheDocument();
        expect(container.querySelector(".white.player-container")).toBeInTheDocument();
    });

    test("puts black's stone on top at the start of the game", () => {
        renderHeader({});
        expect(screen.getByTestId("compact-stone-black")).toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-white")).not.toHaveClass("on-top");
    });

    test("puts white's stone on top once black has played", () => {
        renderHeader({ moves: [[3, 3]] });
        expect(screen.getByTestId("compact-stone-white")).toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-black")).not.toHaveClass("on-top");
    });

    test("puts white's stone on top at the start of a handicap game", () => {
        renderHeader({ handicap: 2, free_handicap_placement: false, initial_player: "white" });
        expect(screen.getByTestId("compact-stone-white")).toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-black")).not.toHaveClass("on-top");
    });

    test("leaves both stones level when the game is over", () => {
        renderHeader({ phase: "finished", outcome: "Resignation", winner: 11 });
        expect(screen.getByTestId("compact-stone-black")).not.toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-white")).not.toHaveClass("on-top");
    });

    test("shows the current move number", () => {
        renderHeader({
            moves: [
                [3, 3],
                [15, 15],
            ],
        });
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    test("follows the browsed move number while the move tree is browsed", () => {
        const { controller } = renderHeader({
            moves: [
                [3, 3],
                [15, 15],
                [3, 15],
            ],
        });
        act(() => {
            controller.goban.showPrevious();
            controller.goban.showPrevious();
        });
        expect(controller.goban.engine.cur_move.move_number).toBe(1);
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.queryByText("3")).toBeNull();
        expect(screen.getByTestId("compact-stone-white")).toHaveClass("on-top");
    });

    test("uses an explicitly supplied controller for variation details", () => {
        const variation = new GobanController({
            game_id: 654321,
            players: {
                black: { id: 11, username: "variation-black", rank: 20 },
                white: { id: 22, username: "variation-white", rank: 20 },
            },
            moves: [[3, 3]],
        } as ConstructorParameters<typeof GobanController>[0]);

        renderHeader(
            {
                moves: [
                    [3, 3],
                    [15, 15],
                    [3, 15],
                ],
            },
            variation,
        );

        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.queryByText("3")).toBeNull();
        expect(screen.getByText("variation-black")).toBeInTheDocument();
    });

    test("restores score popup marks to the Goban it was opened on when controllers change", () => {
        const first = new GobanController({
            game_id: 111,
            players: {
                black: { id: 11, username: "first-black", rank: 20 },
                white: { id: 22, username: "first-white", rank: 20 },
            },
            moves: [[3, 3]],
        } as ConstructorParameters<typeof GobanController>[0]);
        const second = new GobanController({
            game_id: 222,
            players: {
                black: { id: 33, username: "second-black", rank: 20 },
                white: { id: 44, username: "second-white", rank: 20 },
            },
            moves: [[4, 4]],
        } as ConstructorParameters<typeof GobanController>[0]);
        const firstGoban = first.goban;
        const secondGoban = second.goban;
        const firstMove = firstGoban.engine.cur_move!;
        const secondMove = secondGoban.engine.cur_move!;
        const firstMarks = { triangle: "A1" } as any;
        const firstSetMarks = jest.spyOn(firstMove, "setAllMarks");
        const secondSetMarks = jest.spyOn(secondMove, "setAllMarks");
        jest.spyOn(firstMove, "getAllMarks").mockReturnValue(firstMarks);
        jest.spyOn(firstGoban.engine, "computeScore").mockReturnValue({
            black: {
                total: 0,
                stones: 0,
                territory: 0,
                prisoners: 0,
                scoring_positions: "",
                handicap: 0,
                komi: 0,
            },
            white: {
                total: 0,
                stones: 0,
                territory: 0,
                prisoners: 0,
                scoring_positions: "",
                handicap: 0,
                komi: 0,
            },
        } as any);
        jest.spyOn(firstGoban, "showScores").mockImplementation(() => undefined);
        const firstHideScores = jest.spyOn(firstGoban, "hideScores");

        const headerProps = {
            historical_black: null,
            historical_white: null,
            estimating_score: false,
        };
        const { container, rerender } = render(
            <Router>
                <GobanControllerContext.Provider value={first}>
                    <CompactPlayerHeader {...headerProps} controller={first} />
                </GobanControllerContext.Provider>
            </Router>,
        );

        fireEvent.click(container.querySelector(".white.player-container .has-score-details")!);
        expect(screen.getByTestId("compact-score-backdrop")).toBeInTheDocument();

        rerender(
            <Router>
                <GobanControllerContext.Provider value={first}>
                    <CompactPlayerHeader {...headerProps} controller={second} />
                </GobanControllerContext.Provider>
            </Router>,
        );

        expect(firstHideScores).toHaveBeenCalledTimes(1);
        expect(firstSetMarks).toHaveBeenCalledWith(firstMarks);
        expect(secondSetMarks).not.toHaveBeenCalled();
        expect(screen.queryByTestId("compact-score-backdrop")).toBeNull();
    });

    test("restores score popup marks when the header unmounts", () => {
        const { container, controller, unmount } = renderHeader({ moves: [[3, 3]] });
        const goban = controller.goban;
        const currentMove = goban.engine.cur_move!;
        const marks = { triangle: "A1" } as any;
        const setAllMarks = jest.spyOn(currentMove, "setAllMarks");
        jest.spyOn(currentMove, "getAllMarks").mockReturnValue(marks);
        jest.spyOn(goban.engine, "computeScore").mockReturnValue({
            black: {
                total: 0,
                stones: 0,
                territory: 0,
                prisoners: 0,
                scoring_positions: "",
                handicap: 0,
                komi: 0,
            },
            white: {
                total: 0,
                stones: 0,
                territory: 0,
                prisoners: 0,
                scoring_positions: "",
                handicap: 0,
                komi: 0,
            },
        } as any);
        jest.spyOn(goban, "showScores").mockImplementation(() => undefined);
        const hideScores = jest.spyOn(goban, "hideScores");

        fireEvent.click(container.querySelector(".white.player-container .has-score-details")!);
        unmount();

        expect(hideScores).toHaveBeenCalledTimes(1);
        expect(setAllMarks).toHaveBeenCalledWith(marks);
    });
});
