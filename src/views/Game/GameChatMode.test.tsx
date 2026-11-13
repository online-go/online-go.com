/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render } from "@testing-library/react";
import { GameChat } from "./GameChat";
import { useUserIsParticipant } from "./GameHooks";
import { inGameModChannel } from "@/lib/chat_manager";

const mock_set_selected_chat_log = jest.fn();
const mock_user = { current: {} as Record<string, unknown> };

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
        setSelectedChatLog: mock_set_selected_chat_log,
    }),
}));

jest.mock("@/lib/data", () => ({
    __esModule: true,
    get: (key: string, fallback?: unknown) => (key === "user" ? mock_user.current : fallback),
    set: jest.fn(),
    setDefault: jest.fn(),
    setWithoutEmit: jest.fn(),
    remove: jest.fn(),
    watch: jest.fn(),
    unwatch: jest.fn(),
}));

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

// The user's default game chat mode.
jest.mock("@/lib/preferences", () => ({
    __esModule: true,
    get: jest.fn(() => "personal"),
    set: jest.fn(),
}));

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    inGameModChannel: jest.fn(() => false),
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
    ChatUserList: () => null,
    ChatUserCount: () => null,
}));

jest.mock("./GameKibitzRooms", () => ({
    __esModule: true,
    GameKibitzRooms: () => null,
}));

const mock_in_game_mod_channel = inGameModChannel as jest.Mock;
const mock_participant = useUserIsParticipant as jest.Mock;

function lastSelectedChatLog(): string | undefined {
    return mock_set_selected_chat_log.mock.lastCall?.[0];
}

describe("GameChat initial chat mode", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mock_participant.mockReturnValue(false);
        mock_in_game_mod_channel.mockReturnValue(false);
        mock_user.current = { id: 1, anonymous: false, is_moderator: false };
    });

    it("keeps an anonymous moderator in the hidden chat", () => {
        mock_user.current = { id: 1, anonymous: false, is_moderator: true };
        mock_in_game_mod_channel.mockReturnValue(true);
        render(<GameChat channel="game-5" game_id={5} />);
        expect(lastSelectedChatLog()).toBe("hidden");
    });

    it("gives a moderator who joined publicly their default chat mode", () => {
        mock_user.current = { id: 1, anonymous: false, is_moderator: true };
        render(<GameChat channel="game-5" game_id={5} />);
        expect(lastSelectedChatLog()).toBe("personal");
    });

    it("puts a spectator who is not a moderator in the main chat", () => {
        // inGameModChannel is true for anyone on the reports center page.
        mock_in_game_mod_channel.mockReturnValue(true);
        render(<GameChat channel="game-5" game_id={5} />);
        expect(lastSelectedChatLog()).toBe("main");
    });
});
