# Report Submission Checklist — Design

Date: 2026-08-21
Status: Approved for planning
Scope: `ogs-ui` only. No backend change.

Companion documents:

- `2026-08-21-report-checklists-framework-spec.md` — the lead document. The capability, its
  invariants, and the axes it can grow along. Its invariants bind this design.
- `2026-08-21-report-submission-checklist-feature-spec.md` — the v1 proposal, for review of the
  items themselves.

## Summary

Every class of report can carry a set of checklist items that must be satisfied before the
reporter can submit. Items come in two kinds. An **attestation** is a claim the reporter ticks.
A **data check** is evaluated on the reporter's behalf; they see its result and, when it fails,
the reason they cannot proceed.

The checklist is the mechanism for screening wrong reports out of the moderation queue and
teaching the reporting standard at the moment a reporter is motivated to learn it. It
generalises the three ad-hoc gates already in `Report.tsx` — `game_id_required`,
`min_description_length` and `check_applicability` — into one ordered, visible, extensible list
behind a single submission gate, and adds the category those gates have no way to express: the
things a reporter should confirm before filing.

## The problem

Wrong reports cost twice. They consume community-moderator attention that should be going to
real incidents, and they leave the reporter no wiser — the report is closed, usually without an
explanation they can learn anything from, and they go on to file the same kind of report again.

The report dialog is where both costs could be avoided, and today it does almost nothing about
either. It is a form: pick a type, write a description, send. It does not **screen** — it rarely
tells a reporter that what they are describing cannot be acted on. And it does not **educate** —
it does not tell them what the standard actually is, at the one moment they are motivated to
find out.

The gates that already exist are evidence of the gap rather than a solution to it. There are
three of them, they were each added to solve a specific nuisance, and none of them communicates:

- Two applicability checks (`escaping`, `stalling`) report their reason as _placeholder text
  inside the description textarea_, which disappears the moment the reporter types and which
  most people never read.
- `game_id_required` swaps the textarea for a line of prose.
- `min_description_length` shows a character countdown.

Three mechanisms, three presentations, no shared vocabulary, and nowhere to put "here is what
you should have checked before filing this". That last category does not exist at all today.

## Goals

In priority order, as set by the requester:

1. **Screen out reports that cannot be acted on**, before they reach the queue. This is the
   moderator-workload half of the problem.
2. **Educate the reporter at the point of reporting**, so they understand the standard, select
   themselves out when it does not apply, and report better next time. This is the half that
   compounds — a reporter who learns the rule stops generating the cost.
3. **Make careless reporting harder.** Served _indirectly_: requiring explicit confirmation of
   the natural things to check raises the effort of filing without thinking. It is explicitly
   **not** served by threatening language — see "Authoring guidelines".

Screening and education are the same mechanism seen from two sides, which is why one feature
serves both: a check that blocks a report has to explain itself to do its job, and an
explanation given at the moment of reporting is the teaching.

Not a goal: giving moderators better evidence. The checklist is a submission gate, not a record.

### v1 is a pilot, not the answer

The problem above is site-wide and this version addresses one report type. That is deliberate,
and it should not be mistaken for a claim that the problem is solved. v1 builds the mechanism,
migrates the existing ad-hoc gates onto it so there is one vocabulary instead of three, and
works one report type through properly as a demonstration. Whether the checklist actually
deflects reports and teaches anybody is a question the first release exists to answer. The
"Out of scope" section is therefore a roadmap, not a list of things declined.

## Decisions

