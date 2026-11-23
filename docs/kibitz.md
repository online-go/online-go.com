# Kibitz

Opening `/kibitz` selects the first accessible room in the directory's viewer-count
order. Rooms watching the current player's active game are skipped. If all rooms
are blocked, the directory stays open without joining a room. Explicit links to
blocked rooms still show the access warning.

The Kibitz page (`/kibitz/:roomId`) is a room where spectators watch one
board together, chat, and share variations. The board is a live game, or a
public review: a demo board or a review of a game (see "Demo boards"). It
renders through the shared `GobanView` layout (`src/components/GobanView`).

## Layout

Landscape: a left aside with the room list, the variation list and, while
the center is not showing the live game, a small live-game thumbnail — the
thumbnail is landscape only; the board in the center; on the right the two
player cards and the header (the room title with the game's
result pulled right on the same line, or the variation chip in their
place), pending proposals, variation controls and the two-tab chat (Game,
Kibitz). The left aside is resizable, with the drag handle on its right
edge; its width is the `goban-view-left-aside-width` preference, shared
with the Game page's chat column.
Kibitz allows resizing this column down to 240px without changing its 384px
default. The chevron hides its contents and leaves a 28px restore rail;
restoring reuses the saved width. The collapsed state is saved separately
for Kibitz. Normal game chat keeps its existing minimum width and controls.
A people column stands beside the chat log; the People action switches it
off and it drops on its own when the chat panel is narrower than 22rem.

The room chat shows only the latest game-switch warning for the active
pending game. Once the switch completes or is cancelled, that warning is
hidden, including when replaying chat history. Completed-switch messages
and other system messages remain visible. When game details are available,
links to watched games show both players and their ranks. The Hide ranks
preference hides the ranks. A distinct game title appears before the players.
Chat displays the saved text if game details are unavailable. The room requests
details for recent game notices in the background and uses cached details for
older notices.

Portrait: GobanView's `portraitSplit` layout — a board stage, a drag handle,
and one panel area below it. `KibitzLeftAside` is landscape only. Six panes
share the panel area — Game chat, Kibitz chat, People, Variations, Rooms
(the room list alone, with no thumbnail) and Analysis, which holds the
variation panel — and the action bar switches between them.

Both chat panes have separate composers. Game chat sends through the watched
game's normal chat connection and requires a signed-in user with a validated
email. It is disabled until the room's current game controller is ready.
Room and game drafts are retained across desktop tab changes; a game switch
clears the game draft so it cannot be sent to a different game.

Analysis comes forward on its own whenever the center stops showing the live game, and again
for each variation after that — a draft and a posted variation each get a
controller of their own, so starting a second one while the first is open
still brings it forward — and steps back to the pane the reader was on when
the live game returns. Posting is the exception: it ends the composing
session and the post lands in the Kibitz chat, so the reader is left there,
including through the center's own switch to the variation that was just
posted. Opening a variation by hand afterwards brings analysis forward as
usual. It is the one pane that is
not remembered across a visit: it has nothing to show without a draft or a
variation. Its button switches to it like any other, except when it is already
the pane on screen, where it leaves the draft instead. All six stay mounted,
with the `hidden` attribute on the five that are off screen: the chat panel
joins its channel and subscribes to the watched game's chat on mount, and a
hidden pane measures no height.

The header names what the center is showing, in both orientations. Watching
the live game it is the room title, with the game's result pulled right on the
same line once it has one. Showing a variation or a draft it is the variation
chip alone — the room is what the reader closes back to, not what they are
looking at — with a close button flush right. The game's settings are in the
More actions menu, so the header is one line either way.

Both chat logs put a date or a move number on a row of its own above the line
it introduces. They are elements of the log, beside the rows rather than
inside one: a line's row holds its time and the line itself, so the time
stays level with the name beside it. `ChatDateLine` and `GameChatMoveNumber`
(`src/components/Chat/`) render them, and `ChatLine` and `GameChatLine` use
the same two components for the logs that keep their separators inline. A log
does not open with today's date — only with an older one. A posted variation
is laid out the same way, so its link lines up with the chat around it.

