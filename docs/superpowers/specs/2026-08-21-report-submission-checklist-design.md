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

- Two applicability checks (`escaping`, `stalling`) report their reason as *placeholder text
  inside the description textarea*, which disappears the moment the reporter types and which
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
3. **Make careless reporting harder.** Served *indirectly*: requiring explicit confirmation of
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

| Question | Decision | Rationale |
| --- | --- | --- |
| Enforcement | **Client-only.** The submit button stays disabled; no POST-time revalidation. | Matches how `game_id_required` and `check_applicability` work today. The backend keeps its own independent rules. |
| Definition source | **Code registry only**, behind one lookup function that is the seam for later sources. | The requester named admin-config forms and fair-play-filter-style rules as eventual sources. Neither is in v1. |
| Persistence | **Nothing stored in v1.** | Moderator evidence is not a goal. No model change, no migration. |
| Data source for checks | **Client-side fetches** against existing endpoints, via a source-agnostic async interface. | Covers everything v1 needs. A check backed by a new endpoint drops in later without reshaping the framework. |
| Check failure or timeout | **Fail open**, with a visible "could not check" state. | Never trap a legitimate reporter behind a network fault. Silently dropping the item, as the current code does, teaches nobody anything. |
| Item scope | **Per report type only.** No site-wide item set. | Avoids a boilerplate "I have read the guidelines" tickbox that everyone learns to click past, which would work against goal 2. |
| Layout | **Failed data checks hoist above the description and collapse the rest of the form.** Everything else renders below the description, next to the button. | See "Layout" below. |
| Backend test coverage | **Accepted loss** on the during-game escaping rule. | Defence-in-depth. See "Testing". |

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
buttons, a single list headed "Before you can submit" containing every item: satisfied data
checks, attestation tickboxes, and any actionable shortfall such as "20 more characters needed".
Everything the reporter can act on sits together, beside the button it governs.

**A data check has failed.** The failed item renders alone above the description, styled as a
blocker, carrying its reason and the instruction to choose a different report type. The
description textarea and the rest of the checklist are **not rendered**.

A missing game id reaches this state through the synthesised `report.game_identified` blocker, so
the existing behaviour is preserved: the reporter sees *"Please report the user on the game page
so we know where to look."* and no textarea. It arrives by the general rule instead of the
special-cased `show_game_id_required_text` branch.

When a report type has no items at all — `warning` and `troll` declare none — the checklist
renders nothing, and the dialog looks as it does today.

The reasoning for collapsing rather than dimming or leaving the form live: once a blocking data
check fails, the reporter cannot submit whatever else they do, so soliciting tickboxes and a
longer description asks for work that cannot pay off. A reporter who ticks every box, writes a
description and *still* cannot submit reads the dialog as broken. Collapsing also matches what
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
    /** Memoised for one evaluation pass, so sibling checks share one request. */
    fetchGamedata: () => Promise<Gamedata>;
}

export type CheckOutcome = { met: true } | { met: false; message: string };

export type ChecklistItem =
    | { kind: "attestation"; id: ChecklistItemId; label: string }
    | {
          kind: "data_check";
          id: ChecklistItemId;
          label: string;
          /** True when the reporter cannot fix this from inside the dialog. */
          blocking: boolean;
          evaluate: (ctx: ChecklistContext) => CheckOutcome | Promise<CheckOutcome>;
      };
