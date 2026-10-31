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

import EventEmitter from "eventemitter3";
import type { ChatMessage, ChatChannelProxy } from "@/lib/chat_manager";
import { KibitzController } from "./KibitzController";
import * as requests from "@/lib/requests";
import * as chatManager from "@/lib/chat_manager";
import { kibitzTelemetry } from "./kibitzTelemetry";
import * as analysisPolicy from "./kibitzAnalysisPolicy";

const pushHandlers: Record<string, (payload: unknown) => void> = {};

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    del: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
}));

jest.mock("@/lib/sockets", () => ({
    __esModule: true,
    socket: {
        connected: true,
    },
}));

jest.mock("@/components/UIPush/UIPush", () => ({
    __esModule: true,
    push_manager: {
        on: jest.fn((event: string, handler: (payload: unknown) => void) => {
            pushHandlers[event] = handler;
            return { event, handler };
        }),
        off: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
    },
}));

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    chat_manager: {
        join: jest.fn(() => ({
            on: jest.fn(),
            off: jest.fn(),
            part: jest.fn(),
            channel: { chat_log: [], users_by_join: [] },
        })),
    },
    updateCachedChannelInformation: jest.fn(),
}));

jest.mock("@/lib/data", () => ({
    __esModule: true,
    default: {},
    get: jest.fn(),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((text: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            text,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
}));

jest.mock("./kibitzAnalysisPolicy", () => ({
    __esModule: true,
    getCurrentKibitzUser: jest.fn(() => null),
    isKibitzAccessBlockedForUser: jest.fn(() => false),
}));

jest.mock("./kibitzTelemetry", () => ({
    __esModule: true,
    kibitzTelemetry: {
        record: jest.fn(),
        setRoom: jest.fn(),
    },
}));

const mockedGet = requests.get as jest.MockedFunction<typeof requests.get>;
const mockedPost = requests.post as jest.MockedFunction<typeof requests.post>;
const mockedUpdateCachedChannelInformation =
    chatManager.updateCachedChannelInformation as jest.MockedFunction<
        typeof chatManager.updateCachedChannelInformation
    >;

function flushPromises(): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, 0);
    });
}

