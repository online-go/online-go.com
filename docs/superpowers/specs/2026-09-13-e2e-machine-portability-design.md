# E2E machine portability

Repeated runs pass on the development host but fail on two other machines.
The reported names span moderation, game input, tournaments, puzzles, and the
development image middleware. The remote assertions, CPU counts, launch flags,
and exact worker counts are not available. A 48 GiB host normally selects
sixteen workers, not eight.

## Required behavior

- Each action waits for the state it consumes, including both game clients.
  A rendered control is not proof that background scoring or loading finished.
- Board input selects the requested intersection after layout settles and
  verifies the resulting state. Delayed rendering must not change coordinates.
- Tests of HTTP asset serving do not depend on loading the entire application.
- Failures retain enough local evidence to separate wrong state, incomplete
  operations, exhausted deadlines, and service exits. Diagnostics must not
  contain authentication credentials or replace the original assertion.
- RAM selection remains as requested. Do not hide failures with retries,
  speculative timeout increases, or unreported reductions in concurrency.

## Investigation

Run the current full suite with sixteen workers restricted to four frontend
and browser CPU cores. Inspect traces, request completion, board geometry,
scoring events, and server lifetimes. Audit all copies of scoring setup; some
AI moderation tests still bypass the shared synchronized helper. Test suspected
races with controlled delays or layout changes before assigning a cause.

Preserve all existing feature assertions. Keep application changes separate
from test corrections, and make an application change only for a reproduced
application defect. Record remote uncertainties and measured limits explicitly.

## Confirmed causes

- The unchanged full sixteen-worker/four-core run takes 522.1 seconds, with
  70 passes and two CM whole-test deadline failures. Both match the reported
  suspension/warning names. Each trace has about 400 local HTTP requests and
  repeated unrelated Home loads. The processes remain alive. Opening CM
  fixtures directly at their report and removing redundant scoring lets both
  journeys pass the same CPU restriction within their unchanged deadlines.
- A controlled 400-to-700-pixel board resize makes the old helper click D6
  when asked for H2. It measures before Playwright waits for layout stability.
  The trial-action wait before measurement passes the same browser check;
  normal regressions also cover a scoped board and a centre click.
- Pausing the background worker reproduces the missing simultaneous-game
  indicator. Node broadcasts the finished game after Django queues the task;
  the task has not saved `ended` or `simul_games` yet. Waiting for the saved
  result passes with the worker held for twenty seconds after the live event.
- Seven moderation fixtures do not need automatic scoring. They finish their
  existing moves through resignation. Escaping reports target the player who
  did not resign; the UI deliberately disallows reporting the resigner.
- HTTP asset tests take 16–24 seconds when they load the application first
  under the CPU restriction. The HTTP fixture keeps all byte/status checks
  while removing that unrelated browser dependency. The remote asset failure
  itself is not diagnosed without its assertion.

No application, backend, game-rule, retry-count or worker-tier changes are
required for these fixes. The mobile coverage assertion also polls live geometry
in one browser call; its remote failure has not been independently attributed.
