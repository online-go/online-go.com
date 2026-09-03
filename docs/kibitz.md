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

Action bar: settings gear (left), Return to game or Return to live (center),
More actions (right).

When a room has no current game (a preset room sitting between games),
`KibitzView` renders a waiting layout instead of the board: the left aside,
a "Looking for a suitable live game." message, pending proposals and the
room chat.

## Controllers

`useKibitzGobans` (`src/views/Kibitz/useKibitzGobans.ts`) owns two
`GobanController`s. The main controller connects to the room's live game
with `game_id` set and lives until the room changes game. It is always
mounted, in the center or in the thumbnail. The secondary controller is
built for a draft, a posted variation or a game preview and destroyed on
exit. For the current game its trunk is a snapshot of the main controller,
so no second socket is opened for the same game; other games connect
read-only. GobanView receives whichever controller the center shows.

The secondary controller waits for the main controller to produce its first
trunk snapshot (`mainReady`) before it builds. A same-game secondary board
(draft or variation of the current game) then composes synchronously from
that snapshot; a connected board (a preview or a variation of another game)
composes once its own `load` event fires.

`useKibitzCurrentGameConnectionKeeper` re-sends `game/connect` for the main
game after the game picker closes, because mini gobans in the picker send
`game/disconnect` for the same game id when they unmount. Game-picker
thumbnails render with `KibitzBoardPreview`, a read-only board that never
connects to a game.

## State

`KibitzController` holds rooms, the active room, stream items, proposals,
variations and the secondary pane. The secondary pane (`collapsed`,
`variation_id`, `preview_game_id`, `variation_source_*`) fully determines
what the center shows; `deriveKibitzCenterMode` maps it to
`main | draft | variation | preview`. The panel for a posted variation
offers "New variation from here", which starts a new draft using that
variation as its source.

## Streamer mode

Streamer mode hides the left aside, the sidebar header, panels and slider,
leaving the board and the action bar (so the settings gear stays reachable).
It sets the `kibitz-streamer-mode` class on `document.body` so site chrome
outside the page — the nav bar, announcements, private chat, toasts — can
hide itself while it is active.
