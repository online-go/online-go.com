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

import type { KibitzVariationSummary } from "@/models/kibitz";
import type { GobanController } from "@/lib/GobanController";
import {
    isCurrentGameBaseSnapshotUsable,
    isMainBoardSafeForReconnect,
    clampDesktopSidebarWidthPx,
    isVisibleMainBoardMounted,
    pruneVisibleVariationIdsForGame,
} from "./KibitzInner";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import type { KibitzWatchedGame } from "@/models/kibitz";
import {
    isMobileDividerPointerUpNoop,
    MOBILE_DIVIDER_DRAG_START_THRESHOLD_PX,
    shouldActivateMobileDividerDrag,
} from "./KibitzInner";

function makeVariation(id: string, gameId: number): KibitzVariationSummary {
    return {
        id,
        room_id: "room-1",
        game_id: gameId,
        creator: {
            id: gameId,
            username: `user-${gameId}`,
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        created_at: gameId,
        viewer_count: 0,
        current_viewers: [],
    };
}

describe("pruneVisibleVariationIdsForGame", () => {
    it("drops variations from other games when switching to a new game", () => {
        const variations = [
            makeVariation("a1", 10),
            makeVariation("a2", 10),
            makeVariation("b1", 20),
        ];

        expect(pruneVisibleVariationIdsForGame(variations, ["a1", "a2", "b1"], 20)).toEqual(["b1"]);
    });

    it("keeps the current list when no game is selected", () => {
        const variations = [makeVariation("a1", 10), makeVariation("b1", 20)];

        expect(pruneVisibleVariationIdsForGame(variations, ["a1", "b1"], null)).toEqual([
            "a1",
            "b1",
        ]);
    });
});

describe("clampDesktopSidebarWidthPx", () => {
    it("enforces comfortable min width on wide layouts", () => {
        expect(clampDesktopSidebarWidthPx(100, 1200)).toBe(336);
    });

    it("allows narrower minimum on constrained layouts", () => {
        expect(clampDesktopSidebarWidthPx(100, 900)).toBe(288);
    });

    it("caps width so the stage remains usable", () => {
        expect(clampDesktopSidebarWidthPx(900, 1200)).toBeLessThanOrEqual(576);
    });

    it("handles invalid width safely", () => {
        expect(clampDesktopSidebarWidthPx(Number.NaN, 1200)).toBe(336);
    });
});

describe("isCurrentGameBaseSnapshotUsable", () => {
    const liveGame = {
        game_id: 1,
        move_number: 0,
        live: true,
    } as KibitzWatchedGame;
    const nonLiveGame = {
        game_id: 1,
        move_number: 0,
        live: false,
    } as KibitzWatchedGame;

    it("rejects a live root snapshot from the visible board", () => {
        const snapshot = {
            gameId: 1,
            roomId: "r",
            trunkTailMoveNumber: 0,
            moveTreeId: 1,
            movePath: "",
            source: "main-board",
            config: {},
        } as KibitzCurrentGameBaseSnapshot;

        expect(isCurrentGameBaseSnapshotUsable(snapshot, liveGame, "r")).toBe(false);
    });

    it("accepts a non-live root snapshot", () => {
        const snapshot = {
            gameId: 1,
            roomId: "r",
            trunkTailMoveNumber: 0,
            moveTreeId: 1,
            movePath: "",
            source: "main-board",
            config: {},
        } as KibitzCurrentGameBaseSnapshot;

        expect(isCurrentGameBaseSnapshotUsable(snapshot, nonLiveGame, "r")).toBe(true);
    });

    it("accepts a live root snapshot only when fetched game-details prove zero moves", () => {
        const snapshot = {
            gameId: 1,
            roomId: "r",
            trunkTailMoveNumber: 0,
            moveTreeId: 1,
            movePath: "",
            source: "game-details",
            fetchedMoveCount: 0,
            config: {},
        } as KibitzCurrentGameBaseSnapshot;

        expect(isCurrentGameBaseSnapshotUsable(snapshot, liveGame, "r")).toBe(true);
    });
});

describe("isVisibleMainBoardMounted", () => {
    const mainBoardController = {} as GobanController;

    it("rejects stale move-0 hydration for a nonzero room", () => {
        const hydration = {
            roomId: "preset-fast-live",
            gameId: 87402085,
            officialTailMoveNumber: 0,
            expectedMoveNumber: 0,
            hasMoveTree: true,
            hydrated: true,
        };

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydration,
                roomId: "preset-fast-live",
                gameId: 87402085,
                currentExpectedMoveNumber: 121,
                isCurrentGameLive: false,
            }),
        ).toBe(false);
    });

    it("rejects stale lower expected hydration for an advanced room", () => {
        const hydration = {
            roomId: "preset-fast-live",
            gameId: 87402085,
            officialTailMoveNumber: 120,
            expectedMoveNumber: 120,
            hasMoveTree: true,
            hydrated: true,
        };

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydration,
                roomId: "preset-fast-live",
                gameId: 87402085,
                currentExpectedMoveNumber: 121,
                isCurrentGameLive: false,
            }),
        ).toBe(false);
    });

    it("accepts hydration when the expected move is current", () => {
        const hydration = {
            roomId: "preset-fast-live",
            gameId: 87402085,
            officialTailMoveNumber: 121,
            expectedMoveNumber: 121,
            hasMoveTree: true,
            hydrated: true,
        };

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydration,
                roomId: "preset-fast-live",
                gameId: 87402085,
                currentExpectedMoveNumber: 121,
                isCurrentGameLive: false,
            }),
        ).toBe(true);
    });

    it("rejects live root hydration even if the board reports hydrated", () => {
        const hydration = {
            roomId: "preset-fast-live",
            gameId: 87402085,
            officialTailMoveNumber: 0,
            expectedMoveNumber: 0,
            hasMoveTree: true,
            hydrated: true,
        };

        expect(
            isVisibleMainBoardMounted({
                mobileCompareActive: false,
                mainBoardController,
                isCurrentMainBoardController: true,
                visibleMainBoardHydration: hydration,
                roomId: "preset-fast-live",
                gameId: 87402085,
                currentExpectedMoveNumber: 0,
                isCurrentGameLive: true,
            }),
        ).toBe(false);
    });
});

