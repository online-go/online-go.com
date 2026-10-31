# Kibitz thin player header implementation

1. Add a Kibitz viewport hook for the 390 by 844 reference boundary, restricted
   to phone widths and the stacked layout. Keep the selected size while the
   keyboard is open.
2. Extract the stacked header into its own component. Add a dedicated thin
   player component using existing player, clock and goban subscriptions.
3. Add an accessible disclosure for the existing full header. Close it on
   Escape, controller changes and layout changes.
4. Apply thin room-title and navigation spacing only while the thin Kibitz
   layout is active, including less vertical padding and smaller arrow
   buttons in the move-navigation strip. Add capture overflow handling
   without hiding clocks.
5. Update docs/kibitz.md to describe the current player layouts and the thin
   header. Add focused tests for data updates, expansion and layout boundaries.
6. Format modified files, run focused tests, type-check and lint, inspect the
   browser layout, then run the build once. Record any limits in the handoff.

## Verification

- The two focused suites pass all 48 tests, including live clock and capture
  updates, byo-yomi, Canadian overtime, pause state, official-turn tracking,
  controller changes, Escape, the reference boundary and keyboard stability.
- TypeScript, lint, modified-file formatting and the production build pass.
- Browser checks use an actual beta room at 320 by 568, 375 by 667,
  390 by 844 and 844 by 390. The thin header is 45 pixels high including its
  border, and its disclosure has a 44 by 44 pixel touch target. The existing
  cards return at the reference size and in landscape. Expansion fits at 320
  pixels. Live clock rendering is also checked with a local game fixture.
- The browser test expectations include both header forms. The full end-to-end
  suite is not run.
