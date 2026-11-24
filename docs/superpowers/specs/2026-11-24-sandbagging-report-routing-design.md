# Sandbagging reports: the reporter picks the route

Date: 2026-11-24. Spans `ogs` (incident creation) and `ogs-ui` (the report
dialog, its checklists, the e2e tests). This document lives in `ogs-ui`
because most of the work is here.

## Intent

A reporter who sees sandbagging files a "Sandbagging" report, and the server
silently changes its type: to `thrown_game` when the accused lost the reported
game, to `sandbagging_assessment` in every other case. Community moderators
with the sandbagging power handle thrown games; full moderators handle
assessments. The reporter is never told which happened, the dialog cannot show
conditions that belong to one outcome or the other, and the rule lives on the
server although the dialog has the same game data.

After this work the dialog offers exactly one of the two types, decided from
the reported game's outcome, and files it directly. The server validates
what it receives instead of converting it.

## Terms

- **Thrown game**: the accused played in the reported game, the game has
  finished, and the other player won. The outcome text does not matter:
  resignation, timeout, score and cancellation all count, which is the rule the
  server has applied since the conversion existed. Type `thrown_game`.
- **Sandbagging**: every other case. The accused won, the game is still in
  progress, the accused is not one of the players, there is no game, or the
  game data could not be fetched. Type `sandbagging_assessment`; the reporter
  sees the word "Sandbagging".
- **Legacy `sandbagging`**: the old intake type. No report has carried it
  since the conversion was introduced. The value stays in the `ReportType`
  union and the server enum for old rows. Nothing offers it or accepts it.

## What gets built

### The dialog (`Report.tsx`)

When the dialog opens with a game id it fetches that game once from the
termination API. The checklist already does this fetch after a type is chosen;
the fetch moves into one hook, `useReportedGame`, and the checklist hook takes
the fetcher from it, so the dialog and the checks share one request.

The type dropdown offers Thrown Game when the accused lost the finished game
and Sandbagging in every other case. It never offers both. While the fetch is
pending it offers neither, so a reporter cannot pick one and have it replaced
under them.

In `report_categories`, `thrown_game` and `sandbagging_assessment` become
reportable. `sandbagging_assessment` is titled "Sandbagging", with the same
translation context as the old entry so its translations carry over, and a
description that covers both deliberately losing and playing far above rank.
The legacy `sandbagging` entry is removed. In the Reports Center this takes
away the sidebar's always-empty "Sandbagging" category and labels the
assessment category "Sandbagging"; the moderator-ui type selector keeps its own
labels and is unchanged.

### Checklists (`report_checklist_items.ts`)

- `thrown_game`: the game is identified (blocking); this player lost the
  finished game (blocking, from the shared game data); the report is about this
  game only (not blocking). No description is required: the game speaks for
  itself. Links to other games are turned away, because a thrown-game report is
  judged on the reported game alone and moderators look at a player's other
  games themselves. The item is not a blocker because a blocker collapses the
  dialog to its explanation and hides the note, which would leave the reporter
  no way to remove the link.
- `sandbagging_assessment`: the game is identified (blocking); report content
  (placeholder, below).
- The `sandbagging` entry is removed.

The lost-game check mirrors the server rule. It can only fail if the dialog is
opened with the type preset, since the dropdown already applies the rule, but
the table is meant to be the complete statement of what each type requires.

**Placeholder content item.** A Sandbagging report will require the reporter
to supply certain information. What that information is, and whether the
reporter attests to it or the dialog checks it, is still to be decided. Until
then the type carries one non-blocking item,
`sandbagging_assessment.report_content`, that asks for a description of at
least 20 characters. Replacing the evaluate function, or the item, is the
follow-up.

### Server (`ogs`, second pull request)

- `thrown_game` on create is rejected with a 400 unless the accused lost the
  finished game, in the style of the existing "stopped playing on a game still
  underway" rejection. The message tells the reporter to report Sandbagging
  instead.
- `sandbagging` on create is rejected with a 400, as retype already does.
- `sandbagging_assessment` is accepted whatever the outcome. The game may end
  between the dialog opening and the report arriving, and moderators can
  retype.
- The conversion block is removed. The dead `sandbagging` branches in
  `user_can_moderate`, the termination server's power check, the votable
  actions table and the culling task go with it.
- Request-level tests beside `report_retype_test.py`.

### Order

`ogs-ui` first. The current server accepts any known type, so the new dialog
works against it. `ogs` second, with `Depends on online-go/online-go.com#<n>`:
once the server rejects `sandbagging`, the e2e tests on `ogs-ui` main would
fail against it.

### E2E tests

Seven tests under `e2e-tests/cm` file "sandbagging" and assert on the type the
server produced. They now pick `thrown_game` or `sandbagging_assessment`
directly. `reportUser` gains a `notOffered` option, so the two tests that
existed to prove the conversion now prove that the other type is not in the
dropdown. The test that proved conversion when the accused won is renamed to
say what it now checks.

## What is not changing

- Who handles what. `HANDLE_SANDBAGGING` handles `thrown_game`; full
  moderators handle `sandbagging_assessment`.
- The votable actions and canned messages for either type.
- The "Thanks for the report!" flow.

## Decisions

- The reporter-facing word is "Sandbagging"; the type stays
  `sandbagging_assessment`, so moderator tooling, the server enum and the e2e
  assertions on the type selector are untouched.
- The server does not reject `sandbagging_assessment` when the accused lost.
- Stale clients that still send `sandbagging` get an error rather than a
  conversion.
- The legacy entry leaves `report_categories`. `IncidentReportCard` would show
  "Other" for a legacy row, but it lists open reports and none exist.

## Noted, out of scope

- `thrown_game` and `sandbagging_assessment` reports are never culled: the
  culling task lists only the legacy type.
- The automod prompt keys on the legacy type, so a `thrown_game` report gets
  no sandbagging guidance.
