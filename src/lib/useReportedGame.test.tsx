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

import { renderHook, waitFor, act } from "@testing-library/react";

import { get } from "@/lib/requests";
import { useReportedGame } from "@/lib/useReportedGame";

// jest.mock is hoisted above the imports, so `get` is already the mock by the time
// the module body runs.
jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
}));

const mockGet = get as unknown as jest.Mock;

const GAMEDATA = {
    outcome: "",
    winner: 0,
    phase: "finished",
    moves: [1, 2, 3],
    black_player_id: 1,
    white_player_id: 2,
};

beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue(GAMEDATA);
});

test("pending until the fetch resolves, then ready with the game data", async () => {
    const { result } = renderHook(() => useReportedGame(1));

    expect(result.current.reported_game).toEqual({ state: "pending" });

    await waitFor(() =>
        expect(result.current.reported_game).toEqual({ state: "ready", gamedata: GAMEDATA }),
    );
    expect(mockGet).toHaveBeenCalledWith("/termination-api/game/1");
});

test("the dialog's fetch and a check's fetch are one request", async () => {
    const { result } = renderHook(() => useReportedGame(1));

    await waitFor(() => expect(result.current.reported_game.state).toBe("ready"));
    await expect(result.current.fetchGamedata()).resolves.toEqual(GAMEDATA);

    expect(mockGet).toHaveBeenCalledTimes(1);
});

test("no game id: nothing is fetched and fetchGamedata rejects", async () => {
    const { result } = renderHook(() => useReportedGame(undefined));

    expect(result.current.reported_game).toEqual({ state: "none" });
    await expect(result.current.fetchGamedata()).rejects.toThrow();
    expect(mockGet).not.toHaveBeenCalled();
});

test("a failed fetch is unavailable, and the next call retries instead of re-serving the rejection", async () => {
    mockGet.mockRejectedValueOnce(new Error("network"));

    const { result } = renderHook(() => useReportedGame(1));

    await waitFor(() => expect(result.current.reported_game).toEqual({ state: "unavailable" }));

    await expect(result.current.fetchGamedata()).resolves.toEqual(GAMEDATA);
    expect(mockGet).toHaveBeenCalledTimes(2);
});

test("a late response for a previous game is discarded", async () => {
    let resolveFirst: (v: unknown) => void = () => undefined;
    mockGet.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                resolveFirst = resolve;
            }),
    );
    mockGet.mockResolvedValueOnce(GAMEDATA);

    const { result, rerender } = renderHook(
        ({ game_id }: { game_id: number }) => useReportedGame(game_id),
        { initialProps: { game_id: 1 } },
    );

    rerender({ game_id: 2 });
    await waitFor(() => expect(result.current.reported_game.state).toBe("ready"));

    await act(async () => {
        resolveFirst({ ...GAMEDATA, phase: "play" });
    });

    expect(result.current.reported_game).toEqual({ state: "ready", gamedata: GAMEDATA });
});
