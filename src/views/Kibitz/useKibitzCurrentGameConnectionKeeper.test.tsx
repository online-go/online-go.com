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

/* cspell:ignore unhydrated */

import { act, renderHook } from "@testing-library/react";
import type { GobanController } from "@/lib/GobanController";
import { socket } from "@/lib/sockets";
import { useKibitzCurrentGameConnectionKeeper } from "./useKibitzCurrentGameConnectionKeeper";

jest.mock("@/lib/sockets", () => ({
    __esModule: true,
    socket: {
        send: jest.fn(),
    },
}));

jest.mock("./kibitzVariationDebug", () => ({
    __esModule: true,
    logKibitzVariationDebug: jest.fn(),
}));

const mockedSocket = socket as unknown as { send: jest.Mock };

function installAnimationFrame(): void {
    window.requestAnimationFrame = (callback) => {
        return window.setTimeout(() => callback(performance.now()), 0);
    };
    window.cancelAnimationFrame = (handle) => {
        window.clearTimeout(handle);
    };
}

function installVisibilityState(state: DocumentVisibilityState): void {
    Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => state,
    });
}

function renderKeeper(
    overrides?: Partial<{
        roomId: string | null | undefined;
        currentGameId: number | null | undefined;
        currentLiveTailMoveNumber: number;
        isLive: boolean;
        pickerOpen: boolean;
        enabled: boolean;
        boardController: GobanController | null;
    }>,
) {
    return renderHook(() =>
        useKibitzCurrentGameConnectionKeeper({
            roomId: overrides?.roomId ?? "room-1",
            currentGameId: overrides?.currentGameId ?? 123,
            currentLiveTailMoveNumber: overrides?.currentLiveTailMoveNumber ?? 10,
            isLive: overrides?.isLive ?? true,
            pickerOpen: overrides?.pickerOpen ?? false,
            enabled: overrides?.enabled ?? true,
            boardController: overrides?.boardController ?? null,
        }),
    );
}