The left aside has two collapsible sections, Rooms and Variations, laid out
like the chat page's channel list, each with a quiet "+ Room" / "+ Variation"
row at the bottom (Variations also has "Clear all"). The room list shows
preset rooms first, in the order they are defined (`high-ranked-live`,
`mid-ranked-live`, `english-chat-live`), followed by additional presets by
id, then every other room by viewer count. The desktop and portrait lists
label the groups "Preset rooms" and "User rooms", with a thin grey divider
between them. Empty groups and their divider are hidden. When the non-preset
group includes broadcasts, its label is "Other rooms". These are kept per
browser through `data.ts`: the collapsed sections
(`kibitz.left_aside.collapsed`), the landscape chat tab (`kibitz.chat_tab`),
the portrait pane (`kibitz.portrait_pane`, seeded once from the chat tab)
and the people column (`kibitz.people_column`). The height the handle gives
the board is the `goban-view-portrait-split` preference.

The Rooms and Variations sections keep their content height and scroll
together when the left aside runs out of vertical space. The mini main board
stays below that shared scroll area and does not move with the lists.

Pressing the room list's or the variation list's action while it is the pane
on screen puts back whatever the reader was on before it, the way pressing
the analysis action again leaves the draft it opened. A list will not close
back to an analysis pane the centre has left nothing in; it falls back to the
Kibitz chat.

Action bar: in portrait the room list and the variation list (left), then
the two chats, the people list and Analysis (center); in landscape only
the people list and New variation, since the panes are portrait-only, and
the variation panel stays in the sidebar. Return to live and More actions sit
on the right. More actions is headed by the watched game's ruleset, handicap and time
control (fischer without the maximum, which Game information still spells
out), and holds game information, the game link, SGF download, Call moderator, and the room's
own entries: Edit room details and
Change live game where the viewer manages the room, or Room information,
which names the owner, where they do not. There is no settings gear.
Leaving a variation is the close button at the right of the variation chip in
the header, the variation panel's Back to game button (Cancel while
drafting), the landscape mini main board, the x on a variation row, or the
Escape key. Leaving a draft that has unposted moves or annotations asks for confirmation
first, as does starting another variation or opening a posted one while such
a draft is open.

Each variation on the board holds one move-tree line colour. The colour
travels with the visible-variation list, so a variation that a render makes
visible is composed in its own colour instead of the first one. The
variations are composed in list order, whichever one is selected, so the
branch order under a move stays where it was. A swatch in that colour marks
the variation in the list, on its chat post, in the variation panel and in
the chip. The palette is goban's `MoveTree.line_colors`, which the site
theme swaps: `applyMoveTreeLineColors` (`src/lib/move_tree_line_colors.ts`)
puts the light set in front of the renderers for the light theme, repaints
the trees that are on screen through `move_tree_boards`, and tells the
swatches through `useMoveTreeLineColors`.

The player headers show the live game's players and clocks whenever the center
shows the live game or a draft or variation of it; a variation of another
game shows that game's players. Horizontal layouts put both cards in the
sidebar. Stacked layouts put a compact header above the board.

At phone widths below 600 CSS pixels, the stacked header becomes a thin strip
when the viewport is narrower than 390 CSS pixels or shorter than 844 CSS
pixels. Exactly 390 by 844 retains the standard compact header. Opening the
keyboard keeps the header mode from before it opened. The thin strip has a
32-pixel avatar at each outer edge, with a colour stone and linked player
name above each clock and capture count. Its
turn underline follows the official branch; captures follow the displayed
position. Clocks keep their overtime information and take priority over
capture labels when the row is too narrow: a captured stone and count replace
the full label. Paused clocks have a static label.
The two halves use the standard player-card colours: a dark Black panel and
a light White panel, with matching clock, text and player-link colours in
both site themes.

Both stacked headers have an invisible 44-pixel-wide button at the centre.
Tapping it switches between the original and thin layouts, including the
navigation spacing. The choice stays active until the page reloads and applies
only to Kibitz. The button also works with the keyboard and has a visible focus
outline. Player names
retain their usual player links. The room-title strip is shorter in this mode,
and site navigation is 2.75rem high, except that the existing 2rem navigation
on viewports at most 500 CSS pixels tall remains in use. The navigation size
returns to normal when the thin Kibitz layout closes. Rules and komi stay out
of the thin strip and remain in Game information. Larger stacked viewports
retain the existing compact player cards.

