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

import { act, renderHook } from "@testing-library/react";
import type { GobanController } from "@/lib/GobanController";
import { socket } from "@/lib/sockets";
import type { KibitzWatchedGame } from "@/models/kibitz";
import { useKibitzCurrentGameBaseBroker } from "./useKibitzCurrentGameBaseBroker";

jest.mock("@/lib/GobanController", () => {
    return {
        __esModule: true,
        GobanController: jest.fn(),
        getMoveTreeTrunkTail: (moveTree: { trunk_next?: unknown } | null | undefined) => {
            let cursor = moveTree ?? null;

            while (cursor && typeof cursor === "object" && "trunk_next" in cursor) {
                const next = cursor.trunk_next;
                if (!next) {
                    break;
                }
                cursor = next as { trunk_next?: unknown };
            }

            return cursor;
        },
    };
});

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
const mockedGobanController = jest.requireMock("@/lib/GobanController")
    .GobanController as jest.Mock;

function installAnimationFrame(): void {
    window.requestAnimationFrame = (callback) => {
        return window.setTimeout(() => callback(performance.now()), 0);
    };
    window.cancelAnimationFrame = (handle) => {
        window.clearTimeout(handle);
    };
}

function makeGame(gameId: number): KibitzWatchedGame {
    return {
        game_id: gameId,
        board_size: "19x19",
        title: `Game ${gameId}`,
        move_number: 2,
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

interface TestMoveTree {
    toJson: () => {
        id: number;
        move_number: number;
        trunk_next?: unknown;
        branches: unknown[];
    };
}

function makeMoveTree(moveNumber: number, trunkNext?: TestMoveTree) {
    const moveTree = {
        id: moveNumber,
        move_number: moveNumber,
        trunk_next: trunkNext,
        branches: [],
        getMoveStringToThisPoint: () => `M${moveNumber}`,
        toJson: () => ({
            id: moveNumber,
            move_number: moveNumber,
            trunk_next: trunkNext ? trunkNext.toJson() : undefined,
            branches: [],
        }),
    };

    return moveTree;
}

function makeController() {
    const listeners = new Map<string, Set<() => void>>();
    const parent = document.createElement("div");
    document.body.appendChild(parent);
    const goban = {
        parent,
        engine: {
            config: {},
            move_tree: makeMoveTree(0, makeMoveTree(1, makeMoveTree(2))),
        },
        on: jest.fn((event: string, handler: () => void) => {
            const current = listeners.get(event) ?? new Set<() => void>();
            current.add(handler);
            listeners.set(event, current);
        }),
        off: jest.fn((event: string, handler: () => void) => {
            listeners.get(event)?.delete(handler);
        }),
        redraw: jest.fn(),
        move_tree_redraw: jest.fn(),
    };
    const controller = {
        goban,
        destroy: jest.fn(),
    } as unknown as GobanController;

    return {
        controller,
        emit(event: string) {
            for (const handler of listeners.get(event) ?? []) {
                handler();
            }
        },
    };
}

describe("useKibitzCurrentGameBaseBroker", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockedSocket.send.mockReset();
        mockedGobanController.mockReset();
        installAnimationFrame();
        document.body.innerHTML = "";
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it("does not create a broker when disabled", () => {
        const onSnapshot = jest.fn();

        renderHook(() =>
            useKibitzCurrentGameBaseBroker({
                enabled: false,
                roomId: "room-1",
                game: makeGame(4321),
                currentSnapshotFreshnessMoveNumber: 2,
                visibleMainBoardMounted: false,
                onSnapshot,
            }),
        );

        expect(mockedGobanController).not.toHaveBeenCalled();
        expect(onSnapshot).not.toHaveBeenCalled();
    });

    it("creates a broker, emits snapshots, and reconnects on cleanup", () => {
        const { controller, emit } = makeController();
        mockedGobanController.mockImplementation(() => controller);
        const onSnapshot = jest.fn();

        const { unmount } = renderHook(() =>
            useKibitzCurrentGameBaseBroker({
                enabled: true,
                roomId: "room-1",
                game: makeGame(4321),
                currentSnapshotFreshnessMoveNumber: 2,
                visibleMainBoardMounted: false,
                onSnapshot,
            }),
        );

        expect(mockedGobanController).toHaveBeenCalledTimes(1);
        expect(onSnapshot).toHaveBeenCalledWith(
            expect.objectContaining({
                gameId: 4321,
                source: "room-base-broker",
                trunkTailMoveNumber: 2,
            }),
        );

        act(() => {
            emit("load");
        });

        expect(onSnapshot).toHaveBeenCalledTimes(2);

        act(() => {
            controller.goban.parent.remove();
            emit("gamedata");
        });

        expect(onSnapshot).toHaveBeenCalledTimes(2);

        unmount();

        expect(controller.destroy).toHaveBeenCalledTimes(1);
        expect(controller.goban.off).toHaveBeenCalledWith("load", expect.any(Function));

        act(() => {
            jest.advanceTimersByTime(1000);
        });

        expect(mockedSocket.send).toHaveBeenCalledWith("game/connect", {
            game_id: 4321,
            chat: true,
        });
    });
});