describe("useKibitzCurrentGameConnectionKeeper", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockedSocket.send.mockReset();
        installAnimationFrame();
        installVisibilityState("visible");
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("connects the current live room game on mount", () => {
        renderKeeper();

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });
    });

    it("does not keepalive a finished room game", () => {
        renderKeeper({ isLive: false });

        expect(mockedSocket.send).not.toHaveBeenCalled();
    });

    it("reconnects the current game when the picker closes", () => {
        const { rerender } = renderHook(
            ({ pickerOpen }) =>
                useKibitzCurrentGameConnectionKeeper({
                    roomId: "room-1",
                    currentGameId: 123,
                    currentLiveTailMoveNumber: 10,
                    isLive: true,
                    pickerOpen,
                    enabled: true,
                    boardController: null,
                }),
            {
                initialProps: { pickerOpen: true },
            },
        );

        mockedSocket.send.mockClear();

        rerender({ pickerOpen: false });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        const connectCalls = mockedSocket.send.mock.calls.filter(
            ([event]) => event === "game/connect",
        );
        expect(connectCalls.length).toBeGreaterThanOrEqual(5);
    });

    it("reconnects the current game when the main board controller changes", () => {
        const controllerA = {
            goban: {
                engine: {
                    cur_move: { move_number: 10 },
                    last_official_move: { move_number: 10 },
                },
            },
        } as GobanController;
        const controllerB = {
            goban: {
                engine: {
                    cur_move: { move_number: 10 },
                    last_official_move: { move_number: 10 },
                },
            },
        } as GobanController;

        const { rerender } = renderHook(
            ({ boardController }) =>
                useKibitzCurrentGameConnectionKeeper({
                    roomId: "room-1",
                    currentGameId: 123,
                    currentLiveTailMoveNumber: 10,
                    isLive: true,
                    pickerOpen: false,
                    enabled: true,
                    boardController,
                }),
            {
                initialProps: { boardController: controllerA },
            },
        );

        mockedSocket.send.mockClear();

        rerender({ boardController: controllerB });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });
    });

    it("bootstraps an unhydrated controller on mount for the current live game", () => {
        const controller = {
            goban: {
                config: {
                    game_id: 123,
                },
                engine: {
                    cur_move: { move_number: 0 },
                    last_official_move: { move_number: 0 },
                },
            },
        } as GobanController;

        renderHook(() =>
            useKibitzCurrentGameConnectionKeeper({
                roomId: "room-1",
                currentGameId: 123,
                currentLiveTailMoveNumber: 70,
                isLive: true,
                pickerOpen: false,
                enabled: true,
                boardController: controller,
            }),
        );

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });
    });

    it("does not spend the bootstrap when the old game controller is still present during a room switch", () => {
        const oldController = {
            goban: {
                config: {
                    game_id: 123,
                },
                engine: {
                    cur_move: { move_number: 0 },
                    last_official_move: { move_number: 0 },
                },
            },
        } as GobanController;
        const newControllerA = {
            goban: {
                config: {
                    game_id: 456,
                },
                engine: {
                    cur_move: { move_number: 0 },
                    last_official_move: { move_number: 0 },
                },
            },
        } as GobanController;
        const newControllerB = {
            goban: {
                config: {
                    game_id: 456,
                },
                engine: {
                    cur_move: { move_number: 0 },
                    last_official_move: { move_number: 0 },
                },
            },
        } as GobanController;

        const { rerender } = renderHook(
            ({ currentGameId, boardController }) =>
                useKibitzCurrentGameConnectionKeeper({
                    roomId: "room-1",
                    currentGameId,
                    currentLiveTailMoveNumber: 70,
                    isLive: true,
                    pickerOpen: false,
                    enabled: true,
                    boardController,
                }),
            {
                initialProps: {
                    currentGameId: 123,
                    boardController: oldController as GobanController | null,
                },
            },
        );

        mockedSocket.send.mockClear();

        rerender({ currentGameId: 456, boardController: oldController });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 456,
            chat: true,
        });

        mockedSocket.send.mockClear();

        rerender({ currentGameId: 456, boardController: newControllerA });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 456,
            chat: true,
        });

        mockedSocket.send.mockClear();

        rerender({ currentGameId: 456, boardController: newControllerB });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockedSocket.send).not.toHaveBeenCalledWith("game/connect", {
            game_id: 456,
            chat: true,
        });
    });

    it("does not reconnect a controller that still appears unhydrated against a deep live game", () => {
        const controllerA = {
            goban: {
                config: {
                    game_id: 123,
                },
                engine: {
                    cur_move: { move_number: 0 },
                    last_official_move: { move_number: 0 },
                },
            },
        } as GobanController;
        const controllerB = {
            goban: {
                config: {
                    game_id: 123,
                },
                engine: {
                    cur_move: { move_number: 0 },
                    last_official_move: { move_number: 0 },
                },
            },
        } as GobanController;

        const { rerender } = renderHook(
            ({ boardController }) =>
                useKibitzCurrentGameConnectionKeeper({
                    roomId: "room-1",
                    currentGameId: 123,
                    currentLiveTailMoveNumber: 70,
                    isLive: true,
                    pickerOpen: false,
                    enabled: true,
                    boardController,
                }),
            {
                initialProps: { boardController: controllerA },
            },
        );

        mockedSocket.send.mockClear();

        rerender({ boardController: controllerB });

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockedSocket.send).not.toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });
    });

    it("reconnects when focus or visibility returns to the page", () => {
        renderKeeper();
        mockedSocket.send.mockClear();

        act(() => {
            window.dispatchEvent(new Event("focus"));
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });

        mockedSocket.send.mockClear();

        act(() => {
            document.dispatchEvent(new Event("visibilitychange"));
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });
    });

    it("sends a periodic keepalive while the room is active", () => {
        renderKeeper();
        mockedSocket.send.mockClear();

        act(() => {
            jest.advanceTimersByTime(20000);
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 123,
            chat: true,
        });
    });

    it("does not send disconnect on unmount", () => {
        const { unmount } = renderKeeper();

        mockedSocket.send.mockClear();
        unmount();

        expect(mockedSocket.send).not.toHaveBeenCalledWith("game/disconnect", {
            game_id: 123,
        });
    });
});