The thin layout also reduces the vertical padding of the move-arrow strip
to 0.15rem on each side. Its buttons keep their responsive widths, with a
maximum height of 2.4rem and smaller arrow glyphs. This applies only to the
buttons layout in compact Kibitz; the slider and other pages keep their
existing sizes.

In the thin layout, the board–chat divider starts with a 10rem panel basis
instead of 12rem. Dragging it down can leave 6rem for chat instead of 8rem,
giving the board up to 2rem more height (32 pixels at the default font size).
Switching to the original header restores both defaults and clamps any saved
divider position to its range.

The game's result goes beside the room title rather than under the winner's
name. `KibitzKeyboardShortcuts` binds the Game page's
move navigation keys (arrows, Home, End, Page Up, Page Down) to whichever
board the center shows.

When a room has no current game (a preset room sitting between games) there
is no controller, and `GobanView` takes `null` for one: the board is replaced
by its `centerPlaceholder`, here a "Looking for a suitable live game."
message that keeps the space the board would have taken, so the view does not
resize under the reader when a game arrives, and the player bars and the move-number strip are left out. The rest
of the view is the same tree as always, so the action bar, the panes, the
proposals and the chat are all still there. The analysis action is disabled
because there is nothing to analyse, and Return to live cannot apply. Without
a board there is no `GobanContainer` to report resizes, so `GobanView`
listens to the window itself for as long as it has no controller.

## Demo boards

A user room can watch a review instead of a game: a demo board, or a review of
a game. Any public review qualifies; a private one, or a review of a private
game, does not. The picker's ID field takes a demo board or review URL
(`/demo/<id>`, `/review/<id>`, with or without `/view` and a move number) as
well as a game id or URL (`parseKibitzBoardInput`). Preset and broadcast rooms
only watch games.

The server sends the review as `current_review` beside a null
`current_game`, and `mode: "demo"`. `KibitzController` reads it into the same
watched-board shape as a game, with `review_id` set and no `game_id`. A review
is never live, so the policies for live games do not apply to it: the players
of a reviewed game are not kept out, and analysis is never disabled. A demo
board's players are names, with id 0, and are not linked.

Boards are identified by kind and id, because game ids and review ids are
separate sequences. Anything that groups or compares boards goes through
`kibitzBoardRef` (`boardKey`, `sameBoard`, `gobanBoardKey`): the variation
list, the secondary board's target, the draft source
(`variation_source_board`) and the base snapshot (`board`).

The main board connects with `review_id` and follows the presenter, the
review's current controller (`isReviewPresenter`; control can pass from the
owner to someone else). The room's position is the presenter's node
(`cur_review_move`, see `kibitzReviewBoard`), where a game has its trunk tail:
Return to live goes there, "behind live" means away from it, and a stone
placed on the main board to start a draft is taken back to it. The game chat
tab is "Board chat", the review's own chat. SGF and Call moderator use the
review, and More actions links to the review's own page ("Open the board").

The presenter presents from the room. Their main board carries the review
page's owner and controller checks, so their stones, marks and navigation on
it go to the review and every other board in the room follows. For them, and
only for them, a stone on the main board is a move of the review rather than
the start of a draft; "+ Variation" still starts one. While the centre shows the main board, "You are presenting" sits directly
above it, in `GobanView`'s `boardNotice` slot, which both orientations render
inside the board stage. `useKibitzReviewPresenter` follows
control as it passes, so the board changes behaviour when it does.

A review's tree branches and changes: the presenter steps back, branches,
and a demo board's undo takes recorded moves off its trunk. So the base
snapshot copies the whole tree, and is taken whenever the presenter's node
moves, backwards included. A variation posted on a review carries `review_id`
(not `game_id`, so clients that predate reviews drop it) and `from_path`, the
move path from the root to its branch point, as well as the usual `from` and
`moves`. It is laid from the node `from_path` names. When the presenter has
removed that node, the path and the line are replayed from the root, which
puts the same stones on the board, and the reader is told the position is no
longer on the presenter's board.

