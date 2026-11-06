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
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import * as data from "@/lib/data";
import { get, post } from "@/lib/requests";
import { GameHistoryTable } from "./GameHistoryTable";

jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
    post: jest.fn(),
}));

jest.mock("@/components/MiniGoban", () => ({
    __esModule: true,
    MiniGoban: () => null,
}));

jest.mock("@/views/Game", () => ({
    GameChat: () => null,
    GobanControllerContext: jest.requireActual<typeof import("react")>("react").createContext(null),
}));

jest.mock("@/components/AIReview", () => ({
    AIReview: () => null,
}));

const TEST_USER = {
    anonymous: false,
    id: 123,
    username: "test_user",
    registration_date: "2022-05-10 11:03:24.299562+00:00",
    ratings: {
        version: 5,
        overall: { rating: 1500, deviation: 350, volatility: 0.06 },
    },
    country: "un",
    professional: false,
    ranking: 23,
    provisional: 0,
    can_create_tournaments: true,
    is_moderator: false,
    is_superuser: false,
    moderator_powers: 0,
    offered_moderator_powers: 0,
    is_tournament_moderator: false,
    supporter: true,
    supporter_level: 4,
    tournament_admin: false,
    ui_class: "",
    icon: "",
    email: "",
    email_validated: false,
    is_announcer: false,
    last_supporter_trial: "",
} as const;

function player(id: number, username: string, rating: number): rest_api.games.Player {
    return {
        id,
        username,
        ranking: 20,
        professional: false,
        country: "un",
        icon: "",
        ui_class: "",
        ratings: { version: 5, overall: { rating, deviation: 60, volatility: 0.06 } },
    };
}

const alice = player(1, "alice", 1800);
const bob = player(2, "bob", 1500);
const carol = player(3, "carol", 1500);
const dave = player(5, "dave", 1500);
const erin = player(6, "erin", 1500);

function game(fields: Partial<rest_api.Game>): rest_api.Game {
    return {
        name: `game ${fields.id}`,
        width: 19,
        height: 19,
        handicap: 0,
        annulled: false,
        black_lost: false,
        white_lost: true,
        outcome: "Resignation",
        ended: "2026-10-01T12:00:00Z",
        time_per_move: 30,
        time_control_parameters: null,
        flags: null,
        bot_detection_results: null,
        rengo: false,
        ...fields,
    } as unknown as rest_api.Game;
}

const healthy = game({
    id: 101,
    ranked: true,
    players: { black: alice, white: bob },
    historical_ratings: { black: alice, white: bob },
});

const degraded = game({
    id: 102,
    ranked: true,
    players: { black: alice, white: carol },
    historical_ratings: {} as rest_api.Game["historical_ratings"],
});

const degraded_rengo = game({
    id: 103,
    ranked: false,
    rengo: true,
    rengo_black_team: [5, 1],
    rengo_white_team: [6, 7],
    players: { black: dave, white: erin },
    historical_ratings: {} as rest_api.Game["historical_ratings"],
});

function serveGameHistory(results: rest_api.Game[]) {
    (get as jest.Mock).mockImplementation((url: string) => {
        if (url.startsWith("players/1/game_history")) {
            return Promise.resolve({ count: results.length, results });
        }
        return new Promise(() => {});
    });
}

function rowContaining(element: HTMLElement): HTMLTableRowElement {
    const row = element.closest("tr");
    if (!row) {
        throw new Error("element is not in a table row");
    }
    return row;
}

function renderTable() {
    return render(
        <MemoryRouter>
            <GameHistoryTable user_id={1} username="alice" />
        </MemoryRouter>,
    );
}

afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    jest.restoreAllMocks();
});

test("a game without historical ratings shows its opponent and result, but no rank", async () => {
    data.set("user", { ...TEST_USER, id: 1, username: "alice" });
    serveGameHistory([healthy, degraded]);

    const { container } = renderTable();

    const degraded_row = rowContaining(await screen.findByText("carol"));
    const healthy_row = rowContaining(screen.getByText("bob"));

    expect(container.querySelector("td.library-won-result-vs-weaker")).not.toBeNull();
    expect(container.querySelector("td.library-won-result-unranked")).not.toBeNull();
    expect(healthy_row.querySelector("td.user_info")?.textContent).toContain("[");
    expect(degraded_row.querySelector("td.user_info")?.textContent).not.toContain("[");
});

test("a moderator can mass annul from a rengo game without historical ratings", async () => {
    data.set("user", { ...TEST_USER, id: 99, username: "mod", is_moderator: true });
    serveGameHistory([degraded_rengo, healthy]);
    (post as jest.Mock).mockResolvedValue({ done: [101], failed: [] });
    const prompt = jest.spyOn(window, "prompt").mockReturnValue("test note");

    renderTable();

    const rengo_row = rowContaining(await screen.findByText("2 vs. 2"));
    const healthy_row = rowContaining(screen.getByText("bob"));

    fireEvent.click(screen.getByRole("button", { name: "Select" }));
    fireEvent.mouseUp(rengo_row);
    fireEvent.mouseUp(healthy_row);
    fireEvent.click(await screen.findByRole("button", { name: "View Queue (2)" }));
    fireEvent.click(await screen.findByRole("button", { name: "Annul Games(1)" }));

    expect(prompt).toHaveBeenCalledWith(expect.stringContaining("alice's games"));
    await waitFor(() => {
        expect(post).toHaveBeenCalledWith("moderation/annul", {
            games: [101],
            annul: true,
            moderation_note: "player 1 mass annul: test note",
        });
    });
});