| Question                 | Decision                                                                                                                                                 | Rationale                                                                                                                               |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Enforcement              | **Client-only.** The submit button stays disabled; no POST-time revalidation.                                                                            | Matches how `game_id_required` and `check_applicability` work today. The backend keeps its own independent rules.                       |
| Definition source        | **Code registry only**, behind one lookup function that is the seam for later sources.                                                                   | The requester named admin-config forms and fair-play-filter-style rules as eventual sources. Neither is in v1.                          |
| Persistence              | **Nothing stored in v1.**                                                                                                                                | Moderator evidence is not a goal. No model change, no migration.                                                                        |
| Data source for checks   | **Client-side fetches** against existing endpoints, via a source-agnostic async interface.                                                               | Covers everything v1 needs. A check backed by a new endpoint drops in later without reshaping the framework.                            |
| Check failure or timeout | **Fail open**, with a visible "could not check" state.                                                                                                   | Never trap a legitimate reporter behind a network fault. Silently dropping the item, as the current code does, teaches nobody anything. |
| Item scope               | **Per report type only.** No site-wide item set.                                                                                                         | Avoids a boilerplate "I have read the guidelines" tickbox that everyone learns to click past, which would work against goal 2.          |
| Layout                   | **Failed data checks hoist above the description and collapse the rest of the form.** Everything else renders below the description, next to the button. | See "Layout" below.                                                                                                                     |
| Backend test coverage    | **Accepted loss** on the during-game escaping rule.                                                                                                      | Defence-in-depth. See "Testing".                                                                                                        |

### Invariants inherited from the framework

The framework spec states invariants that hold however far the capability grows. Two of them are
not otherwise visible in this design, and an implementer needs to know they exist.

**A check may stop a report without disclosing what it knows.** No v1 check is affected — all of
them read public game data the reporter can already see. It constrains the `message` on a failing
`CheckOutcome`: where a fully specific reason would reveal something about the accused that the
reporter is not entitled to see, the message is less specific — but never false and never absent.

**The checklist never silently changes what gets filed.** v1 satisfies this trivially, since it
reroutes nothing. It is worth naming because the opposite behaviour lives next door in the same
flow: a sandbagging report is converted server-side to `thrown_game` or `sandbagging_assessment`
without the reporter being told (`moderate.py:741-756`). That conversion is out of scope here, but
nothing in this design may grow in that direction.

## Layout

Two states, selected during design review against mockups.

**No data check has failed.** No section above the description. Below the description, above the
buttons, a single list headed "Before you submit" containing only what still needs the
reporter's attention: attestation tickboxes (ticked or not — a ticked box is the reporter's own
confirmation and stays visible), and any actionable shortfall such as "20 more characters needed".
A data check that has passed is not listed: it taught everything it has to teach by passing
silently, and a static mockup's column of ticks turned out in practice to be a list that demands
reading and asks nothing. While any data check is still in flight, its row is not shown either —
a single shared line stands in for all of them, so the reporter still sees why the button is
disabled, and the list reflows once when the checks resolve rather than once per check. When
nothing is left to show — every data check passed, no attestation to tick, checks resolved — the
list renders nothing at all: no heading, no border. Everything the reporter can still act on sits
together, beside the button it governs.

**A data check has failed.** The failed item renders alone above the description, styled as a
blocker, carrying its reason and the instruction to choose a different report type. The
description textarea and the rest of the checklist are **not rendered**.

A missing game id reaches this state through the `report.game_identified` blocker listed in
`REPORT_CHECKLISTS`, so the existing behaviour is preserved: the reporter sees _"Please report the
user on the game page so we know where to look."_ and no textarea. It arrives by the general rule
instead of the special-cased `show_game_id_required_text` branch.

When a report type has no items at all — `warning` and `troll` declare none — the checklist
renders nothing, and the dialog looks as it does today.

The reasoning for collapsing rather than dimming or leaving the form live: once a blocking data
check fails, the reporter cannot submit whatever else they do, so soliciting tickboxes and a
longer description asks for work that cannot pay off. A reporter who ticks every box, writes a
description and _still_ cannot submit reads the dialog as broken. Collapsing also matches what
`Report.tsx` already does when a game id is missing, where `show_game_id_required_text`
suppresses the textarea entirely.

Ticked attestations are lost if the reporter switches report type and switches back. This is
accepted: attestations are cleared on type change anyway, because they belong to the type.

## Data model

All types live in `ogs-ui/src/lib/report_checklist.ts`.

