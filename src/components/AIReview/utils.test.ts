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

import { encodeMove, GobanEngine, JGOFAIReviewMove } from "goban";
import { fillAIMarksBacktracking } from "./utils";

function aiMove(move_number: number, branches: Array<Array<[number, number]>>): JGOFAIReviewMove {
    return {
        move_number,
        move: { x: 0, y: 0 },
        win_rate: 0.5,
        branches: branches.map((moves) => ({
            moves: moves.map(([x, y]) => ({ x, y })),
            win_rate: 0.5,
            visits: 1,
        })),
    };
}

describe("fillAIMarksBacktracking", () => {
    test("a variation only keeps the AI playout that stays on the tree", () => {
        const engine = new GobanEngine({ width: 9, height: 9, moves: "aaabac" });
        const trunk = engine.cur_move;
        expect(trunk.trunk).toBe(true);
        engine.followPath(3, "dddeee");
        const end = engine.cur_move;
        const inVariation = end.parent!.parent!;
        engine.jumpTo(inVariation);

        const marks: { [mark: string]: string } = {};
        const filled = fillAIMarksBacktracking(
            engine.cur_move,
            trunk,
            marks,
            {
                moves: {
                    3: aiMove(3, [
                        [
                            [3, 3],
                            [8, 8],
                            [7, 8],
                        ],
                        [
                            [3, 3],
                            [3, 4],
                            [4, 4],
                            [6, 6],
                        ],
                    ]),
                },
            },
            engine,
        );

        expect(filled).toBe(true);
        expect(engine.cur_move.trunk).toBe(false);
        // One move into the variation, so the next ghost is numbered 2.
        // The AI's (8,8) line is dropped, and (6,6) is past where the tree ends.
        expect(marks[2]).toBe(encodeMove(3, 4));
        expect(marks[3]).toBe(encodeMove(4, 4));
        expect(marks[4]).toBeUndefined();
        expect(marks.black + marks.white).not.toContain(encodeMove(8, 8));
        expect(marks.black + marks.white).not.toContain(encodeMove(6, 6));
    });

    test("a variation with no matching AI playout draws nothing", () => {
        const engine = new GobanEngine({ width: 9, height: 9, moves: "aaabac" });
        const trunk = engine.cur_move;
        expect(trunk.trunk).toBe(true);
        engine.followPath(3, "dddeee");
        engine.jumpTo(engine.cur_move.parent!.parent!);

        const marks: { [mark: string]: string } = {};
        const filled = fillAIMarksBacktracking(
            engine.cur_move,
            trunk,
            marks,
            {
                moves: {
                    3: aiMove(3, [
                        [
                            [3, 3],
                            [8, 8],
                        ],
                    ]),
                },
            },
            engine,
        );

        expect(filled).toBe(false);
        expect(marks).toEqual({});
    });

    test("the end of a variation still shows the AI's own continuation", () => {
        const engine = new GobanEngine({ width: 9, height: 9, moves: "aaabac" });
        const trunk = engine.cur_move;
        engine.followPath(3, "dd");
        expect(engine.cur_move.next()).toBeNull();

        const marks: { [mark: string]: string } = {};
        const filled = fillAIMarksBacktracking(
            engine.cur_move,
            trunk,
            marks,
            {
                moves: {
                    3: aiMove(3, [
                        [
                            [3, 3],
                            [8, 8],
                            [7, 8],
                        ],
                    ]),
                },
            },
            engine,
        );

        expect(filled).toBe(true);
        expect(marks[2]).toBe(encodeMove(8, 8));
        expect(marks[3]).toBe(encodeMove(7, 8));
    });

    test("on the trunk an AI playout may differ from the game", () => {
        const engine = new GobanEngine({ width: 9, height: 9, moves: "aaabacad" });
        const at3 = engine.move_tree.index(3);
        engine.jumpTo(at3);
        expect(at3.trunk).toBe(true);
        expect(at3.next()!.x).not.toBe(8);

        const marks: { [mark: string]: string } = {};
        const filled = fillAIMarksBacktracking(
            engine.cur_move,
            at3.getBranchPoint(),
            marks,
            {
                moves: {
                    3: aiMove(3, [
                        [
                            [8, 8],
                            [7, 7],
                        ],
                    ]),
                },
            },
            engine,
        );

        expect(filled).toBe(true);
        expect(marks[1]).toBe(encodeMove(8, 8));
        expect(marks[2]).toBe(encodeMove(7, 7));
    });
});
