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
import { fireEvent, render, screen } from "@testing-library/react";
import type { ChatMessage } from "@/lib/chat_manager";
import type { KibitzRoomSummary, KibitzStreamItem, KibitzVariationSummary } from "@/models/kibitz";
import { KibitzSharedStreamPanel } from "./KibitzSharedStreamPanel";

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
    ChatLine: ({ line }: { line: ChatMessage }) => (
        <div data-testid="chat-line">
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

jest.mock("@/components/GobanView", () => ({
    __esModule: true,
    useGobanControllerOrNull: () => null,
}));

jest.mock("@/lib/chat_manager", () => ({
    __esModule: true,
    cachedChannelInformation: () => null,
    chat_manager: {
        join: jest.fn(() => mockRoomProxy),
    },
}));

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

jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({
    __esModule: true,
    useKibitzHelpTarget: () => null,
}));

jest.mock("./kibitzVariationQuickList", () => ({
    __esModule: true,
    formatVariationBranchLabel: () => "Main branch",
    formatVariationLengthLabel: () => "18 moves",
}));

jest.mock("./KibitzSharedStreamPanel.css", () => ({}));
jest.mock("@/components/Chat/ChatLog.css", () => ({}));

function makeRoom(): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "room-1",
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

describe("KibitzSharedStreamPanel variation posts", () => {
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
            <KibitzSharedStreamPanel
                mode="live"
                room={makeRoom()}
                items={[
                    makeItem(),
                    makeChatItem("room-chat-1", "room-stream", "Room hello"),
                    makeChatItem("game-chat-1", "game-chat", "Game hello"),
                ]}
                variations={[makeVariation()]}
                onOpenVariation={onOpenVariation}
                onSendMessage={jest.fn()}
                isMobileLayout={false}
            />,
        );

        const chatTimes = container.querySelectorAll(".kibitz-chat-entry time");
        expect(chatTimes).toHaveLength(2);

        const time = container.querySelector(".variation-post-time");
        expect(time).not.toBeNull();
        expect(time?.tagName).toBe("TIME");

        expect(screen.getByText("Game chat")).toBeInTheDocument();
        expect(screen.getByText("Kibitz chat")).toBeInTheDocument();

        const row = time?.closest(".variation-post-entry");
        expect(row).not.toBeNull();
        expect(row).toHaveAttribute("data-variation-id", "variation-1");

        const button = screen.getByRole("button", {
            name: "Study line - Alice - Posted variation - Main branch - 18 moves",
        });
        expect(button).toHaveClass("variation-post");
        expect(button).not.toHaveTextContent(/\d{2}:\d{2}/);

        fireEvent.click(button);
        expect(onOpenVariation).toHaveBeenCalledWith("variation-1", true);
    });

    it("renders the mobile switch labels with the updated wording", () => {
        render(
            <KibitzSharedStreamPanel
                mode="live"
                room={makeRoom()}
                items={[]}
                variations={[]}
                onOpenVariation={jest.fn()}
                onSendMessage={jest.fn()}
                isMobileLayout={true}
            />,
        );

        expect(screen.getByText("Kibitz chat")).toBeInTheDocument();
        expect(screen.getByText("Game chat")).toBeInTheDocument();
    });
});
