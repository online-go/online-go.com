# AI review move numbers

The game page has one move number space: the engine's. `engine.cur_move.move_number`
is the position on the board, and every surface shows or accepts that number
directly: the move slider, the move tree, the review chart crosshair, chat
"Move N" links, the `/game/:id/:move_number` route, and `GobanController.gotoMove(n)`.

## How a move is reviewed

The AI review analyzes positions. `ai_review.moves[k]`, `win_rates[k]` and
`scores[k]` describe the position after `k` moves. The analysis that matters for
move `N` (its alternatives and its quality) lives at position `N - 1`, the
position it was played from.

At an analyzed position `N - 1` the board shows:

- The alternatives for move `N` as quality-colored circles with their score
  or win rate difference.
- Move `N` itself (the engine's `trunk_next`) as a quality-colored circle
  like any other suggestion, plus its quality badge when the review has
  classified it. The badge is what marks it as the move played. It is never
  drawn as a stone.

When the position has no analysis, nothing is drawn for move `N`.

The `ai-review-show-on-board` preference (default on, toggled by the four-dot
button at the left of the Win % / Score row and in Settings) controls whether
the review draws anything on the board at all. When it is off, the board
carries no AI marks, circles or badges; the panel's win rate, chart and
summary table are unaffected.

The engine does not move. The slider, chart and move tree all say `N - 1`.

## The one conversion

Lists that name moves (the key moves list, the summary table's move popover,
the chart's highlight dots) hold move numbers `N`. Before navigating or placing
a dot they convert with `reviewPositionOfMove(N)` in `src/components/AIReview/utils.ts`,
which returns `N - 1`. That is the only place a move number and a position
number differ. Do not add a second space (for example, a display number that
is one more than the engine's). It cannot be kept consistent across the URL,
chat links, variations and asynchronous review loading.

## Goban side

The goban has no state for any of this. The review draws with ordinary marks
and colored circles, and clicks in the move tree and shift-clicks on the board
jump to the clicked node.
