# Kibitz on GobanView: design

Date: 2026-09-03
Branch: `kibitz-layout-updates`

## Goal

Move the Kibitz page onto the shared GobanView layout so it matches the Game,
Puzzle, and Joseki pages, and remove the Kibitz-only code that duplicates
GobanView behaviour (board hosting, sizing, transport controls, resizable
panes, scoreboards).

Two GobanView additions make this possible: an optional left aside, and an
optional pair of player bars around the board.

## Non-goals

- Changing the Game page. It may adopt `playerBars` later.
- Changing the Kibitz backend contract or `KibitzController`'s public API
  beyond removing the side-by-side pane size.
- Reworking the game pickers. Both the desktop overlay and the mobile picker
  stay as they are.

## Part 1: GobanView extensions

Both additions are optional props. Existing consumers see no change.

### Left aside

- New prop `leftAside?: React.ReactNode`.
- Landscape (`wide` and `square` modes): renders as `.GobanView-left-aside`
  before `.GobanView-center`. Same visual treatment as the right sidebar:
  `var(--shade5)` background, 8px radius, the same shadow, and mirrored
  margins (`0 1.25rem var(--goban-view-bottom-margin) 0.3rem`).
- Width comes from a new runtime variable `--goban-view-left-aside-width`
  (280px) in `src/global_styl/01_variables.css`.
- The aside is a flex column with `overflow-y: auto`. The consumer lays out
  its own content and may pin an item to the bottom with `margin-top: auto`.
- Portrait: the prop is ignored. Consumers provide takeover tabs for the same
  content, the reverse of how `aboveBoard` and `belowBoard` are portrait only.
- When `leftAside` is absent nothing renders, so the DOM for existing
  consumers is unchanged.

### Player bars

- New prop `playerBars?: boolean`.
- When true, GobanView renders `<PlayerBar color={top} />` above and
  `<PlayerBar color={bottom} />` below the `GobanContainer` inside
  `.GobanView-center`, in both landscape and portrait.
- `PlayerBar` lives at `src/components/GobanView/PlayerBar.tsx` with its own
  CSS. It reads the controller from `GobanControllerContext`.
- Content, left to right: the player icon (`PlayerIcon`, 40px), then a
  stacked block with the username (`Player` component) above the score line,
  then the clock (`Clock` with `compact`) aligned to the far right.
- Score line: during play it shows the capture count. Once the engine phase
  is `stone removal` or `finished` it shows the points from
  `engine.computeScore`. This mirrors `PlayerCard` on the Game page.
- The bar highlights the side to move using the same `their-turn` class
  convention as the Game page player cards.
- Colour assignment: `user_color(goban, user.id)` decides the bottom colour.
  If the current user is a player, they are on the bottom and the opponent on
  top. Otherwise black is on the bottom and white on top. `user_color` moves
  from `src/views/Game/util.ts` to `src/components/GobanView/util.ts` and the
  Game view imports it from there.
- Each bar is a fixed 3rem tall, so the board area shrinks by 6rem and the
  existing square-fit logic in `GobanContainer` handles the board size.
- Portrait: the bars sit inside `.GobanView-center`, which keeps its
  `aspect-ratio: 1` sizing for the board only. The bars are outside the
  aspect-ratio box, so the center becomes a column of bar, square board, bar.

### Files

- `src/components/GobanView/GobanView.tsx`: two props, the left aside column,
  the bars inside the center.
- `src/components/GobanView/GobanView.css`: `.GobanView-left-aside` and the
  center column changes.
- `src/components/GobanView/PlayerBar.tsx` and `PlayerBar.css`: new.
- `src/components/GobanView/util.ts`: `user_color`.
- `src/global_styl/01_variables.css`: `--goban-view-left-aside-width`.
- `src/components/GobanView/index.ts`: export `PlayerBar` and `user_color`.

## Part 2: Kibitz on GobanView

### Landscape layout

```
+-------------+--------------------------------+--------------------+
| Rooms       | [top player bar]               | header: room title |
|  ...        |                                | [proposal panel]   |
|  + New room |          BOARD                 | [variation panel]  |
|-------------|                                |  (only when a      |
| Variations  |                                |   variation is     |
|  ...        |                                |   open)            |
|  + New var. | [bottom player bar]            | [Game | Room] chat |
|-------------|                                |                    |
| [mini main  |                                |  slider            |
|  board]     |                                | gear  <-  ...      |
+-------------+--------------------------------+--------------------+
```

**Left aside** (`KibitzLeftAside.tsx`): a flex column holding, in order,
`KibitzRoomList`, `KibitzVariationList` with the New variation button, and
`KibitzMiniMainBoard` pinned to the bottom.

- `KibitzMiniMainBoard` renders only while the center shows something other
  than the main game (a draft, a posted variation, or a game preview). It is
  a `GobanContainer` over the main controller's goban with interaction
  disabled and no coordinate labels. It always shows the live tail. Clicking
  it exits the variation.
- The New variation button moves out of the room list into the variation
  list.

**Center**: the board and the two player bars only. Nothing else.

