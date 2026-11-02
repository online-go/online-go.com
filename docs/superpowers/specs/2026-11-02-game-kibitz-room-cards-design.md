# Game view: kibitz room cards in the chat user list

Date: 2026-11-02. Spans `ogs` (one endpoint) and `ogs-ui` (the UI). This
document lives in `ogs-ui` because most of the work is here.

## Intent

A spectator on a Game page has no way to see that one or more kibitz rooms
are already watching that game. Kibitz rooms are where the group discussion
happens; the Game page should tell people they exist and take them there in
one click.

The Chat page already has this idea in one form: `ChatKibitzRoom`
(`src/components/Chat/ChatKibitzRoom.tsx`) sits under the user list on
`/chat/global-english` and links to the preset room scoped to that channel.
This work brings the same card to the Game page, keyed on the game instead of
the chat channel.

## What gets built

### Where the cards live

The game chat (`src/views/Game/GameChat.tsx`) has a user list that opens
from the `fa-users` toggle at the right of the chat input (`ChatUserCount`
in `src/components/ChatUserList/ChatUserList.tsx`). The cards go at the
bottom of that user list, under the user entries, exactly as the Chat page
puts its card under its user list.

So the cards are visible only while the user list is open. That is the
user's deliberate choice. To make the cards discoverable while the list is
closed, the toggle button changes its icon when at least one room is
showing the game (see "Toggle icon" below).

### The stack

Zero or more cards, one per kibitz room whose `current_game` is this game.
When there are none, nothing renders: no heading, no empty state, no
border.

When there is at least one:

- A "Kibitz" heading, as on the Chat page card.
- One card per room. Each card shows the room title and the viewer count
  (number plus the same inline-SVG person icon the Chat page card uses).
  Where the Chat page card shows "black [rank] vs white [rank]", this card
  shows the room's `description` if it has one, and nothing otherwise. The
  matchup line would repeat the game the person is already looking at.
- Clicking a card goes to `/kibitz/<room id>` through `browserHistory`.

Cards sort by viewer count, highest first; ties keep server order.

The visual treatment follows `ChatKibitzRoom.css`: a top border, the
uppercase small-bold heading, the button-reset card with the `--shade2`
hover. Reuse the CSS where it fits and keep the class names parallel so the
two cards look like one family.

### Who sees them

The server's room GET returns 403 when the caller is a player in the room's
current game *and that game has not ended*
(`is_user_player_in_active_game` in `ogs/services/django/ogs/kibitz/permissions.py`).
The cards mirror that: while the game is in progress the two players get no
cards and the toggle icon does not change for them; once the game ends they
get both, like any spectator, without a reload. So the hook's "hide" flag is
participant AND game-not-ended, and it re-evaluates when the game finishes
while the page is open. `useUserIsParticipant(goban)` gives the first half
and is phase-blind; the goban engine's phase (or the game's `ended`) gives
the second.

The Kibitz page already applies this rule to its own room list
(`isKibitzAccessBlockedForUser` in `src/views/Kibitz/kibitzAnalysisPolicy.ts`,
used by `KibitzInner` to mark rooms with a lock icon rather than hide them).
That helper checks only `black`/`white` and treats a correspondence game as
never active (`live !== false`), whereas the server checks rengo teams too
and ignores `live`. The Game page has the goban engine, so its rule is built
from the engine (participant including rengo, phase) to match the server;
the policy helper is a reference, not a dependency. The `live` gap between
the Kibitz page helper and the server is pre-existing and out of scope.

Review pages share `GameChat` (channel `review-<id>`), and so does the
moderators' `AnnulQueueModal` (with a real `game_id`). Cards and the icon
change are game-page only. The feature is switched on by an explicit prop
that only `Game.tsx` passes through `chat_props`; a bare "has game_id" test
is not enough.

### Toggle icon

The toggle currently renders `<i className="fa fa-users" />` plus the user
count. When one or more rooms are showing the game, the icon becomes a
distinct glyph: the Font Awesome "users" heads with a speech bubble above
them. When there are no rooms it stays `fa-users`.

The OGS icon font (`src/global_styl/ogs-font.css`, `ogs-font.woff`) is a
checked-in binary with no generator in the repository, so the new glyph is
an inline SVG React component, not a font glyph. The existing `ogs-kibitz`
font glyph (a speech bubble with a board in it, used on the NavBar) is not
what is wanted here. The SVG should trace the `fa-users` silhouette so the
two states read as the same icon with and without the bubble, and size to
the same box as the `<i>` it replaces so the button does not shift.

`ChatUserCount` is shared, so the "has kibitz" state arrives as a prop; the
component does not fetch anything itself.

### Data

#### Endpoint (ogs)

`GET /api/v1/kibitz/rooms?game=<game id>` returns every room with
`current_game_id = <game id>`, serialised with `KibitzRoomDirectorySerializer`
and carrying `viewer_count` from comm-server, as `GET rooms` already does.
Without `game` the endpoint behaves as today. A `game` value that is not an
integer is a 400. An unknown game id returns `[]`.

This is a filter on the existing `KibitzRoomList.get`, not a new route.
"Every room" is deliberate: the directory endpoint hides empty user rooms
that are not the caller's, and the cards should list those too.

No model change. `KibitzRoom.current_game` has `related_name="+"`, so the
query is `KibitzRoom.objects.filter(current_game_id=...)`.

#### Keeping the stack live (ogs-ui)

The same pattern as `ChatKibitzRoom`: one initial fetch, then follow the
`kibitz-rooms` UIPush channel. The difference is the membership test, which
is `payload.current_game_id === game_id` instead of a preset key match.

