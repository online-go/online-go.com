/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { ChatKibitzRoom } from "./ChatKibitzRoom";
import { get } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";
import { push_manager } from "@/components/UIPush/UIPush";

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    get: jest.fn(),
}));

jest.mock("@/lib/ogsHistory", () => ({
    __esModule: true,
    browserHistory: { push: jest.fn() },
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

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
    npgettext: jest.fn((_: string, singular: string, plural: string, count: number) =>
        count === 1 ? singular : plural,
    ),
}));

jest.mock("@/lib/rank_utils", () => ({
    __esModule: true,
    rankString: jest.fn((player: { ranking: number }) => `${player.ranking}r`),
}));

const mock_get = get as jest.Mock;

const english_room = {
    id: "preset-english-chat-live",
    channel: "kibitz-preset-english-chat-live",
    title: "English chat game",
    description: "A top live game, preferring games played by members of the English chat.",
    viewer_count: 7,
    preset: { preset_key: "english-chat-live" },
    current_game: {
        black: { username: "alice", ranking: 35, professional: false },
        white: { username: "bob", ranking: 33, professional: false },
    },
};

function mockBackend(options?: { show_in_nav?: boolean; rooms?: unknown[] }): void {
    mock_get.mockImplementation((url: string) => {
        if (url === "kibitz/nav-config") {
            return Promise.resolve({ show_in_nav: options?.show_in_nav ?? true });
        }
        if (url === "kibitz/directory") {
            return Promise.resolve(options?.rooms ?? [english_room]);
        }
        return Promise.reject(new Error(`unexpected get: ${url}`));
    });
}

