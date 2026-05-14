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

import { KibitzController } from "./KibitzController";
import * as requests from "@/lib/requests";
import * as chatManager from "@/lib/chat_manager";

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
    chat_manager: {},
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

const mockedGet = requests.get as jest.MockedFunction<typeof requests.get>;
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
                kind: "preset",
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
                kind: "preset",
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
                kind: "preset",
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
            kind: "preset",
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
});
