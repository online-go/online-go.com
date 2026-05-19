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
        const controllerA = {} as GobanController;
        const controllerB = {} as GobanController;

        const { rerender } = renderHook(
            ({ boardController }) =>
                useKibitzCurrentGameConnectionKeeper({
                    roomId: "room-1",
                    currentGameId: 123,
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

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
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
