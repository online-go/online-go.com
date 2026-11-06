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
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import "@/lib/data";
import { get } from "@/lib/requests";
import { ReviewsAndDemosTable } from "./ReviewsAndDemosTable";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

function player(id: number, username: string): rest_api.games.Player {
    return {
        id,
        username,
        ranking: 20,
        professional: false,
        country: "un",
        icon: "",
        ui_class: "",
        ratings: { version: 5, overall: { rating: 1500, deviation: 60, volatility: 0.06 } },
    };
}

const review = {
    id: 7,
    name: "a review",
    created: "2026-10-01T12:00:00Z",
    width: 19,
    height: 19,
    black_lost: false,
    white_lost: true,
    players: { black: player(1, "alice"), white: player(2, "bob") },
    game: { id: 55, historical_ratings: {} },
};

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
});

test("a review of a game without historical ratings shows both players", async () => {
    (get as jest.Mock).mockImplementation((url: string) => {
        if (url.startsWith("reviews")) {
            return Promise.resolve({ count: 1, results: [review] });
        }
        return new Promise(() => {});
    });

    render(
        <MemoryRouter>
            <ReviewsAndDemosTable user_id={1} />
        </MemoryRouter>,
    );

    expect(await screen.findByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
    expect(screen.queryByText("[NULL USER]")).toBeNull();
});
