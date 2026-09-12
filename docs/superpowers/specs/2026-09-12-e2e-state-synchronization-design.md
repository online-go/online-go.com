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