describe("KibitzController room ordering", () => {
    beforeEach(() => {
        mockedGet.mockReset();
        mockedUpdateCachedChannelInformation.mockReset();
        for (const key of Object.keys(pushHandlers)) {
            delete pushHandlers[key];
        }
    });

    it("sorts the initial room list by population and keeps live updates stable", async () => {
        mockedGet.mockResolvedValueOnce([
            {
                id: "room-c",
                channel: "channel-c",
                title: "Room C",
                kind: "user",
                description: null,
                current_game_id: null,
                creator_id: null,
                created_at: "2026-05-01T10:00:00Z",
                last_activity_at: "2026-05-01T10:00:00Z",
                viewer_count: 2,
            },
            {
                id: "room-a",
                channel: "channel-a",
                title: "Room A",
                kind: "user",
                description: null,
                current_game_id: null,
                creator_id: null,
                created_at: "2026-05-01T10:00:00Z",
                last_activity_at: "2026-05-01T10:00:00Z",
                viewer_count: 9,
            },
            {
                id: "room-b",
                channel: "channel-b",
                title: "Room B",
                kind: "user",
                description: null,
                current_game_id: null,
                creator_id: null,
                created_at: "2026-05-01T10:00:00Z",
                last_activity_at: "2026-05-01T10:00:00Z",
                viewer_count: 9,
            },
        ]);

        const controller = new KibitzController();
        await flushPromises();
        await flushPromises();

        expect(controller.rooms.map((room) => room.id)).toEqual(["room-a", "room-b", "room-c"]);
        expect(controller.default_room_id).toBe("room-a");

        pushHandlers["viewer-count-changed"]?.({
            channel: "channel-c",
            viewer_count: 42,
        });

        expect(controller.rooms.map((room) => room.id)).toEqual(["room-a", "room-b", "room-c"]);
        expect(controller.rooms.find((room) => room.id === "room-c")?.viewer_count).toBe(42);

        pushHandlers["room-created"]?.({
            id: "room-new",
            channel: "channel-new",
            title: "Room New",
            kind: "user",
            description: null,
            current_game_id: null,
            creator_id: null,
            created_at: "2026-05-01T10:00:00Z",
            last_activity_at: "2026-05-01T10:00:00Z",
            viewer_count: 99,
        });

        expect(controller.rooms.map((room) => room.id)).toEqual([
            "room-a",
            "room-b",
            "room-c",
            "room-new",
        ]);

        pushHandlers["room-removed"]?.({ id: "room-b" });

        expect(controller.rooms.map((room) => room.id)).toEqual(["room-a", "room-c", "room-new"]);
    });

    it("lists preset rooms in definition order, then custom rooms by viewer count", async () => {
        const directoryRoom = (
            id: string,
            kind: "user" | "preset" | "broadcast",
            viewer_count: number,
            preset_key?: string,
        ) => ({
            id,
            channel: `channel-${id}`,
            title: id,
            kind,
            description: null,
            current_game_id: null,
            creator_id: null,
            created_at: "2026-05-01T10:00:00Z",
            last_activity_at: "2026-05-01T10:00:00Z",
            viewer_count,
            preset: preset_key
                ? {
                      preset_key,
                      selection_status: "watching" as const,
                      pending_game_id: null,
                      change_effective_at: null,
                  }
                : null,
        });

        mockedGet.mockResolvedValueOnce([
            directoryRoom("user-busy", "user", 50),
            directoryRoom("preset-english-chat-live", "preset", 40),
            directoryRoom("broadcast-featured", "broadcast", 100),
            directoryRoom("preset-mid-ranked-live", "preset", 3, "mid-ranked-live"),
            directoryRoom("user-tied-b", "user", 9),
            directoryRoom("preset-alpha-extra", "preset", 99, "alpha-extra"),
            directoryRoom("preset-high-ranked-live", "preset", 0, "high-ranked-live"),
            directoryRoom("user-quiet", "user", 1),
            directoryRoom("preset-zeta-extra", "preset", 1, "zeta-extra"),
            directoryRoom("user-tied-a", "user", 9),
        ]);

        const controller = new KibitzController();
        await flushPromises();
        await flushPromises();

        expect(controller.rooms.map((room) => room.id)).toEqual([
            "preset-high-ranked-live",
            "preset-mid-ranked-live",
            "preset-english-chat-live",
            "preset-alpha-extra",
            "preset-zeta-extra",
            "broadcast-featured",
            "user-busy",
            "user-tied-a",
            "user-tied-b",
            "user-quiet",
        ]);
    });

    it("deduplicates overlapping room directory refreshes", async () => {
        let resolveDirectory: (value: unknown[]) => void = () => undefined;
        const directoryPromise = new Promise<unknown[]>((resolve) => {
            resolveDirectory = resolve;
        });

        mockedGet.mockReturnValueOnce(directoryPromise);

        const controller = new KibitzController();
        const firstRefresh = controller.refreshRoomDirectory();
        const secondRefresh = controller.refreshRoomDirectory();

        expect(firstRefresh).toBe(secondRefresh);
        expect(mockedGet).toHaveBeenCalledTimes(1);

        resolveDirectory([]);
        await firstRefresh;
        await flushPromises();

        mockedGet.mockResolvedValueOnce([]);
        const nextRefresh = controller.refreshRoomDirectory();

        expect(nextRefresh).not.toBe(firstRefresh);
        await nextRefresh;
        expect(mockedGet).toHaveBeenCalledTimes(2);
    });

    it("refreshes the room directory when the directory refresh push arrives", async () => {
        mockedGet.mockResolvedValueOnce([]);

        const controller = new KibitzController();
        await flushPromises();

        mockedGet.mockResolvedValueOnce([
            {
                id: "room-refresh",
                channel: "channel-refresh",
                title: "Room Refresh",
                kind: "preset",
                description: null,
                current_game_id: null,
                creator_id: null,
                created_at: "2026-05-01T10:00:00Z",
                last_activity_at: "2026-05-01T10:00:00Z",
                viewer_count: 7,
            },
        ]);

        pushHandlers["rooms-refresh"]?.({});
        await flushPromises();

        expect(controller.rooms.map((room) => room.id)).toEqual(["room-refresh"]);
    });

    it("hydrates and caches missing game metadata on demand", async () => {
        mockedGet.mockResolvedValueOnce([]);

        const controller = new KibitzController();
        const cacheChanged = jest.fn();
        controller.on("cached-games-changed", cacheChanged);

        await flushPromises();

        mockedGet.mockResolvedValueOnce({
            id: 90210,
            width: 19,
            height: 19,
            name: "Famous Game",
            players: {
                black: { id: 1, username: "Black" },
                white: { id: 2, username: "White" },
            },
            gamedata: {
                moves: [],
            },
            ended: null,
        });

        await controller.ensureGamesCached([90210, 90210]);

        expect(mockedGet).toHaveBeenCalledWith("games/90210");
        expect(controller.getCachedGame(90210)?.title).toBe("Famous Game");
        expect(controller.getCachedGame(90210)?.black.username).toBe("Black");
        expect(controller.getCachedGame(90210)?.white.username).toBe("White");
        expect(cacheChanged).toHaveBeenCalledTimes(1);
    });

    it("keeps cached current game when a partial room update omits it", async () => {
        mockedGet.mockResolvedValueOnce([
            {
                id: "room-current-game",
                channel: "channel-current-game",
                title: "Room Current Game",
                kind: "preset",
                description: null,
                current_game_id: 123,
                current_game: {
                    game_id: 123,
                    board_size: "19x19",
                    title: "Black vs White",
                    black: null,
                    white: null,
                    tournament_name: null,
                    move_number: null,
                    live: true,
                    analysis_disabled: false,
                },
                creator_id: null,
                created_at: "2026-05-01T10:00:00Z",
                last_activity_at: "2026-05-01T10:00:00Z",
                viewer_count: 7,
            },
        ]);

        const controller = new KibitzController();
        await flushPromises();
        await flushPromises();

        expect(controller.rooms[0].current_game?.game_id).toBe(123);

        (requests.put as jest.MockedFunction<typeof requests.put>).mockResolvedValueOnce({
            id: "room-current-game",
            channel: "channel-current-game",
            title: "Renamed Room",
            kind: "preset",
            description: "Updated description",
            current_game_id: 123,
            creator_id: null,
            created_at: "2026-05-01T10:00:00Z",
            last_activity_at: "2026-05-01T10:00:00Z",
        });

        await controller.updateRoomDetails(
            "room-current-game",
            "Renamed Room",
            "Updated description",
        );

        expect(controller.rooms[0].title).toBe("Renamed Room");
        expect(controller.rooms[0].current_game?.game_id).toBe(123);
    });

    test("closeSecondaryPane collapses without a size field", () => {
        const controller = new KibitzController();
        controller.setSecondaryPane({ collapsed: false, variation_id: "v1" });
        controller.closeSecondaryPane();
        expect(controller.secondary_pane).toEqual({ collapsed: true });
        controller.destroy();
    });

    test("selectRoom collapses the pane when the switch starts, not when details arrive", async () => {
        const controller = new KibitzController();
        controller.setSecondaryPane({ collapsed: false, variation_id: "v1" });

        let resolveRoom: (value: unknown) => void = () => undefined;
        mockedGet.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveRoom = resolve;
            }),
        );
        const pending = controller.selectRoom("room-2");
        expect(controller.secondary_pane).toEqual({ collapsed: true });

        // A draft opened while the room details load must survive their arrival.
        controller.setSecondaryPane({
            collapsed: false,
            variation_source_game_id: 5,
        });
        resolveRoom({});
        await pending;
        expect(controller.secondary_pane.collapsed).toBe(false);
        controller.destroy();
    });
});

