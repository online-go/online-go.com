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
import { getChecklist, REPORT_CHECKLISTS } from "@/lib/report_checklist_items";

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

describe("REPORT_CHECKLISTS resolved lists", () => {
    // The complete answer to "what does this report type require?" — read this table,
    // not report_checklist_items.ts, to find out. Each row is asserted against
    // getChecklist(), in evaluation order.
    const cases: Array<[type: string, ids: string[]]> = [
        [
            "escaping",
            [
                "report.game_identified",
                "escaping.game_ended",
                "escaping.not_winner",
                "escaping.not_resigned",
                "escaping.enough_moves",
                // escaping.waited_reasonable_time is parked pending more thought —
                // see the commented-out item in report_checklist_items.ts.
            ],
        ],
        [
            "stalling",
            [
                "report.game_identified",
                "stalling.enough_moves",
                "stalling.kind_selected",
                "stalling.explanation_length",
            ],
        ],
        ["score_cheating", ["report.game_identified"]],
        ["sandbagging", ["report.game_identified"]],
        ["ai_use", ["report.game_identified", "report.description_length"]],
        ["inappropriate_content", ["report.description_length"]],
        ["harassment", ["report.description_length"]],
        ["other", ["report.description_length"]],
        ["malicious_report", ["report.description_length"]],
        // not_reportable in Report.tsx today, but listed so the table stays complete —
        // see the doc comment on REPORT_CHECKLISTS.
        ["thrown_game", ["report.game_identified"]],
        ["sandbagging_assessment", ["report.game_identified"]],
        ["assess_ai_play", ["report.game_identified"]],
        // moderator-only, no report-type requirements of their own.
        ["warning", []],
        ["troll", []],
    ];

    test.each(cases)("%s", (type, ids) => {
        expect(getChecklist(type).map((i) => i.id)).toEqual(ids);
    });

    test("an unknown report type yields an empty list", () => {
        expect(getChecklist("not-a-real-type")).toEqual([]);
    });
});

describe("game_identified ordering invariant", () => {
    test("report.game_identified is first wherever a type has an async check", () => {
        // Derived from REPORT_CHECKLISTS itself, not a hard-coded type list, so a type
        // added later is covered automatically. game_identified is the synchronous
        // blocker evaluateAsyncChecks (report_checklist.ts) checks before running any
        // async check — out of order, an async check would fetch a game that isn't
        // there.
        for (const [type, items] of Object.entries(REPORT_CHECKLISTS)) {
            const has_async_check = items.some((i) => i.kind === "data_check" && !i.sync);
            if (!has_async_check) {
                continue;
            }
            expect({ type, first_id: items[0].id }).toEqual({
                type,
                first_id: "report.game_identified",
            });
        }
    });
});

