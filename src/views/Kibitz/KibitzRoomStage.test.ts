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
    captureMainBoardBaseSnapshotForVariation,
    clearDraftBaseAppliedState,
    clearInstalledSecondaryVariationBaseState,
    getCurrentSecondaryVariationBaseTreeIdentity,
    getOfficialTrunkTailMoveNumber,
    getCurrentDraftBaseTreeIdentity,
    getRequiredBranchAttachMoveForVariation,
    getRequiredVariationSnapshotMoveNumber,
    getRequiredSnapshotMoveForVariation,
    getVariationsToApply,
    isDraftBaseAlreadyApplied,
    isSecondaryVariationBaseSnapshotInstalled,
    markDraftBaseApplied,
    markInstalledSecondaryVariationBaseState,
    isSelectedVariationVisible,
    isSecondaryVariationSnapshotReady,
    resolveSelectedVariationSourceGame,
    shouldKeepMobileMainBoardMounted,
} from "./KibitzRoomStage";

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

describe("mobile main board mounting", () => {
    it("keeps the live main board mounted while mobile compare mode is active", () => {
        expect(shouldKeepMobileMainBoardMounted(true, true, makeGame(4321, "Live game"))).toBe(
            true,
        );
    });

    it("does not keep the main board mounted outside mobile compare mode", () => {
        const game = makeGame(4321, "Live game");
        expect(shouldKeepMobileMainBoardMounted(false, true, game)).toBe(false);
        expect(shouldKeepMobileMainBoardMounted(true, false, game)).toBe(false);
        expect(shouldKeepMobileMainBoardMounted(true, true, null)).toBe(false);
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
