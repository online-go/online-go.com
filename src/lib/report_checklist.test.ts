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

import {
    buildResults,
    checklistSatisfied,
    evaluateAsyncChecks,
    type AsyncDataCheckItem,
    type AttestationItem,
    type ChecklistContext,
    type ChecklistItem,
    type ChecklistItemResult,
    type ChecklistItemState,
    type SyncDataCheckItem,
} from "@/lib/report_checklist";

const ctx: ChecklistContext = {
    game_id: 1,
    note: "",
    fetchGamedata: () => Promise.reject(new Error("not used")),
};

const attest = (id: string): AttestationItem => ({ kind: "attestation", id, label: id });

const syncCheck = (id: string, met: boolean, blocking: boolean): SyncDataCheckItem => ({
    kind: "data_check",
    sync: true,
    id,
    label: id,
    blocking,
    evaluate: () => (met ? { met: true } : { met: false, message: `${id} failed` }),
});

const asyncCheck = (
    id: string,
    met: boolean,
    blocking: boolean,
    onCall?: () => void,
): AsyncDataCheckItem => ({
    kind: "data_check",
    sync: false,
    id,
    label: id,
    blocking,
    evaluate: async () => {
        onCall?.();
        return met ? { met: true } : { met: false, message: `${id} failed` };
    },
});

describe("evaluateAsyncChecks", () => {
    test("a failing sync blocker stops async checks from running at all", async () => {
        let called = false;
        const items: ChecklistItem[] = [
            syncCheck("sync.blocker", false, true),
            asyncCheck("async.one", true, true, () => {
                called = true;
            }),
        ];

        const outcomes = await evaluateAsyncChecks(items, ctx);

        expect(called).toBe(false);
        expect(outcomes).toEqual({});
    });

    test("a failing sync NON-blocker does not stop async checks", async () => {
        const items: ChecklistItem[] = [
            syncCheck("sync.soft", false, false),
            asyncCheck("async.one", true, true),
        ];

        const outcomes = await evaluateAsyncChecks(items, ctx);

        expect(outcomes["async.one"]).toEqual({ met: true });
    });

    test("a rejecting async check yields unavailable rather than throwing", async () => {
        const boom: AsyncDataCheckItem = {
            kind: "data_check",
            sync: false,
            id: "async.boom",
            label: "async.boom",
            blocking: true,
            evaluate: () => Promise.reject(new Error("network")),
        };

        const outcomes = await evaluateAsyncChecks([boom], ctx);

        expect(outcomes["async.boom"]).toBe("unavailable");
    });
});

describe("buildResults", () => {
    test("data checks are pending while async outcomes are unknown", () => {
        const items: ChecklistItem[] = [asyncCheck("async.one", true, true), attest("att.one")];

        const results = buildResults(items, ctx, null, {});

        expect(results.map((r) => [r.id, r.state])).toEqual([
            ["async.one", "pending"],
            ["att.one", "actionable"],
        ]);
    });

    test("an unticked attestation is actionable and a ticked one is satisfied", () => {
        const items: ChecklistItem[] = [attest("att.one")];

        expect(buildResults(items, ctx, {}, {})[0].state).toBe("actionable");
        expect(buildResults(items, ctx, {}, { "att.one": true })[0].state).toBe("satisfied");
    });

    test("sync checks are re-evaluated from ctx, not from the outcome map", () => {
        const lengthCheck: SyncDataCheckItem = {
            kind: "data_check",
            sync: true,
            id: "sync.length",
            label: "sync.length",
            blocking: false,
            evaluate: (c) => (c.note.length >= 5 ? { met: true } : { met: false, message: "more" }),
        };

        expect(buildResults([lengthCheck], { ...ctx, note: "" }, {}, {})[0].state).toBe(
            "actionable",
        );
        expect(buildResults([lengthCheck], { ...ctx, note: "abcde" }, {}, {})[0].state).toBe(
            "satisfied",
        );
    });

    test("a blocked item is returned alone, discarding every other item", () => {
        const items: ChecklistItem[] = [
            syncCheck("sync.ok", true, true),
            asyncCheck("async.bad", false, true),
            attest("att.one"),
        ];

        const results = buildResults(
            items,
            ctx,
            { "async.bad": { met: false, message: "why" } },
            {},
        );

        expect(results).toEqual([
            {
                id: "async.bad",
                kind: "data_check",
                state: "blocked",
                label: "async.bad",
                message: "why",
            },
        ]);
    });

    test("when several blocking checks fail, declaration order decides which is shown", () => {
        const items: ChecklistItem[] = [
            asyncCheck("async.first", false, true),
            asyncCheck("async.second", false, true),
        ];

        const results = buildResults(
            items,
            ctx,
            {
                "async.first": { met: false, message: "first" },
                "async.second": { met: false, message: "second" },
            },
            {},
        );

        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("async.first");
    });

    test("a failing NON-blocking check is actionable and keeps the rest of the list", () => {
        const items: ChecklistItem[] = [syncCheck("sync.soft", false, false), attest("att.one")];

        const results = buildResults(items, ctx, {}, {});

        expect(results.map((r) => r.state)).toEqual(["actionable", "actionable"]);
        expect(results[0].message).toBe("sync.soft failed");
    });

    test("an unavailable result carries no message", () => {
        const items: ChecklistItem[] = [asyncCheck("async.one", true, true)];

        const results = buildResults(items, ctx, { "async.one": "unavailable" }, {});

        expect(results[0].state).toBe("unavailable");
        expect(results[0].message).toBeUndefined();
    });
});

describe("checklistSatisfied", () => {
    test("satisfied and unavailable both pass; pending, actionable and blocked do not", () => {
        const at = (state: ChecklistItemState): ChecklistItemResult[] => [
            { id: "x", kind: "data_check", state, label: "x" },
        ];

        expect(checklistSatisfied(at("satisfied"))).toBe(true);
        expect(checklistSatisfied(at("unavailable"))).toBe(true);
        expect(checklistSatisfied(at("pending"))).toBe(false);
        expect(checklistSatisfied(at("actionable"))).toBe(false);
        expect(checklistSatisfied(at("blocked"))).toBe(false);
    });

    test("an empty checklist is vacuously satisfied — callers must guard on category", () => {
        expect(checklistSatisfied([])).toBe(true);
    });
});