```ts
/**
 * Stable and opaque. Never renamed, never reused for a different claim.
 * These ids are the key for any future record of what a reporter was shown.
 */
export type ChecklistItemId = string;

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

/**
 * Re-evaluated on every render, so it may depend on live form state. `evaluate` may
 * return "unavailable" when it cannot determine the outcome at all — see "Error
 * handling" below.
 */
export interface SyncDataCheckItem extends DataCheckCommon {
    sync: true;
    evaluate: (ctx: ChecklistContext) => CheckOutcome | "unavailable";
}

/** Evaluated only when the report type or reported game changes. */
export interface AsyncDataCheckItem extends DataCheckCommon {
    sync: false;
    evaluate: (ctx: ChecklistContext) => Promise<CheckOutcome | "unavailable">;
}

export type DataCheckItem = SyncDataCheckItem | AsyncDataCheckItem;
export type ChecklistItem = AttestationItem | DataCheckItem;
```

The two kinds — attestation and data check — are a discriminated union rather than one type with
optional fields, because they carry different data and are phrased differently. An attestation has
no `evaluate` and its label is first person — _"I waited a reasonable time for this player to
play"_. A data check has an `evaluate` and its label is a third-person statement about the world —
_"This player did not resign the game"_. The union makes it impossible to construct an attestation
with an evaluate function, or a data check with no way to be established.

`blocking` exists only on `data_check`. An unticked attestation is never blocking: by definition
the reporter can satisfy it, which is what the tickbox is for. The form-collapsing state is
therefore triggered only by a failed data check.

A data check further declares whether it is synchronous — `SyncDataCheckItem` (`sync: true`) or
`AsyncDataCheckItem` (`sync: false`) — rather than one `data_check` variant whose `evaluate`
returns `CheckOutcome | Promise<CheckOutcome>`. The two must run on different schedules: the
description-length check has to re-run on every keystroke, while the game-data checks must run
only when the report type or reported game changes, not on every keystroke. Telling them apart by
inspecting what `evaluate` returns (`instanceof Promise`) cannot express this — it only reveals
whether a call has already been made, not how the call should be scheduled. Splitting the type
lets the compiler enforce the correct treatment of each item instead of leaving it to be inferred
at each call site.

### Result

Both kinds produce one flat shape, so the renderer walks a single ordered list and the
submission gate applies one rule to every entry.

```ts
export type ChecklistItemState =
    | "satisfied"
    | "pending" // async check in flight
    | "unavailable" // async check threw; does NOT gate submission
    | "actionable" // attestation unticked, or non-blocking check unmet
    | "blocked"; // blocking data check unmet

export interface ChecklistItemResult {
    id: ChecklistItemId;
    kind: "attestation" | "data_check";
    state: ChecklistItemState;
    label: string;
    message?: string;
}
```

The result contains no functions and no live objects. This is the persistence seam: storing it
later is a JSON field on `IncidentReport`, one line in the POST payload, and one line in
`ModerationIncidentReportList.post`. Stable ids are mandated now precisely so that a record
written later is still meaningful after items are reordered or strings retranslated.

## Evaluation

Two functions divide the work, in `src/lib/report_checklist.ts`, because sync and async checks
must run on different schedules. `evaluateAsyncChecks(items, ctx): Promise<AsyncOutcomes>` runs the
async data checks; `useReportChecklist` calls it only when the report type or reported game
changes, from an effect. `buildResults(items, ctx, asyncOutcomes, attestations):
ChecklistItemResult[]` is synchronous and pure, and runs on every render — including every
keystroke, since it re-evaluates sync checks against the live `ctx.note` each time it is called. A
single combined function could not serve both call sites: an async check must not be re-invoked on
every keystroke, and a sync check must not be frozen at whatever value it held when the report type
last changed. Splitting the two makes each function's calling contract explicit rather than leaving
it to be inferred from how a caller happens to invoke it.

`evaluateAsyncChecks`:

1. Walks items in declaration order. Synchronous checks are evaluated here too, but only to decide
   whether to short-circuit: if a synchronous check fails, is `blocking`, and did **not** return
   `"unavailable"`, the function returns `{}` immediately, without waiting on any async check that
   may already have started. `"unavailable"` is excluded deliberately — it is not a blocking
   failure, so a sync check reporting it must let the checks after it keep running. This is what
   keeps game-data fetches behind "we actually have a game" — an escaping check never fires
   against a missing game id, because `report.game_identified` is synchronous and ordered first.
