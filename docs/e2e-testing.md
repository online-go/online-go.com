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
Do not overlap another frontend build with the browser suite when measuring
runtime or memory use.

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

All three tournament journeys keep the director's live connection while players
join. They check the full player count and names before starting, wait for the
start response, and require results without a reload. Each joining player waits
for its completed join response, then reloads to check persisted membership and its own server-confirmed chat presence. Players stay connected until the tournament starts: live starts remove entrants who are absent from tournament chat.

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
Warning cleanup waits for each complete acknowledgement response, dismisses at most ten queued messages and then checks whether
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
only cancels reports created by that test. The two cancellation journeys require their unresolved row to load and the cancellation response to finish; an absent row cannot silently count as successful cleanup.

The one-at-a-time escaping queue browser test is replaced by
`report_manager.test.ts`: real report updates hold the next report until its
predecessor resolves, keep different accused users independent, and scope a
reporter's own count. Backend `browser_id_suspension_test.py` covers first-game
eligibility, historical browser IDs, suspension persistence, and client signals.
The browser still checks suspension after a real game. Each execution creates
its own account and device-ID relationship: the old account logs in with a new
current ID, then is suspended. UI registration uses its historical ID and plays
eight moves. The subject page closes before the opponent resigns, avoiding a
race between a finished-game assertion and the automatic suspension reload. A
fresh page verifies suspension; the moderator checks the matched-account dropdown. No fixed
browser ID or cleanup login is shared across runs.

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

Browser warning journeys verify delivery, play restrictions, acknowledgement,
and dismissal. They do not require a short-lived disabled OK button after
checking the box: a slow browser can arrive after the countdown expires.
`AccountWarning.test.tsx` checks that boundary with controlled timers.

Warning countdowns follow the message ID and acknowledgement state. Refreshing
an unchanged message does not restart the reading delay. A new message resets
both the checkbox and the countdown. Component tests cover both cases without
waiting on real time. Backend account updates are published after the database
transaction commits, so the browser can fetch newly announced warnings. Normal
backend tests exercise commit, rollback, and autocommit delivery.

The shared `useData` hook subscribes through React's external-store contract.
Readers do not write render snapshots back to the store. A mounting reader
previously could erase a newly received suspension ID between render and effect
subscription, leaving account settings in the normal-user state. Eight normal
regressions cover that ordering, shared setters, removal, defaults, key changes
and StrictMode; six fail before the fix. See [React data subscriptions](data-hooks.md).

## Synchronization contracts

A click proves that an action was dispatched. A closed modal, changed local
label, or response headers alone do not prove that the server finished a write.
`actAndWaitForResponse` registers the expected HTTP method and path before one
UI action, rejects unsuccessful responses, and waits for the response to finish.
It does not retry writes. Report-count diagnostics run only after a successful journey, so teardown cannot replace an original failure with a closed-page error. Initial-response waits that span navigation allow the navigation and data-load budgets. The development CDN test also waits for the application to replace its seeded cached-config marker, so response headers cannot make that check pass before refresh is applied. Report submission retries only opening the player
popover; it never repeats a submission after an assertion fails.

The automated selection is audited by dependency:

| Dependency                                                                               | Completion required before the next step                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reused ladder accounts                                                                   | Load either vacation-state button before inspecting state. Normalize P1 and P5 before setup, restore both in cleanup, and verify persisted vacation changes. Attempt each cleanup independently; cleanup errors fail an otherwise successful test. A fresh group isolates ladder games but does not reset account-wide vacation.                                                                                                                                      |
| Group, ladder, direct-game and invite writes                                             | Complete the exact join/create/accept/delete response before navigation or another write. Invite deletion also waits for the card count to decrease.                                                                                                                                                                                                                                                                                                                  |
| Multiplayer games                                                                        | Acceptance must navigate both players to the returned game ID and load both boards. Every played move must reach both displays. Scoring and undo additionally verify their own engine state and peer acknowledgements. Non-clock tests use long fixture clocks; the first-turn warning journey keeps its real timeout.                                                                                                                                                |
| Tournament membership and start                                                          | Persist each join, load membership, and receive the player's chat-join confirmation. Keep entrants connected, observe all joins on the director's live page, then complete the start response and observe results.                                                                                                                                                                                                                                                    |
| Account updates, suspension, restoration and appeals                                     | Complete the write before leaving the page. Normal account saves wait for an actual new navigation. Suspended saves wait for the config refresh, then load settings again to prove the ignored update was not persisted. Suspension fixtures disconnect the subject page before moderation to avoid racing its reload signal. Appeal-message writes finish before another client loads the appeal list: Submit disables when input clears, before the POST completes. |
| Reports and votes                                                                        | Complete writes before closing voters or claiming/closing reports. Wait for populated voting options before checking counts. Access-denial checks require the HTTP 403, and empty queues require the initial report synchronization. No-warning checks inspect the persisted queue after voting completes.                                                                                                                                                            |
| Friends and notifications                                                                | Complete friend request and decline writes before checking notification outcomes or sending another request. Positive message assertions establish delivery before dismissal.                                                                                                                                                                                                                                                                                         |
| Remaining navigation, board tools, puzzles, profile, accessibility and dev-server checks | Use loaded content, board mode, persisted preferences, exact request contents, or responses specific to each scenario. Keep intentional clock tests and controlled browser interactions; do not substitute a delay for a state check.                                                                                                                                                                                                                                 |

