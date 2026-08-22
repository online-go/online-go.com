# Report Submission Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three ad-hoc submission gates in the OGS report dialog with one visible, ordered checklist, and add the first reporter attestation.

**Architecture:** A pure evaluation engine (`report_checklist.ts`) knows nothing about report types. A policy registry (`report_checklist_items.ts`) holds every item definition and every translated string. A React hook (`useReportChecklist.ts`) runs async checks when the report type or game changes and rebuilds displayable results on every render. Two presentational components render the list and the blocker. `Report.tsx` loses three bespoke gate mechanisms and gains one.

**Tech Stack:** TypeScript, React 18, Jest + ts-jest + @testing-library/react, Playwright for end-to-end.

## Global Constraints

- Repository: `ogs-ui`. No backend change in this plan.
- Every file starts with the AGPL header used by all files in `src/lib` and `src/components`.
- No `any` types. No emojis.
- One component per file. Each component gets its own `.tsx` and matching `.css`.
- All user-visible strings use `pgettext(context, msgid)` imported from `@/lib/translate`.
- Item ids are stable and opaque. Never rename one, never reuse one for a different claim.
- No hover background changes on non-interactive elements.
- Unit tests run with `yarn test`. A single file: `yarn test src/lib/report_checklist.test.ts`.
- Before the final push: `yarn type-check`, `yarn lint`, `yarn prettier:file <modified files>`, one `yarn build`.
- `yarn spellcheck` covers only `src/**/*.{ts,tsx}` — it does apply to every source file in this plan.

## Three refinements to the design spec

Both were found while writing this plan. Amend
`docs/superpowers/specs/2026-08-21-report-submission-checklist-design.md` in place (Task 8).

**1. A data check declares whether it is synchronous.** The spec had one `data_check` variant whose
`evaluate` returned `CheckOutcome | Promise<CheckOutcome>`, with sync/async distinguished by
inspecting the returned value. That does not work: the description-length check must re-run on every
keystroke, while the game-data checks must not re-run at all, and telling them apart by
`instanceof Promise` means either re-invoking an async check on each render or never refreshing the
sync one. Splitting `DataCheckItem` into `sync: true` and `sync: false` variants makes the compiler
enforce it and makes the two-phase rule explicit rather than inferred.

**2. An `unavailable` result carries no message.** The spec had the engine emit a translated
"We could not check this" string. Keeping it out means `report_checklist.ts` contains no user-visible
text at all — the component supplies the wording for that state. Cleaner boundary, one less string to
thread through.

**3. The game fetch is memoised per game id, not per evaluation pass.** The spec scoped the memo to
a single evaluation. That is too narrow: the reporter types, which re-runs the synchronous
description-length check, and a per-pass memo would refetch game data alongside it. Holding the
promise in a ref keyed by game id means the three escaping checks share one request and typing costs
nothing. It also makes the fetch cheap to repeat if evaluation is re-run for any other reason.

## File Structure

**Create**

| File | Responsibility |
| --- | --- |
| `src/lib/report_checklist.ts` | Types and the pure engine. No translated strings, no knowledge of report types. |
| `src/lib/report_checklist.test.ts` | Engine unit tests. |
| `src/lib/report_checklist_items.ts` | Every item definition, every translated item string, and `getChecklist()`. The policy file. |
| `src/lib/report_checklist_items.test.ts` | Registry and synthesis tests. |
| `src/lib/useReportChecklist.ts` | React binding: async lifecycle, memoised game fetch, staleness guard. |
| `src/lib/useReportChecklist.test.tsx` | Hook tests. |
| `src/components/Report/ReportChecklist.tsx` + `.css` | The list below the description. |
| `src/components/Report/ReportChecklistBlocker.tsx` + `.css` | The single blocker above the description. |
| `e2e-tests/moderation/mod-escaping-attestation-required.ts` | New end-to-end test. |

**Modify**

| File | Change |
| --- | --- |
| `src/components/Report/Report.tsx` | Remove `check_applicability` and both applicability functions, the `inapplicable_reason` / `validating` state and its effect, `show_game_id_required_text`, `more_description_needed`. Add attestation state, the hook, and the two components. |
| `e2e-tests/helpers/user-utils.ts` | `submitReportForm` ticks attestations before submitting. |
| `e2e-tests/moderation/mod-block-early-escape-report.ts` | Assert the blocker, not the textarea placeholder. |
| `e2e-tests/moderation/mod-block-early-stall-report.ts` | Same. |
| `e2e-tests/moderation/mod-reject-escape-report-during-game.ts` | The during-game half now blocks client-side. |
| `e2e-tests/moderation/moderation.spec.ts` | Register the new test. |

---

### Task 1: The evaluation engine

**Files:**
- Create: `src/lib/report_checklist.ts`
- Test: `src/lib/report_checklist.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `ChecklistItemId`, `Gamedata`, `ChecklistContext`, `CheckOutcome`, `AttestationItem`, `SyncDataCheckItem`, `AsyncDataCheckItem`, `DataCheckItem`, `ChecklistItem`, `ChecklistItemState`, `ChecklistItemResult`, `AsyncOutcomes`, `evaluateAsyncChecks(items, ctx): Promise<AsyncOutcomes>`, `buildResults(items, ctx, asyncOutcomes, attestations): ChecklistItemResult[]`, `checklistSatisfied(results): boolean`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/report_checklist.test.ts` (AGPL header, then):

```ts
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

        expect(buildResults([lengthCheck], { ...ctx, note: "" }, {}, {})[0].state).toBe("actionable");
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

        const results = buildResults(items, ctx, { "async.bad": { met: false, message: "why" } }, {});

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/lib/report_checklist.test.ts`
Expected: FAIL — `Cannot find module '@/lib/report_checklist'`.

- [ ] **Step 3: Write the engine**

Create `src/lib/report_checklist.ts` (AGPL header, then):