Chat lines carry a game position, so a room on a review sends its chat lines
without one. Proposals to switch a room to a review are not supported.

## Game page cards

The Game page lists the kibitz rooms whose current board is that game, and
a review or demo board page the rooms whose board is that review.
`GameChat` passes them to `ChatUserList` as its `footer`, so they sit at
the bottom of the chat's user list under a "Kibitz" heading, one card per
room (`src/views/Game/GameKibitzRooms.tsx`): the room title, its
description if it has one, and the viewer count. Clicking a card opens
`/kibitz/<room id>`. With no rooms the footer renders nothing.

`useGameKibitzRooms` (`src/views/Game/useGameKibitzRooms.ts`) seeds the
list from `GET /api/v1/kibitz/rooms?game=<id>`, or `?review=<id>` on a review
or demo board page — every room on the board, empty ones included. A review
of a game lists the rooms on the review, not those on the game. `useKibitzDirectoryRooms`
(`src/lib/useKibitzDirectoryRooms.ts`) then follows the `kibitz-rooms`
directory pushes: `room-created` and `room-updated` add or drop a room by its
`current_game_id` or `current_review_id`, `viewer-count-changed` re-sorts by viewers,
`room-removed` drops, and `rooms-refresh` or a socket reconnect fetch again.
A push that arrives during a fetch is replayed on the result, only the newest
fetch is applied, and a failed fetch keeps the current list.
The hook is inert for a player of the game until it has finished, which is
when the server starts letting players into rooms on their own game. A
review has no such rule, so it is never held back.

The list toggle shows `KibitzUsersIcon`
(`src/components/ChatUserList/KibitzUsersIcon.tsx`, the `fa-users` heads
with a speech bubble above) whenever at least one room is watching the
game, and its number becomes the game chat users plus the viewers across
those rooms: people watching the game anywhere, with the cards accounting
for the difference from the names in the list. A viewer with both the
game page and a room open counts twice. Only `Game.tsx` switches this on,
through `show_kibitz_rooms`, for games, reviews and demo boards; the annul
queue, which also mounts `GameChat`, does not.
`ChatKibitzRoom` on the Chat page is the sibling card, keyed by chat
channel instead of game. It uses the same hook and the same
`KibitzRoomCard` and `KibitzRoomCards` components
(`src/components/KibitzRoomCard/`), and adds a player matchup line. It
shows only while the room's game is live (`current_game.live` in the
directory payload): the English chat room picks only its members' games,
so a room holding a finished game, or still looking for one, has no card.
The server pushes `room-updated` to the directory when a watched game
ends, which hides the card at once.

## Game picker

"Create room" and "Change live game" open `KibitzGamePickerOverlay` in the
site's modal chrome — a backdrop, a centred card with a header, a body and a
buttons row. It closes by the Close button, the Escape key or a click on the
backdrop, in both orientations. The card stays in the app's React tree rather
than going through `openModal`: its game lists render `MiniGoban`s that link
through react-router, and a modal root mounted on `document.body` has no
router above it.

The one primary action — Create room or Change board — sits in the buttons
row beside Close, for both layouts. Landscape shows the game list, the game
ID field and the room details side by side. Portrait is a two-step flow, a
selection step (Ongoing or Game ID) then a preview step with the room
details, with a back arrow in the body returning to the selection.

## Controllers

`useKibitzGobans` (`src/views/Kibitz/useKibitzGobans.ts`) owns two
`GobanController`s. The main controller connects to the room's live game
with `game_id` set and lives until the room changes game. It is always
mounted, in the center or in the thumbnail. The secondary controller is
built for a draft or a posted variation and destroyed on exit. For the
current game its
trunk is a snapshot of the main controller, so no second socket is opened
for the same game; other games connect read-only. GobanView receives
whichever controller the center shows.

