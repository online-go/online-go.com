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

Validate with focused tests, repeated parallel runs, the normal test suite,
TypeScript, lint, formatting, and one final build. Report measured limits and
environment failures explicitly if the runtime target cannot yet be verified.
