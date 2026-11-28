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
import { render, screen, waitFor } from "@testing-library/react";

import * as data from "@/lib/data";
import { get } from "@/lib/requests";
import { Report } from "./Report";

// jest.mock is hoisted above the imports, so `get` is already the mock by the time
// the module body runs.
jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
    post: jest.fn(),
    api1: (url: string) => url,
}));

// The player cache batches requests through the socket layer; the dialog only
// needs a name for the accused, and the icon beside it is not under test.
jest.mock("@/lib/player_cache", () => ({
    lookup: () => undefined,
    fetch: () => Promise.resolve({ username: "accused" }),
}));
jest.mock("@/components/PlayerIcon", () => ({
    PlayerIcon: () => null,
}));

// BlockPlayer pulls in the config cache, whose refresh would answer the mocked
// `get` and overwrite the user. The dialog only blocks on harassment reports.
jest.mock("@/components/BlockPlayer", () => ({
    player_is_ignored: () => false,
    setIgnore: jest.fn(),
}));

const mockGet = get as unknown as jest.Mock;

const ME = { anonymous: false, id: 123, username: "me", is_moderator: false, moderator_powers: 0 };
const ACCUSED = 7;
const OPPONENT = 99;
const GAME = 65;

/** A finished game the accused won, so only Sandbagging is offered. */
const ACCUSED_WON = {
    outcome: "Resignation",
    winner: ACCUSED,
    phase: "finished",
    moves: [1, 2, 3],
    black_player_id: ACCUSED,
    white_player_id: OPPONENT,
};

beforeEach(() => {
    data.set("user", ME as unknown as rest_api.UserConfig);
    mockGet.mockReset();
    mockGet.mockImplementation((url: string) =>
        url === `/termination-api/game/${GAME}`
            ? Promise.resolve(ACCUSED_WON)
            : Promise.resolve({}),
    );
});

function typePicker(): HTMLSelectElement {
    return screen.getByRole("combobox") as HTMLSelectElement;
}

function offeredTypes(): string[] {
    return Array.from(typePicker().options)
        .map((o) => o.value)
        .filter((v) => v !== "");
}

test("offers Sandbagging, not Thrown Game, when the accused won", async () => {
    render(<Report reported_user_id={ACCUSED} reported_game_id={GAME} />);

    await waitFor(() => expect(offeredTypes()).toContain("sandbagging_assessment"));
    expect(offeredTypes()).not.toContain("thrown_game");
    expect(offeredTypes()).not.toContain("sandbagging");
});

test("a preset type the dialog does not offer counts as no selection", async () => {
    render(<Report reported_user_id={ACCUSED} reported_game_id={GAME} report_type="thrown_game" />);

    await waitFor(() => expect(offeredTypes()).toContain("sandbagging_assessment"));
    await waitFor(() => expect(typePicker().value).toBe(""));
    expect(screen.getByRole("button", { name: "Report User" })).toBeDisabled();
});

test("a preset type the dialog does offer survives the wait for the game data", async () => {
    render(
        <Report
            reported_user_id={ACCUSED}
            reported_game_id={GAME}
            report_type="sandbagging_assessment"
        />,
    );

    await waitFor(() => expect(offeredTypes()).toContain("sandbagging_assessment"));
    expect(typePicker().value).toBe("sandbagging_assessment");
});
