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
import { fireEvent, render, screen } from "@testing-library/react";
import type { KibitzRoomSummary, KibitzRoomUser, KibitzVariationSummary } from "@/models/kibitz";
import type { KibitzChatPanelProps } from "./KibitzChatPanel";
import type { KibitzLeftAsideProps } from "./KibitzLeftAside";
import type { KibitzPortraitPane } from "./kibitzPortraitPane";
import { KibitzPortraitPanes } from "./KibitzPortraitPanes";
import { KIBITZ_PORTRAIT_PANES } from "./kibitzPortraitPane";

const mounts: string[] = [];

jest.mock("./KibitzChatPanel", () => ({
    __esModule: true,
    KibitzChatPanel: ({
        mode,
        visible,
        onUnreadChange,
    }: {
        mode: string;
        visible: boolean;
        onUnreadChange?: (unread: { room: boolean; game: boolean }) => void;
    }) => {
        React.useEffect(() => {
            mounts.push(mode);
        }, [mode]);
        return (
            <div data-testid={`chat-${mode}`} data-visible={visible ? "yes" : "no"}>
                <button
                    type="button"
                    data-testid={`unread-${mode}-all`}
                    onClick={() => onUnreadChange?.({ room: true, game: true })}
                />
                <button
                    type="button"
                    data-testid={`unread-${mode}-none`}
                    onClick={() => onUnreadChange?.({ room: false, game: false })}
                />
            </div>
        );
    },
}));

jest.mock("@/components/ChatUserList", () => ({
    __esModule: true,
    ChatUserList: ({ channel }: { channel: string }) => {
        React.useEffect(() => {
            mounts.push(`people-${channel}`);
        }, [channel]);
        return <div data-testid="people" />;
    },
}));

jest.mock("./KibitzRoomList", () => ({
    __esModule: true,
    KibitzRoomList: () => <div data-testid="rooms" />,
}));

jest.mock("./KibitzVariationList", () => ({
    __esModule: true,
    KibitzVariationList: ({ variations }: { variations: KibitzVariationSummary[] }) => (
        <div data-testid="variations" data-count={variations.length} />
    ),
}));

jest.mock("./KibitzMiniMainBoard", () => ({
    __esModule: true,
    KibitzMiniMainBoard: () => <div data-testid="mini-board" />,
}));

function makeUser(id: number, username: string): KibitzRoomUser {
    return { id, username, ranking: 1, professional: false, ui_class: "" };
}

function makeVariation(id: string): KibitzVariationSummary {
    return {
        id,
        room_id: "room-1",
        game_id: 10,
        creator: makeUser(1, "alice"),
        created_at: 0,
        viewer_count: 0,
        current_viewers: [],
        title: id,
        analysis_from: 87,
        move_count: 5,
    };
}

function makeRoom(): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "kibitz-room-1",
        title: "Room 1",
        kind: "preset",
        viewer_count: 0,
    };
}

function props(active: KibitzPortraitPane): React.ComponentProps<typeof KibitzPortraitPanes> {
    const chat: KibitzChatPanelProps = {
        room: makeRoom(),
        items: [],
        variations: [makeVariation("v1")],
        onOpenVariation: jest.fn(),
        gameController: null,
        variationColorIndexes: {},
        showPeople: false,
    };
    const leftAside: KibitzLeftAsideProps = {
        rooms: [makeRoom()],
        activeRoomId: "room-1",
        blockedRoomIds: new Set(),
        onSelectRoom: jest.fn(),
        canOpenCreateRoomFlow: false,
        signInHref: "/sign-in",
        variations: [makeVariation("v1")],
        currentGameId: 10,
        variationGameById: new Map(),
        selectedVariationId: null,
        variationFocusRequestId: 0,
        blockedVariationFlashId: null,
        onRecallVariation: jest.fn(),
        onHideVariation: jest.fn(),
        variationColorIndexes: {},
        miniBoardController: null,
        onExitVariation: jest.fn(),
    };

    return { active, chat, leftAside, roomChannel: "kibitz-room-1", analysis: null };
}

