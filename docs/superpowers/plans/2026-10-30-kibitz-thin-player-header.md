# Kibitz thin player header implementation

1. Add a Kibitz viewport hook for the 390 by 844 reference boundary, restricted
   to phone widths and the stacked layout. Keep the selected size while the
   keyboard is open.
2. Extract the stacked header into its own component. Add a dedicated thin
   player component using existing player, clock and goban subscriptions.
3. Add an accessible disclosure for the existing full header. Close it on
   Escape, controller changes and layout changes.
4. Apply thin room-title and navigation spacing only while the thin Kibitz
   layout is active. Add capture overflow handling without hiding clocks.
5. Update docs/kibitz.md to describe the current player layouts and the thin
   header. Add focused tests for data updates, expansion and layout boundaries.
6. Format modified files, run focused tests, type-check and lint, inspect the
   browser layout, then run the build once. Record any limits in the handoff.
