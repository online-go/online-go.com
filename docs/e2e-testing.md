# End-to-end testing

End-to-end tests exercise user journeys against a running OGS frontend and
backend. Jest tests cover client-side logic and component behavior. Backend tests
cover server policies with controlled data and time.

The runtime target is less than five minutes for automated browser tests after
services and dependencies are ready. Record the worker count, test selection,
retry count, failures, and elapsed time with each measurement.

Tests use fresh users for mutable state. Seeded users supply privileges that
ordinary users cannot create. Report tests must select their own report by ID;
the global queue can contain reports from other tests. Use observable UI or
request completion instead of fixed delays. Test setup and cleanup must not
affect browsers or data owned by another test run.

Keep coverage when moving a test: name the replacement test and verify it before
removing the browser scenario. Client-only form permutations do not need a real
account and backend. Keep browser checks for persistence and server integration.

`prepareNewUser` creates a unique account through the API, selects its initial
rank, and opens an authenticated browser context. It supplies the same cached
configuration as the registration UI so initial routing sees the logged-in user.
The registration smoke test uses `registerNewUser` and `loginAsUser` to test the
forms. Feature tests continue to perform their actions through the UI. Challenge
acceptance waits for the current challenge ID to render, so a cached challenge
from an earlier game cannot be accepted by mistake. Browser actions have a
15-second default timeout, and navigation has a 30-second timeout. The retained
first-turn warning test uses an explicit 90-second wait for the real game timer
and warning delivery. The mobile puzzle test waits for setup mode to finish
loading before it places a stone.

`yarn test:e2e` checks that `E2E_MODERATOR_PASSWORD` is set, builds once, and runs
the full suite against production assets. `yarn test:e2e:built` reuses an existing
build. Both select workers from RAM capacity and serve the production
bundles with the local backend proxy. They keep development-server checks on their own Playwright
project. This reduces browser memory use from development modules. Build the
frontend before using the reuse command; build and service startup time are recorded
separately from browser runtime.

The built runner and self-hosted CI use the same worker selector:

| RAM capacity                   | Workers |
| ------------------------------ | ------- |
| Up to 16 GiB                   | 2       |
| More than 16 GiB, below 32 GiB | 6       |
| 32 GiB to below 48 GiB         | 8       |
| 48 GiB or more                 | 16      |

The selector uses total RAM capacity, capped by the process/container memory
limit reported by Node. It does not use momentary free RAM or include swap.
Host RAM rounds up to whole GiB to account for OS overhead (for example,
31.3 GiB selects the 32 GiB tier). An explicit container limit is not rounded.
Set `E2E_WORKERS` to a positive integer or pass Playwright's `--workers` to
override the selection. The CLI option takes precedence. To print the selected
default without starting tests, run `node scripts/e2e-workers.js` in the same
environment as the tests.

RAM capacity does not measure CPU capacity or current backend load. Each worker
can open several browser contexts. A machine with 48 GiB can have enough memory
for sixteen workers but insufficient CPU time to run them efficiently. Use an
explicit lower count, for example `E2E_WORKERS=4 make e2e`, when testing on a
slower CPU or a busy development stack.

The explicit `test:e2e:dev`, UI, and debug commands use the development frontend
and default to one worker. Listing, help, and CI smoke selection bypass the
build and moderator-password requirement. The Yarn runner stops before building
or starting browsers if credentials are missing.

From the host, `make e2e` runs `yarn test:e2e` inside `ogs_ui_1`, including the
automatic build and all 72 tests. It supplies `xyzzy`, the password used to seed
the local test database. Export `E2E_MODERATOR_PASSWORD` to override this for a
database seeded with a different password. `E2E_WORKERS=4 make e2e` passes an
explicit worker override into the container. Local services, seeded data,
dependencies, and Chromium must already be available.
On the 24 GiB development machine, do not overlap another frontend build with
the browser suite: the combined memory use can cause browser processes to be
killed.

The built preview forwards `/locale/` requests to the development server and
removes Vite's client, React refresh, and checker scripts from the resolved
template. Translations therefore load with the same configuration as the local
frontend, without development scripts that do not exist in the production build.

Generated usernames use a readable role of up to sixteen characters and a
cryptographically random ten-digit suffix. Numeric suffixes avoid random words
and acronyms rejected by the backend's username filter. The server's registration
checks still apply, and registration errors fail the test.

