/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ChatMessage } from "@/lib/chat_manager";
import type { KibitzRoomSummary, KibitzStreamItem, KibitzVariationSummary } from "@/models/kibitz";
import { KibitzChatPanel } from "./KibitzChatPanel";

let observedWidth = 600;
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get() {
            return observedWidth;
        },
    });
    global.ResizeObserver = class {
        constructor(private cb: () => void) {}
        observe() {
            this.cb();
        }
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
});

const mockRoomProxy = {
    channel: {
        markAsRead: jest.fn(),
        send: jest.fn(),
    },
    on: jest.fn(),
    off: jest.fn(),
    part: jest.fn(),
};

jest.mock("@/components/Chat", () => ({
    __esModule: true,
    ChatLine: ({
        line,
        lastLine,
        goban,
    }: {
        line: ChatMessage;
        lastLine?: ChatMessage;
        goban?: { game_id: number } | null;
    }) => (
        <div
            data-testid="chat-line"
            data-last-line-t={lastLine ? String(lastLine.message.t) : ""}
            data-board={goban?.game_id ?? ""}
        >
            {typeof line.message.m === "string" ? line.message.m : line.message.m.type}
        </div>
    ),
}));

jest.mock("@/components/Chat/GameChatLine", () => ({
    __esModule: true,
    GameChatLine: () => <div data-testid="game-chat-line" />,
}));

jest.mock("@/components/TabCompleteInput", () => ({
    __esModule: true,
    TabCompleteInput: (props: React.ComponentProps<"input">) => <input {...props} />,
}));

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user: { username?: string } }) => <span>{user.username}</span>,
}));

jest.mock("@/components/ChatUserList", () => ({
    __esModule: true,
    ChatUserList: ({ channel }: { channel: string }) => (
        <div className="ChatUserList" data-testid="user-list">
            {channel}
        </div>
    ),
    ChatUserCount: ({ onClick, active }: { onClick: () => void; active: boolean }) => (
        <button
            type="button"
            className="ChatUserCount"
            data-testid="user-toggle"
            data-active={active}
            onClick={onClick}
        />
    ),
}));

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    cachedChannelInformation: () => null,
    chat_manager: {
        join: jest.fn(() => mockRoomProxy),
    },
}));

jest.mock("@/lib/data", () => {
    const store = new Map<string, unknown>();
    return {
        __esModule: true,
        get: (key: string, fallback?: unknown) => (store.has(key) ? store.get(key) : fallback),
        set: (key: string, value: unknown) => store.set(key, value),
    };
});

jest.mock("@/lib/hooks", () => ({
    __esModule: true,
    useUser: () => ({
        anonymous: false,
        email_validated: true,
    }),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: (template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    moment: (value: Date | number) => ({
        format: (pattern: string) => {
            const date = typeof value === "number" ? new Date(value) : value;
            if (pattern === "HH:mm") {
                return `${String(date.getHours()).padStart(2, "0")}:${String(
                    date.getMinutes(),
                ).padStart(2, "0")}`;
            }

            return "";
        },
    }),
    pgettext: (_context: string, text: string) => text,
}));

jest.mock("./kibitzVariationQuickList", () => ({
    __esModule: true,
    formatVariationBranchLabel: () => "Main branch",
    formatVariationLengthLabel: () => "18 moves",
}));

jest.mock("./KibitzChatPanel.css", () => ({}));
jest.mock("@/components/Chat/ChatLog.css", () => ({}));

function makeRoom(): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "kibitz-room-1",
        title: "Room 1",
        kind: "preset",
        viewer_count: 0,
    };
}

