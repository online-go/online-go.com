# Compact mobile layout

Portrait play normally straddles the board with the two player cards: the
opponent above it, the local player below it. Compact mode replaces that
pair with one strip above the board, so the row the lower card took goes
back to the board.

## What the user sees

Both players sit on one row, black on the left and white on the right,
whatever seat the user holds. Each half puts the avatar on the outside of
the strip and the name, the capture count and the clock on the inside, so
the two halves mirror each other around the middle. The clocks mirror
too: black's time sits at the left edge with the turn clock icon after
it, and white's time sits at the right edge with the icon before it.

The middle holds a black stone left of centre and a white stone
overlapping it to the right. The side to move is drawn on top of the
other one. A small label above the stones names the rule set, and the
move number sits under them. Because the move number is shown here, the
button-only move controls under the board drop their "Move #" label.

The coloured card backgrounds are dropped in this layout: the stones in
the middle say who is who, and the halves read as one strip rather than
two cards. The capture count becomes a disc in the colour of the stones
captured — a player's captures are the opponent's stones, so black's count
sits in a white disc and white's in a black one. The komi drops its sign
and takes the first letter of the translated word "Komi" instead, so
"+ 6.5" becomes "K 6.5".

Everything else a player card carries stays: the country flag, the chat
presence dot, the auto-resign countdown, the stone-removal accepted badge,
the rengo team count, komi and handicap, the final points once the game
ends, and the tappable score breakdown. While the breakdown is open, a
transparent layer covers the screen, so a tap anywhere closes it without
also reaching the board or a button under it.

## Turning it on

The in-game Settings panel has a **Compact Mode** toggle directly below
Zen Mode. The row only appears in portrait, because the layout only
applies there. The choice is the `game.compact-mode` preference, so it
holds across games and devices.

## Where the code lives

- `src/views/Game/CompactPlayerHeader.tsx` — the strip. It renders the
  same `PlayerCard` the other layouts use, so every badge and popup on a
  card works here without a second implementation; the layout is done in
  `CompactPlayerHeader.css`.
- `src/views/Game/CompactTurnStones.tsx` — the two stones, the rule set
  label and the move number in the middle.
- `src/views/Game/Game.tsx` — picks the strip over the pair of cards for
  the `aboveBoard` slot, drops the lower card from `belowBoard`, and adds
  the `compact` class that `Game.css` uses to hide the move controls'
  "Move #" label.
- `useColorToMoveOnOfficialBranch` and `useOfficialMoveNumber` in
  `src/views/Game/GameHooks.ts` — which stone goes on top, and the move
  number under the stones. Both follow the official branch, so browsing the
  move tree changes neither. The colour hook answers null once the game is
  over.

`CompactPlayerHeader.css` overrides the player-card rules in
`Players.css`. Its selectors are one class deeper than the rules they
replace (`.MainGobanView.portrait .CompactPlayerHeader .player-icons ...`
against `.MainGobanView.portrait .player-icons ...`) so the overrides win
on specificity rather than on stylesheet order.