**Right aside** panels, top to bottom, all inside one `always` tab:

1. `KibitzProposalPanel`: the existing `KibitzProposalBar` and
   `KibitzProposalQueue`, rendered only while a proposal is pending.
2. `KibitzVariationPanel`: rendered only while a variation or draft is open.
   - Draft: `GobanAnalyzeButtonBar`, the move tree at a fixed height (no
     `Resizable`), `KibitzNodeText`, and `KibitzVariationComposer` with Post
     and Discard.
   - Posted variation: the move tree and `KibitzNodeText`.
3. `KibitzChatPanel`: the chat with two tabs, Game and Room. It replaces the
   five-way split in `KibitzSharedStreamPanel`. The Game tab shows the main
   game's chat. The Room tab shows the kibitz room channel. The Room tab's
   input carries the users icon with `ChatUserCount`; pressing it toggles a
   `ChatUserList` for the room channel beside the log, as `GameChat` does.
   The chosen tab persists under the existing
   `kibitz.shared_stream.mobile_tab` key, renamed to `kibitz.chat_tab`.

The right aside header (`header` prop) is the room title.

Move navigation uses GobanView's built-in `MoveNumberSlider`. There are no
Kibitz transport controls.

### Action bar

| Position | Tab | Type | Notes |
| --- | --- | --- | --- |
| left | `kibitz-settings` | action, gear | Opens `KibitzRoomSettingsPopover` anchored to the button. |
| left, portrait only | `kibitz-rooms` | takeover, list icon | Room list. |
| left, portrait only | `kibitz-variations` | takeover, code-fork icon | Variation list with New variation and the mini main board. |
| center | `kibitz-return-to-game` | action, arrow-left | Shown while a draft, variation, or preview is open. Exits to the main game. |
| center | `kibitz-return-to-live` | action, forward | Shown while the main game is in the center and the user is not at the official tail. Jumps to the tail. |
| right | `kibitz-more` | action, ellipsis-h | Popover: Game information, Link to game, Download SGF, Call moderator. |

The More actions popover is `KibitzMoreActionsPopover.tsx`. It reuses
`openGameInfoModal`, `openGameLinkModal`, the `api1("games/<id>/sgf")` URL,
and `openReport` from the Game view, all targeted at the room's current game.

Escape is bound with `KBShortcut` and exits a draft, variation, or preview.
Exiting a draft discards it; the composer's Discard button does the same.

### Portrait layout

GobanView's standard portrait column: header (room title), the top player
bar, the board, the bottom player bar, then the proposal, variation, and chat
panels inline, with the slider and tab bar pinned at the bottom. The rooms
and variations lists open as takeover panels from the tab bar. The
`kibitz-variations` takeover contains the mini main board so the main
controller always has a mount point; when the center shows the main game the
mini board is not rendered there either.

Removed on portrait: the draggable board and chat split, the mobile room
shell and its overlays, the mobile scoreboard, the companion panel switcher,
and the compare panel.

### Streamer mode

Kept. When enabled, the Kibitz root gets `is-streamer-mode`, which hides both
asides and the tab bar so only the board and the player bars remain. The
toggle stays in the room settings popover and the value stays in session
storage under the existing key.

### Controller ownership: `useKibitzGobans`

A hook in `src/views/Kibitz/useKibitzGobans.ts` owns both controllers and
replaces `KibitzBoard`, the snapshot bookkeeping in `KibitzRoomStage`,
`useKibitzCurrentGameBaseBroker`, and `useKibitzCurrentGameConnectionKeeper`.

Inputs: the active room's current game id, the secondary pane state from
`KibitzController`, and the variation summaries.

Outputs:

```ts
interface KibitzGobans {
    main: GobanController | null;
    secondary: GobanController | null;
    /** The controller GobanView shows in the center. */
    center: GobanController | null;
    centerMode: "main" | "draft" | "variation" | "preview";
}
```

Rules:

- **Main controller.** Created when the current game id is known, with
  `game_id` set in its config so it connects to and follows the live game. Destroyed only when the
  game id changes or the hook unmounts. It is always mounted in the DOM,
  either in the center or in the mini board slot, so it is never hidden at
  zero size. When the center switches away from it, the hook calls the
  existing `restoreToOfficialTail` helper on it.
- **Secondary controller.** Created when the secondary pane opens a draft or
  variation. Its base is a snapshot of the main trunk from
  `captureCurrentGameBaseSnapshotFromController`. A posted variation is
  grafted onto it with `applyKibitzVariationToController`. A draft starts in
  analyze mode at the main board's current move. It is destroyed on exit.
- **Preview controller.** When `preview_game_id` is set, the secondary slot
  holds a controller connected read-only to that game.
- The hook exposes `center`, which GobanView receives as its `controller`.
  The slider, keyboard shortcuts, player bars, and chat follow it.
- The offscreen broker is unnecessary because the main controller is never
  unmounted. The connection keeper is unnecessary because the main
  controller keeps its own socket connection.

### State changes