```ts
/** Stable and opaque. Never renamed, never reused for a different claim. */
export type ChecklistItemId = string;

/** The subset of PUBLIC_GAMEDATA_FIELDS the checks use. */
export interface Gamedata {
    outcome: string;
    winner: number;
    phase: string;
    moves: Array<unknown>;
}

export interface ChecklistContext {
    game_id?: number;
    review_id?: number;
    reported_user_id?: number;
    note: string;
    /** Memoised by game id, so sibling checks share one request. */
    fetchGamedata: () => Promise<Gamedata>;
}

export type CheckOutcome = { met: true } | { met: false; message: string };

export interface AttestationItem {
    kind: "attestation";
    id: ChecklistItemId;
    label: string;
}

interface DataCheckCommon {
    kind: "data_check";
    id: ChecklistItemId;
    label: string;
    /** True when the reporter cannot satisfy this from inside the dialog. */
    blocking: boolean;
}

/** Re-evaluated on every render, so it may depend on live form state. */
export interface SyncDataCheckItem extends DataCheckCommon {
    sync: true;
    evaluate: (ctx: ChecklistContext) => CheckOutcome;
}

/** Evaluated only when the report type or reported game changes. */
export interface AsyncDataCheckItem extends DataCheckCommon {
    sync: false;
    evaluate: (ctx: ChecklistContext) => Promise<CheckOutcome>;
}

export type DataCheckItem = SyncDataCheckItem | AsyncDataCheckItem;
export type ChecklistItem = AttestationItem | DataCheckItem;

export type ChecklistItemState =
    | "satisfied"
    | "pending"
    | "unavailable"
    | "actionable"
    | "blocked";

export interface ChecklistItemResult {
    id: ChecklistItemId;
    kind: "attestation" | "data_check";
    state: ChecklistItemState;
    label: string;
    message?: string;
}

export type AsyncOutcomes = Record<ChecklistItemId, CheckOutcome | "unavailable">;

/**
 * Runs the async data checks. Synchronous checks are evaluated here only to decide
 * whether to short-circuit: a failing synchronous blocker means no async check runs,
 * which is what keeps game fetches behind "we actually have a game".
 */
export async function evaluateAsyncChecks(
    items: ChecklistItem[],
    ctx: ChecklistContext,
): Promise<AsyncOutcomes> {
    const pending: Array<{ id: ChecklistItemId; promise: Promise<CheckOutcome> }> = [];

    for (const item of items) {
        if (item.kind !== "data_check") {
            continue;
        }
        if (item.sync) {
            const outcome = item.evaluate(ctx);
            if (!outcome.met && item.blocking) {
                return {};
            }
            continue;
        }
        pending.push({ id: item.id, promise: item.evaluate(ctx) });
    }

    const settled = await Promise.all(
        pending.map(({ promise }) =>
            promise.catch((err: unknown) => {
                console.warn("report checklist data check failed", err);
                return "unavailable" as const;
            }),
        ),
    );

    const outcomes: AsyncOutcomes = {};
    pending.forEach(({ id }, i) => {
        outcomes[id] = settled[i];
    });
    return outcomes;
}

/**
 * Turns items plus outcomes into the displayable list. Pure and synchronous, so it is
 * safe to call on every render. Pass null for asyncOutcomes while evaluation is in
 * flight; async checks then report as pending.
 *
 * When any blocking check has failed, the result is that item alone: the dialog
 * collapses to a single explanation.
 */
export function buildResults(
    items: ChecklistItem[],
    ctx: ChecklistContext,
    asyncOutcomes: AsyncOutcomes | null,
    attestations: Record<ChecklistItemId, boolean>,
): ChecklistItemResult[] {
    const results: ChecklistItemResult[] = items.map((item) => {
        if (item.kind === "attestation") {
            return {
                id: item.id,
                kind: "attestation",
                state: attestations[item.id] ? "satisfied" : "actionable",
                label: item.label,
            };
        }

        const outcome = item.sync ? item.evaluate(ctx) : asyncOutcomes?.[item.id];

        if (outcome === undefined) {
            return { id: item.id, kind: "data_check", state: "pending", label: item.label };
        }
        if (outcome === "unavailable") {
            return { id: item.id, kind: "data_check", state: "unavailable", label: item.label };
        }
        if (outcome.met) {
            return { id: item.id, kind: "data_check", state: "satisfied", label: item.label };
        }
        return {
            id: item.id,
            kind: "data_check",
            state: item.blocking ? "blocked" : "actionable",
            label: item.label,
            message: outcome.message,
        };
    });

    const blocked = results.find((r) => r.state === "blocked");
    return blocked ? [blocked] : results;
}

/**
 * True when nothing in the list stands in the way of submission.
 *
 * Vacuously true for an empty list. Callers must separately confirm a report type is
 * selected — see canSubmit() in Report.tsx.
 */
export function checklistSatisfied(results: ChecklistItemResult[]): boolean {
    return results.every((r) => r.state === "satisfied" || r.state === "unavailable");
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/lib/report_checklist.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/report_checklist.ts src/lib/report_checklist.test.ts
git commit -m "feat: add report checklist evaluation engine"
```

---

### Task 2: The item registry and getChecklist