Only a same-game secondary board — a draft or a variation of the room's
current game — waits for the main controller to produce its first trunk
snapshot (`mainReady`), and it then composes synchronously from that
snapshot. The snapshot is taken from the main controller's engine whether or
not its board is in the DOM: in portrait the main board is off screen
whenever the center shows a variation or a draft, and every rebuild of the
secondary board — a draft started from a variation, a change to which
variations are visible — takes a fresh one. A board for another game connects with its own `game_id` instead and
composes on every `load` event of its own, so it never waits on the main
board and lays the variation back onto a fresh tree after a reconnect. A
draft is not rebuilt when the room moves on to another game: it keeps the
game it was started from and can still be posted as a variation of it.

`useKibitzCurrentGameConnectionKeeper` re-sends `game/connect` for the main
game after the game picker closes, because the picker's game lists render
connecting `MiniGoban`s (through `ObserveGamesComponent`) that send
`game/disconnect` for the same game id when they unmount. Only the selected
game's preview and the proposal bar use `KibitzBoardPreview`, a read-only
board that never connects to a game.

Usage telemetry for the launch window is emitted from the controller and the
view through `kibitzTelemetry.ts`; the schema, switch and queries are in
`ogs/docs/kibitz-telemetry.md`.

## State

`KibitzController` holds rooms, the active room, stream items, proposals,
variations and the secondary pane. The secondary pane (`collapsed`,
`variation_id`, `variation_source_*`, `variation_draft_nonce`) fully
determines what the center shows; `deriveKibitzCenterMode` maps it to
`main | draft | variation`. On the main board, a new variation uses the
official trunk and starts at the move displayed when the action is selected.
Opening the draft leaves the main board at that position. On a posted
variation, "+ Variation" and "New variation from here" start a draft using that
variation as its source, opening at the move the reader was looking at
(`variation_draft_base_path`) rather than at the end of the line. The draft
board is composed with every variation that was visible on the board it came
from, not the source variation alone: the reader can have been standing in
any of them, and a node that is not on the board is replayed as a fresh move
rather than navigated to.

## Annotation-only variations

An analysis post can contain labels, shapes or pen drawings without an added
move. It uses the existing analysis body: `from` is the official position,
`moves` is an empty string, and `marks` or `pen_marks` supplies the annotations.
Empty posts without annotations are rejected. Posting, room history and board
rendering use the same content rule.

An annotation-only post opens at `from`, including position zero. Only the
selected post applies marks to the secondary board's copied trunk. It adds no
move and does not recolour the official position. Selecting another post
rebuilds the secondary board, so annotations from posts at the same position
stay separate and do not change the live board. Draft discard detection includes
annotation edits to existing positions and pen drawings.

## Continue a posted variation

Playing a move on the main game board or a posted variation starts a separate analysis draft that includes the move. Users can extend the line or return to an earlier position to branch. The original post remains unchanged. Navigation does not start a draft.

Kibitz observes Goban’s existing `cur_move` and `update` events. A matching `move_selected` identifies placement; the following completed update starts the draft. No separate Goban event is required.

Main-board clicks use local analysis mode and keep the live connection active. Live game moves and navigation do not start drafts. Main-board placement is disabled while another board is open and during stone removal.

## Post-game discussion notifications

After a game ends, its players receive one `kibitzGameDiscussed` notification
if a spectator chatted in a Kibitz room while the room watched the game. The
server decides who is notified and when; see
`docs/kibitz-discussion-notifications.md` in the ogs repository.

The notification carries `game_id`, `name`, `black`, `white` and `rooms`, a
list of `{ id, title }` for the rooms that discussed the game and still existed
when it was sent. The entry names the game and opens `/game/<id>`. Each room is
a link to `/kibitz/<id>`; the room may show another board by then, but its chat
history keeps the discussion. Malformed rooms are not linked.

Opening a room clears the notification, since reading the discussion is what
it is for. Opening the game keeps it, unlike other game notifications, which
clear when the player visits their game. The player can still dismiss it.

Players turn it on and off with the "My finished game was discussed in a Kibitz
room" notification setting, which the settings page lists from the server. With
desktop notifications on, a connected tab also shows it as a desktop
notification that names the first room. Clicking it opens that room and clears
the notification, or opens the game when no room is listed.