2. Otherwise every async check's `evaluate(ctx)` is called and the resulting promises run in
   parallel via `Promise.all`. A rejection is caught and mapped to `"unavailable"` rather than
   propagating; the caught error is logged with `console.warn`.
3. Returns a map from item id to `CheckOutcome | "unavailable"`, covering only the async items
   that were actually run.

`buildResults` turns items plus that map into the displayable list, and is where the
form-collapsing behaviour lives:

- An attestation is `satisfied` if ticked, else `actionable`.
- A sync data check is re-evaluated fresh, right here, against the `ctx` passed in — this is how
  it sees the live note on every render. Its return, like an async check's, can itself be
  `"unavailable"`.
- An async data check looks itself up in `asyncOutcomes`. A missing entry (the map is `null`,
  i.e. evaluation is still in flight) means `pending`. `"unavailable"` means `unavailable`.
  Otherwise `met` decides `satisfied` vs. (`blocked` if `blocking`, else `actionable`).
- If any item's state comes out `blocked`, the function discards every other result and returns
  that one item alone — callers never have to apply that rule themselves. If more than one
  blocking check has failed, the earliest in declaration order wins, so which blocker the reporter
  sees is deterministic rather than a race.

Step 1 of `evaluateAsyncChecks` is what gates game-data fetches behind "we have a game id",
replacing the ad-hoc `needs_game_id_first` guard in the current effect.

**Invariant:** an async check that needs a game id must belong to a `REPORT_CHECKLISTS` entry that
lists `report.game_identified` first. Otherwise the synchronous game-id blocker will not exist —
or will not run before it — to gate it, and the check will fetch a missing game. A test in
`report_checklist_items.test.ts` derives this from `REPORT_CHECKLISTS` itself, so a type added
later without `report.game_identified` first is caught automatically.

**Shared fetch.** The three `escaping` data checks all need the same game data. `ChecklistContext`
exposes `fetchGamedata()`, implemented in `useReportChecklist.ts` as a promise held in a ref and
keyed by game id — not memoised per evaluation pass. A per-pass memo is too narrow: typing in the
description re-runs the synchronous checks, which re-runs evaluation, and a per-pass cache would
refetch game data alongside every keystroke. Keying by game id in a ref means the three escaping
checks share one request to `/termination-api/game/{id}` and typing costs nothing.

A rejected promise is cleared from that cache rather than being re-served on the next call.
Leaving it cached would turn one network blip into a session-long screening hole: `unavailable`
deliberately does not block submission, so a report that should have been screened out would stay
submittable even after the network recovers. An identity check on eviction stops a late, stale
rejection from wiping a newer cache entry that has since replaced it.

### Submission gate

`checklistSatisfied(results): boolean` returns `results.every((r) => r.state === "satisfied" ||
r.state === "unavailable")`. `pending` therefore gates submission, exactly as the current
`validating` flag does.

**Correctness trap:** `Array.prototype.every` is vacuously true on an empty array, so
`checklistSatisfied([])` is `true`. `canSubmit()` in `Report.tsx` must keep its existing
`if (!category) return false` guard ahead of the call to `checklistSatisfied`, or selecting no
report type — which produces an empty checklist — would enable the button.

### Error handling

An async check that rejects yields `unavailable` and does not gate submission. The rejection is
logged to the console with `console.warn`. A check — sync or async — can also return `unavailable`
directly from `evaluate`, for the case where it ran without error but still could not determine
the outcome (a required field missing from a payload, an argument it needs not being available).
Both paths land on the same state and are handled identically by `buildResults` and
`checklistSatisfied`.

The `unavailable` result carries no message. `report_checklist.ts` holds no user-visible strings
at all; `ReportChecklist.tsx` supplies the wording for that state — _"We could not check this, but
it will not stop your report."_ — so the engine stays a clean boundary between evaluating state and
explaining it.

**Stale-response guard.** The current effect at `Report.tsx:335-351` has no request-generation
guard, so a slow response for one game can land after the reporter has changed context and
overwrite the state. `useReportChecklist` guards against this with a monotonic `generation` ref:
each run of the effect increments it and captures its own value, and a result is applied only if
the ref still holds that value when the promise resolves — so a response for a superseded report
type or game is discarded, rather than being matched against a `(report_type, game_id)` key. This
is a latent bug in the existing code, fixed as part of this work.