**Files:**
- Create: `src/lib/report_checklist_items.ts`
- Test: `src/lib/report_checklist_items.test.ts`

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces: `ChecklistCategory` (`{ game_id_required?: boolean; min_description_length?: number }`), `REPORT_CHECKLISTS`, `getChecklist(report_type: string, category: ChecklistCategory | undefined): ChecklistItem[]`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/report_checklist_items.test.ts` (AGPL header, then):

```ts
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
        expect(results[0].message).toMatch(/has ended/i);
    });

    test("blocks on not_resigned when the accused resigned", async () => {
        const results = await evaluate(gamedata({ outcome: "Resignation", winner: 99 }));
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("escaping.not_resigned");
    });

    test("blocks on enough_moves when fewer than two moves were played", async () => {
        const results = await evaluate(gamedata({ outcome: "Resignation", winner: 7, moves: [1] }));
        expect(results).toHaveLength(1);
        expect(results[0].id).toBe("escaping.enough_moves");
    });

    test("game_ended is checked before not_resigned", async () => {
        const results = await evaluate(gamedata({ phase: "play", winner: 99 }));
        expect(results[0].id).toBe("escaping.game_ended");
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/lib/report_checklist_items.test.ts`
Expected: FAIL — `Cannot find module '@/lib/report_checklist_items'`.

- [ ] **Step 3: Write the registry**

Create `src/lib/report_checklist_items.ts` (AGPL header, then):

```ts
import { interpolate, pgettext } from "@/lib/translate";

import type {
    AsyncDataCheckItem,
    AttestationItem,
    ChecklistItem,
    SyncDataCheckItem,
} from "@/lib/report_checklist";

/**
 * The parts of a ReportDescription that produce synthesised checks. Declared
 * structurally rather than imported, so this module has no dependency on the
 * Report component.
 */
export interface ChecklistCategory {
    game_id_required?: boolean;
    min_description_length?: number;
}

function gameIdentifiedItem(): SyncDataCheckItem {
    return {
        kind: "data_check",
        sync: true,
        id: "report.game_identified",
        label: pgettext("A report checklist item", "The reported game is identified"),
        blocking: true,
        evaluate: (ctx) =>
            ctx.game_id
                ? { met: true }
                : {
                      met: false,
                      message: pgettext(
                          "Shown when a report needs a game but none is known",
                          "Please report the user on the game page so we know where to look.",
                      ),
                  },
    };
}

function descriptionLengthItem(minimum: number): SyncDataCheckItem {
    return {
        kind: "data_check",
        sync: true,
        id: "report.description_length",
        label: pgettext("A report checklist item", "Describe what happened"),
        blocking: false,
        evaluate: (ctx) =>
            ctx.note.length >= minimum
                ? { met: true }
                : {
                      met: false,
                      message: interpolate(
                          pgettext("Context of message", "{{required}} more characters needed"),
                          { required: minimum - ctx.note.length },
                      ),
                  },
    };
}

const escapingGameEnded: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.game_ended",
    label: pgettext("A report checklist item", "The game has ended"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        return gamedata.phase === "finished"
            ? { met: true }
            : {
                  met: false,
                  message: pgettext(
                      "Shown when someone reports stopped-playing on a game still in progress",
                      `This game has not ended yet, so 'stopped playing' does not apply: the other player might still be thinking.

Please choose a different type of report, if there is a different problem.`,
                  ),
              };
    },
};

const escapingNotResigned: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.not_resigned",
    label: pgettext("A report checklist item", "This player did not resign the game"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        const accused_resigned =
            gamedata.outcome?.includes("Resignation") && gamedata.winner !== ctx.reported_user_id;
        return accused_resigned
            ? {
                  met: false,
                  message: pgettext(
                      "A message when trying to create a report that doesn't make sense",
                      `That player resigned, so 'stopped playing' is not applicable: resigning is normally an acceptable way to finish the game.

Please choose a different type of report, if there is a different problem.`,
                  ),
              }
            : { met: true };
    },
};

const escapingEnoughMoves: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "escaping.enough_moves",
    label: pgettext("A report checklist item", "Enough moves were played to judge this"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        return gamedata.moves.length >= 2
            ? { met: true }
            : {
                  met: false,
                  message: pgettext(
                      "A message when the user is trying to report something that we don't want them to report yet",
                      `If the other player leaves the game without playing the first move we will automatically warn them about this.

Please choose a different type of report, if there is a different problem.`,
                  ),
              };
    },
};

const escapingWaitedReasonableTime: AttestationItem = {
    kind: "attestation",
    id: "escaping.waited_reasonable_time",
    label: pgettext(
        "A report checklist item the reporter confirms",
        "I waited a reasonable time for this player to play",
    ),
};

const stallingEnoughMoves: AsyncDataCheckItem = {
    kind: "data_check",
    sync: false,
    id: "stalling.enough_moves",
    label: pgettext("A report checklist item", "Enough moves were played to judge this"),
    blocking: true,
    evaluate: async (ctx) => {
        const gamedata = await ctx.fetchGamedata();
        return gamedata.moves.length >= 2
            ? { met: true }
            : {
                  met: false,
                  message: pgettext(
                      "A message when the user is trying to report something that we don't want them to report yet",
                      `There aren't enough moves played in this game to decide if someone is playing stalling moves.

If the other player leaves the game without playing, we will automatically warn them about that.

Please choose a different type of report, if there is a different problem.`,
                  ),
              };
    },
};

/**
 * Per-report-type checklist items. Mirrors REPORT_TYPE_VOTABLE_ACTIONS in the
 * backend's moderation.py: the report type is the key, and everything about what a
 * type requires is readable in one place.
 *
 * Ordering matters. When several blocking checks fail, the earliest is the one the
 * reporter is shown.
 */
export const REPORT_CHECKLISTS: Record<string, ChecklistItem[]> = {
    escaping: [
        escapingGameEnded,
        escapingNotResigned,
        escapingEnoughMoves,
        escapingWaitedReasonableTime,
    ],
    stalling: [stallingEnoughMoves],
};

/**
 * The single point of access for a report type's checklist. A future source of items
 * — an administrative form, a rule engine — is merged in here and nowhere else.
 */
