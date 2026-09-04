# Game action area

The game page keeps the controls a player must reach without scrolling in
one container, `GameActionArea` (`src/views/Game/GameActionArea.tsx`).

## What it holds

- Play phase, for a participant: the `PlayButtons` strip. Pass or Submit
  in the center, Resign at the right, the undo response at the left. When
  analysis is disabled and the user has stepped back through the game, the
  center slot holds Back to Game instead.
- Score estimation: the estimate and the Back to Board button.
- Stone removal phase: Accept removed stones with its clock, Auto-score,
  and Cancel and resume game. Each player card shows a check or cross badge
  for whether that player has accepted. The sealing warning and the phase
  explanation stay in `PlayControls`.

It renders nothing when the current state has none of these.

## Where it renders

- Portrait (mobile): the Game view passes it to GobanView's `belowBoard`
  slot, under the bottom player card. The slot is part of the board stage,
  and the board is the only part of the stage that shrinks, so anything in
  the area pushes the board up instead of falling below the fold. There is
  no fixed height reservation to keep in sync.
- Wider layouts: `PlayControls` renders it at the top of the sidebar.

## Adding to it

Put a control here only when a player must see it without scrolling and it
fits in a row or two. Cards with explanatory text, such as the anti-grief
cards, stay in `PlayControls`.