describe("KibitzController telemetry", () => {
    const mockedRecord = kibitzTelemetry.record as jest.Mock;
    const mockedSetRoom = kibitzTelemetry.setRoom as jest.Mock;
    const mockedBlocked = analysisPolicy.isKibitzAccessBlockedForUser as jest.Mock;

    const roomPayload = (id: string) => ({
        room: {
            id,
            channel: `kibitz-${id}`,
            title: id,
            kind: id.startsWith("preset-") ? "preset" : "user",
            description: null,
            current_game_id: null,
            creator_id: null,
            created_at: "2026-05-01T10:00:00Z",
            last_activity_at: "2026-05-01T10:00:00Z",
            viewer_count: 1,
        },
        permissions: {},
    });

    beforeEach(() => {
        mockedGet.mockReset();
        mockedRecord.mockReset();
        mockedSetRoom.mockReset();
        mockedBlocked.mockReturnValue(false);
    });

    it("records load_room initial then switch, and mirrors the room into telemetry", async () => {
        mockedGet.mockResolvedValueOnce([]); // directory refresh in the constructor
        const controller = new KibitzController();
        await flushPromises();
        mockedGet.mockResolvedValueOnce(roomPayload("preset-a"));
        await controller.selectRoom("preset-a");
        expect(mockedRecord).toHaveBeenCalledWith("load_room", { reason: "initial" });
        expect(mockedSetRoom).toHaveBeenLastCalledWith("preset-a");
        mockedGet.mockResolvedValueOnce(roomPayload("user-7"));
        await controller.selectRoom("user-7");
        expect(mockedRecord).toHaveBeenLastCalledWith("load_room", { reason: "switch" });
        controller.destroy();
    });

    it("records load_room error when hydration fails", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        mockedGet.mockRejectedValueOnce(new Error("404"));
        await controller.selectRoom("user-9");
        expect(mockedRecord).toHaveBeenCalledWith("load_room", {
            reason: "initial",
            outcome: "error",
            error: "Error: 404",
        });
        expect(mockedSetRoom).toHaveBeenLastCalledWith(null);
        controller.destroy();
    });

    it("records nothing for an access-blocked room", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        mockedBlocked.mockReturnValue(true);
        mockedGet.mockResolvedValueOnce(roomPayload("user-3"));
        await controller.selectRoom("user-3");
        expect(mockedRecord).not.toHaveBeenCalled();
        controller.destroy();
    });

    it("records start_variation from the current board and from a posted variation", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        controller.setActiveRoom({
            id: "user-1",
            channel: "kibitz-user-1",
            title: "r",
            kind: "user",
            description: null,
            viewer_count: 1,
            current_game: { game_id: 5, title: "g" },
        } as never);
        controller.startVariationFromCurrentBoard({ roomId: "user-1", gameId: 5 });
        controller.startVariationFromPostedVariation({ id: "v1", game_id: 5 } as never);
        expect(mockedRecord.mock.calls.map((c) => c[0])).toEqual([
            "start_variation",
            "start_variation",
        ]);
        controller.destroy();
    });

    it("does not start a draft from a ready snapshot while room hydration is pending", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        controller.setActiveRoom({
            id: "preset-room",
            channel: "kibitz-preset-room",
            title: "preset",
            kind: "preset",
            description: null,
            viewer_count: 1,
            current_game: { game_id: 50, title: "old" },
        } as never);

        let resolveRoom: (value: unknown) => void = () => undefined;
        mockedGet.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveRoom = resolve;
            }),
        );
        const pending = controller.selectRoom("user-room");

        expect(controller.active_room?.id).toBe("preset-room");
        expect(
            controller.startVariationFromCurrentBoard(
                { roomId: "user-room", gameId: 9 },
                { x: -1, y: -1 },
            ),
        ).toBe(false);
        expect(controller.secondary_pane.variation_source_game_id).toBeUndefined();
        expect(mockedRecord).not.toHaveBeenCalledWith("start_variation");

        resolveRoom({
            ...roomPayload("user-room"),
            room: {
                ...roomPayload("user-room").room,
                current_game: {
                    game_id: 9,
                    board_size: "9x9",
                    title: "new",
                    black: null,
                    white: null,
                    tournament_name: null,
                    move_number: 4,
                    live: true,
                    analysis_disabled: false,
                },
            },
        });
        await pending;

        expect(controller.active_room?.id).toBe("user-room");
        expect(
            controller.startVariationFromCurrentBoard(
                { roomId: "user-room", gameId: 9 },
                { x: -1, y: -1 },
            ),
        ).toBe(true);
        expect(controller.secondary_pane.variation_source_game_id).toBe(9);
        controller.destroy();
    });

    const game = { game_id: 5, title: "g" } as never;

    it("records create_room ok on success and error on failure", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        mockedPost.mockResolvedValueOnce(roomPayload("user-2").room);
        mockedGet.mockResolvedValueOnce(roomPayload("user-2"));
        await controller.createRoom(game, "name", "");
        expect(mockedRecord).toHaveBeenCalledWith("create_room");
        mockedPost.mockRejectedValueOnce(new Error("403"));
        await controller.createRoom(game, "name", "");
        expect(mockedRecord).toHaveBeenLastCalledWith("create_room", {
            outcome: "error",
            error: "Error: 403",
        });
        controller.destroy();
    });

    it("records change_board ok on success and error on failure", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        mockedPost.mockResolvedValueOnce(roomPayload("user-3").room);
        await controller.changeBoard("user-3", game);
        expect(mockedRecord).toHaveBeenCalledWith("change_board");
        mockedPost.mockRejectedValueOnce(new Error("500"));
        await controller.changeBoard("user-3", game);
        expect(mockedRecord).toHaveBeenLastCalledWith("change_board", {
            outcome: "error",
            error: "Error: 500",
        });
        controller.destroy();
    });

    it("records post_variation ok when sent and malformed_payload when refused", async () => {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        mockedGet.mockResolvedValueOnce(roomPayload("user-4"));
        await controller.selectRoom("user-4");
        mockedRecord.mockClear();
        const boardController = (analysis: { from: unknown; moves: unknown }) =>
            ({
                buildAnalysisSnapshot: () => ({
                    is_duplicate: false,
                    analysis,
                    moves: [],
                    move_count: 0,
                }),
                recordAnalysisSent: jest.fn(),
                goban: { engine: { last_official_move: { move_number: 4 } } },
            }) as never;
        jest.spyOn(console, "warn").mockImplementation(() => undefined);
        controller.postVariation("user-4", boardController({ from: "x", moves: "" }), 5);
        expect(mockedRecord).toHaveBeenLastCalledWith("post_variation", {
            outcome: "error",
            error: "malformed_payload",
        });
        controller.postVariation("user-4", boardController({ from: 4, moves: "aa" }), 5);
        expect(mockedRecord).toHaveBeenLastCalledWith("post_variation");
        controller.destroy();
    });
});