export function getChecklist(
    report_type: string,
    category: ChecklistCategory | undefined,
): ChecklistItem[] {
    if (!category) {
        return [];
    }

    const items: ChecklistItem[] = [];

    if (category.game_id_required) {
        items.push(gameIdentifiedItem());
    }

    items.push(...(REPORT_CHECKLISTS[report_type] ?? []));

    if (category.min_description_length) {
        items.push(descriptionLengthItem(category.min_description_length));
    }

    return items;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/lib/report_checklist_items.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/report_checklist_items.ts src/lib/report_checklist_items.test.ts
git commit -m "feat: add report checklist item registry"
```

---

### Task 3: The React binding

**Files:**
- Create: `src/lib/useReportChecklist.ts`
- Test: `src/lib/useReportChecklist.test.tsx`

**Interfaces:**
- Consumes: `evaluateAsyncChecks`, `buildResults`, `ChecklistItem`, `ChecklistItemId`, `ChecklistItemResult`, `Gamedata` from Task 1. `get` from `@/lib/requests`.
- Produces: `useReportChecklist(args): ChecklistItemResult[]` where args is `{ items, game_id?, review_id?, reported_user_id?, note, attestations }`.

**Note on `items` identity:** the hook re-runs its async effect whenever the `items` array identity changes. `Report.tsx` must therefore wrap `getChecklist(...)` in `React.useMemo` — Task 5 does this. Passing a freshly built array on every render would loop.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/useReportChecklist.test.tsx` (AGPL header, then):

```tsx
import * as React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";

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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/lib/useReportChecklist.test.tsx`
Expected: FAIL — `Cannot find module '@/lib/useReportChecklist'`.

- [ ] **Step 3: Write the hook**

Create `src/lib/useReportChecklist.ts` (AGPL header, then):

```ts
import * as React from "react";

import { get } from "@/lib/requests";
import { buildResults, evaluateAsyncChecks } from "@/lib/report_checklist";

import type {
    AsyncOutcomes,
    ChecklistItem,
    ChecklistItemId,
    ChecklistItemResult,
    Gamedata,
} from "@/lib/report_checklist";

interface UseReportChecklistArgs {
    /** Must be referentially stable across renders — wrap getChecklist() in useMemo. */
    items: ChecklistItem[];
    game_id?: number;
    review_id?: number;
    reported_user_id?: number;
    note: string;
    attestations: Record<ChecklistItemId, boolean>;
}

export function useReportChecklist({
    items,
    game_id,
    review_id,
    reported_user_id,
    note,
    attestations,
}: UseReportChecklistArgs): ChecklistItemResult[] {
    const [outcomes, set_outcomes] = React.useState<AsyncOutcomes | null>(null);

    // One in-flight request per game, shared by every check that needs game data.
    // Either both fields are set or the ref is null: a game id can never sit here
    // without the promise that belongs to it.
    const gamedata_cache = React.useRef<{ game_id: number; promise: Promise<Gamedata> } | null>(
        null,
    );

    const fetchGamedata = React.useCallback((): Promise<Gamedata> => {
        if (!game_id) {
            return Promise.reject(new Error("no reported game"));
        }
        const cached = gamedata_cache.current;
        if (cached && cached.game_id === game_id) {
            return cached.promise;
        }
        const promise = get(`/termination-api/game/${game_id}`) as Promise<Gamedata>;
        gamedata_cache.current = { game_id, promise };
        // A rejected promise must not stay cached. Leaving it there turns one network
        // blip into a session-long screening hole: `unavailable` deliberately does not
        // block submission, so a report that should have been stopped stays submittable
        // even after the network recovers. The identity check stops a stale rejection
        // wiping a newer entry. Return the original promise, never the .catch() result.
        promise.catch(() => {
            if (gamedata_cache.current?.promise === promise) {
                gamedata_cache.current = null;
            }
        });
        return promise;
    }, [game_id]);

    // Guards against a slow response for one report type or game landing after the
    // reporter has moved on and overwriting what they are looking at.
    const generation = React.useRef(0);

    React.useEffect(() => {
        const mine = ++generation.current;
        set_outcomes(null);

        void evaluateAsyncChecks(items, {
            game_id,
            review_id,
            reported_user_id,
            note,
            fetchGamedata,
        }).then((result) => {
            if (generation.current === mine) {
                set_outcomes(result);
            }
        });
        // `note` is deliberately absent: async checks never read it, and including it
        // would restart evaluation on every keystroke. Synchronous checks read the
        // live note through buildResults below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, game_id, review_id, reported_user_id, fetchGamedata]);

    return buildResults(
        items,
        { game_id, review_id, reported_user_id, note, fetchGamedata },
        outcomes,
        attestations,
    );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/lib/useReportChecklist.test.tsx`
Expected: PASS, 7 tests. Two beyond the five listed above were added during execution: one
asserting that typing in the note does not refetch game data, and one asserting a rejected fetch
is retried on the next evaluation rather than served from cache.

- [ ] **Step 5: Commit**

```bash
git add src/lib/useReportChecklist.ts src/lib/useReportChecklist.test.tsx
git commit -m "feat: add useReportChecklist hook"
```

---

### Task 4: The two presentational components

**Files:**
- Create: `src/components/Report/ReportChecklist.tsx`, `src/components/Report/ReportChecklist.css`
- Create: `src/components/Report/ReportChecklistBlocker.tsx`, `src/components/Report/ReportChecklistBlocker.css`

**Interfaces:**
- Consumes: `ChecklistItemResult`, `ChecklistItemId` from Task 1.
- Produces: `<ReportChecklist results onToggle />` and `<ReportChecklistBlocker result />`.

Every row carries `data-checklist-item` and `data-state`; the blocker carries
`data-checklist-blocker`. End-to-end tests target those attributes rather than translated prose.

- [ ] **Step 1: Write ReportChecklist**

Create `src/components/Report/ReportChecklist.tsx` (AGPL header, then):

```tsx
import * as React from "react";

import { pgettext } from "@/lib/translate";

import type { ChecklistItemId, ChecklistItemResult } from "@/lib/report_checklist";

import "./ReportChecklist.css";

interface ReportChecklistProps {
    results: ChecklistItemResult[];
    onToggle: (id: ChecklistItemId) => void;
}

export function ReportChecklist({ results, onToggle }: ReportChecklistProps): React.ReactElement | null {
    if (results.length === 0) {
        return null;
    }

    return (
        <div className="ReportChecklist">
            <div className="checklist-heading">
                {pgettext("Heading above the report submission checklist", "Before you can submit")}
            </div>
            <ul>
                {results.map((result) => (
                    <li key={result.id} data-checklist-item={result.id} data-state={result.state}>
                        {result.kind === "attestation" ? (
                            <label>
                                <input
                                    type="checkbox"
                                    checked={result.state === "satisfied"}
                                    onChange={() => onToggle(result.id)}
                                />
                                <span className="label-text">{result.label}</span>
                            </label>
                        ) : (
                            <div className="check-row">
                                <span className="marker" aria-hidden="true" />
                                {/* State is otherwise carried only by the marker's glyph and
                                    colour, which is hidden from assistive technology. These two
                                    states render no visible detail text, so without this a
                                    screen-reader user cannot tell a passed check from a running
                                    one. `actionable` and `unavailable` are excluded on purpose:
                                    both already render a .detail line stating their situation. */}
                                {(result.state === "satisfied" || result.state === "pending") && (
                                    <span className="sr-only">
                                        {result.state === "satisfied"
                                            ? pgettext(
                                                  "Screen-reader label for a checklist item that passed",
                                                  "Done:",
                                              )
                                            : pgettext(
                                                  "Screen-reader label for a checklist item still being checked",
                                                  "Checking:",
                                              )}
                                    </span>
                                )}
                                <span className="label-text">{result.label}</span>
                            </div>
                        )}
                        {result.state === "unavailable" && (
                            <div className="detail">
                                {pgettext(
                                    "Shown when a report checklist check could not be run",
                                    "We could not check this. You can still submit your report.",
                                )}
                            </div>
                        )}
                        {result.state === "actionable" && result.message && (
                            <div className="detail">{result.message}</div>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
```

- [ ] **Step 2: Write ReportChecklist.css**

Create `src/components/Report/ReportChecklist.css`:

```css
.ReportChecklist {
    border: 1px solid var(--shade4);
    border-radius: 0.25rem;
    padding: 0.5rem 0.75rem;
    margin: 0.75rem 0 0;

    .checklist-heading {
        font-size: 0.7rem;
        letter-spacing: 0.07em;
        text-transform: uppercase;
        opacity: 0.7;
        margin-bottom: 0.4rem;
    }

    ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    li {
        padding: 0.2rem 0;
    }

    label {
        display: flex;
        align-items: flex-start;
        gap: 0.4rem;
        cursor: pointer;
    }

    .check-row {
        display: flex;
        align-items: flex-start;
        gap: 0.4rem;
    }

    .marker {
        flex: none;
        width: 1rem;
        text-align: center;
    }

    /* Glyph and colour come entirely from the state — there is deliberately no
     * default, so a state added later cannot silently inherit the satisfied tick. */
    li[data-state="satisfied"] {
        .marker::before {
            content: "\2713";
            color: var(--success);
        }

        .label-text {
            opacity: 0.7;
        }
    }

    /* A bullet, not a pencil: U+270E is emoji-eligible and gets colour-emoji
     * presentation on some platforms, which this repository forbids. */
    li[data-state="actionable"] .marker::before {
        content: "\2022";
        color: var(--danger);
    }

    li[data-state="pending"] .marker::before {
        content: "\22EF";
        opacity: 0.6;
    }

    li[data-state="unavailable"] .marker::before {
        content: "?";
        opacity: 0.6;
    }

    .detail {
        margin-left: 1.4rem;
        font-size: 0.85rem;
        opacity: 0.8;
        white-space: pre-line;
    }
}
```

- [ ] **Step 3: Write ReportChecklistBlocker**

Create `src/components/Report/ReportChecklistBlocker.tsx` (AGPL header, then):

```tsx
import * as React from "react";

import type { ChecklistItemResult } from "@/lib/report_checklist";

import "./ReportChecklistBlocker.css";

interface ReportChecklistBlockerProps {
    result: ChecklistItemResult;
}

export function ReportChecklistBlocker({
    result,
}: ReportChecklistBlockerProps): React.ReactElement {
    return (
        <div className="ReportChecklistBlocker" data-checklist-blocker={result.id}>
            <div className="claim">{result.label}</div>
            {result.message && <div className="reason">{result.message}</div>}
        </div>
    );
}
```

- [ ] **Step 4: Write ReportChecklistBlocker.css**

Create `src/components/Report/ReportChecklistBlocker.css`:

```css
/* --reject is OGS's red in both themes (#ff410f light, #a62705 dark).
 * Deliberately NOT --danger, which is orange in this codebase. */
.ReportChecklistBlocker {
    border: 1px solid var(--shade4);
    border-left: 3px solid var(--reject);
    border-radius: 0.25rem;
    padding: 0.6rem 0.75rem;
    margin: 0 0 0.75rem;

    .claim {
        font-weight: 600;
    }

    .reason {
        margin-top: 0.25rem;
        font-size: 0.9rem;
        opacity: 0.9;
        white-space: pre-line;
    }
}
```

- [ ] **Step 5: Verify both compile**

Run: `yarn type-check`
Expected: PASS, no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/Report/ReportChecklist.tsx src/components/Report/ReportChecklist.css \
        src/components/Report/ReportChecklistBlocker.tsx src/components/Report/ReportChecklistBlocker.css
git commit -m "feat: add report checklist components"
```

---

### Task 5: Wire the checklist into Report.tsx

**Files:**
- Modify: `src/components/Report/Report.tsx`

**Interfaces:**
- Consumes: `getChecklist` (Task 2), `useReportChecklist` (Task 3), `checklistSatisfied` (Task 1), `ReportChecklist` and `ReportChecklistBlocker` (Task 4).
- Produces: no new exports. `ReportDescription` loses its `check_applicability` field.

- [ ] **Step 1: Remove the old gate machinery**

In `src/components/Report/Report.tsx`:

1. Delete the `Gamedata` type (now in `report_checklist.ts`).
2. Delete `checkGameForEscapingReportApplicability` and `checkGameForStallingReportApplicability`.
3. Delete `check_applicability?: ...` from the `ReportDescription` interface.
4. Delete the `check_applicability: ...` lines from the `escaping` and `stalling` entries of `report_categories`.
5. Delete these state declarations: `validating`, `set_validating`, `inapplicable_reason`, `set_inapplicable_reason`.
6. Delete the whole `React.useEffect` that calls `category.check_applicability` (the one whose dependency array is `[category, game_id]`).
7. Delete `const show_game_id_required_text = ...` and `const more_description_needed = ...`.
8. Remove `interpolate` from the `@/lib/translate` import on line 23. Its only use is the
   character-countdown block deleted in item 7, so leaving it in fails lint.
   **Keep `get`** — it is still used by the source-report effect (`get(\`moderation/incident/...\`)`),
   which this task does not touch. Keep `post`, `_` and `pgettext`.

- [ ] **Step 2: Add the checklist wiring**

Add these imports:

```tsx
import { checklistSatisfied, type ChecklistItemId } from "@/lib/report_checklist";
import { getChecklist } from "@/lib/report_checklist_items";
import { useReportChecklist } from "@/lib/useReportChecklist";
import { ReportChecklist } from "./ReportChecklist";
import { ReportChecklistBlocker } from "./ReportChecklistBlocker";
```

Inside the component, after `const category = report_categories.find(...)`:

```tsx
const [attestations, set_attestations] = React.useState<Record<ChecklistItemId, boolean>>({});

// Memoised so the hook's async effect does not restart on every render.
const checklist_items = React.useMemo(
    () => getChecklist(report_type, category),
    [report_type, category],
);

const checklist = useReportChecklist({
    items: checklist_items,
    game_id,
    review_id,
    reported_user_id,
    note,
    attestations,
});

const blocker = checklist.find((r) => r.state === "blocked");

// Attestations belong to the report type, so a type change clears them.
React.useEffect(() => {
    set_attestations({});
}, [report_type]);

function toggleAttestation(id: ChecklistItemId) {
    set_attestations((prev) => ({ ...prev, [id]: !prev[id] }));
}
```

- [ ] **Step 3: Rewrite canSubmit**

Replace the body of `canSubmit()` with:

```tsx
function canSubmit() {
    // The category guard must come first: checklistSatisfied is vacuously true for
    // the empty list, so without it an unselected report type would enable the button.
    if (!category) {
        return false;
    }

    if (submitting) {
        return false;
    }

    if (!reported_user_id) {
        return false;
    }

    return checklistSatisfied(checklist);
}
```

- [ ] **Step 4: Rewrite the details block**

Replace the whole `<div className="details">…</div>` block, and the
`{more_description_needed && …}` block that follows it, with:

```tsx
{blocker ? (
    <ReportChecklistBlocker result={blocker} />
) : category ? (
    <div className="details">
        <textarea
            className="notes"
            value={note}
            onChange={(ev) => set_note(ev.target.value)}
            placeholder={_(
                "Please provide any relevant details about the problem you are reporting.",
            )}
        />
        <ReportChecklist results={checklist} onToggle={toggleAttestation} />
    </div>
) : null}
```

The `required` class on the textarea is gone: the description-length shortfall now appears
as a checklist row instead of a border colour.

- [ ] **Step 4b: Fix the layout in `src/components/Report/Report.css`**

`.Report` is a flex column, but `.details` is `display: flex` with no direction — it defaults to
row. That never mattered while `.details` held one child at a time; now it holds the textarea and
the checklist as siblings, which would render them side by side in a 25rem card.

- Add `flex-direction: column;` to `.details`.
- Change `.buttons` from `margin-top: 1px` to `margin-top: auto`. A no-op normally, since
  `.details { flex: 1 }` already pushes the buttons down — but when a blocker replaces `.details`
  nothing claims the leftover height, and without this the buttons ride up under the blocker.
- Delete the now-dead `.characters-remaining-prompt` and `.required-text` rules.
- **Do not delete `.required`.** It sits between them and looks like part of the same group, but
  it is still applied to the type-picker `<select>`. Removing it silently drops the "choose a
  report type" highlight.

- [ ] **Step 5: Verify it compiles and unit tests still pass**

Run: `yarn type-check`
Expected: PASS.

Run: `yarn test`
Expected: PASS. `report_util.test.ts` is untouched and must still pass.

- [ ] **Step 6: Manual smoke test**

The docker stack already serves OGS at `http://localhost:1080` with hot reloading — do not
start a dev server. In a browser:

1. Open a finished game, report the opponent, choose **Stopped Playing**. Expect four ticked
   checks and one unticked box; the button is disabled until you tick it.
2. Choose **Stopped Playing** on a game the opponent resigned. Expect the blocker at the top,
   no textarea, no checklist.
3. Report from a profile page with no game. Choose **Score Cheating**. Expect the
   "report on the game page" blocker.
4. Choose **Other** from a profile page. Expect a "more characters needed" row that clears as
   you type, and no blocker.

- [ ] **Step 7: Commit**

```bash
git add src/components/Report/Report.tsx
git commit -m "feat: gate report submission on the checklist"
```

---

### Task 6: Update the existing end-to-end tests

**Files:**
- Modify: `e2e-tests/helpers/user-utils.ts:504-539`
- Modify: `e2e-tests/moderation/mod-block-early-escape-report.ts:71-76`
- Modify: `e2e-tests/moderation/mod-block-early-stall-report.ts:72-77`
- Modify: `e2e-tests/moderation/mod-reject-escape-report-during-game.ts:98-113` and `:151-159`

**Interfaces:**
- Consumes: the `data-checklist-item`, `data-state` and `data-checklist-blocker` attributes from Task 4.
- Produces: `tickReportAttestations(page)` exported from `e2e-tests/helpers/user-utils.ts`.

- [ ] **Step 1: Add the shared attestation helper**

In `e2e-tests/helpers/user-utils.ts`, above `submitReportForm`:

```ts
/**
 * Tick every attestation the report checklist is still waiting on. Reports cannot be
 * submitted until they are all ticked, so every helper that files a report calls this.
 */
export const tickReportAttestations = async (page: Page) => {
    const boxes = page.locator('[data-checklist-item][data-state="actionable"] input[type=checkbox]');

    for (let i = (await boxes.count()) - 1; i >= 0; i--) {
        await boxes.nth(i).check();
    }

    await expect(
        page.locator('[data-checklist-item][data-state="actionable"] input[type=checkbox]'),
        "every attestation should be ticked before submitting",
    ).toHaveCount(0);
};
```

Iterating downwards matters: ticking a box changes its `data-state` to `satisfied`, which
removes it from the locator's match set and would renumber the remaining indices.

- [ ] **Step 2: Call it from submitReportForm**

In `submitReportForm`, between filling the notes box and finding the submit button:

```ts
    const notesBox = page.locator("textarea.notes");
    await notesBox.fill(notes);

    await tickReportAttestations(page);

    const submitButton = await expectOGSClickableByName(page, /Report User$/);
```

- [ ] **Step 3: Re-target the two early-report tests**

In `e2e-tests/moderation/mod-block-early-escape-report.ts`, replace the notes-box block:

```ts
    // The blocking check collapses the form, so there is no textarea to inspect —
    // the reason now appears in the blocker.
    const blocker = reporterPage.locator('[data-checklist-blocker="escaping.enough_moves"]');
    await expect(blocker).toBeVisible();
    await expect(blocker).toContainText("leaves the game without playing");

    await expect(reporterPage.locator("textarea.notes")).toHaveCount(0);

    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).not.toBeEnabled();
```

Remove the now-unused `const notesBox = ...` line.

In `e2e-tests/moderation/mod-block-early-stall-report.ts`, make the same replacement using
`'[data-checklist-blocker="stalling.enough_moves"]'` and expecting the text
`"aren't enough moves played"`.

- [ ] **Step 4: Change the premise of the during-game test**

In `e2e-tests/moderation/mod-reject-escape-report-during-game.ts`, replace lines 98-113 (from
`const notesBoxDuringGame` through the OK-button click) with:

```ts
    // The client now blocks this before any request is sent, so there is no server
    // error to dismiss. The backend rule at moderate.py:758-769 still stands as
    // defence in depth; nothing in the browser suite exercises it any more.
    const blocker = reporterPage.locator('[data-checklist-blocker="escaping.game_ended"]');
    await expect(blocker).toBeVisible();
    await expect(blocker).toContainText("has not ended yet");

    await expect(reporterPage.locator("textarea.notes")).toHaveCount(0);
    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).not.toBeEnabled();

    // Close the dialog before playing on.
    const closeButton = await expectOGSClickableByName(reporterPage, /^Close$/);
    await closeButton.click();
```

In the after-game half, add the attestation step after filling the notes box:

```ts
    await notesBoxAfterGame.fill("E2E test - reporting after game ended");

    await tickReportAttestations(reporterPage);

    const reportButtonAfterGame = await expectOGSClickableByName(reporterPage, /Report User$/);
```

Add `tickReportAttestations` to the existing `@helpers/user-utils` import in that file.

- [ ] **Step 5: Run the two cheap tests**

Run: `yarn test:e2e -- --grep "Block early escape reports"`
Expected: PASS.

Pause for around 30 seconds before the next run so the stack quiesces, then:

Run: `yarn test:e2e -- --grep "Block early stalling reports"`
Expected: PASS.

- [ ] **Step 6: Run the game-driven test**

Pause again, then:

Run: `yarn test:e2e -- --grep "Reject escape reports during active game"`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add e2e-tests/helpers/user-utils.ts e2e-tests/moderation/mod-block-early-escape-report.ts \
        e2e-tests/moderation/mod-block-early-stall-report.ts \
        e2e-tests/moderation/mod-reject-escape-report-during-game.ts
git commit -m "test: update e2e tests for the report checklist"
```

---

### Task 7: New end-to-end test for the attestation gate

**Files:**
- Create: `e2e-tests/moderation/mod-escaping-attestation-required.ts`
- Modify: `e2e-tests/moderation/moderation.spec.ts`

**Interfaces:**
- Consumes: `tickReportAttestations` from Task 6.
- Produces: `escapingAttestationRequiredTest`.

This test deliberately does not submit, so it creates no report and needs no
`withIncidentIndicatorLock`.

- [ ] **Step 1: Write the test**

Create `e2e-tests/moderation/mod-escaping-attestation-required.ts` (AGPL header, then):

```ts
/*
 * No seeded data in use
 */

import type { CreateContextOptions } from "@helpers";

import { BrowserContext, expect } from "@playwright/test";

import {
    prepareNewUser,
    newTestUsername,
    openPlayerDetailsPopover,
    tickReportAttestations,
} from "@helpers/user-utils";
import {
    createDirectChallenge,
    acceptDirectChallenge,
    defaultChallengeSettings,
} from "@helpers/challenge-utils";
import { playMoves, waitForGameViewReady } from "@helpers/game-utils";

export const escapingAttestationRequiredTest = async ({
    createContext,
}: {
    createContext: (options?: CreateContextOptions) => Promise<BrowserContext>;
}) => {
    const { userPage: reporterPage } = await prepareNewUser(
        createContext,
        newTestUsername("EAttRep"),
        "test",
    );

    const accusedUsername = newTestUsername("EAttAcc");
    const { userPage: accusedPage } = await prepareNewUser(createContext, accusedUsername, "test");

    // 60s main time: the default 2s blitz can time the game out mid-sequence on a
    // loaded dev stack, which would end the game the wrong way for this test.
    await createDirectChallenge(reporterPage, accusedUsername, {
        ...defaultChallengeSettings,
        gameName: "E2E escaping attestation",
        boardSize: "9x9",
        speed: "live",
        mainTime: "60",
        timePerPeriod: "10",
        periods: "1",
        color: "black",
    });

    await acceptDirectChallenge(accusedPage);

    const goban = reporterPage.locator(".Goban[data-pointers-bound]");
    await goban.waitFor({ state: "visible" });

    // At least two moves, so escaping.enough_moves passes.
    await playMoves(reporterPage, accusedPage, ["D5", "E5", "D6", "E6"], "9x9");

    // End by passing and scoring, so escaping.game_ended passes and nobody resigned.
    await reporterPage.getByText("Pass", { exact: true }).click();
    await accusedPage.getByText("Pass", { exact: true }).click();

    const accusedAccept = accusedPage.getByText("Accept");
    await expect(accusedAccept).toBeVisible();
    await accusedAccept.click();

    const reporterAccept = reporterPage.getByText("Accept");
    await expect(reporterAccept).toBeVisible();
    await reporterAccept.click();

    await expect(reporterPage.getByText("wins by")).toBeVisible();

    await waitForGameViewReady(reporterPage);

    const playerLink = reporterPage.locator(
        `.white.player-name-container a.Player[data-ready="true"]`,
    );
    await openPlayerDetailsPopover(reporterPage, playerLink);

    await expect(reporterPage.getByRole("button", { name: /Report$/ })).toBeVisible();
    await reporterPage.getByRole("button", { name: /Report$/ }).click();

    await expect(reporterPage.getByText("Request Moderator Assistance")).toBeVisible();

    await reporterPage.selectOption(".type-picker select", { value: "escaping" }); // cspell:disable-line

    // Every data check should pass, leaving only the attestation.
    const attestation = reporterPage.locator(
        '[data-checklist-item="escaping.waited_reasonable_time"]',
    );
    await expect(attestation).toBeVisible();
    await expect(attestation).toHaveAttribute("data-state", "actionable");

    await expect(
        reporterPage.locator('[data-checklist-item="escaping.game_ended"]'),
    ).toHaveAttribute("data-state", "satisfied");

    await reporterPage.locator("textarea.notes").fill("E2E test - checking the attestation gate");

    // The button is held by the unticked attestation alone.
    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).not.toBeEnabled();

    await tickReportAttestations(reporterPage);

    await expect(attestation).toHaveAttribute("data-state", "satisfied");
    await expect(reporterPage.getByRole("button", { name: /Report User$/ })).toBeEnabled();

    // Deliberately not submitted: no report is filed, so no incident-indicator lock
    // is needed and the queue is left as we found it.
};
```

- [ ] **Step 2: Register the test**

In `e2e-tests/moderation/moderation.spec.ts`, add the import next to the other
`mod-*` imports:

```ts
import { escapingAttestationRequiredTest } from "./mod-escaping-attestation-required";
```

and inside the `describe` block, below the "Reject escape reports during active game" line:

```ts
    ogsTest("Escaping report requires the attestation", escapingAttestationRequiredTest);
