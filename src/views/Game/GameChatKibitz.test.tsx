/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { GameChat } from "./GameChat";
import { useGameKibitzRooms } from "./useGameKibitzRooms";
import { useGamePlayersLoaded, usePhase, useUserIsParticipant } from "./GameHooks";
import type { KibitzRoomSummary } from "@/models/kibitz";

jest.mock("./useGameKibitzRooms", () => ({
    __esModule: true,
    useGameKibitzRooms: jest.fn(() => []),
}));

jest.mock("./GameHooks", () => ({
    __esModule: true,
    useUserIsParticipant: jest.fn(() => false),
    usePhase: jest.fn(() => "play"),
    useGamePlayersLoaded: jest.fn(() => true),
}));

jest.mock("./goban_context", () => ({
    __esModule: true,
    useGobanController: () => ({
        goban: null,
        selected_chat_log: "main",
        on: jest.fn(),
        off: jest.fn(),
        setSelectedChatLog: jest.fn(),
    }),
}));

jest.mock("@/lib/data", () => {
    const store = new Map<string, unknown>();
    store.set("user", { id: 1, anonymous: false, email_validated: true, is_moderator: false });
    return {
        __esModule: true,
        get: (key: string, fallback?: unknown) => (store.has(key) ? store.get(key) : fallback),
        set: (key: string, value: unknown) => store.set(key, value),
        setDefault: (key: string, value: unknown) => {
            if (!store.has(key)) {
                store.set(key, value);
            }
        },
        setWithoutEmit: (key: string, value: unknown) => store.set(key, value),
        remove: (key: string) => store.delete(key),
        watch: jest.fn(),
        unwatch: jest.fn(),
    };
});

jest.mock("@/components/Chat", () => ({
    __esModule: true,
    chat_markup: (text: string) => text,
}));

jest.mock("@/components/misc-ui", () => ({
    __esModule: true,
    LineText: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
}));

jest.mock("@/lib/profanity_filter", () => ({
    __esModule: true,
    profanity_filter: (text: string) => text,
}));

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: () => null,
}));

jest.mock("react-router-dom", () => ({
    __esModule: true,
    Link: ({ children }: { children?: React.ReactNode }) => <a>{children}</a>,
}));

jest.mock("@/lib/preferences", () => ({
    __esModule: true,
    get: jest.fn(() => "main"),
    set: jest.fn(),
}));

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    inGameModChannel: () => false,
    chat_manager: { join: jest.fn() },
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    _: (text: string) => text,
    pgettext: (_context: string, text: string) => text,
    interpolate: (template: string) => template,
    current_language: "en",
    moment: () => ({ format: () => "" }),
}));

jest.mock("@/components/TabCompleteInput", () => ({
    __esModule: true,
    TabCompleteInput: (props: React.ComponentProps<"textarea">) => <textarea {...props} />,
}));

jest.mock("@/components/ChatUserList", () => ({
    __esModule: true,
    ChatUserList: ({ footer }: { footer?: React.ReactNode }) => (
        <div data-testid="user-list">{footer}</div>
    ),
    ChatUserCount: ({ has_kibitz }: { has_kibitz?: boolean }) => (
        <button type="button" data-testid="user-toggle" data-has-kibitz={String(!!has_kibitz)} />
    ),
}));

jest.mock("./GameKibitzRooms", () => ({
    __esModule: true,
    GameKibitzRooms: ({ rooms }: { rooms: KibitzRoomSummary[] }) => (
        <div data-testid="kibitz-rooms" data-count={rooms.length} />
    ),
}));

const mock_rooms = useGameKibitzRooms as jest.Mock;
const mock_participant = useUserIsParticipant as jest.Mock;
const mock_phase = usePhase as jest.Mock;
const mock_loaded = useGamePlayersLoaded as jest.Mock;

const room_a: KibitzRoomSummary = {
    id: "user-aaaa",
    channel: "kibitz-user-aaaa",
    title: "A",
    kind: "user",
    viewer_count: 2,
    current_game_id: 5,
};

describe("GameChat kibitz rooms", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mock_rooms.mockReturnValue([]);
        mock_participant.mockReturnValue(false);
        mock_phase.mockReturnValue("play");
        mock_loaded.mockReturnValue(true);
    });

    it("hides the rooms until the game's players have loaded", () => {
        mock_loaded.mockReturnValue(false);
        render(<GameChat channel="game-5" game_id={5} show_kibitz_rooms />);
        expect(mock_rooms).toHaveBeenCalledWith(5, true);
    });

    it("makes no kibitz request when show_kibitz_rooms is not set", () => {
        render(<GameChat channel="game-5" game_id={5} />);
        expect(mock_rooms).toHaveBeenCalledWith(undefined, expect.anything());
    });

    it("asks for the game's rooms when show_kibitz_rooms is set", () => {
        render(<GameChat channel="game-5" game_id={5} show_kibitz_rooms />);
        expect(mock_rooms).toHaveBeenCalledWith(5, false);
    });

    it("hides the rooms from a player while the game is in progress", () => {
        mock_participant.mockReturnValue(true);
        render(<GameChat channel="game-5" game_id={5} show_kibitz_rooms />);
        expect(mock_rooms).toHaveBeenCalledWith(5, true);
    });

    it("shows the rooms to a player once the game is finished", () => {
        mock_participant.mockReturnValue(true);
        mock_phase.mockReturnValue("finished");
        render(<GameChat channel="game-5" game_id={5} show_kibitz_rooms />);
        expect(mock_rooms).toHaveBeenCalledWith(5, false);
    });

    it("marks the toggle when rooms exist", () => {
        mock_rooms.mockReturnValue([room_a]);
        const { getByTestId } = render(<GameChat channel="game-5" game_id={5} show_kibitz_rooms />);
        expect(getByTestId("user-toggle")).toHaveAttribute("data-has-kibitz", "true");
    });
});
