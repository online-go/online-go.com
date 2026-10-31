# Kibitz thin player header

## Behaviour

Kibitz uses a thin player header in its stacked layout when the viewport is
narrower than 600 CSS pixels and either narrower than 390 CSS pixels or shorter
than 844 CSS pixels. The reference size, 390 by 844, keeps the existing header.
Desktop and landscape player cards do not change.

The thin header puts Black and White side by side. Each player has a colour
stone and linked name on the first row, with a clock and captures on the second.
Black's 32-pixel avatar sits on the left edge; White's sits on the right edge.
The halves use the existing player-card background, foreground and clock
colours. Player links use the dark palette on Black's panel and the light
palette on White's panel, including player-role colours in both themes.
A fixed underline marks the player to move on the official branch. Rules,
flags and komi are omitted from the thin strip. Clocks take priority;
captures use a small captured stone and count when the full label does not fit.

Both headers have an invisible 44-pixel-wide centre button that switches the
whole Kibitz layout between its thin and original forms. The choice lasts until
page reload. The button has a translated accessible label and a keyboard focus
outline. Names keep their standard player links; rules and komi remain in
Game information.

The room-title strip has less padding in this mode. The site navigation height
is capped at 44 pixels at the default font size while this Kibitz view is open;
the existing 32-pixel navigation on very short screens stays intact. Global
spacing is restored on leaving Kibitz.

The same compact mode reduces the move-arrow strip's vertical padding to
0.15rem per side and caps its buttons at 2.4rem high with 1.15rem glyphs.
Responsive button widths, navigation actions and the move label do not change.
The existing/new screenshot switch includes this strip. Other pages and the
slider presentation do not change.

The thin layout reduces the chat-panel basis from 12rem to 10rem and the
manual divider reserve from 8rem to 6rem. This permits up to 2rem more board
height. The header toggle restores the original defaults and reclamps stored
divider heights. Pointer and keyboard resizing use the same limits.

## Data and compatibility

Use the selected player-information controller already chosen by KibitzView.
Use the existing Clock component for time controls and overtime. Capture counts
follow the displayed position. The turn marker follows the official branch.
Preserve shared Game-page behaviour and the board engine. The shared split
accepts an optional panel reserve with its existing 8rem default.

## Verification

Check the reference boundary, resizing, selected-controller changes, captures,
clock updates, overtime, turn changes, avatars and capture label fitting. Inspect
320 by 568, 375 by 667, 390 by 844, large portrait and desktop layouts. Run the
targeted tests, TypeScript, lint, modified-file formatting and one final build.