Game scoring waits for both clients to complete auto-scoring, then confirms the
first acceptance on the opponent's page before submitting the second acceptance.
An enabled Accept button alone is insufficient: the UI enables it after two
seconds even if auto-scoring continues. The scoring test waits for the actual
game-log entries. SGF permission checks wait for loaded game state and use
retrying assertions on link classes or button state. Click helpers use the
suite's readiness timeout and Playwright's scrolling during the click instead
of an earlier five-second scrolling timeout.

Scoring, conditional-move, undo, simultaneous-game, suspend-vote, and escape-rate
history fixtures use five-minute main time and five thirty-second periods so
browser work does not exhaust their game clocks. The informal-warning fixture
uses live timing instead of a two-second blitz clock. Both informal-warning
scenarios use the normal three-minute test timeout instead of reducing it to
two minutes. The retained first-turn warning test keeps its clock settings.

Both two-move undo scenarios wait for the played moves on each board before
requesting the undo. They wait for the request state and two visible markers
on both clients, then accept through the UI. Completion requires the expected
move number in each board's display and engine, with no remaining undo markers.
The expected result is move zero for a black requester and move one for a white
requester. The turn label stays the same after a two-move undo and cannot serve
as a completion check.

Ladder rows load after mounting so synchronous cache hits can update their
state. Component regressions cover cached data, delayed responses, and StrictMode
remounting. A populated API response alone does not prove that the rows rendered.

The McMahon journey keeps the director's live connection while players join.
It checks that all five players appear before starting, waits for the start
response, and requires the results to appear without a reload. Each joining
player waits for its join response before reloading to check membership.

Vite reports WebSocket proxy `ECONNRESET` events as concise warnings in both
its development server and the built preview. The first reset is reported
immediately; additional resets in the next five seconds are summarized with a
count. The same error reported by Vite's proxy and socket handlers counts once.
Server shutdown flushes a pending count, including when Playwright fails.
These warnings do not establish why a connection closed. HTTP proxy errors,
other error codes, and unrelated Vite errors keep their existing reporting and
failure behavior. This changes logging only; test assertions and retries do not
change.

`IncidentReportCountTracker` counts the reporter's own active reports. Moderator
queue totals can change in other workers. `submitReportVote` waits for the vote
response before a test navigates away or closes a voter's context. Close voters that have no further
work instead of retaining their pages for debugging.
Vote tests check the resulting report, warning, or suspension. They do not
require the brief disabled-button state that can disappear when a report closes.
Warning cleanup dismisses at most ten queued messages and then checks whether
the queue is empty. Exactly ten messages succeed; remaining messages cause a
failure. Normal tests cover both sides of this limit.

Coverage moved or combined:

| Browser coverage                                          | Replacement                                                                                                                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Six challenge form and request permutations               | `ChallengeModal.test.tsx`: request payload, rank presets, handicap persistence, private/invite flags, analysis, and rengo validation                                           |
| Duplicate profile toggle and persistence journeys         | One browser journey tests both toggle states across reloads                                                                                                                    |
| First-turn disconnect, black timeout, and blitz exclusion | Backend `go_app/first_turn_escaper_test.py`: both colours, termination reasons, game speeds, move counts, and bot exclusion; the live warning-delivery browser journey remains |
| Warning visibility during live and correspondence games   | `AccountWarning.test.tsx` with controlled engine state and timers                                                                                                              |
| Separate three-voter acknowledgement journey              | Acknowledgement delivery and dismissal in the existing unfounded-AI-report journey; immediate acknowledgement behavior in `AccountWarning.test.tsx`                            |

The backend companion change moves the existing first-turn predicate into the
warning function. Land that change with the browser test removals so the normal
backend suite owns the removed policy cases.

The self-hosted backend runner builds once and runs the full automated selection
in one parallel batch. It includes `@Slow` and does not exclude tests based on
the historical flaky or known-bad registries. Build and browser durations are
reported separately. Explicit filters and the legacy `-f` diagnostic mode remain
available.

Malicious-report tests use worker-specific seeded filers (`E2E_CM_MR_FILER_0`
through `E2E_CM_MR_FILER_31`). Ladder tests use six vacation-enabled accounts
per worker (`E2E_LADDER_0_P1` through `E2E_LADDER_31_P6`). This keeps vacation
changes separate when tests repeat concurrently. Run the updated backend
`init_e2e` command before these tests. Each report is captured from its submission response, and cleanup
only cancels reports created by that test.

The one-at-a-time escaping queue browser test is replaced by
`report_manager.test.ts`: real report updates hold the next report until its
predecessor resolves, keep different accused users independent, and scope a
reporter's own count. Backend `browser_id_suspension_test.py` covers first-game
eligibility, historical browser IDs, suspension persistence, and client signals.
The browser still checks suspension after a real game.