describe("KibitzPortraitPanes", () => {
    beforeEach(() => {
        mounts.length = 0;
    });

    test("keeps every pane mounted when the active pane changes", () => {
        const { rerender } = render(<KibitzPortraitPanes {...props("room-chat")} />);
        expect(mounts).toEqual(["game", "room", "people-kibitz-room-1"]);

        rerender(<KibitzPortraitPanes {...props("people")} />);

        // No remount: switching panes must not re-join the chat channel.
        expect(mounts).toEqual(["game", "room", "people-kibitz-room-1"]);
        expect(screen.getByTestId("chat-game")).toBeInTheDocument();
        expect(screen.getByTestId("chat-room")).toBeInTheDocument();
        expect(screen.getByTestId("variations")).toBeInTheDocument();
        expect(screen.getByTestId("rooms")).toBeInTheDocument();
    });

    test("hides the panes that are not active", () => {
        const { container } = render(<KibitzPortraitPanes {...props("variations")} />);
        const panes = [...container.querySelectorAll(".KibitzPortraitPanes-pane")];
        expect(panes).toHaveLength(KIBITZ_PORTRAIT_PANES.length);
        const shown = panes.filter((pane) => !pane.hasAttribute("hidden"));
        expect(shown).toHaveLength(1);
        expect(shown[0].querySelector("[data-testid='variations']")).not.toBeNull();
    });

    test("takes each unread flag from the panel that shows that chat", () => {
        const onUnreadChange = jest.fn();
        const base = props("room-chat");
        render(<KibitzPortraitPanes {...base} chat={{ ...base.chat, onUnreadChange }} />);

        // The game panel calls both chats unread. Only its answer for the
        // game chat counts: it never shows the room chat.
        fireEvent.click(screen.getByTestId("unread-game-all"));
        expect(onUnreadChange).toHaveBeenLastCalledWith({ room: false, game: true });

        fireEvent.click(screen.getByTestId("unread-room-all"));
        expect(onUnreadChange).toHaveBeenLastCalledWith({ room: true, game: true });

        // And the game panel cannot clear the room's dot either.
        fireEvent.click(screen.getByTestId("unread-game-none"));
        expect(onUnreadChange).toHaveBeenLastCalledWith({ room: true, game: false });
    });

    test("tells the chat panel of the active pane that it is visible", () => {
        const { rerender } = render(<KibitzPortraitPanes {...props("game-chat")} />);
        expect(screen.getByTestId("chat-game")).toHaveAttribute("data-visible", "yes");
        expect(screen.getByTestId("chat-room")).toHaveAttribute("data-visible", "no");

        rerender(<KibitzPortraitPanes {...props("room-chat")} />);
        expect(screen.getByTestId("chat-game")).toHaveAttribute("data-visible", "no");
        expect(screen.getByTestId("chat-room")).toHaveAttribute("data-visible", "yes");
    });
});

test("the analysis pane shows the variation panel when there is one", () => {
    const { container } = render(
        <KibitzPortraitPanes
            {...props("analysis")}
            analysis={<div data-testid="variation-panel" />}
        />,
    );
    const shown = [...container.querySelectorAll(".KibitzPortraitPanes-pane")].filter(
        (pane) => !pane.hasAttribute("hidden"),
    );
    expect(shown).toHaveLength(1);
    expect(shown[0].querySelector("[data-testid='variation-panel']")).not.toBeNull();
});

test("the analysis pane explains itself when there is no variation", () => {
    const { container } = render(<KibitzPortraitPanes {...props("analysis")} analysis={null} />);
    const shown = [...container.querySelectorAll(".KibitzPortraitPanes-pane")].filter(
        (pane) => !pane.hasAttribute("hidden"),
    );
    expect(shown[0].querySelector(".KibitzPortraitPanes-empty")).not.toBeNull();
});

test("the rooms pane has no mini board: the thumbnail is landscape only", () => {
    const fixture = props("rooms");
    const { container } = render(
        <KibitzPortraitPanes
            {...fixture}
            leftAside={{
                ...fixture.leftAside,
                miniBoardController: {} as KibitzLeftAsideProps["miniBoardController"],
            }}
        />,
    );
    expect(container.querySelector("[data-testid='mini-board']")).toBeNull();
    expect(container.querySelector("[data-testid='rooms']")).not.toBeNull();
});