test.each([
    { type: "chat", system: false },
    { type: "system", system: false },
    { type: "system", system: true },
])("keeps game metadata in $type history (system flag: $system)", async ({ type, system }) => {
    mockedGet.mockResolvedValueOnce([]);
    const controller = new KibitzController();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    const proxy = {
        on: jest.fn(),
        off: jest.fn(),
        part: jest.fn(),
        channel: {
            chat_log: [
                {
                    channel: "kibitz-room-1",
                    id: 9,
                    username: "Author",
                    ranking: 0,
                    professional: false,
                    ui_class: "",
                    system,
                    message: {
                        i: "message-1",
                        t: 100,
                        m: {
                            type,
                            text: "Look here",
                            game_id: 42,
                            move_number: 17,
                        },
                    },
                },
            ],
            users_by_join: [],
        },
    };
    jest.mocked(chatManager.chat_manager.join).mockReturnValueOnce(proxy as never);
    mockedGet.mockResolvedValueOnce({
        room: { id: "room-1", channel: "kibitz-room-1", title: "Room", kind: "user" },
        permissions: {},
    });
    await controller.selectRoom("room-1");
    expect(controller.stream).toContainEqual(
        expect.objectContaining({
            id: "message-1",
            text: "Look here",
            game_id: 42,
            ...(type === "chat" ? { move_number: 17 } : {}),
        }),
    );
    controller.destroy();
});

