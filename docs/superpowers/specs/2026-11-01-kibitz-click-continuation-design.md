# Kibitz click continuation

Clicking a legal move on a posted variation starts a separate draft at that move. The posted variation stays unchanged. Navigation alone does not start a draft. The explicit branch button remains available.

The board emits `analysis-move` after a successful analysis placement. Kibitz uses the resulting move path to enter its existing posted-variation draft flow. The draft baseline is captured before replaying the new move, so cancellation detects unsaved changes.

Validation: TypeScript, lint, formatting, focused Kibitz tests, and production build. Check desktop and mobile placement, earlier-move branches, illegal moves, cancellation, and original variation preservation.
