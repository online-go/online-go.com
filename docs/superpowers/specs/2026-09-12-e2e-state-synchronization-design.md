# E2E state synchronization and repeatability

The automated suite must remain independent of prior executions and wait for
the state each next action requires. A successful click proves browser input
delivery, not completion of an HTTP write, a database transaction, or another
client's socket update. Dialog dismissal and negative element checks are not
completion signals unless the application ties them to that completion.

The latest ladder failure begins with P1 and P5 already on vacation. The API
correctly rejects the first challenge. Cleanup checks for an End vacation button
before the settings content has loaded, then silently skips restoration. A fresh
group does not isolate account-wide state on reused seeded accounts.

Audit the selected automated journeys and shared helpers for premature writes,
navigation, cross-client observations, cleanup, and negative assertions. Fix
the common contracts and their callers together. Reused mutable fixtures need
an established initial state and verified cleanup; cleanup failures must not be
reported as a successful run. Browser actions under test remain UI actions.

Add controlled checks that withhold a response or start with dirty fixture data.
Use them to establish why the synchronization works. Repeated whole-suite runs
are supplementary evidence, not a replacement for these checks. Keep all 72
automated journeys, the requested RAM tiers, and zero whole-test retries.
Record the audit, changes, and measured limits in the durable testing guide.

Two additional fixture contracts follow from the audit. Browser-ID suspension
uses a fresh historical/current device relationship per execution; the subject
page closes before the opponent completes the game because automatic suspension
reloads that account. Real countdowns have no guaranteed disabled observation
window on a loaded browser; normal tests with controlled timers own that boundary.
Live tournament entrants must remain registered in chat through start, as well
as having a saved tournament entry. Cleanup for unresolved malicious reports
must load the owned row and complete cancellation, with no timed silent skip.

Native backend exits need separate evidence. SIGSEGV is observed during a full
run and must remain a failure; neither write retries nor longer locator waits
repair a crashed service. The captured Node 22.13.1 backtrace enters
`SharedFunctionInfo::DebugNameCStr` through the allocation tracker while
materializing deoptimized objects. Development services enable that profiler
unconditionally. Share `NODE_DEBUG_FLAGS` with allocation tracking off by
default, retain heap snapshots and exposed GC, and allow deliberate profiling
as an override. Restart the service containers to apply the launcher change;
a watched bundle reload preserves the old supervisor arguments.

A CPU-constrained browser run exposes a frontend store race: the suspension
response includes the banned account ID, but mounted readers erase that value.
`useData` writes its initial render snapshot back in a passive effect, after a
newer value may have arrived. A deterministic real-store/React test reproduces
this without a browser delay. Use React's external-store subscription contract
and write only through the returned setter. This is a product correctness fix,
separate from the test synchronization changes; do not hide it with a reload.