For a latency check, run the built command with `E2E_API_DELAY_MS=500`, for example:

```sh
docker exec -e E2E_MODERATOR_PASSWORD=xyzzy -e E2E_API_DELAY_MS=500 ogs_ui_1 yarn test:e2e:built --workers=8
```

This delays real browser API requests in the multi-user context fixture before
dispatch. It does not mock responses or delay API fixture setup. The default is
zero. Playwright routing also disables the browser context's HTTP cache, so
this mode adds asset-loading work on reloads as well as API latency. Use it to
expose navigation and optimistic-UI races; measure normal runtime without it.
See [Playwright's routing documentation](https://playwright.dev/docs/api/class-browsercontext#browser-context-route). To test recovery, put only the dedicated worker's P1 and P5
ladder accounts on vacation first, then run the ladder repeatedly without
resetting the database and verify both accounts finish off vacation.

## Verification

All 635 normal frontend tests pass, as do TypeScript, lint, modified-file
formatting and the production build. Eight data-hook regressions cover store
ordering and subscriptions; six fail before the fix. Seven request-helper tests
control header/body completion and failures. A report-count regression ensures
diagnostics preserve the original journey failure. Graphify is not installed
in this development environment, so `graphify update .` cannot run.

The final full batches use Chromium in `ogs_ui_1` on a host with 32 logical CPUs
and 32 GiB installed RAM (31.3 GiB reported). They include `@Slow`, with zero
retries, no skips, and no database reset between batches. Services, dependencies,
Chromium and seeded data are already available. Times include built-runner
startup and shutdown; builds are measured separately.

| Batch     | Workers | Injected delay              | Passed / failed | Built command |
| --------- | ------- | --------------------------- | --------------- | ------------- |
| normal-16 | 16      | None                        | 72 / 0          | 295.8s        |
| latency   | 8       | 500 ms; HTTP cache disabled | 72 / 0          | 310.1s        |
| normal-1  | 8       | None                        | 72 / 0          | 251.5s        |
| normal-2  | 8       | None                        | 72 / 0          | 256.2s        |

A fifth full run through the ordinary `make e2e` command passes all 72 tests
with the automatically selected eight workers, no retries and no database
reset. Its total wall time is 369.4 seconds (6m 9s), including a Vite build
reported as 1m 7s. The browser summary reports 5.0 minutes. The normal prebuilt
batches above are below five minutes; the full command with a fresh build does
not meet that target. API-delay mode also disables HTTP caching and is a stress
check, not the runtime benchmark. Only documentation changed after this final
build and test run.

Four ladder executions pass with two workers and 500 ms API delay after each
worker's P1/P5 accounts are deliberately put on vacation; all four accounts
finish off vacation. Eight focused tournament/CM-suspension executions pass
with eight workers on four CPU cores in 61.3 seconds. Live tournament entrants
remain connected and confirm chat registration before start. Ten repeated appeal
journeys pass with eight workers and 500 ms API delay in 53.9 seconds after
correcting optimistic Submit-button checks. The ModLog trace previously showed
the moderator fetching the appeals list before the user's POST completed.

The full sixteen-worker/four-core CPU stress audit takes 529.9 seconds: 70 pass,
and two CM journeys reach their existing 180-second whole-test deadlines. The
suspension journey is still processing its third vote when teardown starts;
the sandbagging warning journey has not completed its ten-second countdown.
The traces show continuing progress, not a missed state notification. These
are real failed runs. No timeouts or RAM tiers are changed to conceal them.
The restriction applies to the frontend/browsers, not the backend. RAM capacity
alone cannot guarantee efficient concurrency or a five-minute runtime on a
CPU-constrained machine. This audit predates the final appeal synchronization and allocation-profiler
changes. The final batches above include those fixes; the full four-core
stress case has not been repeated since them.

The scoring failure recurs under a debugger. The game-server2 native stack on
Node 22.13.1 enters `SharedFunctionInfo::DebugNameCStr` through
`AllocationTracker::AddFunctionInfo` and `AllocationTracker::AllocationEvent`
while materializing deoptimized heap objects. The failing services were started with
unconditional `--track-heap-objects` in their development launchers. The backend companion makes
allocation tracking opt-in through `NODE_DEBUG_FLAGS`; ordinary heap snapshots
and exposed GC remain available. This avoids the captured profiler path without
changing game rules or Node versions. It is a workaround for the V8 profiling
fault, not a V8 patch. Eight repeated scoring/stalled-game checks pass in 49.1s
with the new defaults. All final full batches above run after restarting the
Node services with tracking disabled. Restart existing Node service containers
to pick up changed launch flags; a bundle rebuild preserves supervisor arguments.

Backend `make lint` passes the Node checks, then fails on existing baduk.com
Node-type errors. All nine service launch recipes pass dry-run checks with
tracking disabled by default and explicitly enabled; running arguments confirm
the new defaults in all eleven Node service containers. Python source and its
recorded 337 passes/five existing skips are unchanged in this follow-up.