function makeItem(): KibitzStreamItem {
    return {
        id: "item-1",
        room_id: "room-1",
        type: "variation_posted",
        created_at: Date.UTC(2026, 4, 18, 12, 34, 0),
        author: {
            id: 10,
            username: "Alice",
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        text: "",
        variation_id: "variation-1",
        source: "room-stream",
    };
}

function makeChatItem(
    id: string,
    source: "room-stream" | "game-chat",
    text: string,
): KibitzStreamItem {
    return {
        id,
        room_id: "room-1",
        type: "chat",
        created_at: Date.UTC(2026, 4, 18, 12, 35, 0),
        author: {
            id: 11,
            username: `${text} author`,
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        text,
        source,
    };
}

function makeVariation(): KibitzVariationSummary {
    return {
        id: "variation-1",
        room_id: "room-1",
        game_id: 99,
        creator: {
            id: 10,
            username: "Alice",
            ranking: 1,
            professional: false,
            ui_class: "",
        },
        created_at: Date.UTC(2026, 4, 18, 12, 0, 0),
        viewer_count: 0,
        current_viewers: [],
        title: "Study line",
        move_count: 18,
    };
}

function baseProps() {
    return {
        room: makeRoom(),
        items: [] as KibitzStreamItem[],
        variations: [] as KibitzVariationSummary[],
        onOpenVariation: jest.fn(),
        gameController: null,
        variationColorIndexes: {} as Record<string, number>,
        showPeople: false,
    };
}

describe("KibitzChatPanel variation posts", () => {
    beforeEach(() => {
        mockRoomProxy.channel.markAsRead.mockClear();
        mockRoomProxy.channel.send.mockClear();
        mockRoomProxy.on.mockClear();
        mockRoomProxy.off.mockClear();
        mockRoomProxy.part.mockClear();
    });

    it("renders the timestamp outside the variation button and keeps click handling intact", () => {
        const onOpenVariation = jest.fn();

        const { container } = render(
            <KibitzChatPanel
                room={makeRoom()}
                items={[
                    makeItem(),
                    makeChatItem("room-chat-1", "room-stream", "Room hello"),
                    makeChatItem("game-chat-1", "game-chat", "Game hello"),
                ]}
                variations={[makeVariation()]}
                onOpenVariation={onOpenVariation}
                gameController={null}
                variationColorIndexes={{}}
                showPeople={false}
            />,
        );

        const time = container.querySelector(".variation-post-time");
        expect(time).not.toBeNull();
        expect(time?.tagName).toBe("TIME");

        expect(screen.getByText("Game chat")).toBeInTheDocument();
        expect(screen.getByText("Kibitz chat")).toBeInTheDocument();

        const row = time?.closest(".variation-post-entry");
        expect(row).not.toBeNull();
        expect(row).toHaveAttribute("data-variation-id", "variation-1");

        const button = screen.getByRole("button", {
            name: "Variation: Study line",
        });
        expect(button).toHaveClass("variation-post");
        expect(button).not.toHaveTextContent(/\d{2}:\d{2}/);

        fireEvent.click(button);
        expect(onOpenVariation).toHaveBeenCalledWith("variation-1", true);
    });

    test("shows the people column when the panel is wide enough and it is enabled", () => {
        observedWidth = 600;
        const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
        expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).not.toBeNull();
    });

    test("hides the people column when it is switched off", () => {
        observedWidth = 600;
        const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={false} />);
        expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).toBeNull();
    });

    test("keeps the column at the sidebar width a common laptop gives it", () => {
        // 400px is the automatic Kibitz sidebar on a 1366px screen, and 409px
        // on a 1600px one. The action tab is the only route to the people
        // list, so the threshold has to sit below that.
        observedWidth = 400;
        const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
        expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).not.toBeNull();
    });

    test("drops the column when the panel is too narrow to share", () => {
        observedWidth = 200;
        const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
        expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).toBeNull();
    });

    test("does not show the user count button in the composer any more", () => {
        observedWidth = 600;
        const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
        expect(container.querySelector(".KibitzChatPanel-composer .ChatUserCount")).toBeNull();
    });

    test("the composer placeholder reads the same in every room, not the room title", () => {
        render(<KibitzChatPanel {...baseProps()} />);
        expect(screen.getByPlaceholderText("Message kibitz")).toBeInTheDocument();
    });

    test("an external mode picks the chat and drops the tab strip", () => {
        const { container, rerender } = render(
            <KibitzChatPanel
                {...baseProps()}
                mode="game"
                items={[
                    makeChatItem("room-chat-1", "room-stream", "Room hello"),
                    makeChatItem("game-chat-1", "game-chat", "Game hello"),
                ]}
            />,
        );

        expect(container.querySelector(".KibitzChatPanel-tabs")).toBeNull();
        expect(screen.getByText("Game hello")).toBeInTheDocument();
        expect(screen.queryByText("Room hello")).toBeNull();

        rerender(
            <KibitzChatPanel
                {...baseProps()}
                mode="room"
                items={[
                    makeChatItem("room-chat-1", "room-stream", "Room hello"),
                    makeChatItem("game-chat-1", "game-chat", "Game hello"),
                ]}
            />,
        );

        expect(screen.getByText("Room hello")).toBeInTheDocument();
        expect(screen.queryByText("Game hello")).toBeNull();
    });

    test("reports the unread state of the chat the mode leaves off screen", () => {
        const onUnreadChange = jest.fn();
        render(
            <KibitzChatPanel
                {...baseProps()}
                mode="game"
                onUnreadChange={onUnreadChange}
                items={[makeChatItem("room-chat-1", "room-stream", "Room hello")]}
            />,
        );

        expect(onUnreadChange).toHaveBeenLastCalledWith({ room: true, game: false });
    });

    test("a hidden pane leaves its own chat unread until it is shown", () => {
        const onUnreadChange = jest.fn();
        const props = {
            ...baseProps(),
            mode: "room" as const,
            onUnreadChange,
            items: [makeChatItem("room-chat-1", "room-stream", "Room hello")],
        };
        const { rerender } = render(<KibitzChatPanel {...props} visible={false} />);
        expect(onUnreadChange).toHaveBeenLastCalledWith({ room: true, game: false });

        rerender(<KibitzChatPanel {...props} visible={true} />);
        expect(onUnreadChange).toHaveBeenLastCalledWith({ room: false, game: false });
    });

    test("renders room and game chat entries under their respective tabs", () => {
        render(
            <KibitzChatPanel
                {...baseProps()}
                items={[
                    makeChatItem("room-chat-1", "room-stream", "Room hello"),
                    makeChatItem("game-chat-1", "game-chat", "Game hello"),
                ]}
            />,
        );

        fireEvent.click(screen.getByText("Kibitz chat"));
        const roomEntry = screen.getByText("Room hello").closest(".kibitz-chat-entry");
        expect(roomEntry).not.toBeNull();
        expect(roomEntry?.querySelector("time")).not.toBeNull();

        fireEvent.click(screen.getByText("Game chat"));
        const gameEntry = screen.getByText("Game hello").closest(".kibitz-chat-entry");
        expect(gameEntry).not.toBeNull();
        expect(gameEntry?.querySelector("time")).not.toBeNull();
    });
});

