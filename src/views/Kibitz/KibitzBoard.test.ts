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
    shouldConnectKibitzBoardToGame,
    shouldRestoreMainBoardToOfficialTail,
    refreshLastOfficialMoveFromTrunk,
    restoreToOfficialTail,
    shouldRestoreToOfficialTailForGame,
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

describe("shouldConnectKibitzBoardToGame", () => {
    it("allows only the main board to live-connect", () => {
        expect(shouldConnectKibitzBoardToGame("main", true)).toBe(true);
        expect(shouldConnectKibitzBoardToGame("main", false)).toBe(false);
        expect(shouldConnectKibitzBoardToGame("secondary", true)).toBe(false);
        expect(shouldConnectKibitzBoardToGame("secondary", false)).toBe(false);
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

describe("shouldRestoreToOfficialTailForGame", () => {
    it("restores once per game and again only if the board falls back to root", () => {
        expect(shouldRestoreToOfficialTailForGame(0, null, 123)).toBe(true);
        expect(shouldRestoreToOfficialTailForGame(81, null, 123)).toBe(true);
        expect(shouldRestoreToOfficialTailForGame(81, 123, 123)).toBe(false);
        expect(shouldRestoreToOfficialTailForGame(0, 123, 123)).toBe(true);
        expect(shouldRestoreToOfficialTailForGame(81, 123, 456)).toBe(true);
    });
});

describe("shouldRestoreMainBoardToOfficialTail", () => {
    it("restores on a new game, at root, or when the previously-followed live tail advances", () => {
        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 0,
                officialTailMoveNumber: 20,
                lastRestored: null,
            }),
        ).toBe(true);

        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 20,
                officialTailMoveNumber: 20,
                lastRestored: {
                    gameId: 123,
                    moveNumber: 20,
                    nodeId: 20,
                },
            }),
        ).toBe(false);

        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 20,
                officialTailMoveNumber: 21,
                lastRestored: {
                    gameId: 123,
                    moveNumber: 20,
                    nodeId: 20,
                },
            }),
        ).toBe(true);

        expect(
            shouldRestoreMainBoardToOfficialTail({
                gameId: 123,
                currentMoveNumber: 19,
                officialTailMoveNumber: 21,
                lastRestored: {
                    gameId: 123,
                    moveNumber: 20,
                    nodeId: 20,
                },
            }),
        ).toBe(false);
    });
});
