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
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { GobanController } from "@/lib/GobanController";
import { CompactPlayerHeader } from "./CompactPlayerHeader";
import { GobanControllerContext } from "./goban_context";

function renderHeader(config: Record<string, unknown>) {
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
                />
            </GobanControllerContext.Provider>
        </Router>,
    );
    return { ...result, controller };
}

describe("CompactPlayerHeader", () => {
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

    test("leaves both stones level when the game is over", () => {
        renderHeader({ phase: "finished", outcome: "Resignation", winner: 11 });
        expect(screen.getByTestId("compact-stone-black")).not.toHaveClass("on-top");
        expect(screen.getByTestId("compact-stone-white")).not.toHaveClass("on-top");
    });

    test("shows the live move number", () => {
        renderHeader({
            moves: [
                [3, 3],
                [15, 15],
            ],
        });
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    test("keeps the live move number while the move tree is browsed", () => {
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
        expect(screen.getByText("3")).toBeInTheDocument();
        expect(screen.getByTestId("compact-stone-white")).toHaveClass("on-top");
    });
});
