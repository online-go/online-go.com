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