- `room-created` / `room-updated`: if the payload's `current_game_id` is
  this game, add or replace the room in the stack; otherwise remove it if
  present. `room-updated` fires on every board change, so a room that moves
  to another game drops out and a room that moves onto this game appears.
- `viewer-count-changed`: update the matching room's count by `channel`.
- `room-removed`: drop by `id`.
- `rooms-refresh` and socket `connect`: fetch again.

Subscribe to the channel before the first fetch so nothing is lost between
the two, as `ChatKibitzRoom` does.

The room list must exist whether or not the user list is open, because the
toggle icon needs the count. So the fetch-and-follow lives in a hook owned by
`GameChat` (or a small controller it holds), and both the toggle and the
card stack read from it. The hook takes the game id and a flag for whether
the viewer is a player in a game that has not ended; while that flag is true
it does nothing and reports an empty list, and when it turns false (the game
ends) it fetches and follows from then on.

The subscription to `kibitz-rooms` is per mounted hook, as it is per mounted
`ChatKibitzRoom` today.

#### Types

`src/models/kibitz.d.ts` already has `KibitzRoomSummary` with `id`,
`channel`, `title`, `description`, `viewer_count`, `current_game`. The
directory serializer also sends `current_game_id`, which the hook needs for
the membership test. Add it to the type if it is not already there rather
than declaring another local room type.

### Tests

- `ogs`: a test for the `game` filter on `KibitzRoomList.get` (matching
  rooms returned, non-matching excluded, bad value is 400). It goes next to
  the existing request-level tests in
  `ogs/services/django/ogs/api/views/kibitz_rooms_test.py` (APIRequestFactory
  plus `patch.object(KibitzRoom.objects, ...)`) and runs under `make pytest`
  in the container. It must not go in `ogs/kibitz/`: `make pytest-host`
  collects that directory Django-free, and a request-level test there breaks
  `make lint`.
- `ogs-ui`: tests for the hook's push handling (a room moving onto and off
  the game, viewer count, removal) and for the card stack rendering nothing
  with zero rooms and a sorted stack with several, modelled on
  `ChatKibitzRoom.test.tsx`. A test that the toggle shows the kibitz icon
  when rooms exist and `fa-users` otherwise. A test that a player of a game
  in progress gets nothing and a player of a finished game gets the stack.
- e2e: not required for this change. If one is cheap to add alongside an
  existing kibitz e2e, it would open a game page, create a room on that game
  and look for the card.

### Durable documentation

Add a short section to `ogs-ui/docs/kibitz.md` describing the Game page
cards and the toggle icon, and a line to `ogs/docs/kibitz-preset-rooms.md`
or wherever the kibitz API is listed, noting the `game` filter. If no
durable document lists the kibitz endpoints, add the filter to the
`KibitzRoomList` docstring and leave it at that.

## Goals, non-goals, anti-goals

Goals:

- A spectator with the user list open sees every kibitz room on this game
  and can enter one in one click.
- A spectator with the user list closed can tell from the toggle that
  kibitz is available.
- The stack is correct within one push of the server: rooms arriving,
  leaving, being removed, and viewer counts.

Non-goals:

- Cards on the mobile layout beyond what the user list toggle already gives
  there. No new mobile placement.
- Creating a room from the Game page. The card links to rooms that exist.
- Any change to the Chat page card.
- Showing the cards to the game's players while the game is in progress.

Anti-goals (this would be a failure even if it works):

- Cards that stay after the room has moved to another game.
- A toggle that changes size or shifts the chat input when the icon swaps.
- A second copy of the directory-following logic that drifts from
  `ChatKibitzRoom`. If the two can share the push handling cleanly, share
  it; if sharing would mean contorting one of them, keep them separate but
  keep them structurally parallel.

## Constraints

- ogs-ui rules: one component per file with its own CSS, no `any`, all
  strings through `pgettext`/`npgettext`/`interpolate`, PostCSS nested
  syntax, no hover background on non-interactive elements.
- The `ogs-ui` pull request depends on the `ogs` one. Its description must
  say `Depends on online-go/ogs#<number>.`
- Both pull requests pass their repo's lint, type-check and tests.

## Decisions the user made

- Placement: at the bottom of the game chat's user list, not in the main
  right column.
- One card per room showing the game, every such room, none when none.
- A new endpoint (filter) rather than filtering the directory on the client.
- The "has kibitz" toggle icon: the users heads with a speech bubble above.
- The icon is drawn new; the NavBar's `ogs-kibitz` glyph is not reused.
- Players get the cards once the game has ended, not before.

## Calls made by the author of this document

- The endpoint is a `?game=` filter on `GET kibitz/rooms`, not a new route.
- The hide-from-players rule mirrors the server's: participant and game not
  ended, re-evaluated live.
- The feature is opted in by a prop from `Game.tsx`, so the review page and
  the annul queue modal (which also mount `GameChat`) are untouched.
- The `ogs` test lives in `api/views/kibitz_rooms_test.py`, not `kibitz/`.
- Cards show the description instead of the matchup line.
- Cards sort by viewer count, highest first.
- The icon is an inline SVG component rather than a font glyph.
- The room list lives in a hook owned by `GameChat` so the toggle can use
  it with the user list closed.

## Left to the builder

- Hook and component names and files. Suggested:
  `src/views/Game/useGameKibitzRooms.ts`,
  `src/views/Game/GameKibitzRooms.tsx` + `.css`,
  `src/components/ChatUserList/KibitzUsersIcon.tsx`.
- Whether `ChatUserList` takes the cards as a `footer` child/prop or
  `GameChat` renders them as a sibling under it inside
  `.log-player-container`. Either is fine as long as the cards scroll with
  the user list column and sit at its bottom.
- The exact SVG path for the icon.
- Whether to extract the shared push-handling from `ChatKibitzRoom`, per the
  anti-goal above.
