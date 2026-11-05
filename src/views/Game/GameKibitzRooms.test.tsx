/*
 * Copyright (C)  Online-Go.com
 *
 * Licensed under the GNU Affero General Public License.
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import { GameKibitzRooms } from "./GameKibitzRooms";
import { browserHistory } from "@/lib/ogsHistory";
import type { KibitzRoomSummary } from "@/models/kibitz";

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
    npgettext: jest.fn((_: string, singular: string, plural: string, count: number) =>
        count === 1 ? singular : plural,
    ),
}));

const room_a: KibitzRoomSummary = {
    id: "user-aaaa",
    channel: "kibitz-user-aaaa",
    title: "A",
    kind: "user",
    viewer_count: 2,
    description: "Post-mortem",
    current_game_id: 42,
};
const room_b: KibitzRoomSummary = {
    id: "user-bbbb",
    channel: "kibitz-user-bbbb",
    title: "B",
    kind: "user",
    viewer_count: 5,
    current_game_id: 42,
};

describe("GameKibitzRooms", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("renders nothing with no rooms", () => {
        const { container } = render(<GameKibitzRooms rooms={[]} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders one card per room in the given order", () => {
        render(<GameKibitzRooms rooms={[room_b, room_a]} />);
        const titles = screen
            .getAllByRole("button")
            .map((button) => button.querySelector(".room-title")?.textContent);
        expect(titles).toEqual(["B", "A"]);
        expect(screen.getByText("Kibitz")).toBeInTheDocument();
    });

    it("shows the description and viewer count", () => {
        render(<GameKibitzRooms rooms={[room_a]} />);
        expect(screen.getByText("Post-mortem")).toBeInTheDocument();
        const count = document.querySelector(".room-viewer-count");
        expect(count).toHaveAttribute("title", "2 people here");
        expect(count).toHaveTextContent("2");
    });

    it("omits the description line when the room has none", () => {
        render(<GameKibitzRooms rooms={[room_b]} />);
        expect(document.querySelector(".room-live-line")).toBeNull();
    });

    it("navigates to the room on click", () => {
        render(<GameKibitzRooms rooms={[room_a, room_b]} />);
        screen.getAllByRole("button")[0].click();
        expect(browserHistory.push).toHaveBeenCalledWith("/kibitz/user-aaaa");
    });
});
