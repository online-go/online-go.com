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
import { KibitzPresence } from "./KibitzPresence";
import * as player_cache from "@/lib/player_cache";
import type { KibitzRoomSummary, KibitzRoomUser } from "@/models/kibitz";

jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user: { username?: string } }) => (
        <span className="Player">{`player:${user.username ?? ""}`}</span>
    ),
}));

jest.mock("./KibitzUserAvatar", () => ({
    __esModule: true,
    KibitzUserAvatar: ({ user }: { user: { username?: string } }) => (
        <span className="KibitzUserAvatar">{`avatar:${user.username ?? ""}`}</span>
    ),
}));

jest.mock("@/lib/player_cache", () => ({
    __esModule: true,
    default: {},
    lookup: jest.fn(),
    fetch: jest.fn(),
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

const mockedPlayerCache = player_cache as jest.Mocked<typeof player_cache>;

function makeRoom(overrides?: Partial<KibitzRoomSummary>): KibitzRoomSummary {
    return {
        id: "room-1",
        channel: "channel-1",
        title: "Room 1",
        kind: "preset",
        viewer_count: 1,
        description: "Room description",
        creator_id: 1,
        ...overrides,
    };
}

function makeUser(id: number, username: string): KibitzRoomUser {
    return {
        id,
        username,
        ranking: 0,
        professional: false,
        ui_class: "",
    };
}

describe("KibitzPresence", () => {
    beforeEach(() => {
        mockedPlayerCache.lookup.mockReset();
        mockedPlayerCache.fetch.mockReset();
        mockedPlayerCache.lookup.mockReturnValue(null);
    });

    it("renders the owner as a separate section from the live room roster", async () => {
        mockedPlayerCache.fetch.mockResolvedValue({
            id: 1,
            username: "Owner",
            ranking: 0,
            pro: false,
            ui_class: "",
        });

        render(<KibitzPresence room={makeRoom()} users={[makeUser(2, "CurrentUser")]} />);

        expect(screen.getByText("In the room · 1 watching")).toBeInTheDocument();

        const roomRegion = screen.getByRole("region", { name: "In the room" });

        const rows = roomRegion.querySelectorAll(".presence-user");
        expect(rows).toHaveLength(2);

        expect(rows[0]).toHaveTextContent("avatar:Owner");
        expect(rows[0]).toHaveTextContent("player:Owner");
        expect(rows[0]).toHaveTextContent("owner");
        expect(rows[0]).toHaveTextContent("away");

        expect(rows[1]).toHaveTextContent("avatar:CurrentUser");
        expect(rows[1]).toHaveTextContent("player:CurrentUser");
    });
});
