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

import type { KibitzRoomSummary, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import type { GobanController } from "@/lib/GobanController";
import type { MoveTree } from "goban";
import {
    captureRoomBaseSnapshotForVariation,
    captureMainBoardBaseSnapshotForVariation,
    clearDraftBaseAppliedState,
    clearInstalledSecondaryVariationBaseState,
    buildSnapshotFromEngine,
    getCurrentSecondaryVariationBaseTreeIdentity,
    getOfficialTrunkTailMoveNumber,
    getCurrentDraftBaseTreeIdentity,
    getRequiredBranchAttachMoveForVariation,
    getRequiredVariationSnapshotMoveNumber,
    getRequiredSnapshotMoveForVariation,
    getVariationsToApply,
    isDraftBaseAlreadyApplied,
    hasBoardDimensions,
    resolveMobileSecondaryOwner,
    isSelectedGameBaseSnapshotActiveButStale,
    isSelectedGameBaseSnapshotFreshEnough,
    canRetrySelectedGameSnapshotFailure,
    clearSelectedGameSnapshotFailure,
    buildSelectedGameSnapshotFailureFromError,
    getSelectedGameSnapshotBlockingFailure,
    isSecondaryVariationBaseSnapshotInstalled,
    markDraftBaseApplied,
    markInstalledSecondaryVariationBaseState,
    isSelectedVariationVisible,
    isSecondaryVariationSnapshotReady,
    recordSelectedGameSnapshotFailure,
    resolveSelectedVariationSourceGame,
    selectedGameSnapshotFailureKey,
    type SelectedGameBaseSnapshotFailure,
} from "./KibitzRoomStage";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";

function makeUser(id: number, username: string) {
    return {
        id,
        username,
        ranking: 1,
        professional: false,
        ui_class: "",
    };
}

function makeGame(gameId: number, title: string): KibitzWatchedGame {
    return {
        game_id: gameId,
        board_size: "19x19",
        title,
        black: makeUser(gameId * 10 + 1, "black"),
        white: makeUser(gameId * 10 + 2, "white"),
    };
}

function makeVariation(gameId: number, analysisFrom?: number): KibitzVariationSummary {
    return {
        id: `variation-${gameId}`,
        room_id: "room-1",
        game_id: gameId,
        creator: makeUser(gameId, "creator"),
        created_at: 1,
        viewer_count: 0,
        current_viewers: [],
        analysis_from: analysisFrom,
    };
}

function makeMoveTree(
    moveNumber: number,
    trunkNext?: MoveTree | null,
    branches: MoveTree[] = [],
): MoveTree {
    const tree = {
        move_number: moveNumber,
        trunk_next: trunkNext ?? undefined,
        branches,
        getMoveStringToThisPoint: () => `${moveNumber}`,
        toJson: () => ({
            move_number: moveNumber,
            trunk_next: trunkNext ? trunkNext.toJson() : undefined,
            branches: branches.map((branch) => branch.toJson()),
        }),
    };

    return tree as unknown as MoveTree;
}

describe("resolveSelectedVariationSourceGame", () => {
    it("prefers the cached game lookup when the room list does not have the source game yet", () => {
        const selectedVariation = makeVariation(4321);
        const cachedGame = makeGame(4321, "Cached source");
        const fallbackGame = makeGame(4321, "Fallback source");
        const rooms: KibitzRoomSummary[] = [];
        const gameById = new Map<number, KibitzWatchedGame>([[4321, cachedGame]]);

        expect(
            resolveSelectedVariationSourceGame(
                selectedVariation,
                undefined,
                rooms,
                gameById,
                fallbackGame,
            ),
        ).toBe(cachedGame);
    });

    it("falls back to the secondary pane game only when nothing else is available", () => {
        const selectedVariation = makeVariation(4321);
        const fallbackGame = makeGame(4321, "Fallback source");
        const rooms: KibitzRoomSummary[] = [];

        expect(
            resolveSelectedVariationSourceGame(
                selectedVariation,
                undefined,
                rooms,
                undefined,
                fallbackGame,
            ),
        ).toBe(fallbackGame);
    });
});

describe("variation snapshot readiness", () => {
    it("requires only the visible variation anchors for snapshots", () => {
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 140,
        };

        expect(
            getRequiredVariationSnapshotMoveNumber(
                makeVariation(4321, 5),
                [makeVariation(4321, 7), makeVariation(4321, 3)],
                sourceGame,
            ),
        ).toBe(7);
    });

    it("does not require the branch endpoint when the source game is unavailable", () => {
        expect(getRequiredSnapshotMoveForVariation(makeVariation(4321, 5), undefined)).toBe(5);
        expect(getRequiredBranchAttachMoveForVariation(makeVariation(4321, 5), undefined)).toBe(6);
    });

    it("keeps the branch attach move on the official tail when the source game is caught up", () => {
        expect(
            getRequiredBranchAttachMoveForVariation(makeVariation(4321, 2), {
                ...makeGame(4321, "Source game"),
                move_number: 2,
            }),
        ).toBe(2);
    });

    it("refuses to infer a root anchor when analysis_from is missing", () => {
        const variation = makeVariation(4321);

        expect(getRequiredSnapshotMoveForVariation(variation, undefined)).toBeNull();
        expect(getRequiredBranchAttachMoveForVariation(variation, undefined)).toBeNull();
    });

    it("requires the official trunk tail to reach the snapshot move", () => {
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 4,
        };
        const controller = {
            goban: {
                engine: {
                    move_tree: makeMoveTree(2, makeMoveTree(4)),
                },
            },
        } as unknown as import("@/lib/GobanController").GobanController;

        expect(
            isSecondaryVariationSnapshotReady(controller, makeVariation(4321, 2), [], sourceGame),
        ).toBe(true);
        expect(getOfficialTrunkTailMoveNumber(controller)).toBe(4);
    });

    it("can seed a secondary snapshot from the main board official trunk", () => {
        const selectedVariation = makeVariation(4321, 2);
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 4,
        };
        const mainController = {
            goban: {
                engine: {
                    config: {
                        game_id: 4321,
                        moves: [{ x: 1, y: 1 }],
                    },
                    move_tree: makeMoveTree(2, makeMoveTree(4), [makeMoveTree(99)]),
                },
            },
        } as unknown as import("@/lib/GobanController").GobanController;
        const secondaryController = {
            goban: {
                engine: {
                    move_tree: makeMoveTree(1),
                },
            },
        } as unknown as import("@/lib/GobanController").GobanController;

        const snapshot = captureMainBoardBaseSnapshotForVariation(
            mainController,
            secondaryController,
            selectedVariation,
            [],
            sourceGame,
        );

        expect(snapshot?.controller).toBe(secondaryController);
        expect(snapshot?.gameId).toBe(4321);
        expect(snapshot?.trunkTailMoveNumber).toBe(4);
        expect(snapshot?.config.game_id).toBe(4321);
        expect(snapshot?.config.moves).toBeUndefined();
        expect(snapshot?.config.move_tree?.branches).toBeUndefined();
        expect(snapshot?.config.move_tree?.trunk_next).toBeDefined();
    });

    it("can build a headless selected-game snapshot from an engine trunk", () => {
        const moveTree = makeMoveTree(2, makeMoveTree(4)) as MoveTree & { id: number };
        moveTree.id = 99;
        if (moveTree.trunk_next) {
            (moveTree.trunk_next as MoveTree & { id: number }).id = 100;
        }

        const snapshot = buildSnapshotFromEngine({
            engine: {
                config: {
                    game_id: 4321,
                    moves: [{ x: 3, y: 4 }],
                },
                move_tree: moveTree,
            } as unknown as import("goban").GobanEngine,
            gameId: 4321,
            roomId: "room-1",
            source: "selected-game-details",
            requiredSnapshotMoveNumber: 4,
        });

        expect(snapshot).toEqual(
            expect.objectContaining({
                gameId: 4321,
                roomId: "room-1",
                trunkTailMoveNumber: 4,
                moveTreeId: 99,
                source: "selected-game-details",
            }),
        );
        expect(snapshot?.config.game_id).toBe(4321);
        expect(snapshot?.config.moves).toBeUndefined();
        expect(snapshot?.config.move_tree?.branches).toBeUndefined();
        expect(snapshot?.config.move_tree?.trunk_next).toBeDefined();
    });

    it("refuses a headless selected-game snapshot that is too shallow for the requirement", () => {
        const moveTree = makeMoveTree(2, makeMoveTree(4)) as MoveTree & { id: number };
        moveTree.id = 88;
        if (moveTree.trunk_next) {
            (moveTree.trunk_next as MoveTree & { id: number }).id = 89;
        }

        expect(
            buildSnapshotFromEngine({
                engine: {
                    config: {
                        game_id: 4321,
                        moves: [{ x: 3, y: 4 }],
                    },
                    move_tree: moveTree,
                } as unknown as import("goban").GobanEngine,
                gameId: 4321,
                roomId: "room-1",
                source: "selected-game-details",
                requiredSnapshotMoveNumber: 5,
            }),
        ).toBeNull();
    });

    it("allows a selected-game snapshot to be consumed without a source game object", () => {
        const moveTree = makeMoveTree(2, makeMoveTree(4)) as MoveTree & { id: number };
        moveTree.id = 99;
        if (moveTree.trunk_next) {
            (moveTree.trunk_next as MoveTree & { id: number }).id = 100;
        }

        const selectedGameSnapshot = buildSnapshotFromEngine({
            engine: {
                config: {
                    game_id: 4321,
                    moves: [{ x: 3, y: 4 }],
                },
                move_tree: moveTree,
            } as unknown as import("goban").GobanEngine,
            gameId: 4321,
            roomId: "room-1",
            source: "selected-game-details",
            requiredSnapshotMoveNumber: 4,
        });
        const secondaryController = {
            goban: {
                engine: {
                    move_tree: makeMoveTree(1),
                },
            },
        } as unknown as import("@/lib/GobanController").GobanController;
        const selectedVariation = makeVariation(4321, 2);

        expect(
            captureRoomBaseSnapshotForVariation(
                selectedGameSnapshot,
                secondaryController,
                selectedVariation,
                [],
                undefined,
            ),
        ).toEqual(
            expect.objectContaining({
                gameId: 4321,
                trunkTailMoveNumber: 4,
                controller: secondaryController,
            }),
        );
    });

    it("treats a selected-game snapshot as fresh only when it reaches the required move", () => {
        const selectedGameSnapshot = {
            gameId: 4321,
            trunkTailMoveNumber: 4,
        } as KibitzCurrentGameBaseSnapshot;

        expect(isSelectedGameBaseSnapshotFreshEnough(selectedGameSnapshot, 4321, 4)).toBe(true);
        expect(isSelectedGameBaseSnapshotFreshEnough(selectedGameSnapshot, 4321, 5)).toBe(false);
        expect(isSelectedGameBaseSnapshotFreshEnough(selectedGameSnapshot, 1234, 4)).toBe(false);
    });

    it("detects when the active selected-game snapshot is stale for the required move", () => {
        const selectedGameSnapshot = {
            gameId: 4321,
            trunkTailMoveNumber: 126,
        } as KibitzCurrentGameBaseSnapshot;

        expect(isSelectedGameBaseSnapshotActiveButStale(selectedGameSnapshot, 4321, 242)).toBe(
            true,
        );
        expect(isSelectedGameBaseSnapshotActiveButStale(selectedGameSnapshot, 4321, 80)).toBe(
            false,
        );
        expect(isSelectedGameBaseSnapshotActiveButStale(selectedGameSnapshot, 1234, 242)).toBe(
            false,
        );
    });

    it("tracks selected-game failure retries by game and required move", () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1000);
        try {
            const failures = new Map<string, SelectedGameBaseSnapshotFailure>();

            expect(selectedGameSnapshotFailureKey(111, 50)).toBe("111:50");
            expect(canRetrySelectedGameSnapshotFailure(undefined)).toBe(true);
            expect(
                canRetrySelectedGameSnapshotFailure({
                    gameId: 111,
                    variationId: null,
                    requiredMoveNumber: 50,
                    kind: "missing-moves",
                    createdAt: 1,
                }),
            ).toBe(false);
            expect(
                canRetrySelectedGameSnapshotFailure({
                    gameId: 111,
                    variationId: null,
                    requiredMoveNumber: 50,
                    kind: "private-or-unavailable",
                    createdAt: 1,
                }),
            ).toBe(false);
            expect(
                canRetrySelectedGameSnapshotFailure({
                    gameId: 111,
                    variationId: null,
                    requiredMoveNumber: 50,
                    kind: "invalid-game-data",
                    createdAt: 1,
                }),
            ).toBe(false);
            expect(
                canRetrySelectedGameSnapshotFailure({
                    gameId: 111,
                    variationId: null,
                    requiredMoveNumber: 50,
                    kind: "not-fresh-enough",
                    createdAt: 1,
                    retryAfter: 900,
                }),
            ).toBe(true);
            expect(
                canRetrySelectedGameSnapshotFailure({
                    gameId: 111,
                    variationId: null,
                    requiredMoveNumber: 50,
                    kind: "not-fresh-enough",
                    createdAt: 1,
                    retryAfter: 1500,
                }),
            ).toBe(false);
            expect(
                canRetrySelectedGameSnapshotFailure({
                    gameId: 111,
                    variationId: null,
                    requiredMoveNumber: 50,
                    kind: "network-error",
                    createdAt: 1,
                    retryAfter: 1500,
                }),
            ).toBe(false);

            const failure = recordSelectedGameSnapshotFailure(failures, {
                gameId: 111,
                variationId: "variation-111",
                requiredMoveNumber: 50,
                kind: "missing-moves",
                message: "Game details did not include gamedata.moves",
            });

            expect(failure).toEqual(
                expect.objectContaining({
                    gameId: 111,
                    variationId: "variation-111",
                    requiredMoveNumber: 50,
                    kind: "missing-moves",
                    createdAt: 1000,
                }),
            );
            expect(
                getSelectedGameSnapshotBlockingFailure(failures, {
                    gameId: 111,
                    requiredMoveNumber: 50,
                }),
            ).toEqual(failure);

            clearSelectedGameSnapshotFailure(failures, 111, 50);

            expect(
                getSelectedGameSnapshotBlockingFailure(failures, {
                    gameId: 111,
                    requiredMoveNumber: 50,
                }),
            ).toBeNull();
        } finally {
            nowSpy.mockRestore();
        }
    });

    it("maps transient selected-game fetch errors to retryable failures", () => {
        const nowSpy = jest.spyOn(Date, "now").mockReturnValue(2000);
        try {
            const failure = buildSelectedGameSnapshotFailureFromError({
                error: new Error("timeout"),
                gameId: 111,
                variationId: "variation-111",
                requiredMoveNumber: 50,
            });

            expect(failure).toEqual(
                expect.objectContaining({
                    gameId: 111,
                    variationId: "variation-111",
                    requiredMoveNumber: 50,
                    kind: "network-error",
                    createdAt: 2000,
                    retryAfter: 7000,
                    message: "timeout",
                }),
            );
            expect(canRetrySelectedGameSnapshotFailure(failure)).toBe(false);

            nowSpy.mockReturnValue(7000);
            expect(canRetrySelectedGameSnapshotFailure(failure)).toBe(true);
        } finally {
            nowSpy.mockRestore();
        }
    });
});