Moderation vote fixtures that do not test ranking use unranked games. This keeps
external AI analysis and asynchronous rating updates outside those scenarios.
Kibitz room creation guards its route transition so concurrent directory updates
cannot close the picker or redirect a newly created room to the default room.
The guard clears on any committed URL change, including a navigation that
supersedes the requested room or returns to the directory after deletion. Normal
hook tests cover interrupted navigation and preserve the picker-closing guard.
Snapshot copies preserve shared player records while removing circular
references, so game-picker thumbnails receive both players.

The obsolete Fair Play Search result-link journey is removed. Its expected
new-tab filter behavior no longer matches the current result links, and its
empty-data return previously counted as a pass. `player-check-ai-button.ts`
retains the current player-filter navigation journey and requires both the
exact player ID and the populated player name.

Warning countdowns follow the message ID and acknowledgement state. Refreshing
an unchanged message does not restart the reading delay. A new message resets
both the checkbox and the countdown. Component tests cover both cases without
waiting on real time. Backend account updates are published after the database
transaction commits, so the browser can fetch newly announced warnings. Normal
backend tests exercise commit, rollback, and autocommit delivery.

## Verification

The 2026-09-12 stability changes pass all 619 normal frontend tests, TypeScript,
lint, and modified-file formatting. Five new tests cover numeric usernames;
three cover cached, delayed, and StrictMode ladder-row mounting. The two cached
row cases fail before the product fix and pass afterward. Launcher regressions
also cover current development scripts and translation routing. Graphify is not
installed in the development environment.

The latest full run uses Chromium in `ogs_ui_1`, eight workers, 32 logical CPUs,
and 32 GiB installed RAM (31.3 GiB reported). It includes `@Slow` and uses zero
retries. Services, dependencies, Chromium, and seeded data are already available.
The database is not reset between checks.

| Full run       | Passed | Failed | Skipped | Complete built-runner command |
| -------------- | ------ | ------ | ------- | ----------------------------- |
| After undo fix | 72     | 0      | 0       | 233.3 seconds                 |

The undo follow-up passes 24 executions (twelve per requester colour) with eight
workers and the frontend/browsers restricted to two CPU cores, in 152.1 seconds
including startup/shutdown. All pass with zero retries. TypeScript, lint,
modified-file formatting, and the 35.9-second build also pass.

The measured build and complete browser command total 269.2 seconds (4m 29s).
Dependency installation and service startup are outside this measurement.

Two earlier full runs pass all 72 tests in 240.3 and 240.2 seconds. A subsequent
run exposes the undo race: an unchanged turn label releases the assertion before
the board receives the undo. The latest run includes the state-based checks.
Earlier full checks also expose a cached ladder-row failure and a McMahon reload
that misses the start update; both are fixed before the undo follow-up.
The McMahon change passes four parallel repetitions with browsers restricted to
two CPU cores in 66.7 seconds including runner startup/shutdown.

A separate load check restricts the frontend runner and its browsers to two CPU
cores while keeping eight workers. All twelve selected game and moderation
journeys pass in 4.1 minutes (249 seconds including startup and shutdown), with
zero retries or skips. Earlier load checks reproduce an immediate SGF permission
assertion, a fixture game timing out after two moves, and a two-minute scenario
timeout. This is a test of CPU pressure on the frontend, not a benchmark of the
entire stack on a two-core machine.

The earlier 24 GiB host passes all 72 tests twice with six workers in 253.9 and
252.1 seconds of browser execution. An earlier eight-worker measurement on the
32 GiB host peaks at 22.0 GiB system memory use, with at least 9.3 GiB available
and no OOM kills. The sixteen-worker tier has selector-test coverage, but no
browser benchmark on a 48 GiB machine.

The automated selection is reduced from 86 to 72 journeys through fourteen
removals or merges. The old unfiltered count of 92 also included four utilities
and two visual checks. Those six remain in the repository outside the automated
selection. Smoke screenshots use their separate command.

The reported scoring and stalled-game failures coincide with gameserver1
exiting at 14:27:09 UTC on 2026-09-12. Gameserver2 also exits during an earlier
load check at 14:59:32 UTC. The supervisor omits the exit signal; container OOM
counters remain zero. The reason for these service interruptions is unconfirmed.
The tests continue to fail on backend HTTP errors. Manual testing in mobile and
desktop browsers remains pending.
