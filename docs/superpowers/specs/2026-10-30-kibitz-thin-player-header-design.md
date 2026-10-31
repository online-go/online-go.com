# Kibitz thin player header

## Behaviour

Kibitz uses a thin player header in its stacked layout when the viewport is
narrower than 600 CSS pixels and either narrower than 390 CSS pixels or shorter
than 844 CSS pixels. The reference size, 390 by 844, keeps the existing header.
Desktop and landscape player cards do not change.

The thin header puts Black and White side by side. Each player has a colour
stone and linked name on the first row, with a clock and captures on the second.
A fixed underline marks the player to move on the official branch. Rules,
avatars, flags and komi are omitted from the thin strip. Clocks take priority;
captures move to the expanded cards when there is too little room.

A centre disclosure button opens the existing full player header below the
strip. It is an inline expansion, so it has no backdrop or separate focus
scope. Escape closes the expansion before it can leave a variation. Changing
the selected game or leaving the thin layout closes the expansion.

The room-title strip has less padding in this mode. The site navigation height
is capped at 44 pixels at the default font size while this Kibitz view is open;
the existing 32-pixel navigation on very short screens stays intact. Global
spacing is restored on leaving Kibitz.

The same compact mode reduces the move-arrow strip's vertical padding to
0.15rem per side and caps its buttons at 2.4rem high with 1.15rem glyphs.
Responsive button widths, navigation actions and the move label do not change.
The existing/new screenshot switch includes this strip. Other pages and the
slider presentation do not change.

## Data and compatibility

Use the selected player-information controller already chosen by KibitzView.
Use the existing Clock component for time controls and overtime. Capture counts
follow the displayed position. The turn marker follows the official branch.
Do not change shared Game-page components or the board engine.

## Verification

Check the reference boundary, resizing, selected-controller changes, captures,
clock updates, overtime, turn changes and expansion keyboard behaviour. Inspect
320 by 568, 375 by 667, 390 by 844, large portrait and desktop layouts. Run the
targeted tests, TypeScript, lint, modified-file formatting and one final build.
