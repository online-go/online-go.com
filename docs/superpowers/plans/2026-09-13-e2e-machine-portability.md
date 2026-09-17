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

## Completed validation

- Preserve the original board-resize and delayed-result failures, then pass the
  same timing conditions after the shared helper fixes.
- Keep all 72 automated journeys. Convert seven moderation fixtures to
  resignation, share scoring in three further callers, and open twenty initial
  CM setup sites across twelve journeys directly at their report.
- Pass 638 normal tests, TypeScript, lint and formatting. The one final build
  runs through `make e2e`; the separate CI gameplay/scoring smoke test passes.
- Pass all three final full batches without retries or a database reset:
  automatic eight-worker fresh build (293.4s), sixteen workers on four
  frontend/browser cores (506.1s), and normal sixteen workers
  (259.9s). Preserve the baseline 70/2 failure report for comparison.
- Record runtime metadata and original failures in the JSON report. Document
  the exact commands, retained feature coverage, measured limits and remaining
  remote uncertainty in `docs/e2e-testing.md` and the existing UI PR.
