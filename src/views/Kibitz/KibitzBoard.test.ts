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

import { GobanController } from "@/lib/GobanController";
import {
    getMovePathToRestore,
    refreshLastOfficialMoveFromTrunk,
    restoreToOfficialTail,
} from "./KibitzBoard";

describe("getMovePathToRestore", () => {
    it("uses the original source path when the current restore path is blank and the source is preferred", () => {
        expect(getMovePathToRestore("", "aa", true)).toBe("aa");
    });

    it("keeps a blank current path when it is authoritative", () => {
        expect(getMovePathToRestore("", "aa", false)).toBe("");
    });

    it("falls back to the current path when there is no source path to restore", () => {
        expect(getMovePathToRestore("bb", undefined, true)).toBe("bb");
    });
});

describe("refreshLastOfficialMoveFromTrunk", () => {
    it("updates a stale official move pointer while preserving the current variation node", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            players: {
                black: { id: 1, username: "black" },
                white: { id: 2, username: "white" },
            },
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                    },
                    branches: [
                        {
                            x: 3,
                            y: 4,
                        },
                    ],
                },
            },
        });
        const staleOfficialMove = controller.goban.engine.move_tree.trunk_next;
        const trunkTail = staleOfficialMove?.trunk_next;
        const variation = staleOfficialMove?.branches[0];

        if (!staleOfficialMove || !trunkTail || !variation) {
            throw new Error("Expected test move tree to contain trunk and variation nodes");
        }

        controller.goban.engine.jumpTo(variation);
        controller.goban.engine.last_official_move = staleOfficialMove;

        expect(refreshLastOfficialMoveFromTrunk(controller)).toBe(trunkTail);
        expect(controller.goban.engine.last_official_move).toBe(trunkTail);
        expect(controller.goban.engine.cur_move).toBe(variation);
    });
});

describe("restoreToOfficialTail", () => {
    it("jumps the board to the trunk tail and keeps the official pointer there", () => {
        const controller = new GobanController({
            width: 9,
            height: 9,
            players: {
                black: { id: 1, username: "black" },
                white: { id: 2, username: "white" },
            },
            move_tree: {
                x: -1,
                y: -1,
                trunk_next: {
                    x: 3,
                    y: 3,
                    trunk_next: {
                        x: 4,
                        y: 3,
                    },
                    branches: [
                        {
                            x: 3,
                            y: 4,
                        },
                    ],
                },
            },
        });
        const trunkTail = controller.goban.engine.move_tree.trunk_next?.trunk_next;

        if (!trunkTail) {
            throw new Error("Expected test move tree to contain a trunk tail");
        }

        expect(restoreToOfficialTail(controller)).toBe(trunkTail);
        expect(controller.goban.engine.last_official_move).toBe(trunkTail);
        expect(controller.goban.engine.cur_move).toBe(trunkTail);
    });
});
