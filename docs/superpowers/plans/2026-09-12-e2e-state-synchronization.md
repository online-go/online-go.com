# E2E state synchronization plan

1. Preserve the ladder trace and identify the missing fixture invariant. Inspect
   the application handlers for each synchronization signal before changing it.
2. Inventory the selected automated tests, shared actions, mutable seeded
   accounts, fixed delays, instantaneous snapshots, and navigation after writes.
   Classify each dependency and record the audit in the testing guide.
3. Give UI writes a shared response-completion helper with controlled normal
   tests. Apply it to actions whose current UI signals precede completion.
4. Make ladder setup and cleanup idempotent and verified. Exercise the fixture
   from pre-existing vacation state and with delayed settings/write responses.
5. Replace the globally shared browser-ID suspension fixture with a fresh
   historical/current device relationship per execution. Correct related game,
   tournament, account, report, and notification checks
   identified by the audit. Live tournament starts require chat registration as well
   as saved membership; retain entrants until start. CM-vote suspensions require
   a new navigation to read the persisted ban, unlike direct moderator reload
   signals. Appeal-message POSTs must complete before another client queries the
   appeals list; disabled Submit is only optimistic input clearing. Replace the
   ModLog fixture's duplicate empty-board scoring with a short resignation game.
   Preserve the outcomes each browser test owns.
6. Capture native exit signals and a backtrace for the independent backend
   service exits observed during stress checks. Do not infer an OOM or hide a
   service failure with test retries.
7. Reproduce the shared `useData` mount/commit race with the real data store and
   React layout effects. Replace render-effect writeback with external-store
   subscriptions and explicit setters; verify consumers, defaults, removals,
   key changes, and StrictMode. Document the contract in `docs/data-hooks.md`.
8. Run focused checks with delayed responses and parallel CPU pressure, required
   frontend checks, one build, then repeated full batches without a reset.
   Review the final diff and update the existing PR with exact changed coverage.
