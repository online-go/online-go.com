# E2E machine portability plan

1. Record repository/service state and request the remote assertion details.
   Run an unchanged sixteen-worker/four-core baseline and preserve its traces.
2. Trace the reported journeys through shared game input, auto-scoring,
   tournament membership, application loading, and development asset handling.
   Reproduce timing dependencies with controlled experiments.
3. Correct confirmed synchronization gaps across all relevant callers. Retain
   feature coverage and exact outcome assertions; use normal regressions for
   deterministic helper behavior where they add useful coverage.
4. Improve failure evidence and isolate HTTP-only checks from browser startup
   where the existing test does not need application execution.
5. Run focused delayed checks and the constrained full suite, required normal
   checks, and one final build. Repeat the ordinary full suite without a reset.
6. Update the testing guide and existing PRs with changed coverage, root-cause
   evidence, timing, and remaining remote uncertainty.