describe("opening date separator", () => {
    // ChatLine draws a date by comparing the line with the one before it,
    // and unconditionally when there is none. The panel seeds that "previous
    // line" with the current time, so a first message sent today opens the
    // log without a date and an older one keeps it. ChatLine is mocked here,
    // so what this pins is the seed the panel hands it.
    test("the first line is given a previous line dated now", () => {
        const before = Math.floor(Date.now() / 1000);
        const { container } = render(
            <KibitzChatPanel
                {...baseProps()}
                mode="room"
                visible={true}
                items={[makeChatItem("only", "room-stream", "hello")]}
            />,
        );
        const after = Math.floor(Date.now() / 1000);
        const seeded = container.querySelector("[data-testid='chat-line']");
        const t = Number(seeded?.getAttribute("data-last-line-t"));
        expect(Number.isFinite(t)).toBe(true);
        expect(t).toBeGreaterThanOrEqual(before);
        expect(t).toBeLessThanOrEqual(after);
    });
});

describe("Kibitz room chat move references", () => {
    function propsWithGame() {
        return {
            ...baseProps(),
            mode: "room" as const,
            room: { ...makeRoom(), current_game: { game_id: 42 } } as KibitzRoomSummary,
            gameController: {
                destroyed: false,
                goban: {
                    game_id: 42,
                    chat_log: [],
                    engine: {
                        last_official_move: { move_number: 17 },
                        cur_move: { move_number: 3 },
                    },
                    on: jest.fn(),
                    off: jest.fn(),
                },
            } as unknown as import("@/lib/GobanController").GobanController,
            onOpenChatMove: jest.fn(),
        };
    }

    test("sends the live move rather than the position being viewed", () => {
        const props = propsWithGame();
        render(<KibitzChatPanel {...props} />);
        const input = screen.getByPlaceholderText("Message kibitz");
        fireEvent.change(input, { target: { value: "Hello" } });
        fireEvent.keyPress(input, { key: "Enter", charCode: 13 });
        expect(mockRoomProxy.channel.send).toHaveBeenLastCalledWith("Hello", {
            game_id: 42,
            move_number: 17,
        });
    });

    test("sends plain chat while the main board belongs to the previous game", () => {
        const props = propsWithGame();
        props.room = { ...props.room, current_game: { game_id: 43 } } as KibitzRoomSummary;
        render(<KibitzChatPanel {...props} />);
        const input = screen.getByPlaceholderText("Message kibitz");
        fireEvent.change(input, { target: { value: "Hello again" } });
        fireEvent.keyPress(input, { key: "Enter", charCode: 13 });
        expect(mockRoomProxy.channel.send).toHaveBeenLastCalledWith("Hello again", undefined);
    });

    test("groups same-position messages and makes old-game headings plain text", () => {
        const props = propsWithGame();
        const items = [
            { ...makeChatItem("a", "room-stream", "First"), game_id: 42, move_number: 12 },
            { ...makeChatItem("b", "room-stream", "Second"), game_id: 42, move_number: 12 },
            { ...makeChatItem("c", "room-stream", "Earlier game"), game_id: 41, move_number: 12 },
            makeChatItem("d", "room-stream", "Legacy message"),
        ];
        const { rerender } = render(<KibitzChatPanel {...props} items={items} />);
        expect(screen.getAllByRole("button", { name: "Move 12" })).toHaveLength(1);
        fireEvent.click(screen.getByRole("button", { name: "Move 12" }));
        expect(props.onOpenChatMove).toHaveBeenCalledWith(42, 12);
        expect(screen.getAllByText("Move 12")).toHaveLength(2);
        rerender(
            <KibitzChatPanel
                {...props}
                room={{ ...props.room, current_game: undefined }}
                items={items}
            />,
        );
        expect(screen.queryByRole("button", { name: "Move 12" })).not.toBeInTheDocument();
        expect(screen.getAllByText("Move 12")).toHaveLength(2);
    });

    test("keeps move zero and ignores malformed metadata", () => {
        const props = propsWithGame();
        render(
            <KibitzChatPanel
                {...props}
                items={[
                    {
                        ...makeChatItem("a", "room-stream", "Before the first move"),
                        game_id: 42,
                        move_number: 0,
                    },
                    {
                        ...makeChatItem("b", "room-stream", "Invalid move"),
                        game_id: 42,
                        move_number: -1,
                    },
                ]}
            />,
        );
        expect(screen.getByRole("button", { name: "Move 0" })).toBeInTheDocument();
        expect(screen.queryByText("Move -1")).not.toBeInTheDocument();
    });
    test("highlights coordinates only for messages belonging to the current game", () => {
        const props = propsWithGame();
        const items = [
            { ...makeChatItem("a", "room-stream", "Current A19"), game_id: 42, move_number: 12 },
            { ...makeChatItem("b", "room-stream", "Older S7"), game_id: 41, move_number: 12 },
            makeChatItem("c", "room-stream", "Unknown A19"),
        ];
        const { rerender } = render(<KibitzChatPanel {...props} items={items} />);
        expect(screen.getByText("Current A19")).toHaveAttribute("data-board", "42");
        expect(screen.getByText("Older S7")).toHaveAttribute("data-board", "");
        expect(screen.getByText("Unknown A19")).toHaveAttribute("data-board", "");
        rerender(<KibitzChatPanel {...props} items={items} coordinateGoban={null} />);
        expect(screen.getByText("Current A19")).toHaveAttribute("data-board", "");
        const variationBoard = { game_id: 0 } as import("goban").Goban;
        rerender(<KibitzChatPanel {...props} items={items} coordinateGoban={variationBoard} />);
        expect(screen.getByText("Current A19")).toHaveAttribute("data-board", "0");
    });
});

