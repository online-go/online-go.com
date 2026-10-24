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

import type { GobanController } from "@/lib/GobanController";
import {
    isCurrentGameBaseSnapshotUsable,
    isMainBoardSafeForReconnect,
    startVariationAfterDiscardConfirm,
} from "./KibitzInner";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import type { KibitzWatchedGame } from "@/models/kibitz";

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

function roomSnapshot(gameId: number, roomId: string): KibitzCurrentGameBaseSnapshot {
    return {
        gameId,
        roomId,
        trunkTailMoveNumber: 50,
        moveTreeId: 1,
        movePath: "",
        source: "main-board",
        config: {},
    } as KibitzCurrentGameBaseSnapshot;
}

describe("startVariationAfterDiscardConfirm", () => {
    function pendingConfirm(): {
        confirmDiscardDraft: () => Promise<boolean>;
        resolve: (confirmed: boolean) => void;
    } {
        let resolveConfirm: (confirmed: boolean) => void = () => undefined;
        return {
            confirmDiscardDraft: () =>
                new Promise<boolean>((resolve) => {
                    resolveConfirm = resolve;
                }),
            resolve: (confirmed) => resolveConfirm(confirmed),
        };
    }

    it("refuses a snapshot when the room changes during the discard confirm", async () => {
        const previousRoom = roomSnapshot(50, "preset-room");
        const currentRoomIdRef = { current: "preset-room" as string | null };
        const currentRoomGameIdRef = { current: 50 as number | null };
        const startVariation = jest.fn();
        const showNotReady = jest.fn();
        const confirm = pendingConfirm();

        const pending = startVariationAfterDiscardConfirm({
            confirmDiscardDraft: confirm.confirmDiscardDraft,
            getSnapshot: () => previousRoom,
            currentRoomIdRef,
            currentRoomGameIdRef,
            showNotReady,
            startVariation,
        });

        currentRoomIdRef.current = "user-room";
        currentRoomGameIdRef.current = 9;
        confirm.resolve(true);
        await pending;

        expect(startVariation).not.toHaveBeenCalled();
        expect(showNotReady).toHaveBeenCalledTimes(1);
    });

    it("refuses a snapshot when only the game changes during the discard confirm", async () => {
        const previousGame = roomSnapshot(50, "user-room");
        const currentRoomIdRef = { current: "user-room" as string | null };
        const currentRoomGameIdRef = { current: 50 as number | null };
        const startVariation = jest.fn();
        const showNotReady = jest.fn();
        const confirm = pendingConfirm();

        const pending = startVariationAfterDiscardConfirm({
            confirmDiscardDraft: confirm.confirmDiscardDraft,
            getSnapshot: () => previousGame,
            currentRoomIdRef,
            currentRoomGameIdRef,
            showNotReady,
            startVariation,
        });

        currentRoomGameIdRef.current = 9;
        confirm.resolve(true);
        await pending;

        expect(startVariation).not.toHaveBeenCalled();
        expect(showNotReady).toHaveBeenCalledTimes(1);
    });

    it("starts a variation when the snapshot still matches the current room", async () => {
        const snapshot = roomSnapshot(9, "user-room");
        const startVariation = jest.fn(() => true);
        const showNotReady = jest.fn();

        await startVariationAfterDiscardConfirm({
            confirmDiscardDraft: () => Promise.resolve(true),
            getSnapshot: () => snapshot,
            currentRoomIdRef: { current: "user-room" },
            currentRoomGameIdRef: { current: 9 },
            showNotReady,
            startVariation,
        });

        expect(showNotReady).not.toHaveBeenCalled();
        expect(startVariation).toHaveBeenCalledTimes(1);
        expect(startVariation).toHaveBeenCalledWith(snapshot);
    });

    it("shows not ready when the active room rejects the snapshot", async () => {
        const snapshot = roomSnapshot(9, "user-room");
        const startVariation = jest.fn(() => false);
        const showNotReady = jest.fn();

        await startVariationAfterDiscardConfirm({
            confirmDiscardDraft: () => Promise.resolve(true),
            getSnapshot: () => snapshot,
            currentRoomIdRef: { current: "user-room" },
            currentRoomGameIdRef: { current: 9 },
            showNotReady,
            startVariation,
        });

        expect(startVariation).toHaveBeenCalledWith(snapshot);
        expect(showNotReady).toHaveBeenCalledTimes(1);
    });
});
