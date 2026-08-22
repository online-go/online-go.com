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

import { buildResults, evaluateAsyncChecks, type Gamedata } from "@/lib/report_checklist";
import { getChecklist } from "@/lib/report_checklist_items";

const gamedata = (over: Partial<Gamedata> = {}): Gamedata => ({
    outcome: "Resignation",
    winner: 99,
    phase: "finished",
    moves: [1, 2, 3],
    ...over,
});

const ctxFor = (data: Gamedata, note = "") => ({
    game_id: 4471,
    reported_user_id: 7,
    note,
    fetchGamedata: () => Promise.resolve(data),
});

describe("getChecklist synthesis", () => {
    test("a category needing a game gets the game-identified blocker first", () => {
        const items = getChecklist("score_cheating", { game_id_required: true });
        expect(items[0].id).toBe("report.game_identified");
    });

    test("a category with a minimum description gets the length check last", () => {
        const items = getChecklist("other", { min_description_length: 20 });
        expect(items[items.length - 1].id).toBe("report.description_length");
    });

    test("registry items sit between the two synthesised checks", () => {
        const ids = getChecklist("escaping", { game_id_required: true }).map((i) => i.id);
        expect(ids).toEqual([
            "report.game_identified",
            "escaping.game_ended",
            "escaping.not_resigned",
            "escaping.enough_moves",
            "escaping.waited_reasonable_time",
        ]);
    });

    test("a type with no items and no gates yields an empty list", () => {
        expect(getChecklist("troll", {})).toEqual([]);
    });

    test("no category yields an empty list", () => {
        expect(getChecklist("escaping", undefined)).toEqual([]);
    });
});

describe("synthesised checks", () => {
    test("game_identified blocks when there is no game id", () => {
        const items = getChecklist("escaping", { game_id_required: true });
        const results = buildResults(
            items,
            { note: "", fetchGamedata: () => Promise.reject(new Error("no game")) },
            null,
            {},
        );
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("report.game_identified");
        expect(results[0].state).toBe("blocked");
    });

    test("description_length is actionable while short and satisfied once long enough", () => {
        const items = getChecklist("other", { min_description_length: 5 });
        const ctx = (note: string) => ({ note, fetchGamedata: () => Promise.reject(new Error()) });

        expect(buildResults(items, ctx(""), {}, {})[0].state).toBe("actionable");
        expect(buildResults(items, ctx("abcde"), {}, {})[0].state).toBe("satisfied");
    });

    test("description_length does not block — the rest of the list survives", () => {
        const items = getChecklist("other", { min_description_length: 5 });
        const results = buildResults(
            items,
            { note: "", fetchGamedata: () => Promise.reject(new Error()) },
            {},
            {},
        );
        expect(results[0].state).toBe("actionable");
    });
});

describe("escaping data checks", () => {
    const evaluate = async (data: Gamedata) => {
        const items = getChecklist("escaping", { game_id_required: true });
        const ctx = ctxFor(data);
        const outcomes = await evaluateAsyncChecks(items, ctx);
        return buildResults(items, ctx, outcomes, {});
    };

    test("passes for a finished game the accused did not resign", async () => {
        const results = await evaluate(gamedata({ outcome: "Resignation", winner: 7 }));
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.game_ended"]).toBe("satisfied");
        expect(states["escaping.not_resigned"]).toBe("satisfied");
        expect(states["escaping.enough_moves"]).toBe("satisfied");
    });

    test("blocks on game_ended while the game is still being played", async () => {
        const results = await evaluate(gamedata({ phase: "play" }));
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("escaping.game_ended");
        expect(results[0].message).toMatch(/has not ended yet/i);
    });

    test("blocks on not_resigned when the accused resigned", async () => {
        const results = await evaluate(gamedata({ outcome: "Resignation", winner: 99 }));
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("escaping.not_resigned");
    });

    test("not_resigned is unavailable, not satisfied, when the accused is unknown", async () => {
        // A check that cannot be determined must not report success — the framework's
        // first invariant. An unknown accused means we cannot tell who resigned, so
        // this must come back "unavailable" rather than a false "satisfied".
        const items = getChecklist("escaping", { game_id_required: true });
        const ctx = {
            game_id: 4471,
            note: "",
            fetchGamedata: () => Promise.resolve(gamedata({ outcome: "Resignation", winner: 99 })),
        };
        const outcomes = await evaluateAsyncChecks(items, ctx);
        const results = buildResults(items, ctx, outcomes, {});
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.not_resigned"]).toBe("unavailable");
    });

    test("blocks on enough_moves when fewer than two moves were played", async () => {
        const results = await evaluate(gamedata({ outcome: "Resignation", winner: 7, moves: [1] }));
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("escaping.enough_moves");
        expect(results[0].message).toMatch(
            /There aren't enough moves played in this game to decide whether this player stopped playing/,
        );
    });

    test("game_ended is checked before not_resigned", async () => {
        const results = await evaluate(gamedata({ phase: "play", winner: 99 }));
        expect(results[0].id).toBe("escaping.game_ended");
    });

    test("game_ended is unavailable, not blocking, when phase is missing from the payload", async () => {
        // winner: 7 matches reported_user_id, so not_resigned is satisfied rather than
        // blocking — otherwise buildResults would collapse the list down to that
        // blocker and game_ended's state would not be observable here.
        const results = await evaluate(
            gamedata({ phase: undefined as unknown as string, winner: 7 }),
        );
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.game_ended"]).toBe("unavailable");
    });

    test("not_resigned is unavailable when outcome or winner is missing from the payload", async () => {
        const missingOutcome = await evaluate(
            gamedata({ outcome: undefined as unknown as string }),
        );
        const missingWinner = await evaluate(gamedata({ winner: undefined as unknown as number }));
        const stateOf = (results: typeof missingOutcome) =>
            Object.fromEntries(results.map((r) => [r.id, r.state]))["escaping.not_resigned"];
        expect(stateOf(missingOutcome)).toBe("unavailable");
        expect(stateOf(missingWinner)).toBe("unavailable");
    });

    test("enough_moves is unavailable when moves is missing from the payload", async () => {
        const results = await evaluate(
            gamedata({
                outcome: "Resignation",
                winner: 7,
                moves: undefined as unknown as Array<unknown>,
            }),
        );
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.enough_moves"]).toBe("unavailable");
    });
});

describe("stalling data checks", () => {
    test("blocks when fewer than two moves were played", async () => {
        const items = getChecklist("stalling", {
            game_id_required: true,
            min_description_length: 20,
        });
        const ctx = ctxFor(gamedata({ moves: [1] }), "a".repeat(20));
        const outcomes = await evaluateAsyncChecks(items, ctx);
        const results = buildResults(items, ctx, outcomes, {});

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("stalling.enough_moves");
    });
});