describe("mobile divider gesture lifecycle", () => {
    it("uses a small movement threshold before activating a resize drag", () => {
        expect(MOBILE_DIVIDER_DRAG_START_THRESHOLD_PX).toBe(3);
        expect(shouldActivateMobileDividerDrag(1)).toBe(false);
        expect(shouldActivateMobileDividerDrag(2)).toBe(false);
        expect(shouldActivateMobileDividerDrag(3)).toBe(true);
        expect(shouldActivateMobileDividerDrag(-3)).toBe(true);
    });

    it("treats pointerup as a no-op until the drag is active", () => {
        expect(isMobileDividerPointerUpNoop("armed")).toBe(true);
        expect(isMobileDividerPointerUpNoop(null)).toBe(true);
        expect(isMobileDividerPointerUpNoop("active")).toBe(false);
    });
});

describe("isMainBoardSafeForReconnect", () => {
    const liveGame = {
        game_id: 1,
        move_number: 0,
        live: true,
    } as KibitzWatchedGame;

    it("blocks reconnects for a live root-only controller", () => {
        expect(
            isMainBoardSafeForReconnect({
                mainBoardController: {} as GobanController,
                currentGame: liveGame,
                currentGameBaseSnapshotTailMoveNumber: 0,
                mainBoardOfficialTailMoveNumber: 0,
                mainBoardCurrentMoveNumber: 0,
                mainBoardLastOfficialMoveNumber: 0,
            }),
        ).toBe(false);
    });

    it("allows reconnects once the official tail advances", () => {
        expect(
            isMainBoardSafeForReconnect({
                mainBoardController: {} as GobanController,
                currentGame: liveGame,
                currentGameBaseSnapshotTailMoveNumber: 33,
                mainBoardOfficialTailMoveNumber: 33,
                mainBoardCurrentMoveNumber: 33,
                mainBoardLastOfficialMoveNumber: 33,
            }),
        ).toBe(true);
    });

    it("blocks reconnects when the tail is fresh but the live position is still stale", () => {
        expect(
            isMainBoardSafeForReconnect({
                mainBoardController: {} as GobanController,
                currentGame: liveGame,
                currentGameBaseSnapshotTailMoveNumber: 67,
                mainBoardOfficialTailMoveNumber: 67,
                mainBoardCurrentMoveNumber: 0,
                mainBoardLastOfficialMoveNumber: 0,
            }),
        ).toBe(false);
    });
});
