/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import { act, renderHook, waitFor } from "@testing-library/react";
import { useGameKibitzRooms } from "./useGameKibitzRooms";
import { get } from "@/lib/requests";
import { push_manager } from "@/components/UIPush/UIPush";
import type { KibitzRoomSummary } from "@/models/kibitz";

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    get: jest.fn(),
}));

jest.mock("@/lib/sockets", () => ({
    __esModule: true,
    socket: { on: jest.fn(), off: jest.fn(), send: jest.fn(), connected: false },
}));

jest.mock("@/components/UIPush/UIPush", () => {
    const handlers: { [event: string]: Array<(data: unknown) => void> } = {};
    return {
        __esModule: true,
        push_manager: {
            on: jest.fn((event: string, cb: (data: unknown) => void) => {
                (handlers[event] = handlers[event] ?? []).push(cb);
                return { event, cb };
            }),
            off: jest.fn((handler: { event: string; cb: (data: unknown) => void }) => {
                handlers[handler.event] = (handlers[handler.event] ?? []).filter(
                    (cb) => cb !== handler.cb,
                );
            }),
            subscribe: jest.fn(),
            unsubscribe: jest.fn(),
            fire: (event: string, data: unknown) => {
                for (const cb of handlers[event] ?? []) {
                    cb(data);
                }
            },
        },
    };
});

const mock_push_manager = push_manager as unknown as {
    subscribe: jest.Mock;
    unsubscribe: jest.Mock;
    fire: (event: string, data: unknown) => void;
};

const mock_get = get as jest.Mock;

const room_a: KibitzRoomSummary = {
    id: "user-aaaa",
    channel: "kibitz-user-aaaa",
    title: "A",
    kind: "user",
    viewer_count: 2,
    current_game_id: 42,
};
const room_b: KibitzRoomSummary = {
    id: "user-bbbb",
    channel: "kibitz-user-bbbb",
    title: "B",
    kind: "user",
    viewer_count: 5,
    current_game_id: 42,
};

function mockBackend(rooms: KibitzRoomSummary[]): void {
    mock_get.mockImplementation((url: string, params: { game: number }) => {
        if (url === "kibitz/rooms" && params?.game === 42) {
            return Promise.resolve(rooms);
        }
        return Promise.reject(new Error(`unexpected get: ${url}`));
    });
}

function ids(rooms: KibitzRoomSummary[]): string[] {
    return rooms.map((r) => r.id);
}

async function renderWithRooms(rooms: KibitzRoomSummary[]) {
    mockBackend(rooms);
    const rendered = renderHook(() => useGameKibitzRooms(42, false));
    await waitFor(() => expect(mock_get).toHaveBeenCalled());
    await waitFor(() => expect(rendered.result.current).toHaveLength(rooms.length));
    return rendered;
}

describe("useGameKibitzRooms", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("fetches the rooms for the game and sorts them by viewer count", async () => {
        const { result } = await renderWithRooms([room_a, room_b]);
        expect(ids(result.current)).toEqual(["user-bbbb", "user-aaaa"]);
        expect(mock_get).toHaveBeenCalledWith("kibitz/rooms", { game: 42 });
    });

    it("fetches for an anonymous viewer", async () => {
        const { result } = await renderWithRooms([room_a]);
        expect(ids(result.current)).toEqual(["user-aaaa"]);
    });

    it("returns no rooms and makes no request while hidden", () => {
        mockBackend([room_a]);
        const { result } = renderHook(() => useGameKibitzRooms(42, true));
        expect(mock_get).not.toHaveBeenCalled();
        expect(result.current).toEqual([]);
        expect(mock_push_manager.subscribe).not.toHaveBeenCalled();
    });

    it("starts fetching when hidden turns false", async () => {
        mockBackend([room_a, room_b]);
        const { result, rerender } = renderHook(
            ({ hidden }: { hidden: boolean }) => useGameKibitzRooms(42, hidden),
            { initialProps: { hidden: true } },
        );
        expect(mock_get).not.toHaveBeenCalled();
        rerender({ hidden: false });
        await waitFor(() => expect(result.current).toHaveLength(2));
    });

    it("returns no rooms and makes no request without a game id", () => {
        mockBackend([room_a]);
        const { result } = renderHook(() => useGameKibitzRooms(undefined, false));
        expect(mock_get).not.toHaveBeenCalled();
        expect(result.current).toEqual([]);
    });

    it("subscribes to kibitz-rooms before the first fetch", async () => {
        await renderWithRooms([room_a]);
        expect(mock_push_manager.subscribe).toHaveBeenCalledWith("kibitz-rooms");
        expect(mock_push_manager.subscribe.mock.invocationCallOrder[0]).toBeLessThan(
            mock_get.mock.invocationCallOrder[0],
        );
    });

    it("adds a room from a room-created push for this game", async () => {
        const { result } = await renderWithRooms([]);
        act(() => {
            mock_push_manager.fire("room-created", room_a);
        });
        expect(ids(result.current)).toEqual(["user-aaaa"]);
    });

    it("ignores room-created pushes for other games", async () => {
        const { result } = await renderWithRooms([]);
        act(() => {
            mock_push_manager.fire("room-created", { ...room_a, current_game_id: 7 });
        });
        expect(result.current).toEqual([]);
    });

    it("drops a room whose room-updated moves it to another game", async () => {
        const { result } = await renderWithRooms([room_a]);
        act(() => {
            mock_push_manager.fire("room-updated", { ...room_a, current_game_id: 7 });
        });
        expect(result.current).toEqual([]);
    });

    it("adds a room whose room-updated moves it onto this game", async () => {
        const { result } = await renderWithRooms([]);
        act(() => {
            mock_push_manager.fire("room-updated", room_b);
        });
        expect(ids(result.current)).toEqual(["user-bbbb"]);
    });

    it("updates the viewer count and re-sorts from viewer-count-changed", async () => {
        const { result } = await renderWithRooms([room_a, room_b]);
        expect(ids(result.current)).toEqual(["user-bbbb", "user-aaaa"]);
        act(() => {
            mock_push_manager.fire("viewer-count-changed", {
                channel: "kibitz-user-aaaa",
                viewer_count: 9,
            });
        });
        expect(ids(result.current)).toEqual(["user-aaaa", "user-bbbb"]);
        expect(result.current[0].viewer_count).toBe(9);
    });

    it("drops a room on room-removed", async () => {
        const { result } = await renderWithRooms([room_a]);
        act(() => {
            mock_push_manager.fire("room-removed", { id: "user-aaaa" });
        });
        expect(result.current).toEqual([]);
    });

    it("refetches on rooms-refresh", async () => {
        const { result } = await renderWithRooms([room_a]);
        mockBackend([room_a, room_b]);
        act(() => {
            mock_push_manager.fire("rooms-refresh", undefined);
        });
        await waitFor(() => expect(result.current).toHaveLength(2));
    });

    it("unsubscribes on unmount", async () => {
        const { unmount } = await renderWithRooms([room_a]);
        unmount();
        expect(mock_push_manager.unsubscribe).toHaveBeenCalledWith("kibitz-rooms");
    });
});