## Files

### New

| Path                                                        | Contents                                                                   | Why separate                                                                                                               |
| ----------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/report_checklist.ts`                               | Types, `evaluateAsyncChecks()`, `buildResults()`                           | Pure logic, no React, directly unit-testable. `report_util.test.ts` sets the precedent.                                    |
| `src/lib/report_checklist_items.ts`                         | `REPORT_CHECKLISTS` registry, its `pgettext` strings, and `getChecklist()` | The policy file. Adding an attestation to another report type means editing only this, with no need to read the evaluator. |
| `src/lib/useReportChecklist.ts`                             | React binding: effect, result state, staleness guard                       | Keeps async lifecycle out of both the engine and `Report.tsx`.                                                             |
| `src/components/Report/ReportChecklist.tsx` + `.css`        | The below-description list                                                 | One component per file, co-located with its only parent.                                                                   |
| `src/components/Report/ReportChecklistBlocker.tsx` + `.css` | The single above-description blocker                                       | As above.                                                                                                                  |
| `src/lib/report_checklist.test.ts`                          | Evaluator unit tests                                                       | See "Testing".                                                                                                             |
| `src/lib/report_checklist_items.test.ts`                    | Registry and resolved-list unit tests                                      | See "Testing".                                                                                                             |
| `src/lib/useReportChecklist.test.tsx`                       | Hook unit tests                                                            | See "Testing".                                                                                                             |

`REPORT_CHECKLISTS` is `Record<string, ChecklistItem[]>`, not `Partial<Record<ReportType, ChecklistItem[]>>`
as the idiom it mirrors — `REPORT_TYPE_VOTABLE_ACTIONS` in `ogs/go_app/models/moderation.py` and
`COMMUNITY_MODERATION_REPORT_TYPES` in `report_util.ts` — would suggest. Keying on `string` rather than
`ReportType` is deliberate: importing `ReportType` here would reintroduce the dependency on
`Report.tsx` that `report_checklist_items.ts` is built to avoid. The cost is that a typo'd
report-type key compiles silently instead of being caught by the type checker; that is accepted,
not fixed, in the review that produced this correction.

### The seam

`getChecklist(type)` is the single point of access, and the only place a future source needs to be
merged in: `REPORT_CHECKLISTS[type] ?? []`, nothing else.

`REPORT_CHECKLISTS` is one table, keyed by report type, holding each type's complete item list in
evaluation order. There is no synthesis step: a v1 draft of this design built
`report.game_identified` and `report.description_length` on the fly from `category.game_id_required`
and `category.min_description_length` on `report_categories` in `Report.tsx`, and `getChecklist`
spliced them around the type's registry entry. That was cheap to build, but it meant a type's
requirements were split across two files and a function's control flow — the project owner tried to
answer "what does Score Cheating require?" from the code and could not, which is exactly the
inspectability the framework spec argues for. `REPORT_CHECKLISTS` now lists every item explicitly,
including `report.game_identified` and `report.description_length` where a type needs them, so the
table is the literal answer.

`gameIdentifiedItem` is a module-level constant — it takes no arguments, so a factory function
bought nothing. `descriptionLengthItem(minimum)` stays a factory, since its minimum differs per
type (`malicious_report` needs only 1 character; most others need 20).

`report_categories` in `Report.tsx` no longer carries `game_id_required` or
`min_description_length` — those fields drove the deleted synthesis step and nothing else read
them.

### `Report.tsx` changes

Removed:

- `check_applicability` from the `ReportDescription` interface
- `checkGameForEscapingReportApplicability` and `checkGameForStallingReportApplicability`
  (re-expressed in `report_checklist_items.ts`)
- the `inapplicable_reason` and `validating` state and the effect at lines 335-351
- `show_game_id_required_text` and its `.required-text` block
- `more_description_needed` and the `.characters-remaining-prompt` block
- `game_id_required` and `min_description_length` from the `ReportDescription` interface, once the
  one-table correction above deleted the synthesis step that had read them

Added:

```tsx
const [attestations, set_attestations] = React.useState<Record<ChecklistItemId, boolean>>({});
// Memoised: useReportChecklist restarts its async evaluation whenever the items
// array identity changes, and a fresh array each render would loop forever.
const checklist_items = React.useMemo(() => getChecklist(report_type), [report_type]);
const results = useReportChecklist({
    items: checklist_items,
    game_id,
    review_id,
    reported_user_id,
    note,
    attestations,
});
const blocker = results.find((r) => r.state === "blocked");
```

```tsx
{blocker ? (
    <ReportChecklistBlocker result={blocker} />
) : category ? (
    <>
        <textarea className={...} ... />
        <ReportChecklist results={results} onToggle={toggleAttestation} />
    </>
) : null}
```

`ReportChecklist` takes `results` and `onToggle` only — `attestations` stays local to `Report.tsx` and is
never passed as a prop; the component reads ticked-vs-not entirely from each result's `state`.

`attestations` is cleared whenever `report_type` changes.

The `Gamedata` type gains `phase`, which is already public — see `PUBLIC_GAMEDATA_FIELDS` in
`services/game-server/api.ts:26`.

The moderator-only `warning` path (`canWarn` / `sendWarning`, posting to `moderation/warn`) is
deliberately untouched. It is a different button hitting a different endpoint, and it is not a
report.

### Markup and accessibility

Attestations are real `<input type="checkbox">` elements with `<label htmlFor>`. The list is a
`<ul>`. Data-check rows are non-interactive and get no hover treatment, per the ogs-ui rule
against hover background changes on non-interactive elements.

Every row carries `data-checklist-item={id}` and `data-state={state}`; the blocker carries
`data-checklist-blocker={id}`. End-to-end tests target these rather than translated prose.

All labels and messages are translated with `pgettext` at module scope in
`report_checklist_items.ts`.

## v1 content

The framework migrates the existing gates for every type that declared them, and adds genuinely
new items for `escaping` only. No other report type gains new items in v1.

Every reportable type — and, for completeness, the three `not_reportable` types described below —
has an explicit entry in `REPORT_CHECKLISTS`. Migrated straight across from the old
`game_id_required` / `min_description_length` flags:

- `report.game_identified` first — `escaping`, `score_cheating`, `stalling`, `thrown_game`,
  `sandbagging`, `sandbagging_assessment`, `ai_use`, `assess_ai_play`
- `report.description_length` last — `stalling` (20), `malicious_report` (1),
  `inappropriate_content` (20), `harassment` (20), `ai_use` (20), `other` (20)

`thrown_game`, `sandbagging_assessment` and `assess_ai_play` are `not_reportable` — they are
produced by server-side conversion or by the AI detector, never chosen from the report dropdown, so
their single-item lists (`report.game_identified`) are never evaluated today. They are listed
anyway so `REPORT_CHECKLISTS` stays a complete statement of what each type requires, rather than
silently leaving a type ungoverned if it is ever made reportable. `warning` and `troll` have no
entry: both are moderator-only paths with no report-type requirements of their own.

Authored directly into `REPORT_CHECKLISTS`, not migrated from an old flag:

- `stalling.enough_moves` — data check, blocking. Label: _"Enough moves were played to judge
  this"_. Message: the existing stalling applicability string.

### `escaping`

Note that `escaping`'s list carries no `report.description_length` item — the old
`min_description_length` flag was never set for it. Evaluation order:

| id                                | Kind                    | Blocking | Label                                                |
| --------------------------------- | ----------------------- | -------- | ---------------------------------------------------- |
| `report.game_identified`          | data check, listed      | yes      | _The reported game is identified_                    |
| `escaping.game_ended`             | data check, **new**     | yes      | _The game has ended_                                 |
| `escaping.not_resigned`           | data check, migrated    | yes      | _This player did not resign the game_                |
| `escaping.enough_moves`           | data check, migrated    | yes      | _Enough moves were played to judge this_             |
| `escaping.waited_reasonable_time` | attestation, **new**    | —        | _I waited a reasonable time for this player to play_ |

`escaping.game_ended` reads `phase === "finished"` from the shared game-data fetch. It mirrors a
rule the backend already enforces at `ogs/api/views/moderate.py:758-769`, which rejects escaping
reports while the game is still underway. Today the reporter meets that rule only _after_ writing
a description and submitting, and sees it as the generic _"There was an error submitting your
report"_. The data check turns that into a specific explanation before any effort is spent. The
backend rule stays in place as defence-in-depth.

`escaping.enough_moves` carries the existing translated string from
`checkGameForEscapingReportApplicability`, with one addition: its message now opens with a
self-contained sentence stating what is true about this game — see the framework spec's
"Authoring items" section, which carries the worked example of why that sentence was needed.

`escaping.not_resigned` carries its existing translated string unchanged, but its logic does not:
it now reports `"unavailable"` for an unknown accused, rather than either passing or failing. The
check has to tell whether _the reported player_ resigned, which needs `ctx.reported_user_id`. The
code this replaced compared `gamedata.winner !== ctx.reported_user_id` unconditionally; when
`reported_user_id` was `undefined` that comparison was true for any real game, since `winner` is
never `undefined`, so every finished game the accused won by resignation was flagged as "that
player resigned" regardless of who actually resigned. `escaping.not_resigned` now guards on
`ctx.reported_user_id !== undefined` first and reports `"unavailable"` when it is unknown: an
unknown accused means the check cannot be determined at all, and the framework's first invariant
is that a reporter is never told a check passed when it did not run. Reporting `{ met: true }` for
"cannot determine" — this design's original choice — violated that invariant; `"unavailable"` is
the state the framework already has for exactly this case, and it satisfies the _second_ invariant
too, since `checklistSatisfied` treats `unavailable` the same as `satisfied` and so it still does
not block. The same bug still exists in `checkGameForEscapingReportApplicability`, the
pre-checklist code this replaced — it is recorded here rather than treated as a silent
improvement.

### Authoring guidelines for future items

How items are worded is governed by the framework spec's "Authoring items" section: attestations
state the natural things a careful reporter would check rather than warning anybody off,
attestation labels are first person and specific to the report type, and data-check labels are
positive statements about the world. That document is canonical. Do not restate those rules here —
two copies of a tone policy will drift, and the framework spec is the one that outlives this
release.

One authoring rule is an implementation constraint rather than a matter of tone, so it stays here:

**Ids are stable and opaque.** Never rename an id, never reuse one for a different claim. The
evaluator, the result shape, the end-to-end test selectors and any record stored later all key on
them.

## Testing

### Unit

`src/lib/report_checklist.test.ts`, against `evaluateAsyncChecks` and `buildResults` directly:

- a synchronous blocking failure short-circuits before any async check runs
- with several failing async blocking checks, declaration order decides the result
- `pending` gates submission
- `unavailable` does not gate submission
- an async rejection produces `unavailable`, not `blocked`
- `canSubmit()` is false with no category selected, despite an empty result array —
  `checklistSatisfied([])` is vacuously `true`

`src/lib/useReportChecklist.test.tsx`, against the hook:

- a stale response for a superseded report type or game is discarded

### End to end

One shared edit and four targeted ones.

1. `e2e-tests/helpers/user-utils.ts` — a new shared helper, `tickReportAttestations(page)`, ticks
   every `[data-checklist-item][data-state="actionable"] input[type=checkbox]` before submitting.
   `submitReportForm` calls it, and so does `reportUser`/`reportPlayerByColor` by extension. This
   one edit covers `cm/escape-rate-helpers.ts`, the `cm-*` escaping and stalling tests, and most of
   the `ai-detector-*` tests. `moderation/ai-detector-sees-suspension-modlog.ts` is the exception:
   it drives the report dialog directly rather than through `submitReportForm`, so it never calls
   `tickReportAttestations`. This is safe only because it files an `ai_use` report and `ai_use` has
   no attestation item today; see the note on `tickReportAttestations` itself.
2. `moderation/mod-block-early-escape-report.ts` is renamed to
   `moderation/mod-block-escape-report-unfinished-game.ts`. It, and
   `moderation/mod-block-early-stall-report.ts`, previously asserted the block message arrived as
   the textarea's `placeholder` attribute. Under the collapsing layout the textarea is absent, so
   both re-target `[data-checklist-blocker=...]` and additionally assert the textarea is not
   present. The escaping test asserts the `escaping.game_ended` blocker specifically, not
   `escaping.enough_moves` — see the accepted coverage gap below.
3. `moderation/mod-reject-escape-report-during-game.ts` — **its premise changes**, and it is
   renamed to `moderation/mod-block-escape-report-during-game.ts` with its exported test function
   renamed from `modRejectEscapeReportDuringGameTest` to `modBlockEscapeReportDuringGameTest` to
   match, since the server rejects nothing any more. Its registered name changes from "Reject
   escape reports during active game" to "Block escape reports during an active game", because the
   client now blocks the report before any request reaches the server. The during-game half
   previously submitted and asserted the server's error alert; it now asserts the
   `escaping.game_ended` blocker and a disabled button instead. The test fills notes inline rather
   than through `submitReportForm` in both halves, so it also needs the attestation-ticking step
   added to its after-game half.
4. New `moderation/mod-escaping-attestation-required.ts`, registered as "Escaping report requires
   the attestation" — with all data checks passing, the submit button stays disabled until
   `escaping.waited_reasonable_time` is ticked, then enables.

**Accepted coverage loss.** After change 3, no test drives the backend rule at
`moderate.py:758-769` through the user interface. This is accepted: the rule only fires for a
client that bypasses the dialog, which is exactly the case end-to-end tests cannot drive, and
`e2e-tests/CLAUDE.md` directs tests to drive the system as a user does rather than call the API
directly.

**Accepted coverage gap: `escaping.enough_moves`.** No end-to-end test reaches this check. It only
becomes the displayed blocker for a game that has already finished with fewer than two moves
played — e.g. a first-turn timeout — and driving that through the browser would mean waiting out a
timeout, which would force the test to carry `@Slow`. It is covered instead by unit tests in
`src/lib/report_checklist_items.test.ts`.

**Verification scope.** Because `submitReportForm` is shared, verification runs the whole
`moderation` and `cm` end-to-end families, not only the four tests above. Pull-request CI does not
run Playwright, so this is a manual run.

Also required before the change is considered done: `yarn type-check`, `yarn lint`,
`yarn prettier:file` on modified files, `yarn spellcheck`, and one `yarn build`.

## Out of scope

This is the roadmap implied by "v1 is a pilot" above, recorded so later work has a starting
point. None of it is a commitment, and each item should wait on evidence from the first release.

- **Persisting checklist answers.** Requires a JSON field on `IncidentReport`, a migration, a line
  in the POST payload, and surfacing in the report detail view. Stable ids make this additive.
- **Admin-configurable items.** A Django model plus admin form for attestation items, merged into
  `getChecklist()`. Data checks would stay code-defined, since they need real logic.
- **Rule-engine items** in the style of fair-play filters.
- **Server-side enforcement.** The backend keeps its own independent rules; it does not read the
  checklist.
- **New items for other report types.** `score_cheating`, `sandbagging` and `ai_use` were all
  considered and deferred. Each new item is a policy decision needing sign-off and translation.

## Risks

**Reporters routed to "Other".** A blocked reporter who believes they are right may pick "Other"
and paste the same complaint. Collapsing the form and naming the reason is intended to reduce
this, but it cannot be prevented. Worth watching the `other` report volume after release.

**Attestation fatigue.** Every added tickbox lowers the attention paid to all of them. Shipping
one attestation for one report type is the deliberate counter to this. Resist growth without
evidence that a given item deflects reports.

**Shared test-helper edit.** Changing `submitReportForm` touches many tests at once. It is the
right place for the change, but it means a mistake there fails two whole test families, which is
why both are in the verification scope.

## This document

Under the design-artifact policy proposed in online-go/online-go.com#3672, this spec belongs in
`ogs-ui/docs/superpowers/specs/`, committed to the feature branch as its own `docs:` commit ahead
of the implementation commits, and **amended in place** as the work teaches us things. A spec that
no longer matches what was built is worse than none.

By the same policy this document is scaffolding: the durable artifact is the framework spec, which
becomes `ogs-ui/docs/report-checklists.md` — present tense, describing the capability as built —
once v1 ships. That is the document that carries the invariants forward.
