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

import type { GobanController } from "@/lib/GobanController";
import type { KibitzWatchedGame } from "@/models/kibitz";
import {
    canHydrateMainBoardFromRoomBaseSnapshot,
    captureCurrentGameBaseSnapshotFromController,
    chooseFresherCurrentGameBaseSnapshot,
    hydrateMainBoardFromRoomBaseSnapshot,
} from "./kibitzCurrentGameBaseSnapshot";

function makeGame(gameId: number, moveNumber: number): KibitzWatchedGame {
    return {
        game_id: gameId,
        move_number: moveNumber,
        board_size: "19x19",
        title: `Game ${gameId}`,
        black: {
            id: gameId * 10 + 1,
            username: "black",
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        white: {
            id: gameId * 10 + 2,
            username: "white",
            ranking: 1,
            professional: false,
            ui_class: "",
        },
    };
}

interface TestMoveTreeJson {
    id: number | string;
    move_number: number;
    trunk_next?: TestMoveTreeJson;
    branches: TestMoveTreeJson[];
}

interface TestMoveTree {
    id: number | string;
    move_number: number;
    trunk_next?: TestMoveTree;
    branches: TestMoveTree[];
    getMoveStringToThisPoint: () => string;
    toJson: () => TestMoveTreeJson;
}

function makeMoveTree(moveNumber: number, trunkNext?: TestMoveTree): TestMoveTree {
    return {
        id: moveNumber,
        move_number: moveNumber,
        trunk_next: trunkNext,
        branches: [
            {
                id: `${moveNumber}-branch`,
                move_number: moveNumber + 100,
                trunk_next: undefined,
                branches: [],
                getMoveStringToThisPoint: () => "B[branch]",
                toJson: () => ({
                    id: `${moveNumber}-branch`,
                    move_number: moveNumber + 100,
                    trunk_next: undefined,
                    branches: [],
                }),
            },
        ],
        getMoveStringToThisPoint: () => `M${moveNumber}`,
        toJson: () => ({
            id: moveNumber,
            move_number: moveNumber,
            trunk_next: trunkNext ? trunkNext.toJson() : undefined,
            branches: [
                {
                    id: `${moveNumber}-branch`,
                    move_number: moveNumber + 100,
                    trunk_next: undefined,
                    branches: [],
                },
            ],
        }),
    };
}

function makeController(moveTree: TestMoveTree): GobanController {
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const controller = {
        goban: {
            parent,
            config: {
                game_id: 87165523,
            },
            mode: "play",
            load: jest.fn((config: { move_tree?: TestMoveTree }) => {
                controller.goban.engine.move_tree =
                    config.move_tree ?? controller.goban.engine.move_tree;
                controller.goban.engine.config = config;
            }),
            redraw: jest.fn(),
            engine: {
                config: {},
                move_tree: moveTree,
                cur_move: moveTree,
                last_official_move: moveTree,
                jumpTo: jest.fn(),
                setLastOfficialMove: jest.fn(),
            },
        },
    };

    return controller as unknown as GobanController;
}

describe("chooseFresherCurrentGameBaseSnapshot", () => {
    it("keeps the fresher same-game snapshot", () => {
        const previous = {
            gameId: 10,
            trunkTailMoveNumber: 2,
        } as Parameters<typeof chooseFresherCurrentGameBaseSnapshot>[0];
        const next = {
            gameId: 10,
            trunkTailMoveNumber: 0,
        } as Parameters<typeof chooseFresherCurrentGameBaseSnapshot>[1];

        expect(chooseFresherCurrentGameBaseSnapshot(previous, next)).toBe(previous);
    });

    it("accepts a newer same-game snapshot", () => {
        const previous = {
            gameId: 10,
            trunkTailMoveNumber: 2,
        } as Parameters<typeof chooseFresherCurrentGameBaseSnapshot>[0];
        const next = {
            gameId: 10,
            trunkTailMoveNumber: 3,
        } as Parameters<typeof chooseFresherCurrentGameBaseSnapshot>[1];

        expect(chooseFresherCurrentGameBaseSnapshot(previous, next)).toBe(next);
    });

    it("accepts snapshots for a different game", () => {
        const previous = {
            gameId: 10,
            trunkTailMoveNumber: 2,
        } as Parameters<typeof chooseFresherCurrentGameBaseSnapshot>[0];
        const next = {
            gameId: 11,
            trunkTailMoveNumber: 0,
        } as Parameters<typeof chooseFresherCurrentGameBaseSnapshot>[1];

        expect(chooseFresherCurrentGameBaseSnapshot(previous, next)).toBe(next);
    });
});

describe("main board broker hydration", () => {
    it("accepts a fresh current-room snapshot for a root-only main board", () => {
        const controller = makeController(makeMoveTree(0));
        const roomBaseSnapshot = {
            gameId: 87165523,
            trunkTailMoveNumber: 126,
            config: {
                game_id: 87165523,
                move_tree: makeMoveTreeJson(126),
            },
        } as unknown as Parameters<
            typeof canHydrateMainBoardFromRoomBaseSnapshot
        >[0]["roomBaseSnapshot"];

        expect(
            canHydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBe(true);
    });

    it("hydrates the visible main board from the room-base snapshot", () => {
        const controller = makeController(makeMoveTree(0));
        const load = controller.goban.load as jest.Mock;
        const roomBaseSnapshot = {
            gameId: 87165523,
            trunkTailMoveNumber: 126,
            config: {
                game_id: 87165523,
                move_tree: makeMoveTreeJson(126),
            },
        } as unknown as Parameters<
            typeof hydrateMainBoardFromRoomBaseSnapshot
        >[0]["roomBaseSnapshot"];

        expect(
            hydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toEqual(expect.objectContaining({ move_number: 126 }));

        expect(load).toHaveBeenCalledTimes(1);
        expect(load).toHaveBeenCalledWith(
            expect.objectContaining({
                game_id: 87165523,
                move_tree: expect.objectContaining({
                    move_number: 126,
                }),
            }),
        );
        expect(controller.goban.engine.jumpTo).toHaveBeenCalled();
        expect(controller.goban.engine.setLastOfficialMove).toHaveBeenCalled();
        expect(controller.goban.redraw).toHaveBeenCalledWith(true);
    });

    it("rejects a snapshot for the wrong game", () => {
        const controller = makeController(makeMoveTree(0));
        const load = controller.goban.load as jest.Mock;
        const roomBaseSnapshot = {
            gameId: 87164848,
            trunkTailMoveNumber: 126,
            config: {
                game_id: 87164848,
                move_tree: makeMoveTreeJson(126),
            },
        } as unknown as Parameters<
            typeof hydrateMainBoardFromRoomBaseSnapshot
        >[0]["roomBaseSnapshot"];

        expect(
            canHydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBe(false);

        expect(
            hydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBeNull();
        expect(load).not.toHaveBeenCalled();
    });

    it("rejects a snapshot that is not fresh enough", () => {
        const controller = makeController(makeMoveTree(0));
        const load = controller.goban.load as jest.Mock;
        const roomBaseSnapshot = {
            gameId: 87165523,
            trunkTailMoveNumber: 80,
            config: {
                game_id: 87165523,
                move_tree: makeMoveTreeJson(80),
            },
        } as unknown as Parameters<
            typeof hydrateMainBoardFromRoomBaseSnapshot
        >[0]["roomBaseSnapshot"];

        expect(
            canHydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBe(false);

        expect(
            hydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBeNull();
        expect(load).not.toHaveBeenCalled();
    });

    it("rejects a main board that is already ready", () => {
        const controller = makeController(makeMoveTree(126));
        const load = controller.goban.load as jest.Mock;
        const roomBaseSnapshot = {
            gameId: 87165523,
            trunkTailMoveNumber: 126,
            config: {
                game_id: 87165523,
                move_tree: makeMoveTreeJson(126),
            },
        } as unknown as Parameters<
            typeof hydrateMainBoardFromRoomBaseSnapshot
        >[0]["roomBaseSnapshot"];

        expect(
            canHydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBe(false);

        expect(
            hydrateMainBoardFromRoomBaseSnapshot({
                mainBoardController: controller,
                currentGame: makeGame(87165523, 126),
                currentRoomGameId: 87165523,
                requiredMoveNumber: 126,
                roomBaseSnapshot,
            }),
        ).toBeNull();
        expect(load).not.toHaveBeenCalled();
    });
});

function makeMoveTreeJson(moveNumber: number) {
    return {
        id: moveNumber,
        move_number: moveNumber,
        branches: [],
        trunk_next: undefined,
    };
}

describe("captureCurrentGameBaseSnapshotFromController", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("captures only the official trunk", () => {
        const moveTree = makeMoveTree(0, makeMoveTree(1, makeMoveTree(2)));
        const controller = makeController(moveTree);
        const snapshot = captureCurrentGameBaseSnapshotFromController(
            controller,
            makeGame(4321, 2),
            "room-1",
            "room-base-broker",
        );

        expect(snapshot?.gameId).toBe(4321);
        expect(snapshot?.roomId).toBe("room-1");
        expect(snapshot?.source).toBe("room-base-broker");
        expect(snapshot?.trunkTailMoveNumber).toBe(2);
        expect(snapshot?.config.move_tree?.branches).toBeUndefined();
        expect(snapshot?.config.move_tree?.trunk_next).toBeDefined();
    });

    it("rejects stale trees when the required move number is not available", () => {
        const moveTree = makeMoveTree(0, makeMoveTree(1));
        const controller = makeController(moveTree);

        expect(
            captureCurrentGameBaseSnapshotFromController(
                controller,
                makeGame(4321, 2),
                "room-1",
                "room-base-broker",
                2,
            ),
        ).toBeNull();
    });

    it("rejects detached controllers", () => {
        const moveTree = makeMoveTree(0, makeMoveTree(1, makeMoveTree(2)));
        const parent = document.createElement("div");
        const controller = {
            goban: {
                parent,
                engine: {
                    config: {},
                    move_tree: moveTree,
                },
            },
        } as unknown as GobanController;

        expect(
            captureCurrentGameBaseSnapshotFromController(
                controller,
                makeGame(4321, 2),
                "room-base-broker",
            ),
        ).toBeNull();
    });
});
