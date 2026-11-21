# Kibitz: rooms on demo boards

Date: 2026-11-21. Issue: online-go/online-go.com#3899. Spans `ogs` (model,
endpoints, serializers) and `ogs-ui` (the room). This document lives in
`ogs-ui` because most of the work is here.

## Intent

A Kibitz room can only watch a live OGS game. Teachers, group reviews and
people following a professional game on an external stream need a room that
follows a board someone moves by hand. The presenter places stones on an OGS
demo board; everyone in the room watches it in real time, chats and shares
variations as they do on a game.

OGS already has that board: a demo board is a `Review` with no `game`, and a
review of a game is the same object with `game` set. Goban connects to either
with `review_id` (`review/connect`, `review/<id>/r`, `isDemoBoard()`), and
`GobanController` already accepts `review_id` and joins the `review-<id>`
chat. This work lets a room watch a review, and makes the parts of the room
that assume a game work for one.

## As built

The build departed from the design below in these places. The durable
description is the "Demo boards" section of `docs/kibitz.md`.

- The client has no separate `KibitzWatchedReview` type: the review is read
  into `KibitzWatchedGame` with `review_id` set and `game_id` absent, so the
  code that reads `room.current_game` works unchanged. Boards are compared
  through `kibitzBoardRef`. The draft source is one `variation_source_board`
  key.