describe("Kibitz history replay batching", () => {
    let frames: Map<number, FrameRequestCallback>;
    let nextFrame: number;
    beforeEach(() => {
        frames = new Map();
        nextFrame = 0;
        jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
            frames.set(++nextFrame, callback);
            return nextFrame;
        });
        jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
            frames.delete(id);
        });
        mockedGet.mockReset();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    function flushFrames() {
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach((callback) => callback(0));
    }
    function message(index: number): ChatMessage {
        return {
            channel: "kibitz-test",
            id: 1,
            username: "Author",
            ranking: 0,
            professional: false,
            ui_class: "",
            message: { i: `message-${index}`, t: index, m: `Message ${index}` },
        };
    }
    async function setup() {
        mockedGet.mockResolvedValueOnce([]);
        const controller = new KibitzController();
        await flushPromises();
        const proxy = Object.assign(new EventEmitter(), {
            channel: { chat_log: [] as ChatMessage[], users_by_join: [] },
            part: jest.fn(),
        });
        jest.mocked(chatManager.chat_manager.join).mockReturnValueOnce(
            proxy as unknown as ChatChannelProxy,
        );
        mockedGet.mockResolvedValueOnce({
            room: { id: "test", channel: "kibitz-test", title: "Test", kind: "user" },
            permissions: {},
        });
        await controller.selectRoom("test");
        return { controller, proxy };
    }
    test.each([false, true])(
        "publishes a replay burst once with annotation-only=%p",
        async (annotationOnly) => {
            const { controller, proxy } = await setup();
            const streamChanged = jest.fn();
            controller.on("stream-changed", streamChanged);
            for (let index = 0; index < 500; ++index) {
                const line = message(index);
                proxy.channel.chat_log.push(line);
                proxy.emit("chat", line);
            }
            const variation = message(500);
            variation.message.m = {
                type: "analysis",
                game_id: 42,
                name: "Variation",
                from: 0,
                moves: annotationOnly ? "" : "aa",
                marks: annotationOnly ? { triangle: "dd" } : undefined,
            } as ChatMessage["message"]["m"];
            proxy.channel.chat_log.push(variation);
            proxy.emit("chat", variation);
            expect(streamChanged).not.toHaveBeenCalled();
            expect(frames.size).toBe(1);
            flushFrames();
            expect(streamChanged).toHaveBeenCalledTimes(1);
            expect(controller.stream.map((item) => item.id)).toEqual(
                proxy.channel.chat_log.map((line) => line.message.i),
            );
            expect(controller.variations).toEqual([
                expect.objectContaining({ id: "message-500", game_id: 42 }),
            ]);
            const previous = controller.stream;
            const live = message(501);
            proxy.channel.chat_log.push(live);
            proxy.emit("chat", live);
            flushFrames();
            expect(controller.stream).toHaveLength(502);
            expect(previous).toHaveLength(501);
            controller.destroy();
        },
    );
    test("removal cancels a queued replay and rebuilds from the remaining log", async () => {
        const { controller, proxy } = await setup();
        proxy.channel.chat_log.push(message(1), message(2));
        proxy.emit("chat", message(2));
        proxy.channel.chat_log.splice(0, 1);
        proxy.emit("chat-removed", { uuid: "message-1" });
        expect(frames.size).toBe(0);
        expect(controller.stream.map((item) => item.id)).toEqual(["message-2"]);
        controller.destroy();
    });
    test("rebuilds when a bulk clear and append replace already displayed messages", async () => {
        const { controller, proxy } = await setup();
        proxy.channel.chat_log.push(message(1), message(2));
        proxy.emit("chat", message(2));
        flushFrames();
        proxy.channel.chat_log.splice(0, 1);
        proxy.emit("chat", null);
        proxy.channel.chat_log.push(message(3), message(4));
        proxy.emit("chat", message(4));
        flushFrames();
        expect(controller.stream.map((item) => item.id)).toEqual([
            "message-2",
            "message-3",
            "message-4",
        ]);
        controller.destroy();
    });
    test("cancels queued history when leaving a room", async () => {
        const { controller, proxy } = await setup();
        proxy.channel.chat_log.push(message(1));
        proxy.emit("chat", message(1));
        mockedGet.mockResolvedValueOnce({
            room: { id: "next", channel: "kibitz-next", title: "Next", kind: "user" },
            permissions: {},
        });
        await controller.selectRoom("next");
        expect(frames.size).toBe(0);
        expect(controller.stream).toEqual([]);
        expect(proxy.part).toHaveBeenCalled();
        controller.destroy();
    });
    test("cancels queued history on destruction", async () => {
        const { controller, proxy } = await setup();
        proxy.channel.chat_log.push(message(1));
        proxy.emit("chat", message(1));
        const changed = jest.fn();
        controller.on("stream-changed", changed);
        controller.destroy();
        expect(frames.size).toBe(0);
        flushFrames();
        expect(changed).not.toHaveBeenCalled();
    });
});