describe.each(["room", "game"] as const)("%s chat scrolling", (mode) => {
    let scrollHeight: number;
    let frames: FrameRequestCallback[];

    beforeEach(() => {
        scrollHeight = 1000;
        frames = [];
        jest.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
            () => scrollHeight,
        );
        jest.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(200);
        jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
            frames.push(callback);
            return frames.length;
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    function flushFrames() {
        act(() => {
            const pending = frames;
            frames = [];
            pending.forEach((callback) => callback(0));
        });
    }

    function chatProps(roomId = "room-1", count = 2) {
        return {
            ...baseProps(),
            mode,
            room: { ...makeRoom(), id: roomId, channel: `kibitz-${roomId}` },
            items: Array.from({ length: count }, (_, index) => ({
                ...makeChatItem(
                    `${roomId}-${index}`,
                    mode === "room" ? "room-stream" : "game-chat",
                    `Message ${index}`,
                ),
                room_id: roomId,
            })),
        };
    }

    test("opens at the latest message when history arrives after mount", () => {
        const { container, rerender } = render(<KibitzChatPanel {...chatProps("room-1", 0)} />);
        rerender(<KibitzChatPanel {...chatProps()} />);
        flushFrames();
        expect(container.querySelector(".chat-lines")?.scrollTop).toBe(scrollHeight);
    });

    test("keeps the reading position when messages arrive in the same room", () => {
        const { container, rerender } = render(<KibitzChatPanel {...chatProps()} />);
        flushFrames();
        const log = container.querySelector<HTMLDivElement>(".chat-lines")!;
        fireEvent.scroll(log, { target: { scrollTop: 100 } });
        scrollHeight = 1200;
        rerender(<KibitzChatPanel {...chatProps("room-1", 3)} />);
        flushFrames();
        expect(log.scrollTop).toBe(100);
    });

    test("opens the new room at the latest message after reading older messages", () => {
        const { container, rerender } = render(<KibitzChatPanel {...chatProps()} />);
        flushFrames();
        fireEvent.scroll(container.querySelector(".chat-lines")!, { target: { scrollTop: 0 } });
        rerender(<KibitzChatPanel {...chatProps("room-2")} />);
        flushFrames();
        expect(container.querySelector(".chat-lines")?.scrollTop).toBe(scrollHeight);
    });

    test("scrolls a new room with the same history length even when already following", () => {
        const { container, rerender } = render(<KibitzChatPanel {...chatProps()} />);
        flushFrames();
        scrollHeight = 1500;
        rerender(<KibitzChatPanel {...chatProps("room-2")} />);
        flushFrames();
        expect(container.querySelector(".chat-lines")?.scrollTop).toBe(scrollHeight);
    });

    test("opens the new room at the latest message when a hidden pane becomes visible", () => {
        const { container, rerender } = render(<KibitzChatPanel {...chatProps()} />);
        flushFrames();
        fireEvent.scroll(container.querySelector(".chat-lines")!, { target: { scrollTop: 0 } });
        rerender(<KibitzChatPanel {...chatProps("room-2")} visible={false} />);
        rerender(<KibitzChatPanel {...chatProps("room-2")} visible={true} />);
        flushFrames();
        expect(container.querySelector(".chat-lines")?.scrollTop).toBe(scrollHeight);
    });

    test("follows delayed history in a new room after reading older messages", () => {
        const { container, rerender } = render(<KibitzChatPanel {...chatProps()} />);
        flushFrames();
        fireEvent.scroll(container.querySelector(".chat-lines")!, { target: { scrollTop: 0 } });
        rerender(<KibitzChatPanel {...chatProps("room-2", 0)} />);
        rerender(<KibitzChatPanel {...chatProps("room-2")} />);
        flushFrames();
        expect(container.querySelector(".chat-lines")?.scrollTop).toBe(scrollHeight);
    });
});

describe("room presence and read-state batching", () => {
    let frames: Map<number, FrameRequestCallback>;
    let nextFrame: number;
    beforeEach(() => {
        frames = new Map();
        nextFrame = 0;
        mockRoomProxy.on.mockClear();
        mockRoomProxy.channel.markAsRead.mockClear();
        jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
            frames.set(++nextFrame, callback);
            return nextFrame;
        });
        jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
            frames.delete(id);
        });
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    function flushFrames() {
        act(() => {
            const pending = [...frames.values()];
            frames.clear();
            pending.forEach((callback) => callback(0));
        });
    }
    test("updates read state once per replay burst instead of once per message", () => {
        const { unmount } = render(<KibitzChatPanel {...baseProps()} />);
        flushFrames();
        mockRoomProxy.channel.markAsRead.mockClear();
        const chat = mockRoomProxy.on.mock.calls.find(([event]) => event === "chat")![1];
        act(() => {
            for (let index = 0; index < 500; ++index) {
                chat();
            }
        });
        expect(mockRoomProxy.channel.markAsRead).not.toHaveBeenCalled();
        expect(frames.size).toBe(1);
        flushFrames();
        expect(mockRoomProxy.channel.markAsRead).toHaveBeenCalledTimes(1);
        unmount();
    });
    test("does not refresh or mark the previous room as read after switching rooms", () => {
        const { rerender, unmount } = render(<KibitzChatPanel {...baseProps()} />);
        flushFrames();
        const chat = mockRoomProxy.on.mock.calls.find(([event]) => event === "chat")![1];
        act(() => {
            chat();
        });
        rerender(
            <KibitzChatPanel
                {...baseProps()}
                room={{ ...makeRoom(), id: "next", channel: "kibitz-next" }}
            />,
        );
        mockRoomProxy.channel.markAsRead.mockClear();
        flushFrames();
        expect(mockRoomProxy.channel.markAsRead).not.toHaveBeenCalled();
        unmount();
    });
});
