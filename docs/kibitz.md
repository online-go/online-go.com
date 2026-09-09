# Kibitz

The Kibitz page (`/kibitz/:roomId`) is a room where spectators watch one live
game together, chat, and share variations. It renders through the shared
`GobanView` layout (`src/components/GobanView`).

## Layout

Landscape: a left aside with the room list, the variation list and, while
the center is not showing the live game, a small live-game thumbnail — the
thumbnail is landscape only; the
board with a player bar above and below it in the center; on the right the
header (the room title with the game's result pulled right on the same line,
or the variation chip in their place),
pending proposals, variation controls and the two-tab chat (Game, Kibitz).
A people column stands beside the chat log; the People action switches it
off and it drops on its own when the chat panel is narrower than 22rem.

Portrait: GobanView's `portraitSplit` layout — a board stage, a drag handle,
and one panel area below it. `KibitzLeftAside` is landscape only. Six panes
share the panel area — Game chat (read-only, so it carries no composer),
Kibitz chat, People, Variations, Rooms
(the room list alone, with no thumbnail) and Analysis, which holds the
variation panel — and the action bar switches between them. Analysis comes
forward on its own whenever the center stops showing the live game, and again
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
row at the bottom (Variations also has "Clear all"). These are kept per
browser through `data.ts`: the collapsed sections
(`kibitz.left_aside.collapsed`), the landscape chat tab (`kibitz.chat_tab`),
the portrait pane (`kibitz.portrait_pane`, seeded once from the chat tab)
and the people column (`kibitz.people_column`). The height the handle gives
the board is the `goban-view-portrait-split` preference.

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
Escape key. Leaving a draft that has unposted moves asks for confirmation
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

The player bars show the live game's players and clocks whenever the center
shows the live game or a draft or variation of it; a variation of another
game shows that game's players. A bar puts the name on its top edge and the
capture count on its bottom, with the clock centred between them, so the two
bars keep their text nearest the board. Komi rides on the capture line the
way it does on the game page — "0 captures + 6.5" — and the game's result
goes beside the room title rather than under the winner's name. `KibitzKeyboardShortcuts` binds the Game page's
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
snapshot. A board for another game connects with its own `game_id` instead and
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

## State

`KibitzController` holds rooms, the active room, stream items, proposals,
variations and the secondary pane. The secondary pane (`collapsed`,
`variation_id`, `variation_source_*`, `variation_draft_nonce`) fully
determines what the center shows; `deriveKibitzCenterMode` maps it to
`main | draft | variation`. The panel for a posted variation
offers "New variation from here", which starts a new draft using that
variation as its source, opening at the move the reader was looking at
(`variation_draft_base_path`) rather than at the end of the line.
