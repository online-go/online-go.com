/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ChatKibitzRoom } from "./ChatKibitzRoom";
import { get } from "@/lib/requests";
import { browserHistory } from "@/lib/ogsHistory";

jest.mock("@/lib/requests", () => ({
    __esModule: true,
    get: jest.fn(),
}));

jest.mock("@/lib/ogsHistory", () => ({
    __esModule: true,
    browserHistory: { push: jest.fn() },
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    interpolate: jest.fn((template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
    ),
    pgettext: jest.fn((_: string, text: string) => text),
}));

jest.mock("@/lib/rank_utils", () => ({
    __esModule: true,
    rankString: jest.fn((player: { ranking: number }) => `${player.ranking}r`),
}));

const mock_get = get as jest.Mock;

const english_room = {
    id: "preset-english-chat-live",
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
});
