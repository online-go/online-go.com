/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import { act, renderHook } from "@testing-library/react";
import { get } from "@/lib/requests";
import type { KibitzRoomSummary, KibitzWatchedGame } from "@/models/kibitz";
import { useGameKibitzRooms } from "@/views/Game/useGameKibitzRooms";
import type { KibitzController } from "./KibitzController";
import {
    findKibitzContinuationRoom,
    getKibitzContinuationTitle,
    useKibitzContinuation,
} from "./useKibitzContinuation";

jest.mock("@/lib/requests", () => ({ get: jest.fn() }));
jest.mock("@/views/Game/useGameKibitzRooms", () => ({ useGameKibitzRooms: jest.fn(() => []) }));

const mockGet = get as jest.Mock;
const mockUseGameRooms = useGameKibitzRooms as jest.Mock;
let mockSocketConnectHandler: (() => void) | undefined;

jest.mock("@/lib/sockets", () => ({
    socket: {
        on: jest.fn((event: string, handler: () => void) => {
            if (event === "connect") {
                mockSocketConnectHandler = handler;
            }
        }),
        off: jest.fn(),
    },
}));

const game: KibitzWatchedGame = {
    game_id: 42,
    board_size: "19x19",
    title: "Black vs White",
    black: { id: 1, username: "Black", ranking: 1000, professional: false, ui_class: "" },
    white: { id: 2, username: "White", ranking: 1000, professional: false, ui_class: "" },
};

const preset: KibitzRoomSummary = {
    id: "preset-room",
    channel: "kibitz-preset-room",
    title: "Preset room",
    kind: "preset",
    viewer_count: 4,
    current_game_id: 42,
    current_game: game,
};

function makeContinuation(overrides: Partial<KibitzRoomSummary> = {}): KibitzRoomSummary {
    return {
        id: "user-room",
        channel: "kibitz-user-room",
        title: "Black vs White · #42",
        kind: "user",
        viewer_count: 3,
        current_game_id: 42,
        ...overrides,
    };
}

function makeController(): KibitzController {
    return {
        createRoom: jest.fn(
            async (
                _game: KibitzWatchedGame,
                _title: string,
                _description: string,
                options?: { beforeSelectRoom?: (roomId: string) => void },
            ) => {
                options?.beforeSelectRoom?.("new-room");
                return "new-room";
            },
        ),
        postContinuationRoomAnnouncement: jest.fn(),
    } as unknown as KibitzController;
}

function renderContinuation(params?: {
    room?: KibitzRoomSummary;
    canCreate?: boolean;
    blocked?: boolean;
    controller?: KibitzController;
}) {
    const controller = params?.controller ?? makeController();
    const navigateToRoom = jest.fn();
    const onError = jest.fn();
    const result = renderHook(
        ({ room }) =>
            useKibitzContinuation({
                controller,
                room,
                canCreate: params?.canCreate ?? true,
                blocked: params?.blocked ?? false,
                navigateToRoom,
                onError,
            }),
        { initialProps: { room: params?.room ?? preset } },
    );
    return { ...result, controller, navigateToRoom, onError };
}

beforeEach(() => {
    jest.clearAllMocks();
    mockUseGameRooms.mockReturnValue([]);
    mockGet.mockResolvedValue([]);
    mockSocketConnectHandler = undefined;
});

test("uses a stable, language-neutral title and matches only user rooms with that title", () => {
    expect(getKibitzContinuationTitle(game)).toBe("Black vs White · #42");
    expect(
        findKibitzContinuationRoom(
            [makeContinuation({ kind: "preset" }), makeContinuation({ id: "match" })],
            getKibitzContinuationTitle(game),
        )?.id,
    ).toBe("match");
});

test("shows create when no room exists and join with the viewer count when one exists", async () => {
    const { result, rerender } = renderContinuation();
    expect(result.current.actionTitle).toBe("Continue in new room");

    mockUseGameRooms.mockReturnValue([makeContinuation()]);
    rerender({ room: preset });
    expect(result.current.actionTitle).toBe("Join continuation room (3)");
    await act(async () => result.current.onActivate());
});

test("follows the current game when a preset switches", () => {
    mockUseGameRooms.mockImplementation((gameId: number) =>
        gameId === 42 ? [makeContinuation()] : [],
    );
    const { result, rerender } = renderContinuation();
    expect(result.current.actionTitle).toBe("Join continuation room (3)");

    rerender({
        room: {
            ...preset,
            current_game_id: 43,
            current_game: { ...game, game_id: 43 },
        },
    });
    expect(result.current.actionTitle).toBe("Continue in new room");
    expect(result.current.gameTitle).toBe("Black vs White");
});

