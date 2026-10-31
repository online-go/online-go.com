# Kibitz thin player header implementation

1. Add a Kibitz viewport hook for the 390 by 844 reference boundary, restricted
   to phone widths and the stacked layout. Keep the selected size while the
   keyboard is open.
2. Extract the stacked header into its own component. Add a dedicated thin
   player component using existing player, clock and goban subscriptions.
3. Put 32-pixel avatars at the two outer edges. Add an invisible centre button
   to both stacked headers to switch layouts and navigation spacing together.
   Keep the manual choice until page reload. Abbreviate capture labels
   to a captured stone and count when the full text does not fit. Use the
   original player-card palettes for backgrounds, clocks, text and player links.
4. Apply thin room-title and navigation spacing only while the thin Kibitz
   layout is active, including less vertical padding and smaller arrow
   buttons in the move-navigation strip. Add capture overflow handling
   without hiding clocks.
5. Update docs/kibitz.md to describe the current player layouts and the thin
   header. Add focused tests for data updates, avatars and layout boundaries.
6. Format modified files, run focused tests, type-check and lint, inspect the
   browser layout, then run the build once. Record any limits in the handoff.

## Verification

- The three focused suites pass all 73 tests, including live clock and capture
  updates, byo-yomi, Canadian overtime, pause state, official-turn tracking,
  controller changes, avatars, the reference boundary, keyboard stability and
  switching both header layouts through the centre button.
- TypeScript, lint and modified-file formatting pass. The production build
  remains a final-push check for the avatar revision.
- Browser checks use an actual beta room at 320 by 568, 375 by 667,
  390 by 844 and 844 by 390. The thin header is 45 pixels high including its
  border. The existing cards return at the reference size and in landscape.
  Live clock rendering is also checked with a local game fixture.
- The browser test expectations include both header forms. The full end-to-end
  suite is not run.