describe("mobile secondary board ownership", () => {
    it("requires source-game dimensions before selecting a mobile draft owner", () => {
        const selectedVariation = makeVariation(123, 5);
        const sourceGame = makeGame(123, "Source game");

        expect(hasBoardDimensions(null)).toBe(false);
        expect(hasBoardDimensions(undefined)).toBe(false);
        expect(hasBoardDimensions(sourceGame)).toBe(true);

        expect(
            resolveMobileSecondaryOwner({
                mobileCompareActive: true,
                selectedVariation: undefined,
                isDraftingVariation: true,
                secondaryGameId: null,
                secondaryBoardGame: null,
            }),
        ).toBe("none");

        expect(
            resolveMobileSecondaryOwner({
                mobileCompareActive: true,
                selectedVariation: undefined,
                isDraftingVariation: true,
                secondaryGameId: null,
                secondaryBoardGame: sourceGame,
            }),
        ).toBe("draft");

        expect(
            resolveMobileSecondaryOwner({
                mobileCompareActive: true,
                selectedVariation: undefined,
                isDraftingVariation: false,
                secondaryGameId: 123,
                secondaryBoardGame: null,
            }),
        ).toBe("none");

        expect(
            resolveMobileSecondaryOwner({
                mobileCompareActive: true,
                selectedVariation: undefined,
                isDraftingVariation: false,
                secondaryGameId: 123,
                secondaryBoardGame: sourceGame,
            }),
        ).toBe("preview");

        expect(
            resolveMobileSecondaryOwner({
                mobileCompareActive: true,
                selectedVariation,
                isDraftingVariation: true,
                secondaryGameId: null,
                secondaryBoardGame: null,
            }),
        ).toBe("variation");
    });
});

