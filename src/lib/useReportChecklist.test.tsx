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
import { useReportChecklist } from "@/lib/useReportChecklist";
import type { AsyncDataCheckItem, AttestationItem, ChecklistItem } from "@/lib/report_checklist";

// jest.mock is hoisted above the imports, so `get` is already the mock by the time
// the module body runs.
jest.mock("@/lib/requests", () => ({
    get: jest.fn(),
}));

const mockGet = get as unknown as jest.Mock;

const movesCheck: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "test.moves",
    label: "moves",
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        return gamedata.moves.length >= 2 ? { met: true } : { met: false, message: "too few" };
    },
};

const attestation: AttestationItem = {
    kind: "attestation",
    id: "test.attest",
    label: "attest",
};

const items: ChecklistItem[] = [movesCheck, attestation];

beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ outcome: "", winner: 0, phase: "finished", moves: [1, 2, 3] });
});

test("reports pending before the fetch resolves, then satisfied", async () => {
    const { result } = renderHook(() =>
        useReportChecklist({ items, game_id: 1, note: "", attestations: {} }),
    );

    expect(result.current[0].state).toBe("pending");

    await waitFor(() => expect(result.current[0].state).toBe("satisfied"));
});

test("ticking an attestation does not refetch game data", async () => {
    const { result, rerender } = renderHook(
        ({ attestations }: { attestations: Record<string, boolean> }) =>
            useReportChecklist({ items, game_id: 1, note: "", attestations }),
        { initialProps: { attestations: {} as Record<string, boolean> } },
    );

    await waitFor(() => expect(result.current[0].state).toBe("satisfied"));
    expect(mockGet).toHaveBeenCalledTimes(1);

    rerender({ attestations: { "test.attest": true } });

    await waitFor(() => expect(result.current[1].state).toBe("satisfied"));
    expect(mockGet).toHaveBeenCalledTimes(1);
});

test("typing in the note does not refetch game data", async () => {
    const { result, rerender } = renderHook(
        ({ note }: { note: string }) =>
            useReportChecklist({ items, game_id: 1, note, attestations: {} }),
        { initialProps: { note: "" } },
    );

    await waitFor(() => expect(result.current[0].state).toBe("satisfied"));
    expect(mockGet).toHaveBeenCalledTimes(1);

    rerender({ note: "a" });
    rerender({ note: "ab" });

    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(result.current[0].state).toBe("satisfied");
});

test("does not fetch when there is no game id", async () => {
    const { result } = renderHook(() =>
        useReportChecklist({ items, game_id: undefined, note: "", attestations: {} }),
    );

    await waitFor(() => expect(result.current[0].state).toBe("unavailable"));
    expect(mockGet).not.toHaveBeenCalled();
});

test("a rejected fetch yields unavailable and does not gate", async () => {
    mockGet.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() =>
        useReportChecklist({ items, game_id: 1, note: "", attestations: {} }),
    );

    await waitFor(() => expect(result.current[0].state).toBe("unavailable"));
});

test("a stale response for a previous game is discarded", async () => {
    let resolveFirst: (v: unknown) => void = () => undefined;
    mockGet.mockImplementationOnce(
        () =>
            new Promise((resolve) => {
                resolveFirst = resolve;
            }),
    );
    mockGet.mockResolvedValueOnce({ outcome: "", winner: 0, phase: "finished", moves: [1, 2, 3] });

    const { result, rerender } = renderHook(
        ({ game_id }: { game_id: number }) =>
            useReportChecklist({ items, game_id, note: "", attestations: {} }),
        { initialProps: { game_id: 1 } },
    );

    rerender({ game_id: 2 });
    await waitFor(() => expect(result.current[0].state).toBe("satisfied"));

    // The first game's response lands late, carrying a failing outcome.
    await act(async () => {
        resolveFirst({ outcome: "", winner: 0, phase: "finished", moves: [1] });
    });

    expect(result.current[0].state).toBe("satisfied");
});