- `KibitzSecondaryPaneState.size` and the `"small" | "equal"` mode are
  removed. `collapsed` plus the `variation_id`, `preview_game_id`, and
  `variation_source_*` fields fully describe the center.
- `KibitzController.setSecondaryPaneMode` is reduced to open and close.
- `kibitz.desktop.sidebar_width_px` and `kibitz-mobile-split-ratio` storage
  keys are no longer read or written.

### Kept

`KibitzController`, `kibitzVariationTree`, `kibitzCurrentGameBaseSnapshot`
and its types, `kibitzAnalysisPolicy` and its text, `KibitzRoomList`,
`KibitzVariationList`, `kibitzVariationQuickList`, `KibitzProposalBar`,
`KibitzProposalQueue`, `KibitzRoomSettingsPopover`, `KibitzGamePickerOverlay`,
`KibitzMobileGamePicker`, `KibitzPresetChangePendingBanner`,
`KibitzDebugPanel`, `KibitzNodeText`, `KibitzVariationComposer`,
`kibitzVariationDebug`, `KibitzUserAvatar`, `useCurrentKibitzUser`,
`parseGameId`, and the `HelpFlows` directory with its target ids. The
`refreshLastOfficialMoveFromTrunk` and `restoreToOfficialTail` helpers move
from `KibitzBoard.tsx` into `kibitzCurrentGameBaseSnapshot.ts`.

### Deleted

`KibitzRoomStage`, `KibitzBoard`, `kibitzBoardSizing`,
`kibitzBoardSizeDebug`, `KibitzDividerHandle`,
`KibitzDesktopMainGameScoreboard`, `KibitzMobileMainGameScoreboard`,
`kibitzScoreboardPlayerDisplay`, `KibitzMainGameStats` (already unreferenced),
`KibitzPresence`, `KibitzPresencePanel`, `KibitzMobileComparePanel`,
`useKibitzCurrentGameBaseBroker`, `useKibitzCurrentGameConnectionKeeper`,
`KibitzBoardControls`, `KibitzMoveTreeStrip`, and `KibitzSharedStreamPanel`
(replaced by `KibitzChatPanel`, which keeps its message rendering). Each
deleted module's test file and CSS file go with it. `KibitzInner.tsx` is
rewritten; the surviving state and effects (room resolution, stream and
proposal wiring, variation colour indexes, help flow triggers, game picker
wiring) are kept and the layout code is replaced.

### New files

| File | Purpose |
| --- | --- |
| `KibitzView.tsx` | The GobanView consumer: tabs, header, asides, popovers, shortcuts. Replaces the layout part of `KibitzInner`. |
| `useKibitzGobans.ts` | Controller ownership described above. |
| `KibitzLeftAside.tsx` | Room list, variation list, mini main board. |
| `KibitzMiniMainBoard.tsx` | Non-interactive main board thumbnail. |
| `KibitzProposalPanel.tsx` | Proposal bar and queue wrapper. |
| `KibitzVariationPanel.tsx` | Draft and posted variation controls. |
| `KibitzChatPanel.tsx` | Two-tab chat with the room user list. |
| `KibitzMoreActionsPopover.tsx` | Game info, link, SGF, call moderator. |

Each gets a matching CSS file.

## Testing

- `useKibitzGobans` unit tests: main controller created from a game id;
  swapping to a draft, a posted variation, and a preview and back; the main
  controller is restored to the tail on exit; controllers are destroyed on
  game change and unmount.
- `PlayerBar` render tests: top and bottom colour for a player and for a
  spectator; captures during play versus points when finished; clock
  present.
- `KibitzView` render tests: for each center mode (main, draft, variation,
  preview) and for a pending proposal, assert which panels and action tabs
  render in landscape and in portrait, and that the mini main board is
  present only when the center is not the main game.
- `KibitzChatPanel` render test: tab switching and the user list toggle.
- Surviving pure-logic tests run unchanged.
- Manual testing in desktop and mobile browsers before the PR, per
  `CONTRIBUTING.md`.

## Delivery

Three phases on this branch, each buildable and lint clean:

1. GobanView extensions (Part 1) with no Kibitz change.
2. Kibitz on GobanView (Part 2): new files, rewritten `KibitzInner`, deletions.
3. Cleanup: `docs/kibitz.md` durable document describing the layout and
   controller ownership, storage key removals, `graphify update .`.

## Risks

- **Hydration races.** The git history shows repeated fixes for the main
  board losing sync when hidden offscreen or resized to zero. The design
  removes the cause by keeping the main controller mounted at a real size at
  all times. On portrait the mini board lives in a takeover that is
  `display: none` while closed; `GobanContainer` already skips resizing when
  the container measures zero, and the engine keeps receiving moves
  regardless of rendering.
- **Chat panel rewrite.** `KibitzSharedStreamPanel` mixes two channels and a
  split ratio. `KibitzChatPanel` keeps the message rendering and the game
  chat subscription code, and drops the split.
- **Test churn.** About twenty test files go away with the modules they
  cover. The new tests above replace the coverage that still matters.
