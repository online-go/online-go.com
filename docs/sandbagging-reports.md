# Sandbagging reports

Sandbagging is losing games on purpose to lower a rank, or playing on an
account whose rank is far below the player's strength. A reporter files one of
two report types, and the report dialog decides which one is offered.

## The two types

| Type                     | Offered when                                                                                                                                                                                | Reporter sees | Handled by                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------------------------------------ |
| `thrown_game`            | The accused played in the reported game, the game has finished and the other player won. The outcome text does not matter: resignation, timeout, score and cancellation all count.             | Thrown Game   | Community moderators with the sandbagging power  |
| `sandbagging_assessment` | Every other case: the accused won, the game is still in progress, the accused is not one of the players, there is no game, or the game data could not be fetched.                             | Sandbagging   | Full moderators                                  |

The dialog never offers both. It offers neither until the game data has
arrived, so a choice cannot be swapped under the reporter. A type the dialog
does not offer counts as no selection, including one a caller preset when
opening the dialog: nothing can be filed under it.

## Where the rule lives

- `src/lib/sandbagging_report_type.ts`: the rule, as `accusedLostFinishedGame`
  and `sandbaggingReportType`.
- `src/lib/useReportedGame.ts`: the one fetch of the reported game, shared by
  the dialog's dropdown and the checklist's data checks.
- `src/lib/report_checklist_items.ts`: each type's checklist. `thrown_game`
  carries the same rule as a blocking check, `thrown_game.accused_lost`, and
  turns away links to other games with `thrown_game.this_game_only`, because
  the report is judged on the reported game alone. It requires no description.
  `sandbagging_assessment` requires the opposite with
  `sandbagging_assessment.other_games_linked`: a link to at least one game
  other than the reported one, because the report is a claim about a pattern.
  Neither link item blocks, so the reporter can still edit the note.
- The server (`ogs`, `services/django/ogs/api/views/moderate.py`) enforces the
  same rule: it rejects `thrown_game` unless the accused lost the finished game,
  accepts `sandbagging_assessment` whatever the outcome, and rejects the legacy
  `sandbagging` type.

## The legacy type

`sandbagging` was the type reporters filed until November 2026. The server
converted it on filing to one of the two types above. The value stays in
`ReportType` and in the server's enum for old rows. It has no entry in
`report_categories`, no checklist, and nothing accepts it.

## Tests

- `src/lib/sandbagging_report_type.test.ts`: the rule.
- `src/lib/useReportedGame.test.tsx`: one request per game, retry after a
  failure, late responses discarded.
- `e2e-tests/cm`: the thrown-game vote tests file `thrown_game`;
  `cm-sandbagging-accused-won.ts` and `cm-sandbagging-in-progress-game.ts`
  check that only Sandbagging is offered. `reportUser` takes `notOffered` for
  the types that must be absent from the dropdown.
