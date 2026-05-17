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

import type { MoveTree } from "goban";
import { getMoveTreeTrunkTail } from "./GobanController";

function makeMoveNode(move_number: number, trunk_next?: MoveTree): MoveTree {
    return {
        move_number,
        trunk_next,
    } as unknown as MoveTree;
}

describe("GobanController", () => {
    it("finds the actual trunk tail even when a variation exists", () => {
        const tail = makeMoveNode(7);
        const trunk = makeMoveNode(6, tail);
        const variation = makeMoveNode(6);
        variation.branches = [makeMoveNode(6, makeMoveNode(7))] as unknown as MoveTree["branches"];
        const root = makeMoveNode(0, trunk);
        trunk.branches = [variation] as unknown as MoveTree["branches"];

        expect(getMoveTreeTrunkTail(root)).toBe(tail);
        expect(getMoveTreeTrunkTail(trunk)).toBe(tail);
    });
});