describe("variation recomposition helpers", () => {
    it("detects whether the selected variation is currently visible", () => {
        const selectedVariation = makeVariation(4321, 5);
        expect(isSelectedVariationVisible(selectedVariation, [])).toBe(false);
        expect(isSelectedVariationVisible(selectedVariation, [selectedVariation])).toBe(true);
    });

    it("only applies the currently visible variations", () => {
        const selectedVariation = makeVariation(4321, 5);
        const visibleVariation = {
            ...makeVariation(4321, 7),
            id: "variation-visible",
        };
        const hiddenVariation = {
            ...makeVariation(4321, 9),
            id: "variation-hidden",
        };

        expect(
            getVariationsToApply(selectedVariation, [
                visibleVariation,
                hiddenVariation,
                visibleVariation,
            ]).map((variation) => variation.id),
        ).toEqual([visibleVariation.id, hiddenVariation.id]);
    });
});

describe("draft base apply guard", () => {
    it("tracks the loaded tree identity so a replaced tree can be applied again", () => {
        const controller = {
            goban: {
                engine: {
                    move_tree: {
                        id: 1,
                    },
                },
            },
        } as unknown as GobanController;
        const variationId = "draft-base-1";
        let applied = clearDraftBaseAppliedState();

        expect(isDraftBaseAlreadyApplied(applied, controller, variationId)).toBe(false);
        expect(getCurrentDraftBaseTreeIdentity(controller)).toEqual({
            moveTreeId: 1,
            engine: controller.goban.engine,
        });

        applied = markDraftBaseApplied(controller, variationId);

        expect(isDraftBaseAlreadyApplied(applied, controller, variationId)).toBe(true);

        controller.goban.engine = {
            move_tree: {
                id: 2,
            } as unknown as MoveTree,
        } as typeof controller.goban.engine;

        expect(isDraftBaseAlreadyApplied(applied, controller, variationId)).toBe(false);

        applied = clearDraftBaseAppliedState();

        expect(isDraftBaseAlreadyApplied(applied, controller, variationId)).toBe(false);
    });

    it("treats a replaced secondary base tree as not installed", () => {
        const moveTree = makeMoveTree(0, makeMoveTree(2)) as MoveTree & { id: number };
        moveTree.id = 1;
        if (moveTree.trunk_next) {
            (moveTree.trunk_next as MoveTree & { id: number }).id = 2;
        }

        const controller = {
            goban: {
                engine: {
                    move_tree: moveTree,
                },
            },
        } as unknown as GobanController;
        const snapshot = {
            controller,
            gameId: 20553,
            trunkTailMoveNumber: 2,
            config: {},
        } as unknown as Parameters<typeof isSecondaryVariationBaseSnapshotInstalled>[0];
        const installed = markInstalledSecondaryVariationBaseState(controller, 20553);

        expect(getCurrentSecondaryVariationBaseTreeIdentity(controller)).toEqual({
            moveTreeId: 1,
        });
        expect(isSecondaryVariationBaseSnapshotInstalled(snapshot, controller, installed)).toBe(
            true,
        );

        moveTree.id = 3;

        expect(isSecondaryVariationBaseSnapshotInstalled(snapshot, controller, installed)).toBe(
            false,
        );
        expect(clearInstalledSecondaryVariationBaseState()).toEqual({
            controller: null,
            gameId: null,
            trunkTailMoveNumber: 0,
            moveTreeId: null,
        });
    });
});
