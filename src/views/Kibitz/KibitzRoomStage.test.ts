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

/* cspell:ignore retryable Cpuip */

import type { KibitzRoomSummary, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import type { GobanController } from "@/lib/GobanController";
import type { GobanConfig, MoveTree, MoveTreeJson } from "goban";
import {
    captureRoomBaseSnapshotForVariation,
    captureMainBoardBaseSnapshotForVariation,
    buildSecondaryVariationBaseSnapshotFromCurrentGameSnapshot,
    buildSecondaryVariationApplyKey,
    buildDraftBaseSnapshotFromSelectedGameSnapshot,
    buildSelectedGameBaseSnapshotFromDetails,
    clearDraftBaseAppliedState,
    clearInstalledSecondaryVariationBaseState,
    buildSnapshotFromEngine,
    decideSecondaryVariationReloadAction,
    getSameGameVariationBaseSnapshotState,
    getCurrentSecondaryVariationBaseTreeIdentity,
    getOfficialTrunkTailMoveNumber,
    getCurrentDraftBaseTreeIdentity,
    getApplicableVisibleVariations,
    getSelectedVariationBaseSnapshotIdentity,
    isCurrentTrackedSecondaryController,
    isCurrentDraftSecondaryController,
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
    resolveDraftSourceBoardDimensions,
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

function makeVariation(
    gameId: number,
    analysisFrom?: number,
    analysisMoves: string = JSON.stringify([{ x: 1, y: 1, color: 1 }]),
): KibitzVariationSummary {
    return {
        id: `variation-${gameId}`,
        room_id: "room-1",
        game_id: gameId,
        creator: makeUser(gameId, "creator"),
        created_at: 1,
        viewer_count: 0,
        current_viewers: [],
        analysis_from: analysisFrom,
        analysis_moves: analysisMoves,
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

function makeSelectedGameDetails(
    moves: GobanConfig["moves"],
): Parameters<typeof buildSelectedGameBaseSnapshotFromDetails>[0]["details"] {
    return {
        id: 4321,
        width: 19,
        height: 19,
        name: "Source game",
        gamedata: {
            moves,
        } as Parameters<typeof buildSelectedGameBaseSnapshotFromDetails>[0]["details"]["gamedata"],
    };
}

function makeSelectedGameSnapshot(moveTree?: MoveTreeJson | null): KibitzCurrentGameBaseSnapshot {
    return {
        gameId: 4321,
        roomId: "room-1",
        trunkTailMoveNumber: 4,
        moveTreeId: 99,
        movePath: "4",
        source: "selected-game-details",
        config: moveTree
            ? {
                  game_id: 4321,
                  move_tree: moveTree,
              }
            : {
                  game_id: 4321,
              },
    };
}

function makeCurrentGameBaseSnapshot(
    gameId: number,
    trunkTailMoveNumber: number,
    moveTreeId: number | string | null,
): KibitzCurrentGameBaseSnapshot {
    return {
        gameId,
        roomId: "room-1",
        trunkTailMoveNumber,
        moveTreeId,
        movePath: `${trunkTailMoveNumber}`,
        source: "room-base-broker",
        config: {
            game_id: gameId,
        },
    };
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
    it("allows an empty move list when the required snapshot move is root", () => {
        const debugLog = jest.fn();
        const result = buildSelectedGameBaseSnapshotFromDetails({
            details: makeSelectedGameDetails([]),
            gameId: 4321,
            roomId: "room-1",
            requiredSnapshotMoveNumber: 0,
            logDebug: debugLog,
        });

        expect(result.kind).toBe("ready");
        if (result.kind !== "ready") {
            return;
        }

        expect(result.snapshot.gameId).toBe(4321);
        expect(result.snapshot.trunkTailMoveNumber).toBe(0);
        expect(result.snapshot.source).toBe("selected-game-details");
        expect(result.snapshot.config.moves).toBeUndefined();
        expect(result.snapshot.config.move_tree).toBeDefined();
        expect(debugLog).toHaveBeenCalledWith(
            "selected-game-base-snapshot:empty-moves-root",
            expect.objectContaining({
                selectedGameId: 4321,
                requiredSnapshotMoveNumber: 0,
                moveCount: 0,
            }),
        );
    });

    it("keeps an empty move list blocked when the required snapshot move is not root", () => {
        const result = buildSelectedGameBaseSnapshotFromDetails({
            details: makeSelectedGameDetails([]),
            gameId: 4321,
            roomId: "room-1",
            requiredSnapshotMoveNumber: 1,
        });

        expect(result).toEqual(
            expect.objectContaining({
                kind: "failure",
                failure: expect.objectContaining({
                    kind: "missing-moves",
                    details: expect.objectContaining({
                        moveCount: 0,
                        requiredMoveNumber: 1,
                    }),
                }),
            }),
        );
    });

    it("rejects non-array move data as invalid game data", () => {
        const result = buildSelectedGameBaseSnapshotFromDetails({
            details: {
                ...makeSelectedGameDetails([]),
                gamedata: {
                    moves: undefined,
                },
            },
            gameId: 4321,
            roomId: "room-1",
            requiredSnapshotMoveNumber: 0,
        });

        expect(result).toEqual(
            expect.objectContaining({
                kind: "failure",
                failure: expect.objectContaining({
                    kind: "invalid-game-data",
                }),
            }),
        );
    });

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

    it("skips malformed visible variations without blocking the selected variation", () => {
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 140,
        };
        const selectedVariation = makeVariation(4321, 5);
        const malformedVisibleVariation = {
            ...makeVariation(4321, 7),
            id: "variation-malformed",
            analysis_from: undefined,
        };

        const result = getApplicableVisibleVariations({
            selectedVariation,
            visibleVariations: [malformedVisibleVariation],
            sourceGame,
        });

        expect(result.selectedVariationValid).toBe(true);
        expect(result.applicableVariations.map((variation) => variation.id)).toEqual([]);
        expect(result.skippedVariations).toEqual([
            expect.objectContaining({
                variation: expect.objectContaining({
                    id: malformedVisibleVariation.id,
                }),
                reason: "missing-analysis-from",
            }),
        ]);
        expect(
            getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                [malformedVisibleVariation],
                sourceGame,
            ),
        ).toBe(5);
    });

    it("requires the deepest valid visible variation anchor when some visible variations are malformed", () => {
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 140,
        };
        const selectedVariation = makeVariation(4321, 20);
        const deeperVisibleVariation = {
            ...makeVariation(4321, 35),
            id: "variation-deeper",
        };
        const malformedVisibleVariation = {
            ...makeVariation(4321, 41),
            id: "variation-malformed",
            analysis_moves: "",
        };

        const result = getApplicableVisibleVariations({
            selectedVariation,
            visibleVariations: [deeperVisibleVariation, malformedVisibleVariation],
            sourceGame,
        });

        expect(result.selectedVariationValid).toBe(true);
        expect(result.applicableVariations.map((variation) => variation.id)).toEqual([
            deeperVisibleVariation.id,
        ]);
        expect(result.skippedVariations).toEqual([
            expect.objectContaining({
                variation: expect.objectContaining({
                    id: malformedVisibleVariation.id,
                }),
                reason: "missing-analysis-moves",
            }),
        ]);
        expect(
            getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                [deeperVisibleVariation, malformedVisibleVariation],
                sourceGame,
            ),
        ).toBe(35);
    });

    it("rejects an invalid selected variation even when visible variations are valid", () => {
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 140,
        };
        const selectedVariation = {
            ...makeVariation(4321, 20),
            analysis_from: undefined,
        };
        const visibleVariation = makeVariation(4321, 35);

        const result = getApplicableVisibleVariations({
            selectedVariation,
            visibleVariations: [visibleVariation],
            sourceGame,
        });

        expect(result.selectedVariationValid).toBe(false);
        expect(result.selectedVariationSkipReason).toBe("missing-analysis-from");
        expect(
            getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                [visibleVariation],
                sourceGame,
            ),
        ).toBeNull();
    });

    it("ignores visible variations from the wrong game", () => {
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 140,
        };
        const selectedVariation = makeVariation(4321, 20);
        const wrongGameVariation = {
            ...makeVariation(9999, 35),
            id: "variation-wrong-game",
        };

        const result = getApplicableVisibleVariations({
            selectedVariation,
            visibleVariations: [wrongGameVariation],
            sourceGame,
        });

        expect(result.applicableVariations).toEqual([]);
        expect(result.skippedVariations).toEqual([
            expect.objectContaining({
                variation: expect.objectContaining({
                    id: wrongGameVariation.id,
                }),
                reason: "wrong-game",
            }),
        ]);
        expect(
            getRequiredVariationSnapshotMoveNumber(
                selectedVariation,
                [wrongGameVariation],
                sourceGame,
            ),
        ).toBe(20);
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

    it("prefers the current game snapshot for same-game variation base refresh", () => {
        const selectedVariation = makeVariation(4321, 4);
        const sourceGame = {
            ...makeGame(4321, "Source game"),
            move_number: 17,
        };
        const currentGameBaseSnapshot = {
            ...makeCurrentGameBaseSnapshot(4321, 17, 99),
            config: {
                game_id: 4321,
                move_tree: makeMoveTree(13, makeMoveTree(17)).toJson() as MoveTreeJson,
            },
        };
        const secondaryController = {
            goban: {
                engine: {
                    move_tree: makeMoveTree(13),
                },
            },
        } as unknown as GobanController;

        const snapshot = buildSecondaryVariationBaseSnapshotFromCurrentGameSnapshot(
            currentGameBaseSnapshot,
            secondaryController,
            selectedVariation,
            [],
            sourceGame,
        );

        expect(snapshot?.trunkTailMoveNumber).toBe(17);
        expect(
            buildSecondaryVariationApplyKey({
                selectedGameId: selectedVariation.game_id,
                snapshotTailMoveNumber: snapshot?.trunkTailMoveNumber,
                visibleVariationKey: "variation-1",
                selectedVariationId: selectedVariation.id,
                variationFocusRequestId: 10,
            }),
        ).toBe("4321:17:variation-1:variation-4321:10");
    });

    it("waits when the current-game snapshot is stale for a same-game variation", () => {
        const selectedVariation = makeVariation(4321, 4);
        const state = getSameGameVariationBaseSnapshotState({
            currentGameBaseSnapshot: makeCurrentGameBaseSnapshot(4321, 13, 99),
            currentRoomGameId: 4321,
            selectedVariation,
            requiredSnapshotMoveNumber: 4,
            mainBoardOfficialTailMoveNumber: 17,
        });

        expect(state.requiredSameGameBaseTailMoveNumber).toBe(17);
        expect(state.currentLiveTailMoveNumber).toBe(17);
        expect(state.currentGameSnapshotTailMoveNumber).toBe(13);
        expect(state.snapshotUsable).toBe(false);
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

    it("still loads a non-empty selected-game snapshot through the validation path", () => {
        const result = buildSelectedGameBaseSnapshotFromDetails({
            details: makeSelectedGameDetails([{ x: 3, y: 4 }]),
            gameId: 4321,
            roomId: "room-1",
            requiredSnapshotMoveNumber: 1,
        });

        expect(result.kind).toBe("ready");
        if (result.kind !== "ready") {
            return;
        }

        expect(result.snapshot.gameId).toBe(4321);
        expect(result.snapshot.trunkTailMoveNumber).toBeGreaterThanOrEqual(1);
        expect(result.snapshot.source).toBe("selected-game-details");
        expect(result.snapshot.config.moves).toBeUndefined();
        expect(result.snapshot.config.move_tree).toBeDefined();
    });

    it("builds a draft-base snapshot from a selected-game snapshot that has a move tree", () => {
        const moveTree = makeMoveTree(0, makeMoveTree(2)).toJson() as MoveTreeJson;
        const cloneMoveTree = jest.fn(
            (tree: MoveTreeJson) => JSON.parse(JSON.stringify(tree)) as MoveTreeJson,
        );
        const result = buildDraftBaseSnapshotFromSelectedGameSnapshot({
            selectedGameSnapshot: makeSelectedGameSnapshot(moveTree),
            gameId: 4321,
            controller: {
                goban: {
                    engine: {
                        move_tree: makeMoveTree(0),
                    },
                },
            } as unknown as GobanController,
            cloneMoveTree,
        });

        expect(result).not.toBeNull();
        expect(cloneMoveTree).toHaveBeenCalledTimes(1);
        expect(cloneMoveTree).toHaveBeenCalledWith(moveTree);
        expect(result?.config.move_tree).toEqual(moveTree);
        expect(result?.config.move_tree).not.toBe(moveTree);
    });

    it("returns null instead of cloning when the selected-game snapshot is missing a move tree", () => {
        const cloneMoveTree = jest.fn(
            (tree: MoveTreeJson) => JSON.parse(JSON.stringify(tree)) as MoveTreeJson,
        );
        const result = buildDraftBaseSnapshotFromSelectedGameSnapshot({
            selectedGameSnapshot: makeSelectedGameSnapshot(undefined),
            gameId: 4321,
            controller: {
                goban: {
                    engine: {
                        move_tree: makeMoveTree(0),
                    },
                },
            } as unknown as GobanController,
            cloneMoveTree,
        });

        expect(result).toBeNull();
        expect(cloneMoveTree).not.toHaveBeenCalled();
    });

    it("treats a null selected-game snapshot as unavailable rather than malformed", () => {
        const cloneMoveTree = jest.fn(
            (tree: MoveTreeJson) => JSON.parse(JSON.stringify(tree)) as MoveTreeJson,
        );
        const result = buildDraftBaseSnapshotFromSelectedGameSnapshot({
            selectedGameSnapshot: null,
            gameId: 4321,
            controller: {
                goban: {
                    engine: {
                        move_tree: makeMoveTree(0),
                    },
                },
            } as unknown as GobanController,
            cloneMoveTree,
        });

        expect(result).toBeNull();
        expect(cloneMoveTree).not.toHaveBeenCalled();
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

describe("mobile draft source dimensions", () => {
    it("accepts dimensions from the selected-game cache when the source game is old", () => {
        const sourceGameId = 87164848;
        const snapshot = {
            gameId: sourceGameId,
            trunkTailMoveNumber: 242,
            moveTreeId: 242,
            movePath: "242",
            source: "selected-game-details",
            config: {
                width: 19,
                height: 19,
            },
        } as KibitzCurrentGameBaseSnapshot;
        const cache = new Map<number, KibitzCurrentGameBaseSnapshot>([[sourceGameId, snapshot]]);

        expect(
            resolveDraftSourceBoardDimensions({
                draftBaseVariation: makeVariation(sourceGameId, 242),
                variationSourceGameId: sourceGameId,
                secondaryBoardGame: null,
                selectedGameBaseSnapshot: null,
                selectedGameBaseSnapshotCache: cache,
                variationSourceMoveTree: null,
            }),
        ).toEqual({
            width: 19,
            height: 19,
            source: "selected-game-cache",
            gameId: sourceGameId,
        });
    });

    it("uses the watched game dimensions when they are already known", () => {
        const sourceGame = makeGame(123, "Source game");

        expect(
            resolveDraftSourceBoardDimensions({
                draftBaseVariation: makeVariation(123, 5),
                variationSourceGameId: 123,
                secondaryBoardGame: sourceGame,
                selectedGameBaseSnapshot: null,
                selectedGameBaseSnapshotCache: new Map(),
                variationSourceMoveTree: null,
            }),
        ).toEqual({
            width: 19,
            height: 19,
            source: "secondary-board-game",
            gameId: 123,
        });
    });

    it("does not infer logical dimensions from pixel board size", () => {
        expect(
            resolveDraftSourceBoardDimensions({
                draftBaseVariation: makeVariation(87164848, 242),
                variationSourceGameId: 87164848,
                secondaryBoardGame: null,
                selectedGameBaseSnapshot: null,
                selectedGameBaseSnapshotCache: new Map(),
                variationSourceMoveTree: null,
            }),
        ).toBeNull();
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

    it("accepts a current normal secondary board and a draft secondary board", () => {
        const controller = {
            goban: {
                parent: {
                    isConnected: true,
                },
                engine: {
                    move_tree: {
                        id: 1,
                    },
                },
            },
        } as unknown as GobanController;
        const variationContext = {
            controller,
            epoch: 3,
            roomId: "room-user-cc22e57e",
            gameId: 87164848,
            secondaryBoardKey: "room-user-cc22e57e-variation-game-87164848-remount-0",
        } as Parameters<typeof isCurrentTrackedSecondaryController>[0]["context"];
        const draftContext = {
            controller,
            roomId: "room-user-cc22e57e",
            gameId: 87164848,
            // cspell:ignore xjV.VKCpuip
            secondaryBoardKey: "room-user-cc22e57e-draft-87164848-xjV.VKCpuip---remount-0",
        } as Parameters<typeof isCurrentTrackedSecondaryController>[0]["context"];

        expect(
            isCurrentTrackedSecondaryController({
                controller,
                context: variationContext,
                roomId: "room-user-cc22e57e",
                expectedGameId: 87164848,
                expectedSecondaryBoardKey: "room-user-cc22e57e-variation-game-87164848-remount-0",
                isDetached: false,
            }),
        ).toBe(true);
        expect(
            isCurrentTrackedSecondaryController({
                controller,
                context: draftContext,
                roomId: "room-user-cc22e57e",
                expectedGameId: 87164848,
                expectedSecondaryBoardKey:
                    // cspell:ignore xjV.VKCpuip
                    "room-user-cc22e57e-draft-87164848-xjV.VKCpuip---remount-0",
                isDetached: false,
            }),
        ).toBe(true);
    });

    it("rejects a stale outgoing variation controller once the draft board key changes", () => {
        const controller = {
            goban: {
                parent: {
                    isConnected: true,
                },
                engine: {
                    move_tree: {
                        id: 1,
                    },
                },
                config: {
                    game_id: 87164848,
                },
            },
        } as unknown as GobanController;
        const staleContext = {
            controller,
            epoch: 3,
            roomId: "room-user-cc22e57e",
            gameId: 87164848,
            secondaryBoardKey: "room-user-cc22e57e-variation-game-87164848-remount-0",
        } as Parameters<typeof isCurrentDraftSecondaryController>[0]["context"];

        expect(
            isCurrentDraftSecondaryController({
                controller,
                context: staleContext,
                roomId: "room-user-cc22e57e",
                expectedGameId: 87164848,
                expectedSecondaryBoardKey: "room-user-cc22e57e-draft-87164848-draft-base-remount-0",
                currentSecondaryBoardKey: "room-user-cc22e57e-draft-87164848-draft-base-remount-0",
                isDetached: false,
            }),
        ).toBe(false);
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

    describe("secondary variation reload decisions", () => {
        it("skips reload when the desired dirty state is already displayed", () => {
            expect(
                decideSecondaryVariationReloadAction({
                    snapshotInstalled: true,
                    currentSecondaryTailMoveNumber: 147,
                    snapshotTailMoveNumber: 147,
                    treeDirty: true,
                    desiredApplyKey: "game:147:visible:selected:1",
                    lastAppliedDesiredApplyKey: "game:147:visible:selected:1",
                }),
            ).toMatchObject({
                action: "skip-already-displayed",
                desiredDirtyStateAlreadyDisplayed: true,
                needsSnapshotLoad: false,
                staleDirtyState: false,
            });
        });

        it("reloads when the dirty tree is stale for a different desired state", () => {
            expect(
                decideSecondaryVariationReloadAction({
                    snapshotInstalled: true,
                    currentSecondaryTailMoveNumber: 147,
                    snapshotTailMoveNumber: 147,
                    treeDirty: true,
                    desiredApplyKey: "new",
                    lastAppliedDesiredApplyKey: "old",
                }),
            ).toMatchObject({
                action: "load-snapshot",
                staleDirtyState: true,
                needsSnapshotLoad: true,
            });
        });

        it("applies visible variations when the base is installed and clean", () => {
            expect(
                decideSecondaryVariationReloadAction({
                    snapshotInstalled: true,
                    currentSecondaryTailMoveNumber: 147,
                    snapshotTailMoveNumber: 147,
                    treeDirty: false,
                    desiredApplyKey: "new",
                    lastAppliedDesiredApplyKey: null,
                }),
            ).toMatchObject({
                action: "apply",
                baseSnapshotInstalled: true,
                needsSnapshotLoad: false,
            });
        });

        it("reloads when the installed snapshot is missing", () => {
            expect(
                decideSecondaryVariationReloadAction({
                    snapshotInstalled: false,
                    currentSecondaryTailMoveNumber: 0,
                    snapshotTailMoveNumber: 147,
                    treeDirty: false,
                    desiredApplyKey: "key",
                    lastAppliedDesiredApplyKey: null,
                }),
            ).toMatchObject({
                action: "load-snapshot",
                baseSnapshotInstalled: false,
                needsSnapshotLoad: true,
            });
        });

        it("reloads when the official trunk is behind the snapshot tail", () => {
            expect(
                decideSecondaryVariationReloadAction({
                    snapshotInstalled: true,
                    currentSecondaryTailMoveNumber: 100,
                    snapshotTailMoveNumber: 147,
                    treeDirty: false,
                    desiredApplyKey: "key",
                    lastAppliedDesiredApplyKey: null,
                }),
            ).toMatchObject({
                action: "load-snapshot",
                baseSnapshotInstalled: false,
                needsSnapshotLoad: true,
            });
        });
    });

    describe("selected variation base snapshot identity", () => {
        it("stays unchanged when an unrelated room snapshot advances", () => {
            const initial = makeCurrentGameBaseSnapshot(87402085, 135, 1);
            const next = makeCurrentGameBaseSnapshot(87402085, 136, 2);

            expect(
                getSelectedVariationBaseSnapshotIdentity({
                    selectedVariationGameId: 87252117,
                    selectedGameBaseSnapshot: null,
                    currentGameBaseSnapshot: initial,
                }),
            ).toBeNull();
            expect(
                getSelectedVariationBaseSnapshotIdentity({
                    selectedVariationGameId: 87252117,
                    selectedGameBaseSnapshot: null,
                    currentGameBaseSnapshot: next,
                }),
            ).toBeNull();
        });

        it("changes when the selected variation source snapshot advances", () => {
            const initialSelected = makeCurrentGameBaseSnapshot(87252117, 147, 1);
            const advancedSelected = makeCurrentGameBaseSnapshot(87252117, 150, 2);

            expect(
                getSelectedVariationBaseSnapshotIdentity({
                    selectedVariationGameId: 87252117,
                    selectedGameBaseSnapshot: initialSelected,
                    currentGameBaseSnapshot: makeCurrentGameBaseSnapshot(87402085, 135, 9),
                }),
            ).toBe("87252117:147:1");
            expect(
                getSelectedVariationBaseSnapshotIdentity({
                    selectedVariationGameId: 87252117,
                    selectedGameBaseSnapshot: advancedSelected,
                    currentGameBaseSnapshot: makeCurrentGameBaseSnapshot(87402085, 135, 9),
                }),
            ).toBe("87252117:150:2");
        });
    });
});