test("posts annotation-only analysis and refuses an empty post", async () => {
    mockedGet.mockResolvedValueOnce([]);
    const controller = new KibitzController();
    await flushPromises();
    const sendTypedBody = jest.fn();
    jest.mocked(chatManager.chat_manager.join).mockReturnValueOnce({
        on: jest.fn(),
        off: jest.fn(),
        part: jest.fn(),
        channel: { chat_log: [], users_by_join: [], sendTypedBody },
    } as never);
    mockedGet.mockResolvedValueOnce({
        room: { id: "annotations", channel: "kibitz-annotations", kind: "user" },
        permissions: {},
    });
    await controller.selectRoom("annotations");
    jest.mocked(analysisPolicy.getCurrentKibitzUser).mockReturnValue({
        id: 1,
        username: "Author",
        anonymous: false,
    } as never);
    const analysis = { type: "analysis", from: 0, moves: "", marks: { triangle: "dd", A: "ee" } };
    const recordAnalysisSent = jest.fn();
    const board = {
        buildAnalysisSnapshot: () => ({ analysis, moves: [], move_count: 0, is_duplicate: false }),
        recordAnalysisSent,
        goban: { engine: { last_official_move: { move_number: 0 } } },
    } as never;
    try {
        expect(controller.postVariation("annotations", board, 42)).toEqual(
            expect.objectContaining(analysis),
        );
        expect(sendTypedBody).toHaveBeenCalledWith(
            expect.objectContaining({ ...analysis, game_id: 42 }),
        );
        expect(recordAnalysisSent).toHaveBeenCalledWith(analysis);
        analysis.marks = {} as typeof analysis.marks;
        expect(controller.postVariation("annotations", board, 42)).toBeNull();
        expect(sendTypedBody).toHaveBeenCalledTimes(1);
    } finally {
        controller.destroy();
        jest.mocked(analysisPolicy.getCurrentKibitzUser).mockReturnValue(null);
    }
});