describe("synthesised checks", () => {
    test("game_identified blocks when there is no game id", () => {
        const items = getChecklist("escaping");
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

    // The two description minimums are part of what a report type requires, but the
    // resolved-list table above cannot show them — both produce the same item id. These
    // two tests are what pin the actual thresholds, so a change to either is caught.
    test("malicious_report is satisfied by a single character", () => {
        const items = getChecklist("malicious_report");
        const ctx = (note: string) => ({ note, fetchGamedata: () => Promise.reject(new Error()) });

        expect(buildResults(items, ctx(""), {}, {})[0].state).toBe("actionable");
        expect(buildResults(items, ctx("a"), {}, {})[0].state).toBe("satisfied");
    });

    test("every other type needs exactly 20 characters", () => {
        const ctx = (note: string) => ({ note, fetchGamedata: () => Promise.reject(new Error()) });

        for (const type of ["ai_use", "inappropriate_content", "harassment", "other"]) {
            const items = getChecklist(type).filter((i) => i.id === "report.description_length");

            expect({
                type,
                at_19: buildResults(items, ctx("a".repeat(19)), {}, {})[0].state,
            }).toEqual({ type, at_19: "actionable" });
            expect({
                type,
                at_20: buildResults(items, ctx("a".repeat(20)), {}, {})[0].state,
            }).toEqual({ type, at_20: "satisfied" });
        }
    });

    test("description_length does not block — the rest of the list survives", () => {
        const items = getChecklist("other");
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
        const items = getChecklist("escaping");
        const ctx = ctxFor(data);
        const outcomes = await evaluateAsyncChecks(items, ctx);
        return buildResults(items, ctx, outcomes, {});
    };

    test("passes for a finished game the accused did not resign or win", async () => {
        const results = await evaluate(gamedata({ outcome: "Score", winner: 99 }));
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.game_ended"]).toBe("satisfied");
        expect(states["escaping.not_winner"]).toBe("satisfied");
        expect(states["escaping.not_resigned"]).toBe("satisfied");
        expect(states["escaping.enough_moves"]).toBe("satisfied");
    });

    test("blocks on not_winner when the accused won a scored game", async () => {
        // A scored finish — both players passed and accepted, nobody resigned — is
        // exactly the case not_winner exists to catch: the accused plainly played,
        // whether they won on the board or the reporter simply timed out.
        const results = await evaluate(gamedata({ outcome: "Score", winner: 7 }));
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("escaping.not_winner");
        expect(results[0].message).toMatch(/that player won this game/i);
    });

    test("not_winner does not block a resignation-ended game the accused won", async () => {
        // The reporter resigned, so the accused (7) won by resignation. A reporter
        // whose opponent has stopped playing may reasonably resign to end the game
        // rather than wait out the clock, so this must not be blocked — the
        // framework's rule is to fail open on that ambiguity. A resignation-ended
        // game is judged only by who resigned (escaping.not_resigned's job), never
        // by who won.
        const results = await evaluate(gamedata({ outcome: "Resignation", winner: 7 }));
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.not_winner"]).toBe("satisfied");
    });

    test("not_winner is unavailable, not satisfied, when the accused is unknown", async () => {
        // As with not_resigned: an unknown accused means we cannot tell who won, so
        // this must come back "unavailable" rather than a false "satisfied".
        const items = getChecklist("escaping");
        const ctx = {
            game_id: 4471,
            note: "",
            fetchGamedata: () => Promise.resolve(gamedata({ outcome: "Score", winner: 7 })),
        };
        const outcomes = await evaluateAsyncChecks(items, ctx);
        const results = buildResults(items, ctx, outcomes, {});
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.not_winner"]).toBe("unavailable");
    });

    test("not_winner is unavailable when winner or outcome is missing from the payload", async () => {
        const missingWinner = await evaluate(
            gamedata({ outcome: "Score", winner: undefined as unknown as number }),
        );
        const missingOutcome = await evaluate(
            gamedata({ outcome: undefined as unknown as string, winner: 7 }),
        );
        const stateOf = (results: typeof missingWinner) =>
            Object.fromEntries(results.map((r) => [r.id, r.state]))["escaping.not_winner"];
        expect(stateOf(missingWinner)).toBe("unavailable");
        expect(stateOf(missingOutcome)).toBe("unavailable");
    });

    test("complementarity: not_winner and not_resigned split by how the game ended, not by who won", async () => {
        // Resignation ending: judged solely by who resigned. The accused won
        // because the reporter resigned — not_winner exempts resignation endings
        // entirely, and not_resigned is satisfied too (the accused isn't who
        // resigned), so the whole checklist passes: the report can be filed.
        const resignedResults = await evaluate(gamedata({ outcome: "Resignation", winner: 7 }));
        const resignedStates = Object.fromEntries(resignedResults.map((r) => [r.id, r.state]));
        expect(resignedStates["escaping.not_winner"]).toBe("satisfied");
        expect(resignedStates["escaping.not_resigned"]).toBe("satisfied");

        // Scored ending: judged solely by who won. not_resigned is trivially
        // satisfied (there was no resignation to catch) — not_winner is what
        // blocks here.
        const scoredResults = await evaluate(gamedata({ outcome: "Score", winner: 7 }));
        expect(scoredResults).toHaveLength(1);
        expect(scoredResults[0].id).toBe("escaping.not_winner");
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
        const items = getChecklist("escaping");
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
        const results = await evaluate(gamedata({ outcome: "Score", winner: 99, moves: [1] }));
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
        // A scored finish with someone else as winner keeps both not_winner and
        // not_resigned satisfied rather than blocking — otherwise buildResults would
        // collapse the list down to whichever one blocks and game_ended's state would
        // not be observable here.
        const results = await evaluate(
            gamedata({ phase: undefined as unknown as string, outcome: "Score", winner: 99 }),
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
                outcome: "Score",
                winner: 99,
                moves: undefined as unknown as Array<unknown>,
            }),
        );
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["escaping.enough_moves"]).toBe("unavailable");
    });
});

