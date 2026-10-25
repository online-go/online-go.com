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
    /**
     * The stall kind the reporter has selected in the stalling report form
     * (a StallingKind from stalling_kinds.ts), or undefined until they pick one.
     * Live form state, like `note` — so only sync checks may read it.
     */
    stalling_kind?: string;
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

/**
 * Re-evaluated on every render, so it may depend on live form state.
 * `evaluate` may return "unavailable" when it cannot determine the outcome at all —
 * distinct from `{ met: false }`, which means it determined the claim does not hold.
 */
export interface SyncDataCheckItem extends DataCheckCommon {
    sync: true;
    evaluate: (ctx: ChecklistContext) => CheckOutcome | "unavailable";
}

/**
 * Evaluated only when the report type or reported game changes.
 * `evaluate` may return "unavailable" when it cannot determine the outcome at all —
 * distinct from `{ met: false }`, which means it determined the claim does not hold.
 */
export interface AsyncDataCheckItem extends DataCheckCommon {
    sync: false;
    evaluate: (ctx: ChecklistContext) => Promise<CheckOutcome | "unavailable">;
}

export type DataCheckItem = SyncDataCheckItem | AsyncDataCheckItem;
export type ChecklistItem = AttestationItem | DataCheckItem;

export type ChecklistItemState = "satisfied" | "pending" | "unavailable" | "actionable" | "blocked";

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
 *
 * Returns `{}` both when a sync blocker short-circuited and when there were simply no
 * async checks to run — the two cases are indistinguishable from the return value
 * alone. Callers must always pass the result to `buildResults`, which independently
 * re-evaluates the sync checks and so renders the short-circuited blocker correctly
 * either way; do not treat an empty `AsyncOutcomes` as "nothing to show".
 */
export async function evaluateAsyncChecks(
    items: ChecklistItem[],
    ctx: ChecklistContext,
): Promise<AsyncOutcomes> {
    const pending: Array<{ id: ChecklistItemId; promise: Promise<CheckOutcome | "unavailable"> }> =
        [];

    for (const item of items) {
        if (item.kind !== "data_check") {
            continue;
        }
        if (item.sync) {
            const outcome = item.evaluate(ctx);
            // "unavailable" is not a blocking failure — it is the absence of a
            // determination, so it must not short-circuit the checks after it.
            if (outcome !== "unavailable" && !outcome.met && item.blocking) {
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
