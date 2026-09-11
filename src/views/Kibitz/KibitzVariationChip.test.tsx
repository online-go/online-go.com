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
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { KibitzVariationSummary } from "@/models/kibitz";
import { KibitzVariationChip } from "./KibitzVariationChip";

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user?: { username?: string } }) => (
        <span data-testid="Player">{user?.username ?? ""}</span>
    ),
}));

jest.mock("@/lib/translate", () => ({
    __esModule: true,
    pgettext: (_context: string, text: string) => text,
    interpolate: (template: string, values: Record<string, string | number>) =>
        Object.entries(values).reduce(
            (result, [key, value]) => result.replace(`{{${key}}}`, String(value)),
            template,
        ),
}));

const variation: KibitzVariationSummary = {
    id: "v1",
    room_id: "room-1",
    game_id: 100,
    creator: { id: 1, username: "alice", ranking: 0, professional: false, ui_class: "" },
    created_at: 0,
    viewer_count: 0,
    current_viewers: [],
    title: "Tenuki instead",
};

test("names the variation and its author", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={null}
        />,
    );
    expect(screen.getByText("Tenuki instead")).toBeInTheDocument();
    expect(screen.getByTestId("Player")).toHaveTextContent("alice");
});

test("shows the variation's colour", () => {
    const { container } = render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={null}
        />,
    );
    expect(
        container.querySelector(".KibitzVariationSwatch")?.getAttribute("data-color-index"),
    ).toBe("1");
});

test("says which game an older variation belongs to", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={{
                game_id: 42,
                board_size: "19x19",
                title: "Round 3",
                black: { id: 1, username: "b", ranking: 0, professional: false, ui_class: "" },
                white: { id: 2, username: "w", ranking: 0, professional: false, ui_class: "" },
            }}
        />,
    );
    expect(screen.getByText(/Round 3/)).toBeInTheDocument();
});

test("labels a draft rather than naming it", () => {
    render(
        <KibitzVariationChip mode="draft" variation={null} colorIndex={null} otherGame={null} />,
    );
    expect(screen.getByText("New variation")).toBeInTheDocument();
});

test("falls back for an untitled variation", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={{ ...variation, title: undefined }}
            colorIndex={0}
            otherGame={null}
        />,
    );
    expect(screen.getByText("Untitled variation")).toBeInTheDocument();
});

test("the close button leaves the variation", async () => {
    const onClose = jest.fn();
    render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={null}
            onClose={onClose}
        />,
    );
    await userEvent.click(screen.getByLabelText("Back to game"));
    expect(onClose).toHaveBeenCalledTimes(1);
});

test("no close button when there is nowhere to go back to", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={null}
        />,
    );
    expect(screen.queryByLabelText("Back to game")).toBeNull();
});