describe("stalling data checks", () => {
    test("blocks when fewer than two moves were played", async () => {
        const items = getChecklist("stalling");
        const ctx = ctxFor(gamedata({ moves: [1] }), "a".repeat(20));
        const outcomes = await evaluateAsyncChecks(items, ctx);
        const results = buildResults(items, ctx, outcomes, {});

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("stalling.enough_moves");
    });

    test("enough_moves is unavailable when moves is missing from the payload", async () => {
        const items = getChecklist("stalling");
        const ctx = ctxFor(
            gamedata({ moves: undefined as unknown as Array<unknown> }),
            "a".repeat(20),
        );
        const outcomes = await evaluateAsyncChecks(items, ctx);
        const results = buildResults(items, ctx, outcomes, {});
        const states = Object.fromEntries(results.map((r) => [r.id, r.state]));
        expect(states["stalling.enough_moves"]).toBe("unavailable");
    });
});

describe("stalling kind and explanation", () => {
    const ctx = (over: { stalling_kind?: string; note?: string } = {}) => ({
        note: over.note ?? "",
        stalling_kind: over.stalling_kind,
        fetchGamedata: () => Promise.reject(new Error()),
    });

    const stateOf = (id: string, c: ReturnType<typeof ctx>) => {
        const items = getChecklist("stalling").filter((i) => i.id === id);
        return buildResults(items, c, {}, {})[0].state;
    };

    test("kind_selected is actionable until a stall kind is chosen", () => {
        expect(stateOf("stalling.kind_selected", ctx())).toBe("actionable");
    });

    test("kind_selected is satisfied once a stall kind is chosen", () => {
        expect(stateOf("stalling.kind_selected", ctx({ stalling_kind: "undo_spam" }))).toBe(
            "satisfied",
        );
    });

    test("a specific stall kind needs no written explanation", () => {
        expect(stateOf("stalling.explanation_length", ctx({ stalling_kind: "undo_spam" }))).toBe(
            "satisfied",
        );
    });

    test("'something else' needs exactly 20 characters of explanation", () => {
        const at = (note: string) =>
            stateOf("stalling.explanation_length", ctx({ stalling_kind: "other", note }));
        expect(at("a".repeat(19))).toBe("actionable");
        expect(at("a".repeat(20))).toBe("satisfied");
    });

    test("whitespace does not count toward the 'something else' explanation", () => {
        // composeStallingNote trims the note before submission, so anything the
        // trim would discard must not satisfy this check — otherwise a
        // whitespace-padded note passes here yet reaches moderators with no
        // explanation at all.
        const at = (note: string) =>
            stateOf("stalling.explanation_length", ctx({ stalling_kind: "other", note }));
        expect(at(" ".repeat(25))).toBe("actionable");
        expect(at(`  ${"a".repeat(19)}  `)).toBe("actionable");
        expect(at(`  ${"a".repeat(20)}  `)).toBe("satisfied");
    });

    test("explanation is required at all only for 'something else'", () => {
        // No kind selected yet: kind_selected is the item asking for action, so the
        // explanation item must not simultaneously demand text the reporter may
        // never need.
        expect(stateOf("stalling.explanation_length", ctx())).toBe("satisfied");
    });

    test("neither item blocks — the rest of the list survives them failing", () => {
        const items = getChecklist("stalling").filter(
            (i) => i.id === "stalling.kind_selected" || i.id === "stalling.explanation_length",
        );
        const results = buildResults(items, ctx({ stalling_kind: "other" }), {}, {});
        expect(results).toHaveLength(2);
        expect(results.map((r) => r.state)).toEqual(["satisfied", "actionable"]);
    });
});
