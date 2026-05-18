/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
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
import { officialTrunkNodeByMoveNumber } from "./kibitzVariationTree";

function makeMoveTree(moveNumber: number): MoveTree {
    return {
        move_number: moveNumber,
        branches: [],
    } as unknown as MoveTree;
}

describe("officialTrunkNodeByMoveNumber", () => {
    it("walks trunk_next and ignores branch nodes with the same move number", () => {
        const root = makeMoveTree(1);
        const officialTwo = makeMoveTree(2);
        const officialThree = makeMoveTree(3);
        const branchTwo = makeMoveTree(2);

        root.trunk_next = officialTwo;
        officialTwo.trunk_next = officialThree;
        root.branches = [branchTwo];

        expect(officialTrunkNodeByMoveNumber(root, 2)).toBe(officialTwo);
        expect(officialTrunkNodeByMoveNumber(root, 3)).toBe(officialThree);
    });

    it("returns null when the official trunk does not contain the move number", () => {
        const root = makeMoveTree(1);
        root.trunk_next = makeMoveTree(2);

        expect(officialTrunkNodeByMoveNumber(root, 9)).toBeNull();
    });
});
