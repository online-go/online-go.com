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
import { PlayerAutocomplete } from "./PlayerAutocomplete";
import * as player_cache from "@/lib/player_cache";

jest.mock("@/lib/player_cache", () => ({
    lookup: jest.fn(),
    lookup_by_username: jest.fn(),
    update: jest.fn(),
    fetch: jest.fn(),
}));
jest.mock("@/lib/requests", () => ({ get: jest.fn(), abort_requests_in_flight: jest.fn() }));
jest.mock("@/lib/translate", () => ({ _: (text: string) => text }));

const lookup = player_cache.lookup as jest.Mock;
const fetchPlayer = player_cache.fetch as jest.Mock;

describe("PlayerAutocomplete", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("shows the cached username for the given player id", () => {
        lookup.mockReturnValue({ id: 5, username: "cached" });

        render(<PlayerAutocomplete onComplete={jest.fn()} playerId={5} />);

        expect(screen.getByPlaceholderText("Player name")).toHaveValue("cached");
        expect(fetchPlayer).not.toHaveBeenCalled();
    });

    test("fetches and shows the username when the player id is not cached", async () => {
        lookup.mockReturnValue(null);
        fetchPlayer.mockResolvedValue({ id: 7, username: "fetched" });

        render(<PlayerAutocomplete onComplete={jest.fn()} playerId={7} />);

        expect(fetchPlayer).toHaveBeenCalledWith(7);
        expect(await screen.findByDisplayValue("fetched")).toBeInTheDocument();
    });

    test("does not fetch when no player id is given", () => {
        lookup.mockReturnValue(null);

        render(<PlayerAutocomplete onComplete={jest.fn()} />);

        expect(screen.getByPlaceholderText("Player name")).toHaveValue("");
        expect(fetchPlayer).not.toHaveBeenCalled();
    });
});
