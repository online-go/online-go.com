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

The earlier measurements use Chromium on a local Docker OGS stack with 32 logical
CPUs and 24 GiB RAM. Services and seeded data remain in place between complete runs.
On that machine the built runner selects all 72 automated tests, including `@Slow`,
with six workers and zero retries. Manual, visual, utility, and smoke tests are
outside this selection. Smoke tests retain their separate Docker command.

Fourteen automated browser journeys are removed or merged, reducing that
selection from 86 to 72. The old unfiltered command listed 92 entries because it
also selected four utility scripts and two visual checks. Those six remain in
the repository and are excluded from the automated run; the runtime improvement
does not represent removal of 20 automated journeys.

The measured runs execute inside `ogs_ui_1`, where dependencies and Chromium are
installed. With the local services running, the updated `init_e2e` fixtures
seeded, and `E2E_MODERATOR_PASSWORD` exported in the host shell, run:

```sh
docker exec -e E2E_MODERATOR_PASSWORD ogs_ui_1 yarn test:e2e
```

`docker exec` needs `-e` to receive the exported password. Running Yarn directly
on the host requires dependencies and Chromium to be installed there too. The
2026-09-11 measurements below use `test:e2e:built` after a separate build; the
standard command now performs those same phases in sequence.

| Complete run | Passed | Failed | Skipped | Browser duration |
| ------------ | ------ | ------ | ------- | ---------------- |
| First        | 72     | 0      | 0       | 4m 14s           |
| Repeat       | 72     | 0      | 0       | 4m 12s           |

These consecutive runs start at 20:32:35 and 20:37:00 UTC on 2026-09-11.
Both use the same final build and database, without a reset between runs.

The complete browser commands take 255 and 253 seconds including preview startup
and shutdown. The final frontend build takes 35 seconds, so that build plus the
first browser run takes 290 seconds. Dependency installation and service
startup are separate from these measurements.

On 2026-09-12, the standard `test:e2e` command passes all 72 tests with six
workers, zero retries, and zero skips. Its automatic build takes 33 seconds,
the browser suite takes 250.5 seconds, and the complete command takes
285.4 seconds (4m 45s). The container's out-of-memory kill count does not
increase during this run.

The later `make e2e` verification takes 295.7 seconds including its automatic
build: 71 tests pass and one fails because the backend's offensive-name check
rejects a randomly generated fixture username. There are no new out-of-memory
kills. Total system memory use peaks at 22.5 GiB, sampled every two seconds
using `MemTotal - MemAvailable`.

The warning-cleanup and Kibitz-navigation review fixes pass 13 new normal
regression cases and seven affected browser journeys. The browser checks use
six workers, no retries, and no skips, and complete in 89.6 seconds with no new
out-of-memory kills.

After increasing the host to 32 GiB (31.3 GiB reported by the OS), the automatic
selector chooses eight workers. The 2026-09-12 run takes 238.5 seconds in the
browser suite and about 240 seconds for the complete reuse command. It has
71 passes, no retries or skips, and one failure: the username filter rejects
`e2ekibBlk_fmlvdy2` during setup of the variation-sharing test. This is the same
unresolved generated-username fixture issue. Peak system memory use is 22.0 GiB,
with at least 9.3 GiB available, sampled every two seconds. There are no
out-of-memory kills. The preceding automatic build takes 30.9 seconds. The
first launch found no Chromium installation in the current container; installing
Chromium and its system dependencies allowed the browser run above. The 16-worker
tier is covered by normal selector tests, not a full browser benchmark.

An earlier run lost its game-server process during scoring and report loading,
which caused two failures. The tests are not expected to pass through a service
outage; the final measurements require running services.

Validation also includes 611 frontend tests, 337 backend tests with five existing
skips, TypeScript, frontend lint, the production build, Python lint and formatting,
and shell syntax checks for the CI runner. The built-runner tests check argument
forwarding, backend proxy selection, server shutdown, and success/failure exit
codes. They also check automatic builds, build failures before browser startup,
the missing-password error, and listing/help/smoke behavior without a build.
RAM-selection tests cover tier boundaries, host OS overhead, container limits,
valid and invalid overrides, and use of the automatic default by the built runner.
Proxy-warning tests cover colored log prefixes, duplicate callbacks, burst
counts, continuous resets, shutdown flushing, and preservation of other errors
and logger methods. The real Vite configuration is also checked for log-level
settings and live logger state. A controlled upstream produces real TCP resets through both
Vite server modes: four WebSocket resets produce one warning and one count
summary; an HTTP reset still logs an error and returns HTTP 502. Three browser
journeys (SGF download, early escape reporting, and suspended-user login) pass
in 13.1 seconds with no retries or skips after the logger change.
The CI orchestration script itself is not executed locally because it
updates repositories and sends notifications.

The backend aggregate `make lint` stops in the separate baduk.com app because
its Vite configuration cannot resolve Node types. Graphify is not installed in
this workspace, so `graphify update .` cannot run. Manual mobile and desktop
browser testing is required before submitting a PR.