- The presenter does not move stones in the room. The main board is a
  follower for everyone; More actions links to the review page ("Open the
  board"), where the presenter moves the stones.
- A variation whose branch point is gone is told to the reader by a toast,
  not by a message in the variation panel.
- The picker takes a demo board or review by ID field (URL) only. The "My
  demo boards and reviews" list is not built.
- Telemetry does not carry `mode` yet.
- Room chat lines in a review room carry no board position.
- The connection keeper stays game-only: the picker shows no connected review
  boards that could disconnect the room's review.
- "Change live game" keeps its label.

## Terms

- **Board**: what a room watches. Either a game or a review.
- **Review**: a `go_app.Review` row. A demo board is a review whose `game` is
  null. Both are in scope.
- **Presenter**: the review's `controller`, the one user whose moves are the
  review's official position. Not necessarily the room's creator.
- **Demo mode**: a room whose board is a review.

## What gets built

### Which reviews a room can watch

Any review that is not private. `Review.private` is already true for a review
of a private game (`game.py` sets it from the game when the review is
created), so the one check covers both. A private review is rejected even when
the caller is on its ACL: a room is public, and its viewers are not.

Any user who may manage the room (creator or moderator, the existing
`can_change_board_directly`) may attach any public review. Being the review's
owner or controller is not required, the same as for games today.

The "player in an active game" block does not apply to reviews.

Preset and broadcast rooms stay game-only. The preset selector must not pick,
keep or replace a review.

### Backend (`ogs`)

#### Model

`KibitzRoom` gains `current_review`, a nullable foreign key to
`go_app.Review`, `related_name="+"`, `on_delete=SET_NULL`. A check constraint
allows at most one of `current_game` and `current_review` to be set. A room
with neither is still valid (a preset between games, or a room whose review
was deleted).

Migration: the next number in `ogs/kibitz/migrations/` (0009 at the time of
writing). Confirm it is free on `origin/main` before creating it.

#### Endpoints

- `POST kibitz/rooms` takes either `source_game_id` or `source_review_id`.
  Exactly one is required. Both is a 400.
- `POST kibitz/rooms/:id/change-board` takes either `game_id` or `review_id`,
  exactly one. Setting one clears the other in the same save. It is a 403 for
  a preset or broadcast room when the target is a review.
- `_validate_review_for_room(review_id_raw)`, beside
  `_validate_game_for_room`: integer id, review exists (404), not private
  (403).
- `GET kibitz/rooms?review=<id>` mirrors `?game=`: every room whose
  `current_review_id` is that review. A non-integer is a 400. Passing both
  `game` and `review` is a 400.
- `KibitzRoomDetail.get` skips `is_user_player_in_active_game` when the room
  has no `current_game`.
- Every queryset that `select_related`s `current_game` also takes
  `current_review`, `current_review__owner`, `current_review__controller`,
  `current_review__black`, `current_review__white`.

The `board-changed` and `room-updated` pushes are unchanged; their payload is
the serializer output below.

#### Serializers

Both serializers gain:

- `current_review_id`
- `current_review`, a block mirroring `KibitzWatchedReview` (below), or null
- `mode`: `"demo"` when `current_review` is set, otherwise `"live"`

The `current_review` block:

| field            | source                                                                |
| ---------------- | --------------------------------------------------------------------- |
| `review_id`      | `review.id`                                                           |
| `board_size`     | the review's width and height (from its game, else its stored config) |
| `title`          | `review.name or ""`                                                   |
| `black`, `white` | `_player_block(review.black/white)` when set, else a name-only block  |
| `controller`     | `_player_block(review.controller)`                                    |
| `owner`          | `_player_block(review.owner)`                                         |
| `game_id`        | `review.game_id` (null for a demo board)                              |
| `outcome`        | `review.outcome` or null                                              |

A name-only block is `{ id: 0, username: black_player_name or "",
ranking: black_player_rank, professional: black_player_pro, ui_class: "" }`,
and the same for white. `id: 0` tells the client the name is not an OGS
account and must not be linked.

Where the board size is stored for a demo board is left to the builder to
confirm; if it is only in the game-server's review log, read it the way
`ReviewDetail` / `ReviewSerializer` already does.

#### Preset selector

`preset_selector.py` and `tasks.py` filter on `kind=preset`; check that no
path reads or clears `current_review`, and that no review room ever reaches
the selector. The constraint makes a stray write fail rather than leave a room
with two boards.

### Frontend (`ogs-ui`)

#### Types (`src/models/kibitz.d.ts`)

- `KibitzBoardRef = { kind: "game" | "review"; id: number }`, plus helpers
  `boardRefKey(ref)` (`"game:123"`, `"review:45"`) and `sameBoard(a, b)`, in a
  new `src/views/Kibitz/kibitzBoardRef.ts`.
- `KibitzWatchedReview`: the serializer block above.
- `KibitzRoomSummary` gains `current_review_id`, `current_review` and `mode`.
  The existing `KibitzMode` type is used for `mode`.
- `KibitzVariationSummary` gains optional `review_id`. Exactly one of
  `game_id` and `review_id` is set; `game_id` becomes optional in the type.
- `KibitzSecondaryPaneState.variation_source_game_id` /
  `variation_source_game` gain review counterparts, or are replaced by a
  `variation_source_board: KibitzBoardRef` plus the watched-board block. The
  builder picks; the replacement is preferred if it does not spread too far.

#### The board-ref refactor (no behaviour change)

Every place that groups, filters or compares by `game_id` moves to the board
ref: `useKibitzGobans` (`computeSecondaryTargetGameId`, the composed set, the
`useMainTrunk` test, `variationGameById`), `KibitzController`
(`mapAnalysisToVariation`, the secondary-pane setters, the board-change chat
line), `kibitzVisibleVariations`, `KibitzVariationList`,
`kibitzVisibleStreamItems`, `kibitzChatMove`, `KibitzVariationChip`,
`KibitzVariationPanel`. Games keep exactly today's behaviour. This lands as
its own commit so review can confirm nothing changed.

#### Variation wire format

An analysis chat body for a review variation carries `review_id` and no
`game_id`. Current clients drop bodies without `game_id`
(`mapAnalysisToVariation`), so an old client in a demo room ignores the new
variations instead of misplacing them. A body with both is invalid and
dropped.

Demo variations also carry `from_path`: the move path from the root to the
node the variation branches from (`getMoveStringToThisPoint()`), which
`from` alone cannot express once the review has branches. `from` is still
sent, as the move number of that node, for display.

#### Anchoring variations on a review

A game's trunk only grows. A review's does not: the presenter branches, goes
back, deletes nodes and edits stones. So in demo mode:

- The main board's snapshot for a secondary board copies the whole review
  tree, branches included, not `cloneOfficialTrunkMoveTreeJson`. The trunk
  test in `captureCurrentGameBaseSnapshotFromController` (tail move number
  against the room's `move_number`) does not apply.
- A variation opens by finding `from_path` in the copied tree
  (`findNodeByMovePath`) and laying its moves from there.
- If the node is gone (the presenter deleted it), the variation still opens:
  its moves are replayed from the root along `from_path` as a fresh line, and
  the variation panel says the position is no longer on the presenter's
  board. It is never laid onto a different node that happens to share the
  move number.
- A draft started on the main board branches from the node the reader is
  looking at, wherever in the tree that is.

#### The main board

- `useKibitzGobans` creates the main controller with `review_id` instead of
  `game_id` when the room is in demo mode. `connect_to_chat: true` already
  joins `review-<id>`.
- The main board follows the presenter, as the review page does for a
  non-controller. "Return to live" goes to the presenter's current node, not
  the trunk tail.
- `useKibitzCurrentGameConnectionKeeper` re-sends `review/connect` for a
  review, for the same reason it re-sends `game/connect` (the picker's
  previews disconnect on unmount). Check whether review previews in the picker
  have the same effect before relying on it.
- If the presenter is in the room and is the viewer, the main board is
  interactive the way the review page is for the controller: their moves go to
  the review. Everyone else's main-board clicks start a draft, as today.

#### Room chrome

- The chat tabs are "Board" and "Kibitz" in demo mode; "Board" is the
  review's chat. The game-chat composer rules (signed in, validated email)
  apply unchanged.
- Player cards and the thin header show the review's players with no clocks.
  A name-only player (`id: 0`) is plain text, not a player link, and has no
  avatar (the placeholder avatar is used).
- The header shows the room title, and on the right the review's `outcome`
  when it has one, where a game shows its result.
- More actions: "Review information" in place of game information, a link to
  `/review/<id>` (or `/demo/<id>` for a demo board), and SGF download from the
  review's SGF endpoint. Call moderator reports the review.
- Score estimation and the analysis policy follow the rules the review page
  already uses for reviews. `analysis_disabled` does not apply.
- The left aside's live-game thumbnail shows the review's board.

#### The picker (`KibitzGamePickerOverlay`)

A third source beside Ongoing and Game ID: **Demo board**, in both layouts.

- "My demo boards and reviews": `GET reviews?owner_id=<me>`, private ones
  left out, newest first.
- A review ID or URL field. `parseGameId.ts` gains a review parser that
  accepts a bare id, `/review/<id>`, `/review/view/<id>`, `/demo/<id>`,
  `/demo/view/<id>`, with or without a move number and host.
- The selected review's preview and the room-details fields work as for a
  game. The primary action is the same Create room / Change board button.

Creating a new demo board from inside the picker is out of scope for this
change.

#### Proposals

A proposal to switch to a review is not supported. The proposal UI offers
games only; a room in demo mode can still receive proposals to switch to a
game, which behave as today.

#### Directory and cards

- Room cards (`KibitzRoomCard`, the room list) show the review's title or its
  player names, marked as a demo or review.
- `/kibitz` default-room selection skips nothing new: the "player of the
  watched game" rule does not apply to reviews.
- `useKibitzDirectoryRooms` keeps working: review rooms have a null
  `current_game_id`, so the Game page cards never list them.

Review page cards (rooms on this review, the Game page cards' twin) are not
in this change.

### Telemetry

Room-level events in `kibitzTelemetry.ts` carry `mode`. Update the schema in
`ogs/docs/kibitz-telemetry.md` and the termination-server validator if it
rejects unknown fields.

## Tests

- `ogs`, in `ogs/api/views/kibitz_rooms_test.py` (request-level, runs under
  `make pytest`, not in `ogs/kibitz/`): create with a review; change from a
  game to a review and back, the other field cleared each time; private
  review rejected; both ids is a 400; review on a preset room is a 403;
  `?review=` filter; detail GET of a review room by a user who is playing a
  live game elsewhere is allowed. A migration test is not needed; the
  constraint is covered by the "both ids" path.
- `ogs-ui` jest: board-ref grouping (a game and a review with the same
  numeric id do not mix); `mapAnalysisToVariation` accepts `review_id`,
  rejects both; anchor resolution, including a deleted anchor node; the
  review URL parser; the picker's Demo board source; name-only players render
  without links.
- e2e (local stack): the presenter creates a demo board and a room on it and
  places a stone; a second user in the room sees it, posts a variation; the
  presenter sees the variation in the room.

## Durable documentation

`docs/kibitz.md` says the room watches "one live game". Rewrite that line and
add a "Demo boards" section: what a room may watch, who moves the board, how
variations are anchored on a review, and what the chrome changes. Add the
`review` parameters to the endpoint docstrings in `ogs/kibitz/views.py`.

## Goals, non-goals, anti-goals

Goals:

- A room owner can point a room at any public demo board or review, from the
  picker, by list or by id or URL.
- Everyone in the room sees the presenter's moves in real time.
- Chat, people and variations work in demo mode as they do on a game.
- A variation stays attached to the position it was made from, or says
  plainly that the position is gone.

Non-goals:

- Creating a demo board from the picker.
- Proposals to switch a room to a review.
- Preset or broadcast rooms on reviews.
- Room cards on the review page.
- Private reviews, for anyone.

Anti-goals (this would be a failure even if it works):

- A variation drawn on the wrong position after the presenter edits the tree.
- A game's and a review's variations mixing because their numeric ids match.
- An old client misplacing demo variations rather than ignoring them.
- Any change to how a room on a game behaves.
- A name-only demo player linked to an unrelated OGS account.

## Constraints

- ogs-ui rules: one component per file with its own CSS, no `any`, all
  strings through `pgettext`/`npgettext`/`interpolate`, PostCSS nested
  syntax.
- `ogs` rules: `make lint`; migration number checked against `origin/main`;
  migrate the local stack only.
- The `ogs-ui` pull request says `Depends on online-go/ogs#<number>.`

## Decisions the user made

- Rooms may watch any public review, demo boards and game reviews alike.
- Any room owner (or moderator) may attach any public review.
- Creating a demo board from the picker is left for later.
- Proposals targeting reviews are out of scope for this change.

## Calls made by the author of this document

- `current_review` is a second nullable foreign key with a check constraint,
  not a generic board reference, so `current_game` and everything reading it
  stay as they are.
- Preset and broadcast rooms stay game-only.
- Demo variations carry `review_id` instead of `game_id`, so old clients drop
  them, and `from_path` so they survive a branching tree.
- A variation whose anchor was deleted replays from the root rather than
  disappearing.
- The board-ref refactor lands first, as a no-change commit.
- The Game chat tab is labelled "Board" in demo mode.

## Left to the builder

- Whether the secondary-pane source fields gain review twins or become one
  board ref.
- Where a demo board's size is read from on the server.
- Exact names and files for the review URL parser and the picker's Demo board
  source.
- The wording of the "position no longer on the board" message.