```

The two kinds are a discriminated union rather than one type with optional fields, because they
carry different data and are phrased differently. An attestation has no `evaluate` and its label
is first person — *"I waited a reasonable time for this player to play"*. A data check has an
`evaluate` and its label is a third-person statement about the world — *"This player did not
resign the game"*. The union makes it impossible to construct an attestation with an evaluate
function, or a data check with no way to be established.

`blocking` exists only on `data_check`. An unticked attestation is never blocking: by definition
the reporter can satisfy it, which is what the tickbox is for. The form-collapsing state is
therefore triggered only by a failed data check.

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

`evaluateChecklist(items, ctx, attestations)` is a pure function returning
`Promise<ChecklistItemResult[]>`. It contains no React and is unit-testable directly.

1. **Synchronous checks run first**, in declaration order. The first blocking failure
   short-circuits: evaluation stops and that single blocked item is the entire result.
2. **Asynchronous checks run only if no synchronous blocker failed.** They run in parallel.
   If more than one blocking async check fails, the one earliest in declaration order wins, so
   which blocker the reporter sees is deterministic rather than a race.
3. Otherwise every item is evaluated and the full list is returned.

Step 1 is what gates game-data fetches behind "we have a game id", replacing the ad-hoc
`needs_game_id_first` guard in the current effect.

**Invariant:** an async check that needs a game id must belong to a report type whose category
declares `game_id_required`. Otherwise the synchronous game-id blocker will not exist to gate it,
and the check will fetch a missing game.

**Shared fetch.** The three `escaping` data checks all need the same game data. `ChecklistContext`
exposes `fetchGamedata()`, memoised per evaluation pass, so they share one request to
`/termination-api/game/{id}` rather than making three.

### Submission gate

Every result must be `satisfied` or `unavailable`. `pending` therefore gates submission, exactly
as the current `validating` flag does.

**Correctness trap:** `Array.prototype.every` is vacuously true on an empty array. `canSubmit()`
must keep its existing `if (!category) return false` guard first, or selecting no report type
enables the button.

### Error handling

An async check that rejects yields `unavailable`, carrying a translated "We could not check this"
message, and does not gate submission. The rejection is logged to the console.

**Stale-response guard.** The current effect at `Report.tsx:335-351` has no request-generation
guard, so a slow response for one game can land after the reporter has changed context and
overwrite the state. The hook keys in-flight evaluations by `(report_type, game_id)` and discards
resolutions that no longer match. This is a latent bug in the existing code, fixed as part of
this work.

## Files

### New

| Path | Contents | Why separate |
| --- | --- | --- |
| `src/lib/report_checklist.ts` | Types, `evaluateChecklist()`, `getChecklist()` | Pure logic, no React, directly unit-testable. `report_util.test.ts` sets the precedent. |
| `src/lib/report_checklist_items.ts` | `REPORT_CHECKLISTS` registry and its `pgettext` strings | The policy file. Adding an attestation to another report type means editing only this, with no need to read the evaluator. |
| `src/lib/useReportChecklist.ts` | React binding: effect, result state, staleness guard | Keeps async lifecycle out of both the engine and `Report.tsx`. |
| `src/components/Report/ReportChecklist.tsx` + `.css` | The below-description list | One component per file, co-located with its only parent. |
| `src/components/Report/ReportChecklistBlocker.tsx` + `.css` | The single above-description blocker | As above. |
| `src/lib/report_checklist.test.ts` | Evaluator unit tests | See "Testing". |

`REPORT_CHECKLISTS` is `Partial<Record<ReportType, ChecklistItem[]>>`, deliberately mirroring the
existing idiom: `REPORT_TYPE_VOTABLE_ACTIONS` in `ogs/go_app/models/moderation.py` and
`COMMUNITY_MODERATION_REPORT_TYPES` in `report_util.ts`.

### The seam

`getChecklist(type, category)` is the single point of access, and the only place a future source
needs to be merged in. In v1 it composes, in this order:

1. `report.game_identified` — synthesised when `category.game_id_required`. Synchronous,
   **blocking**. Message: the existing *"Please report the user on the game page so we know where
   to look."*
2. `REPORT_CHECKLISTS[type] ?? []`
3. `report.description_length` — synthesised when `category.min_description_length`.
   Synchronous, **not** blocking. Message: the existing *"{{required}} more characters needed"*.

Synthesising from the existing declarative fields means none of the fourteen entries in
`report_categories` need editing. Only `check_applicability` is deleted outright, because it
carries no label to display and must be re-expressed as properly labelled data checks.

### `Report.tsx` changes

Removed:

- `check_applicability` from the `ReportDescription` interface
- `checkGameForEscapingReportApplicability` and `checkGameForStallingReportApplicability`
  (re-expressed in `report_checklist_items.ts`)
- the `inapplicable_reason` and `validating` state and the effect at lines 335-351
- `show_game_id_required_text` and its `.required-text` block
- `more_description_needed` and the `.characters-remaining-prompt` block

Added:

```tsx
const [attestations, set_attestations] = React.useState<Record<ChecklistItemId, boolean>>({});
const results = useReportChecklist({ category, game_id, review_id, reported_user_id, note, attestations });
const blocker = results.find((r) => r.state === "blocked");
```

```tsx
{blocker ? (
    <ReportChecklistBlocker result={blocker} />
) : category ? (
    <>
        <textarea className={...} ... />
        <ReportChecklist results={results} attestations={attestations} onToggle={toggleAttestation} />
    </>
) : null}
```

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

The framework migrates the existing gates for every type that declares them, and adds genuinely
new items for `escaping` only. No other report type gains new items in v1.

Migrated automatically by synthesis, with no per-type authoring:

- `game_id_required` — `escaping`, `score_cheating`, `stalling`, `thrown_game`, `sandbagging`,
  `sandbagging_assessment`, `ai_use`, `assess_ai_play`
- `min_description_length` — `stalling`, `malicious_report`, `inappropriate_content`,
  `harassment`, `ai_use`, `other`

Migrated by hand into `REPORT_CHECKLISTS`:

- `stalling.enough_moves` — data check, blocking. Label: *"Enough moves were played to judge
  this"*. Message: the existing stalling applicability string.

### `escaping`

Note that the `escaping` category declares no `min_description_length`, so no description-length
item is synthesised for it. Evaluation order:

| id | Kind | Blocking | Label |
| --- | --- | --- | --- |
| `report.game_identified` | data check, synthesised | yes | *The reported game is identified* |
| `escaping.game_ended` | data check, **new** | yes | *The game has ended* |
| `escaping.not_resigned` | data check, migrated | yes | *This player did not resign the game* |
| `escaping.enough_moves` | data check, migrated | yes | *Enough moves were played to judge this* |
| `escaping.waited_reasonable_time` | attestation, **new** | — | *I waited a reasonable time for this player to play* |

`escaping.game_ended` reads `phase === "finished"` from the shared game-data fetch. It mirrors a
rule the backend already enforces at `ogs/api/views/moderate.py:758-769`, which rejects escaping
reports while the game is still underway. Today the reporter meets that rule only *after* writing
a description and submitting, and sees it as the generic *"There was an error submitting your
report"*. The data check turns that into a specific explanation before any effort is spent. The
backend rule stays in place as defence-in-depth.

`escaping.not_resigned` and `escaping.enough_moves` carry the existing translated strings from
`checkGameForEscapingReportApplicability` unchanged.

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

`src/lib/report_checklist.test.ts`, against `evaluateChecklist` directly:

- a synchronous blocking failure short-circuits before any async check runs
- with several failing async blocking checks, declaration order decides the result
- `pending` gates submission
- `unavailable` does not gate submission
- an async rejection produces `unavailable`, not `blocked`
- a stale `(report_type, game_id)` resolution is discarded
- `canSubmit()` is false with no category selected, despite an empty result array

### End to end

One shared edit and four targeted ones.

1. `e2e-tests/helpers/user-utils.ts:504` — `submitReportForm` ticks every
   `[data-checklist-item][data-state="actionable"] input[type=checkbox]` before submitting. This
   one edit covers `cm/escape-rate-helpers.ts`, the `cm-*` escaping and stalling tests, and the
   `ai-detector-*` tests.
2. `moderation/mod-block-early-escape-report.ts:74` and
   `moderation/mod-block-early-stall-report.ts:75` — both currently assert the block message
   arrives as the textarea's `placeholder` attribute. Under the collapsing layout the textarea is
   absent, so both re-target `[data-checklist-blocker=...]` and additionally assert the textarea
   is not present.
3. `moderation/mod-reject-escape-report-during-game.ts` — **its premise changes.** The during-game
   half currently submits and asserts the server's error alert. The client now blocks first, so it
   asserts the `escaping.game_ended` blocker and a disabled button instead. The test fills notes
   inline rather than through `submitReportForm`, in both halves, so it also needs the
   attestation-ticking step added to its after-game half.
4. New `moderation/mod-escaping-attestation-required.ts` — with all data checks passing, the
   submit button stays disabled until `escaping.waited_reasonable_time` is ticked, then enables.

**Accepted coverage loss.** After change 3, no test drives the backend rule at
`moderate.py:758-769` through the user interface. This is accepted: the rule only fires for a
client that bypasses the dialog, which is exactly the case end-to-end tests cannot drive, and
`e2e-tests/CLAUDE.md` directs tests to drive the system as a user does rather than call the API
directly.

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
