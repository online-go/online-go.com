# AI review

## Move numbers

Every move number on the game page is the engine's `cur_move.move_number`:
the slider, the move tree, the review chart crosshair, chat "Move N" links,
the `/game/:id/:move_number` route and `GobanController.gotoMove(n)`.

The review's data is keyed by position: `ai_review.moves[k]`, `win_rates[k]`
and `scores[k]` describe the board after `k` moves, and the analysis of a
move lives at the position it was played from. Lists that name moves (the
key moves list, the summary table's move popover, the chart highlight dots)
navigate through `reviewPositionOfMove()` in `src/components/AIReview/utils.ts`
to reach that position.

## What the board shows

At an analyzed position the board shows the AI's suggestions for the next
move as quality-colored circles with their score or win rate difference. The
move that was actually played is one of those circles, badged with a small
triangle in its quality color. Positions without analysis draw nothing.

Two preferences control the board marks:

- `ai-review-show-on-board` (default on): the four-dot button at the left of
  the Win % / Score row, also in Settings. Off hides every AI mark on the
  board; the panel's win rate, chart and summary table are unaffected.
- `ai-review-show-visit-counts` (default off): shows each suggestion's
  playout count under its score difference.

The goban holds no review state. The review draws with ordinary marks and
colored circles, and clicks in the move tree and shift-clicks on the board
jump to the clicked node.
