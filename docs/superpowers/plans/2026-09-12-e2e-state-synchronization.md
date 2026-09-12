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
5. Correct related game, tournament, account, report, and notification checks
   identified by the audit. Preserve the outcomes each browser test owns.
6. Run focused checks with delayed responses and parallel CPU pressure, required
   frontend checks, one build, then repeated full batches without a reset.
   Review the final diff and update the existing PR with exact changed coverage.
