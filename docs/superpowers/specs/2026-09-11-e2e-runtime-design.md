# End-to-end test runtime and isolation

The target is a stable automated end-to-end run below five minutes on the local
OGS stack. Measure test execution separately from dependency installation and
service startup. Do not count retries as proof of stability or omit slow coverage
without a replacement at the appropriate test layer.

The current configuration runs 92 tests with one worker, a five-second delay
after each test, and up to two retries on the test server. Some tests only check
client-side form state with intercepted requests. Others wait for server timers
or build moderation history through many games. Moderators share the report queue.

Move client-only branches into Jest component tests. Keep browser coverage for
real user journeys, persistence, sockets, and browser rendering. Consolidate
duplicate journeys. Replace arbitrary delays with observable completion. Make
test data and report selection specific to each test before enabling concurrency.
Server policy and timer checks belong in backend tests when those tests can
exercise the same production behavior with controlled time.

Keep failure reporting reliable: the launcher must propagate failures; contexts
must close even on failure; setup must not kill browsers from another run.
Document test selection, isolation, and measured results in `docs/e2e-testing.md`.

Scale built-runner concurrency to RAM capacity: two workers up to 16 GiB, six
above 16 and below 32 GiB, eight from 32 to below 48 GiB, and sixteen at 48 GiB
or more. Account for OS overhead in reported host capacity and respect lower
container limits. Use one selector for local and self-hosted CI runs. Preserve
explicit overrides and the single-worker development and smoke defaults.

Keep WebSocket proxy reset logs readable during parallel browser cleanup.
Report `ECONNRESET` as a warning, count bursts in five-second windows, and avoid
counting the same error twice. Flush pending counts at shutdown. Preserve all
other proxy failures and test failure behavior; a reset warning is not proof
that the disconnect was harmless.

Validate with focused tests, repeated parallel runs, the normal test suite,
TypeScript, lint, formatting, and one final build. Report measured limits and
environment failures explicitly if the runtime target cannot yet be verified.

Investigate intermittent failures with preserved traces and matching backend
logs. Distinguish service interruptions from test timing assumptions. Exercise
parallel browsers with restricted CPU capacity as well as the normal host.
The built preview must serve translations and remove development-only scripts.
Game fixtures must allow time for browser work unless the clock is under test;
scoring checks must wait for scoring and persisted log entries. Generated
fixture names must not introduce random words that the username filter rejects.
Keep the requested RAM tiers and zero retries. Do not retry moderation writes to
conceal backend failures.

Fix product readiness defects exposed by the full run. Cached ladder rows must
populate after React mounts them, regardless of whether data arrives before or
after ladder metadata. Normal component tests must cover both timings.

Undo assertions must observe each client's updated move number and rendered
markers. A two-move undo preserves the player to move, so the turn label cannot
establish that the undo completed. Keep coverage for both requester colours.
