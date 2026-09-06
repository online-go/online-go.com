# Kibitz

The Kibitz page (`/kibitz/:roomId`) is a room where spectators watch one live
game together, chat, and share variations. It renders through the shared
`GobanView` layout (`src/components/GobanView`).

## Layout

Landscape: a left aside with the room list, the variation list and, while
the center is not showing the live game, a small live-game thumbnail; the
board with a player bar above and below it in the center; the room title,
pending proposals, variation controls and the two-tab chat (Game, Room) on
the right. Portrait: GobanView's single column, with the left aside content
behind one takeover tab, "Rooms", that holds the room list, the variation
list and the mini main-board thumbnail together.

The left aside has two collapsible sections, Rooms and Variations, laid out
like the chat page's channel list, each with a quiet "+ Room" / "+ Variation"
row at the bottom (Variations also has "Clear all"). The collapsed state and
the selected chat tab are kept per browser through `data.ts`
(`kibitz.left_aside.collapsed`, `kibitz.chat_tab`).

Action bar: settings gear and New variation (left), Return to game or
Return to live (center), More actions with game information, the game link,
SGF download and Call moderator (right). The variation panel's Back to game
button (Cancel while drafting), the mini main board, the x on a variation
row and the Escape key also leave a variation. Leaving a draft that has
unposted moves asks for confirmation first, as does starting another
variation or opening a posted one while such a draft is open.

The player bars show the live game's players and clocks whenever the center
shows the live game or a draft or variation of it; a variation of another
game shows that game's players. `KibitzKeyboardShortcuts` binds the Game page's
move navigation keys (arrows, Home, End, Page Up, Page Down) to whichever
board the center shows.

Help flows exist for landscape only (desktop first run, desktop variations,
and the draft started from a posted variation); portrait has no onboarding
flow.

When a room has no current game (a preset room sitting between games),
`KibitzView` renders a waiting layout instead of the board: the left aside,
a "Looking for a suitable live game." message, pending proposals and the
room chat.

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
variation as its source.
