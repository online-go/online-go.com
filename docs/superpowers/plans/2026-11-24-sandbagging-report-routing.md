# Plan: sandbagging reports, the reporter picks the route

Spec: `docs/superpowers/specs/2026-11-24-sandbagging-report-routing-design.md`.

Two pull requests. Branch `sandbagging-report-routing` in `ogs-ui`, then in
`ogs`. The `ogs` pull request depends on the `ogs-ui` one.

## 1. `ogs-ui`

1. `src/lib/report_checklist.ts`: `Gamedata` gains `black_player_id` and
   `white_player_id`.
2. `src/lib/sandbagging_report_type.ts`: `accusedLostFinishedGame(gamedata,
   accused_id)` and `sandbaggingReportType(gamedata, accused_id)`. Unit tests
   for the rule: lost, won, in progress, not a player, no data.
3. `src/lib/useReportedGame.ts`: owns the one fetch per game id (moved from
   `useReportChecklist`) and exposes `{ fetchGamedata, reported_game }`.
   `useReportChecklist` takes `fetchGamedata` as an argument. Caching tests
   move with the code.
4. `src/lib/report_checklist_items.ts`: `thrown_game.accused_lost`,
   `thrown_game.this_game_only`, `sandbagging_assessment.other_games_linked`,
   the new `thrown_game` and `sandbagging_assessment` lists, no `sandbagging`
   list. Table test updated.
5. `src/components/Report/Report.tsx`: categories, the dropdown filter from
   `sandbaggingReportType`, the shared fetcher.
6. `src/lib/report_util.ts`: comment.
7. E2E: `reportUser` and `submitReportForm` take `{ notOffered }`; the seven
   tests pick the type directly; `cm-sandbagging-assessment-conversion.ts`
   becomes `cm-sandbagging-accused-won.ts`; `cm.spec.ts` names.
8. `docs/sandbagging-reports.md`: the durable description.
9. `yarn type-check`, `yarn lint`, `yarn prettier:file` on touched files,
   `yarn test` on the touched suites, `yarn build` once before pushing.

## 2. `ogs`

1. `services/django/ogs/api/views/moderate.py`: replace the conversion with
   validation of `thrown_game`, reject `sandbagging` on create.
2. `services/django/ogs/go_app/models/moderation.py`: drop the `sandbagging`
   branch of `user_can_moderate` and the `SANDBAGGING` votable actions.
3. `services/django/ogs/go_app/tasks/cull_incident_reports.py`: drop the
   `SANDBAGGING` clauses.
4. `services/termination-server/IncidentReports.ts`: drop the `sandbagging`
   power branch.
5. Tests beside `report_retype_test.py` for the create path.
6. `make lint`.

## 3. `moderator-ui`

1. `ReportsCenter/ReportTypeSelector.tsx`: the comment on `NOT_RETYPE_TARGETS`
   no longer describes a conversion.
