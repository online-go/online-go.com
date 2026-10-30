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

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { chat_manager, type ChatMessage } from "./chat_manager";
import { socket } from "./sockets";
import { maxMessageLength } from "./misc";
import { emitNotification } from "@/components/Notifications";
import { ChatLine } from "@/components/Chat/ChatLine";

jest.mock("@/lib/data", () => ({
    get: (key: string, fallback: unknown) =>
        key === "config.user" || key === "user" ? { id: 7, username: "Reader" } : fallback,
    set: jest.fn(),
    watch: (key: string, callback: (value: unknown) => void) => {
        if (key === "config.user") {
            callback({ id: 7, username: "Reader" });
        }
    },
    unwatch: jest.fn(),
}));
jest.mock("@/lib/sockets", () => ({ socket: { on: jest.fn(), off: jest.fn(), send: jest.fn() } }));
jest.mock("@/lib/preferences", () => ({ get: jest.fn() }));
jest.mock("@/lib/player_cache", () => ({ update: jest.fn() }));
jest.mock("@/lib/requests", () => ({ get: jest.fn() }));
jest.mock("@/components/Notifications", () => ({ emitNotification: jest.fn() }));
jest.mock("@/components/BlockPlayer", () => ({ getBlocks: () => ({ block_chat: false }) }));
jest.mock("@/components/ErrcodeModal", () => ({}));
jest.mock("@/lib/ogsHistory", () => ({}));
jest.mock("@/lib/swal_config", () => ({}));
jest.mock("@/lib/translate", () => ({
    _: (text: string) => text,
    pgettext: (_context: string, text: string) => text,
    interpolate: (text: string) => text,
    moment: () => ({ format: () => "" }),
}));
jest.mock("@/components/Player", () => ({ Player: () => <span>Author</span> }));
jest.mock("@/components/Chat/chat_markup", () => ({
    chat_markup: (text: string) => <span>{text}</span>,
}));
jest.mock("@/lib/profanity_filter", () => ({ profanity_filter: (text: string) => text }));

const position = { game_id: 42, move_number: 17 };
let proxy: ReturnType<typeof chat_manager.join>;
beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    proxy = chat_manager.join("kibitz-test");
});
afterEach(() => {
    proxy.part();
    jest.clearAllTimers();
    jest.useRealTimers();
});

test("keeps the same contextual body in the socket payload and optimistic chat log", () => {
    proxy.channel.send("  hello  world ", position);
    const body = { type: "chat", text: "hello world", ...position };
    expect(socket.send).toHaveBeenCalledWith(
        "chat/send",
        expect.objectContaining({ message: body }),
    );
    expect(proxy.channel.chat_log[0].message.m).toEqual(body);
});

test("leaves ordinary channel text unchanged", () => {
    proxy.channel.send("hello");
    expect(socket.send).toHaveBeenCalledWith(
        "chat/send",
        expect.objectContaining({ message: "hello" }),
    );
});

test("preserves context while splitting long messages", () => {
    proxy.channel.send("word ".repeat(300), position);
    expect(proxy.channel.chat_log.length).toBeGreaterThan(1);
    for (const message of proxy.channel.chat_log) {
        expect(message.message.m).toMatchObject({ type: "chat", ...position });
        expect((message.message.m as { text: string }).text.length).toBeLessThanOrEqual(
            maxMessageLength,
        );
    }
});

test("contextual messages still use flood protection", () => {
    for (let i = 0; i < 6; ++i) {
        proxy.channel.send("hello", position);
    }
    expect(socket.send).toHaveBeenCalledTimes(5);
    expect(proxy.channel.chat_log.filter((message) => !message.system)).toHaveLength(5);
    expect(proxy.channel.chat_log[proxy.channel.chat_log.length - 1]?.system_message_type).toBe(
        "flood",
    );
});

test("received contextual text still triggers mentions and unread state", () => {
    chat_manager.onMessage({
        channel: "kibitz-test",
        id: 8,
        username: "Author",
        ranking: 0,
        professional: false,
        ui_class: "",
        message: {
            i: "remote",
            t: 100,
            m: { type: "chat", text: "Reader, look here", ...position },
        },
    });
    expect(proxy.channel.mentioned).toBe(true);
    expect(proxy.channel.unread_ct).toBe(1);
    expect(emitNotification).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("Reader, look here"),
    );
});

test("contextual /me messages render as normal text and preserve mention styling", () => {
    const line: ChatMessage = {
        channel: "kibitz-test",
        id: 8,
        username: "Author",
        ranking: 0,
        professional: false,
        ui_class: "",
        message: { i: "remote", t: 0, m: { type: "chat", text: "/me greets Reader", ...position } },
    };
    const { container } = render(<ChatLine line={line} showDate={false} />);
    expect(screen.getByText("greets Reader")).toBeInTheDocument();
    expect(container.querySelector(".chat-line")).toHaveClass("third-person", "mentions");
});