```

- [ ] **Step 3: Run it**

Pause around 30 seconds after any previous end-to-end run, then:

Run: `yarn test:e2e -- --grep "Escaping report requires the attestation"`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add e2e-tests/moderation/mod-escaping-attestation-required.ts \
        e2e-tests/moderation/moderation.spec.ts
git commit -m "test: add e2e coverage for the escaping attestation gate"
```

---

### Task 8: Spec amendments and full verification

**Files:**
- Modify: `docs/superpowers/specs/2026-08-21-report-submission-checklist-design.md`
- Modify: this plan, if execution taught you anything

- [ ] **Step 1: Amend the design spec's data model**

In the "Data model" section, replace the single `data_check` variant with the two variants
implemented in Task 1, and add a sentence explaining why: the description-length check must
re-run on every keystroke while the game-data checks must not, so sync and async cannot be
distinguished by inspecting the returned value.

- [ ] **Step 2: Amend the design spec's error handling**

In "Error handling", record that an `unavailable` result carries no message and that
`ReportChecklist` supplies the wording, so the engine holds no user-visible strings.

- [ ] **Step 3: Record anything else execution changed**

If any task deviated from this plan, amend both this plan and the spec to match what was
actually built. A spec that no longer describes the code is worse than no spec.

- [ ] **Step 4: Full verification**

Run each, and fix anything that fails:

```
yarn type-check
yarn lint
yarn prettier:file src/lib/report_checklist.ts src/lib/report_checklist.test.ts src/lib/report_checklist_items.ts src/lib/report_checklist_items.test.ts src/lib/useReportChecklist.ts src/lib/useReportChecklist.test.tsx src/components/Report/ReportChecklist.tsx src/components/Report/ReportChecklist.css src/components/Report/ReportChecklistBlocker.tsx src/components/Report/ReportChecklistBlocker.css src/components/Report/Report.tsx
yarn spellcheck
yarn test
yarn build
```

- [ ] **Step 5: Run the whole affected end-to-end families**

Pull-request CI does not run Playwright, so this is a manual pass. `submitReportForm` is shared,
so both families are in scope, not only the tests this plan touched. Pause between runs.

Run: `yarn test:e2e -- --grep "@Mod"`
Expected: PASS.

Pause, then:

Run: `yarn test:e2e -- --grep "@CM"`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/specs/2026-08-21-report-submission-checklist-design.md \
        docs/superpowers/plans/2026-08-21-report-submission-checklist.md
git commit -m "docs: reconcile the checklist spec and plan with what was built"
```