describe("ChatKibitzRoom", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders nothing for a channel with no mapped kibitz room", () => {
        mockBackend();
        const { container } = render(<ChatKibitzRoom channel="global-francais" />);
        expect(container).toBeEmptyDOMElement();
        expect(mock_get).not.toHaveBeenCalled();
    });

    it("renders nothing when kibitz is nav-disabled", async () => {
        mockBackend({ show_in_nav: false });
        const { container } = render(<ChatKibitzRoom channel="global-english" />);
        await waitFor(() => expect(mock_get).toHaveBeenCalledWith("kibitz/nav-config"));
        expect(container).toBeEmptyDOMElement();
    });

    it("shows the room card with the current matchup and viewer count", async () => {
        mockBackend();
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        const matchup = document.querySelector(".room-matchup");
        expect(matchup).toHaveTextContent("alice[35r]vsbob[33r]");
        expect(matchup).toHaveAttribute("title", "alice [35r] vs bob [33r]");
        expect(screen.getByText("7")).toBeInTheDocument();
        expect(document.querySelector(".room-viewer-count")).toHaveAttribute(
            "title",
            "7 people here",
        );
    });

    it("uses the singular viewer count tooltip for one viewer", async () => {
        mockBackend({ rooms: [{ ...english_room, viewer_count: 1 }] });
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        expect(document.querySelector(".room-viewer-count")).toHaveAttribute(
            "title",
            "1 person here",
        );
    });

    it("falls back to the room description when there is no current game", async () => {
        mockBackend({ rooms: [{ ...english_room, current_game: null }] });
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        expect(screen.getByText(english_room.description)).toBeInTheDocument();
    });

    it("renders nothing when the directory has no matching room", async () => {
        mockBackend({ rooms: [{ ...english_room, preset: { preset_key: "fast-live" } }] });
        const { container } = render(<ChatKibitzRoom channel="global-english" />);
        await waitFor(() => expect(mock_get).toHaveBeenCalledWith("kibitz/directory"));
        expect(container).toBeEmptyDOMElement();
    });

    it("navigates to the room when the card is clicked", async () => {
        mockBackend();
        render(<ChatKibitzRoom channel="global-english" />);
        const card = await screen.findByRole("button");
        card.click();
        expect(browserHistory.push).toHaveBeenCalledWith("/kibitz/preset-english-chat-live");
    });

    it("subscribes to the directory push channel only", async () => {
        mockBackend();
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        expect(mock_push_manager.subscribe).toHaveBeenCalledWith("kibitz-rooms");
        expect(mock_push_manager.subscribe).not.toHaveBeenCalledWith(
            "kibitz-preset-english-chat-live",
        );
    });

    it("subscribes to the directory even when the first fetch finds no room", async () => {
        mockBackend({ rooms: [] });
        const { container } = render(<ChatKibitzRoom channel="global-english" />);
        await waitFor(() => expect(mock_get).toHaveBeenCalledWith("kibitz/directory"));
        expect(mock_push_manager.subscribe).toHaveBeenCalledWith("kibitz-rooms");
        expect(container).toBeEmptyDOMElement();
    });

    it("shows the card when a matching room-created push arrives after an empty fetch", async () => {
        mockBackend({ rooms: [] });
        render(<ChatKibitzRoom channel="global-english" />);
        await waitFor(() => expect(mock_get).toHaveBeenCalledWith("kibitz/directory"));
        act(() => {
            mock_push_manager.fire("room-created", english_room);
        });
        expect(await screen.findByText("English chat game")).toBeInTheDocument();
    });

    it("ignores room-created pushes for other presets", async () => {
        mockBackend({ rooms: [] });
        const { container } = render(<ChatKibitzRoom channel="global-english" />);
        await waitFor(() => expect(mock_get).toHaveBeenCalledWith("kibitz/directory"));
        act(() => {
            mock_push_manager.fire("room-created", {
                ...english_room,
                id: "preset-fast-live",
                preset: { preset_key: "fast-live" },
            });
        });
        expect(container).toBeEmptyDOMElement();
    });

    it("hides the card on room-removed and shows it again when the room is recreated", async () => {
        mockBackend();
        const { container } = render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        act(() => {
            mock_push_manager.fire("room-removed", {
                id: english_room.id,
                channel: english_room.channel,
            });
        });
        expect(container).toBeEmptyDOMElement();
        act(() => {
            mock_push_manager.fire("room-created", english_room);
        });
        expect(await screen.findByText("English chat game")).toBeInTheDocument();
    });

    it("shows the card again from a rooms-refresh push after it was removed", async () => {
        mockBackend();
        const { container } = render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        act(() => {
            mock_push_manager.fire("room-removed", {
                id: english_room.id,
                channel: english_room.channel,
            });
        });
        expect(container).toBeEmptyDOMElement();
        act(() => {
            mock_push_manager.fire("rooms-refresh", undefined);
        });
        expect(await screen.findByText("English chat game")).toBeInTheDocument();
    });

    it("updates the matchup from a room-updated push", async () => {
        mockBackend();
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        act(() => {
            mock_push_manager.fire("room-updated", {
                ...english_room,
                current_game: {
                    black: { username: "carol", ranking: 20, professional: false },
                    white: { username: "dave", ranking: 21, professional: false },
                },
            });
        });
        expect(document.querySelector(".room-matchup")).toHaveTextContent("carol[20r]vsdave[21r]");
    });

    it("ignores room-updated pushes for other rooms", async () => {
        mockBackend();
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        act(() => {
            mock_push_manager.fire("room-updated", {
                ...english_room,
                id: "preset-fast-live",
                channel: "kibitz-preset-fast-live",
                preset: { preset_key: "fast-live" },
                current_game: {
                    black: { username: "carol", ranking: 20, professional: false },
                    white: { username: "dave", ranking: 21, professional: false },
                },
            });
        });
        expect(document.querySelector(".room-matchup")).toHaveTextContent("alice[35r]vsbob[33r]");
    });

    it("updates the viewer count from a viewer-count-changed push", async () => {
        mockBackend();
        render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        act(() => {
            mock_push_manager.fire("viewer-count-changed", {
                channel: "kibitz-preset-english-chat-live",
                viewer_count: 12,
            });
        });
        expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("unsubscribes from the directory push channel on unmount", async () => {
        mockBackend();
        const { unmount } = render(<ChatKibitzRoom channel="global-english" />);
        await screen.findByText("English chat game");
        unmount();
        expect(mock_push_manager.unsubscribe).toHaveBeenCalledWith("kibitz-rooms");
    });
});
