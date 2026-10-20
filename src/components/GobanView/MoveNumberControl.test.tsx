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
import { act, render } from "@testing-library/react";
import { EventEmitter } from "eventemitter3";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "./GobanViewContext";
import { MoveNumberControl } from "./MoveNumberControl";

interface FakeMove {
    move_number: number;
    prev(): FakeMove;
    next(): FakeMove | undefined;
}

function moveList(length: number): FakeMove[] {
    const moves: FakeMove[] = [];
    for (let i = 0; i < length; ++i) {
        moves.push({
            move_number: i,
            prev: () => moves[Math.max(0, i - 1)],
            next: () => moves[i + 1],
        });
    }
    return moves;
}

function fakeController(moves: FakeMove[], mode: string, start: number) {
    const goban = Object.assign(new EventEmitter(), {
        mode,
        engine: { cur_move: moves[start] },
    });
    const jump = (move: FakeMove | undefined) => {
        if (move) {
            goban.engine.cur_move = move;
            goban.emit("cur_move", move);
        }
    };
    const controller = Object.assign(new EventEmitter(), {
        goban,
        autoplaying: false,
        previousMove: () => jump(goban.engine.cur_move.prev()),
        nextMove: () => jump(goban.engine.cur_move.next()),
    });
    return controller as unknown as GobanController & {
        previousMove: () => void;
        nextMove: () => void;
    };
}

const flushMicrotasks = async () => {
    for (let i = 0; i < 10; ++i) {
        await Promise.resolve();
    }
};

describe("MoveNumberControl", () => {
    const g = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    let act_environment: boolean | undefined;

    beforeEach(() => {
        act_environment = g.IS_REACT_ACT_ENVIRONMENT;
    });
    afterEach(() => {
        g.IS_REACT_ACT_ENVIRONMENT = act_environment;
    });

    /* Holding an arrow key sends a keydown for every key repeat. When the
     * browser handles the queued keydowns before React's scheduler task,
     * only the synchronous (discrete event) renders run. React 19 counts
     * each of these commits as a nested update when it leaves work pending,
     * and throws "Maximum update depth exceeded" after 50 of them. The loop
     * below only flushes microtasks, so the scheduler task does not run. */
    test("a long run of keydown navigation does not leave updates pending", async () => {
        const moves = moveList(200);
        const controller = fakeController(moves, "analyze", 199);
        const onKeyDown = () => controller.previousMove();

        render(
            <GobanControllerContext.Provider value={controller}>
                <MoveNumberControl />
            </GobanControllerContext.Provider>,
        );
        await act(async () => {
            await new Promise((resolve) => setTimeout(resolve, 0));
        });

        g.IS_REACT_ACT_ENVIRONMENT = false;
        document.addEventListener("keydown", onKeyDown);
        const errors: unknown[] = [];
        const onError = (ev: ErrorEvent) => {
            errors.push(ev.error);
            ev.preventDefault();
        };
        window.addEventListener("error", onError);
        try {
            for (let i = 0; i < 120; ++i) {
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));
                await flushMicrotasks();
            }
        } finally {
            document.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("error", onError);
        }

        expect(errors).toEqual([]);
        expect(controller.goban.engine.cur_move.move_number).toBe(79);
    });

    test("in a puzzle, forward navigation stops at the deepest move visited", () => {
        const controller = fakeController(moveList(10), "puzzle", 0);
        const { getByTitle } = render(
            <GobanControllerContext.Provider value={controller}>
                <MoveNumberControl />
            </GobanControllerContext.Provider>,
        );
        const next = getByTitle("Next move") as HTMLButtonElement;
        expect(next.disabled).toBe(true);

        act(() => {
            controller.nextMove();
            controller.nextMove();
            controller.nextMove();
        });
        expect(next.disabled).toBe(true);

        act(() => {
            controller.previousMove();
            controller.previousMove();
        });
        expect(next.disabled).toBe(false);

        act(() => {
            controller.nextMove();
            controller.nextMove();
        });
        expect(next.disabled).toBe(true);
    });
});