test("a successful create posts one linked announcement and moves to the new room", async () => {
    const controller = makeController();
    const { result, navigateToRoom } = renderContinuation({ controller });

    await act(async () => result.current.onActivate());

    expect(controller.createRoom).toHaveBeenCalledWith(
        game,
        "Black vs White · #42",
        "",
        expect.objectContaining({
            beforeSelectRoom: expect.any(Function),
            select: false,
        }),
    );
    expect(controller.postContinuationRoomAnnouncement).toHaveBeenCalledWith(
        "preset-room",
        42,
        "new-room",
        "Black vs White · #42",
    );
    expect(navigateToRoom).toHaveBeenCalledTimes(1);
    expect(navigateToRoom).toHaveBeenCalledWith("new-room");
});

test("a title-taken response refetches and switches to join without announcing", async () => {
    const controller = makeController();
    (controller.createRoom as jest.Mock).mockRejectedValue({ errcode: "kibitzroom_title_taken" });
    mockGet.mockResolvedValueOnce([]).mockResolvedValueOnce([makeContinuation()]);
    const { result, navigateToRoom } = renderContinuation({ controller });

    await act(async () => result.current.onActivate());

    expect(mockGet).toHaveBeenNthCalledWith(1, "kibitz/rooms", { game: 42 });
    expect(mockGet).toHaveBeenNthCalledWith(2, "kibitz/rooms", { game: 42 });
    expect(result.current.actionTitle).toBe("Join continuation room (3)");
    expect(controller.postContinuationRoomAnnouncement).not.toHaveBeenCalled();
    await act(async () => result.current.onActivate());
    expect(navigateToRoom).toHaveBeenCalledWith("user-room");
});

test("drops a title-taken fallback after reconnect and follows the refreshed room list", async () => {
    mockGet.mockResolvedValueOnce([makeContinuation()]);
    const { result } = renderContinuation();

    await act(async () => result.current.onActivate());
    expect(result.current.actionTitle).toBe("Join continuation room (3)");

    act(() => mockSocketConnectHandler?.());
    expect(result.current.actionTitle).toBe("Continue in new room");
});

test("a stale create response neither posts an announcement nor navigates", async () => {
    const controller = makeController();
    let resolveCreate!: (roomId: string) => void;
    (controller.createRoom as jest.Mock).mockImplementation(
        (
            _game: KibitzWatchedGame,
            _title: string,
            _description: string,
            options: { beforeSelectRoom?: (roomId: string) => void; select?: boolean },
        ) =>
            new Promise<string>(
                (resolve) =>
                    (resolveCreate = (roomId) => {
                        options.beforeSelectRoom?.(roomId);
                        resolve(roomId);
                    }),
            ),
    );
    const { result, rerender, navigateToRoom } = renderContinuation({ controller });

    const createPromise = result.current.onActivate();
    await Promise.resolve();
    rerender({
        room: {
            ...preset,
            current_game_id: 43,
            current_game: { ...game, game_id: 43 },
        },
    });
    await act(async () => {
        resolveCreate("stale-room");
        await createPromise;
    });

    expect(controller.postContinuationRoomAnnouncement).not.toHaveBeenCalled();
    expect(navigateToRoom).not.toHaveBeenCalled();
});

test("refresh state comes from the live room list, and access gates hide the action", () => {
    mockUseGameRooms.mockReturnValue([makeContinuation()]);
    const joined = renderContinuation();
    expect(joined.result.current.actionTitle).toBe("Join continuation room (3)");
    joined.unmount();

    const blocked = renderContinuation({ blocked: true });
    expect(blocked.result.current.visible).toBe(false);
    blocked.unmount();

    const signedOut = renderContinuation({ canCreate: false });
    expect(signedOut.result.current.visible).toBe(false);
});

test("hides the action and invitation source from a continuation user room", () => {
    const continuationRoom = {
        ...preset,
        id: "user-room",
        channel: "kibitz-user-room",
        title: "Black vs White · #42",
        kind: "user" as const,
    };
    const { result } = renderContinuation({ room: continuationRoom });

    expect(result.current.visible).toBe(false);
    expect(result.current.continuationRoom).toBeNull();
});
