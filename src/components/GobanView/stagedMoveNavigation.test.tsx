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
import { callbacks } from "goban";
import * as preferences from "@/lib/preferences";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "./GobanViewContext";
import { MoveNumberControl } from "./MoveNumberControl";
import { GameChatMoveNumber } from "@/components/Chat/GameChatMoveNumber";
import { GameChatLine } from "@/views/Game/GameChat";

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: () => null,
}));

function stagedGame() {
    const controller = new GobanController({
        width: 9,
        height: 9,
        moves: [
            [2, 2],
            [3, 3],
        ],
    });
    const goban = controller.goban;
    goban.setMode("play");
    const official = goban.engine.cur_move;
    goban.engine.place(4, 4);
    goban.move_selected = { x: 4, y: 4 };
    goban.submit_move = () => {
        /* staged, not sent */
    };
    return { controller, goban, official };
}

function stoneIsGone(
    goban: ReturnType<typeof stagedGame>["goban"],
    official: { branches: Array<{ x: number; y: number }> },
) {
    expect(goban.submit_move).toBeUndefined();
    expect(goban.move_selected).toBeUndefined();
    expect(official.branches.some((branch) => branch.x === 4 && branch.y === 4)).toBe(false);
}

describe("staged move and analysis disabled", () => {
    const previous = callbacks.isAnalysisDisabled;

    beforeEach(() => {
        callbacks.isAnalysisDisabled = () => true;
        preferences.set("move-number-control-mode", "slider");
    });

    afterEach(() => {
        callbacks.isAnalysisDisabled = previous;
        preferences.set("move-number-control-mode", "buttons");
    });

    test("dragging the move slider back drops the staged stone", () => {
        const { controller, goban, official } = stagedGame();
        render(
            <GobanControllerContext.Provider value={controller}>
                <MoveNumberControl />
            </GobanControllerContext.Provider>,
        );
        const slider = screen.getByRole("slider") as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
        setter?.call(slider, "1");
        fireEvent.change(slider);
        stoneIsGone(goban, official);
        expect(goban.engine.cur_move.move_number).toBe(1);
    });

    test("a chat move link drops the staged stone", () => {
        const { controller, goban, official } = stagedGame();
        render(
            <GobanControllerContext.Provider value={controller}>
                <GameChatMoveNumber line={{ move_number: 1 }} />
            </GobanControllerContext.Provider>,
        );
        fireEvent.click(screen.getByText(/Move/));
        stoneIsGone(goban, official);
        expect(goban.engine.cur_move.move_number).toBe(1);
    });

    test("the game chat move link drops the staged stone", () => {
        const { controller, goban, official } = stagedGame();
        const line = {
            body: "ok",
            move_number: 1,
            channel: "main",
            chat_id: "1",
            player_id: 0,
        };
        render(
            <GobanControllerContext.Provider value={controller}>
                <GameChatLine line={line as never} last_line={undefined as never} />
            </GobanControllerContext.Provider>,
        );
        fireEvent.click(screen.getByText(/Move/));
        stoneIsGone(goban, official);
        expect(goban.engine.cur_move.move_number).toBe(1);
    });
});
