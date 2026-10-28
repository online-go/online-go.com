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

import { GobanEngine } from "goban";
import type { GobanController } from "@/lib/GobanController";
import { openKibitzChatMove } from "./kibitzChatMove";

function setup() {
    const engine = new GobanEngine({
        width: 9,
        height: 9,
        moves: [
            [0, 0],
            [1, 1],
            [2, 2],
        ],
    });
    engine.setLastOfficialMove();
    const goban = {
        game_id: 42,
        engine,
        setMode: jest.fn(),
        isAnalysisDisabled: jest.fn(() => false),
        drawPenMarks: jest.fn(),
        updatePlayerToMoveTitle: jest.fn(),
        redraw: jest.fn(),
        emit: jest.fn(),
    };
    const target = { goban, destroyed: false, stopEstimatingScore: jest.fn() };
    const args = {
        controller: target as unknown as GobanController,
        gameId: 42,
        moveNumber: 1,
        isCurrentGame: jest.fn(() => true),
        confirmDiscardDraft: jest.fn(async () => true),
        closeVariation: jest.fn(),
    };
    return { target, goban, args };
}

test("opens the official position and leaves a variation only after confirmation", async () => {
    const { target, goban, args } = setup();
    expect(await openKibitzChatMove(args)).toBe(true);
    expect(args.closeVariation).toHaveBeenCalledTimes(1);
    expect(target.stopEstimatingScore).toHaveBeenCalledTimes(1);
    expect(goban.setMode).toHaveBeenCalledWith("analyze");
    expect(goban.engine.cur_move.move_number).toBe(1);
    expect(goban.engine.board[0][0]).toBe(1);
    expect(goban.engine.board[1][1]).toBe(0);
    expect(goban.redraw).toHaveBeenCalledWith(true);
    expect(goban.emit).toHaveBeenCalledWith("update");
});

test("keeps the current board and draft when discard is cancelled", async () => {
    const { goban, args } = setup();
    args.confirmDiscardDraft.mockResolvedValue(false);
    expect(await openKibitzChatMove(args)).toBe(false);
    expect(args.closeVariation).not.toHaveBeenCalled();
    expect(goban.engine.cur_move.move_number).toBe(3);
});

test.each(["room", "board"])("ignores a stale %s after the confirmation yields", async (change) => {
    const { target, goban, args } = setup();
    args.confirmDiscardDraft.mockImplementation(async () => {
        if (change === "room") {
            args.isCurrentGame.mockReturnValue(false);
        } else {
            target.destroyed = true;
        }
        return true;
    });
    expect(await openKibitzChatMove(args)).toBe(false);
    expect(args.closeVariation).not.toHaveBeenCalled();
    expect(goban.engine.cur_move.move_number).toBe(3);
});

test.each([-1, 1.5, 4, NaN])("refuses unavailable or invalid move %s", async (moveNumber) => {
    const { args } = setup();
    expect(await openKibitzChatMove({ ...args, moveNumber })).toBe(false);
    expect(args.confirmDiscardDraft).not.toHaveBeenCalled();
});

test("refuses another game before prompting", async () => {
    const { args } = setup();
    expect(await openKibitzChatMove({ ...args, gameId: 43 })).toBe(false);
    expect(args.confirmDiscardDraft).not.toHaveBeenCalled();
});

test("can show move zero without enabling disabled analysis", async () => {
    const { goban, args } = setup();
    goban.isAnalysisDisabled.mockReturnValue(true);
    expect(await openKibitzChatMove({ ...args, moveNumber: 0 })).toBe(true);
    expect(goban.engine.cur_move.move_number).toBe(0);
    expect(goban.setMode).not.toHaveBeenCalled();
    expect(goban.updatePlayerToMoveTitle).toHaveBeenCalled();
});
