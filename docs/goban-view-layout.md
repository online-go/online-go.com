# GobanView layout

`GobanView` (`src/components/GobanView/`) puts every board-view layout
decision in one place. A view — Game, Kibitz — defines its own content and
actions and hands them to `GobanView` through props and slots. `GobanView`
decides where each slot goes. It does not know what an action does.

## One owner for each layout decision

A board view has one layout path:

1. `classifyGameLayout` picks the mode from the viewport.
2. `resolveGobanViewLayout` turns the mode, the root width, the
   preferences and what the view offers into one `GobanViewLayout`.
3. `GobanView` renders the DOM structure from that result, and
   `gobanViewLayoutClasses(result)` gives every layout class on the root.
   Both render branches (portrait and landscape) use it.
4. `GobanView.css` places the columns, the board stage and the board from
   those classes and its own custom properties.

The root also has classes that do not come from the resolver. They are
presentation and user sizing, not layout decisions:

- From props: `has-no-board` (no controller), `has-custom-slider` (the
  view gives a `customSlider`), and the view's own `className`.
- From the viewport snapshot: `squashed` (a short viewport).
- From a user drag: `has-custom-sidebar-width` and
  `has-custom-left-aside-width` (a stored or dragged width, set as a CSS
  variable on the root), `is-resizing-sidebar` and `is-resizing-stage`
  (a drag is in progress).
- On tab panels, not on the root: `.takeover.active` and
  `.keep-goban-visible`. They show and hide panel content only.

Rules that keep it one path:

- A layout decision is made in `resolveGobanViewLayout` and nowhere else.
  The DOM and the CSS classes for a decision come from the same field of
  its result, so the two cannot disagree.
- A user resize is an intended geometry input. Dragging the sidebar or
  the left aside, or the portrait split handle, changes the column widths
  or the stage height, and so the board size.
- Transient UI state, such as an open takeover, a popover or focus, is
  never a geometry input. A takeover replaces the panel area. It never
  changes the board stage, the board size or the board position. There is
  no takeover class on the root.
- CSS that lays out an element keys on that element, not on a root class
  that says the element is there.
- A size that CSS lays out and JS also computes with is defined in CSS.
  The JS copy (`LAYOUT_GEOMETRY` in `layout.ts`) is checked against the
  stylesheets by `layout.test.ts`.
- A size that a part of the board stage takes from the board has one
  variable. The part is held to it, and the board inset counts it:
  `--goban-view-player-bar-height` for the player bars,
  `--goban-view-move-controls-height` for the move controls under the
  board.
- Views do not override the columns, the board stage or the board
  placement, and do not copy those rules. A view can style the content of
  its own panels. A view that must change its content for a layout reads
  `useGobanViewLayout()` inside the view, or uses the rule's function
  from `layout.ts` (Kibitz uses `leftAsideAllowed` to know when its lists
  are not in a left aside). A view passes `portraitSplit` and
  `sidebarContentBefore` in every mode; the resolver decides where they
  apply.
- In landscape, the whole center column takes the wheel (`onWheel`), the
  space beside the board included. The board container does not get
  `onWheel` there, so one notch fires the handler once. In portrait the
  board container takes it.
- The landscape stage needs container query units for the board size.
  Where they are missing, the stage fills the center column and
  `GobanContainer` centers the board in it.

Known exceptions:

- Zen mode in `Game.css` moves the root to the top of the window and takes
  the margins off the sidebar. Zen is an explicit mode, not transient
  state. The window alignment is then off by the sidebar's 0.3rem edge
  margin. In portrait, zen gives `.GobanView-stage` `margin-top: auto`
  (`Game.css`), which pushes the board down near the thumb.
- `FULL_HORIZONTAL_REQUIREMENTS`, which `classifyGameLayout` uses, is a
  simpler model of the columns than `LAYOUT_GEOMETRY` and
  `MIN_BOARD_PANE_REM`. It takes the aside and sidebar widths from
  `LAYOUT_GEOMETRY`, but its gaps (24px) and minimum board (200px) are its
  own. Between 1016px and about 1218px the mode is
  `fullHorizontal`, but the board pane is narrower than 24rem when the
  left aside shows.

## Modes

`classifyGameLayout` (`src/components/GobanView/layout.ts`) reads the
viewport and returns one of three modes:

- `stacked`: the viewport is narrow, or its aspect ratio is portrait
  (width / height <= 0.8), or its width is under `MINIMUM_HORIZONTAL_WIDTH`
  (600px). The view lays out as one column.
- `fullHorizontal`: the viewport is wide and tall enough for the left
  aside, the board and the main sidebar together
  (`FULL_HORIZONTAL_REQUIREMENTS`), and its height is at least 600px. The
  view lays out as up to four columns.
- `compactHorizontal`: wide but not `fullHorizontal`. The view lays out as
  two columns: the board and the main sidebar. There is no left aside and
  no action dock.

`classifyGameLayout` does not read preferences and holds no state. The
viewport snapshot store in the same file (`nextSnapshot`, read through
`useGameLayout`) holds the previous mode while an on-screen keyboard is
open and a text input has focus, so opening the keyboard cannot unmount the
input and close it. The store then sets `keyboardOpen` on the snapshot. It
releases the held mode once the viewport is as tall as it was before the
keyboard opened, the width changes, or no text input has focus.

## Resolution

`resolveGobanViewLayout` (`src/components/GobanView/layout.ts`) takes the
mode, the measured root width, the preferences and what the view offers (a
board, the slots, player bars, the built-in move controls). It returns one
`GobanViewLayout`. An on-screen keyboard changes only the root height, and
a takeover is not an input, so neither can change the result.

Rules:

1. The left aside and the action dock can show only in `fullHorizontal`. A
   slot the view did not offer never shows.
2. The board's width is the root width less the outer width (width plus
   gap and resizer) of every column that shows. The left aside's outer
   width uses its stored width, clamped, or the default width when the
   stored width is null. The dock's outer width is only its collapsed
   width, because it expands over the main sidebar instead of pushing the
   board.
3. The left aside shows whenever the view offers it in `fullHorizontal`. It
   never drops, because Kibitz has no other place for its room list there.
   `clampLeftAsideWidth` clamps its stored width so the board pane keeps at
   least `MIN_BOARD_PANE_REM` (24rem). The resize handles use the same
   limit (`resizerUtil.ts`). The clamp never goes below the default width
   (24rem), so on narrow `fullHorizontal` screens the board pane can go
   under 24rem (see Known exceptions above).
4. The action dock shows only when the `goban-view-action-buttons`
   preference is `"dock"` and the board width, with every other column
   that shows, is at least `minimumUsefulGoban`. There is no automatic
   choice: with `"bar"` (default) the actions stay in the tab bar.
5. When the board would not fit, only the action dock gives way. The left
   aside never drops for width; its stored width is clamped instead.
6. `mobileScroll` is true only when the mode is `stacked`, the
   `goban-view-mobile-scroll` preference is on, and the view does not use
   `portraitSplit`. Kibitz uses `portraitSplit`, so its portrait layout
   never scrolls this way.
7. The move controls position is the `goban-view-move-controls`
   preference, except that `mobileScroll` forces `"under-board"`.
8. The built-in move controls have their row under the board
   (`moveControlsUnderBoard`) when the position is `"under-board"`, there
   is a board, the view gives no `customSlider`, and `hideSlider` is not
   `true`. `hideSlider="when-cramped"` is a portrait measurement; it can
   leave the row empty in portrait, where the board inset is not used.
9. Player bars show when the view offers them and there is a board, except
   in `compactHorizontal`. The view's `sidebarContentBefore` shows at the
   top of the sidebar only in `compactHorizontal`, in place of the bars.
10. `boardAlignment` is the `goban-view-board-alignment` preference
    (an unknown value reads as `container`) in landscape, and null when
    `stacked`. The root gets exactly one `board-align-*` class in
    landscape and none in portrait. The `board-align-*` rules are the only
    CSS that places the board sideways.

## Preferences

Defined in `src/lib/preferences.ts`:

| Key                           | Type                                 | Default       | Used by   |
| ----------------------------- | ------------------------------------ | ------------- | --------- |
| `goban-view-action-buttons`   | `"bar" \| "dock"`                    | `"bar"`       | GobanView |
| `goban-view-board-alignment`  | `"window" \| "container" \| "group"` | `"container"` | GobanView |
| `goban-view-left-aside-width` | `number \| null`                     | `null`        | GobanView |
| `goban-view-mobile-scroll`    | `boolean`                            | `false`       | GobanView |
| `goban-view-move-controls`    | `"docked" \| "under-board"`          | `"docked"`    | GobanView |
| `game.chat-column`            | `boolean`                            | `false`       | Game view |

`goban-view-action-buttons` is the "Action buttons" setting: "Bottom of the
side panel" (`"bar"`) or "Right side" (`"dock"`). An unknown stored value
reads as `"bar"`. `normalizeActionButtonsPosition` in `layout.ts` is the only
place that reads the stored value; `useActionButtonsPosition` in
`util.ts` uses it for `GobanView` and the Action buttons picker.

The Game page Settings popover and Settings > Theme show these five
settings as illustrated pickers. The pickers are in
`src/components/LayoutSettings/pickers/`, the drawings are in
`src/components/LayoutSettings/illustrations/`, and the titles and choice
labels are in `src/components/LayoutSettings/options.ts`. They are
settings UI, so they are not part of `GobanView`. The Board alignment
picker reads the stored value through `normalizeBoardAlignment`, as the
resolver does. Each picker is a `LayoutChoicePicker`
(`src/components/LayoutChoicePicker/`): a radio group of cards, each with
a drawing of the layout and a label.

| Setting          | Preference                   | Choices                                                      |
| ---------------- | ---------------------------- | ------------------------------------------------------------ |
| Action buttons   | `goban-view-action-buttons`  | Bottom of the side panel, Right side                         |
| Chat column      | `game.chat-column`           | Left column (on), In the side panel (off)                    |
| Scrolling layout | `goban-view-mobile-scroll`   | Fits the screen (off), Scrolls (on)                          |
| Move controls    | `goban-view-move-controls`   | Under the board, Docked                                      |
| Board alignment  | `goban-view-board-alignment` | Center in window, Center beside sidebar, Center with sidebar |

The desktop popover shows Action buttons, Move controls, Chat column and
Board alignment. The mobile popover shows Scrolling layout and Move
controls, with phone drawings; the mobile popover greys out the Move
controls picker, with a note, while Scrolling layout is on, because the
resolver forces `"under-board"` there regardless of the stored choice.
Board alignment applies only to the landscape layout, so the mobile
popover does not show it. Settings > Theme shows all five, and its Move
controls picker is never disabled. The "More options" panel in the game
sidebar shows the Settings > Theme component.

`goban-view-mobile-scroll` is not only a Game page setting. It changes
every `GobanView` that does not use `portraitSplit`: today the Game,
Puzzle and Joseki pages. Kibitz uses `portraitSplit`, so the setting does
not change it. A view that gives no `actionDock` keeps its tab bar in the
scrolling layout.

`goban-view-left-aside-width` null means the CSS default width, 24rem, as
if the reader had never dragged the handle. The dock has no width
preference: its widths are the CSS variables `--dock-collapsed-width`
(2rem) and `--dock-width` (15rem).

`GobanView` also reads `goban-view-sidebar-width` and
`goban-view-portrait-split`, the user sizes of the sidebar and the
portrait split.

## Slots

- **`leftAside`**: a landscape-only column before the board, styled like
  the sidebar. Resizable with a handle on its right edge
  (`SidebarResizer`, edge `"end"`). It never drops once offered in
  `fullHorizontal`; its width is clamped to keep a 24rem board pane.
- **`actionDock`**: the view's labelled actions list, given once. On
  desktop, `GobanView` renders it in a dock attached to the right edge of
  the main sidebar: collapsed, `--dock-collapsed-width` wide and showing
  only icons; expanded, `--dock-width` wide and showing icons and labels,
  expanding over the main sidebar so the layout does not move. The dock
  expands on hover, only for a pointer that can hover, and on keyboard focus
  (`:focus-visible` in the dock). A click or a tap does not keep it
  expanded: it collapses when the pointer leaves. In mobile scrolling
  mode, `GobanView` renders it at the end of the scroll, always expanded,
  after the panels. A row is a direct child of the dock or the list. Its
  first child is the icon, and the label is a `<span>` after it. The dock
  and list CSS size only the first child, so a composite icon such as
  `UndoIcon` keeps its own inner layout.
  While the resolved layout shows the dock or the mobile scroll list,
  `GobanView` does not render the tab bar. If the view gives no
  `actionDock`, the tab bar stays, on desktop and on mobile, so the view
  keeps its actions.
- **Board stage**: in landscape, `GobanView` wraps the board in
  `.GobanView-stage` whenever there is a board, with the player bars and
  the move controls under the board when the layout has them. The stage
  is as wide as the board and centered in the center column. Without a
  board, `centerPlaceholder` fills the center column instead.
- **`aboveBoard`** / **`belowBoard`**: portrait-only slots directly above
  and below the board, inside the scroll flow, part of the stage that is
  capped to the screen height outside scroll mode.
- **Move controls** (`MoveNumberControl`, or a view's `customSlider`):
  `"docked"` puts the strip above the tab bar in portrait and at the
  bottom of the sidebar in landscape.
  `"under-board"` puts it directly under the board, above the bottom
  player card, in both orientations; the board shrinks to make room for
  it. The root gets `has-move-controls-under-board`, and so the board
  inset, from rule 8, not from whether the strip renders now. In
  landscape the strip under the board is held to
  `--goban-view-move-controls-height` (2.6rem). A takeover never removes
  the strip under the board, because the strip is part of the board stage.
  In landscape, and in portrait during a `keepGobanVisible` takeover, it
  stays visible with the board. In portrait, an overlay takeover covers it
  with the board and the rest of the scroll area. Docked, the built-in
  strip does not render during a takeover that covers its place: any
  takeover in landscape and an overlay takeover in portrait. A
  `keepGobanVisible` takeover in portrait keeps it. A `customSlider` always
  renders, and the overlay leaves room for it. Under the board the strip
  has no background and no border. A `customSlider` never moves
  under the board; only the built-in `MoveNumberControl` does.

The root gets `has-action-list` in portrait when the action list has
replaced the tab bar (mobile scroll on, and the view gives an
`actionDock`). CSS that must apply only while there is no tab bar keys off
`has-action-list`, not `has-mobile-scroll`: scrolling mode without an
`actionDock` still has a tab bar.

## Reading the layout

`useGobanViewLayout()` (`src/components/GobanView/GobanViewLayoutContext.tsx`)
returns the resolved `GobanViewLayout` for the current render. It throws
outside a `GobanView`. Children of `GobanView` — tab content, slot content —
read it to change what they render for the current layout. The Game view
uses it to render the chat only where the layout puts it: in the left
aside when `leftAside` is true there, in the main tab otherwise. On mobile,
`SidebarGameChat` follows the chat toggle (`game.mobile-chat-visible`),
except when `mobileScroll` is true: then the chat always shows, if the chat
is enabled.

## Game view actions

The Game view defines each action once (`useGameActions`,
`src/views/Game/useGameActions.tsx`). The tab bar (`sortBarActions` and
`gameActionTab`), the "..." menu (`GameActionsPanel`) and the labelled list
(`GameActionList`, the `actionDock`) render from that one list. Each sorts
by its own field, so the order of the array does not matter:

- The tab bar sorts by `bar.align`, then `bar.order`. An action with
  `bar: null` is not in the bar.
- The "..." menu sorts by `menuOrder`. An action with no `menuOrder` is not
  in the menu. A divider follows the last row of each `menuSection`:
  `"tabs"` (Analyze game or Previous move, Chat, Review this game, Plan
  conditional moves, Pause) at the top, and `"play"` (Request / Cancel
  undo, Accept / Reject undo, Resign / Cancel game) after Tournament and
  Ladder. The menu does not have Settings, Moderator or Zen mode.
- The dock and the mobile scroll list sort by `dockOrder`. An action with
  no `dockOrder` is not in them. Settings is last. Accept / Reject undo
  and Resign / Cancel game are not in the dock, because the play buttons
  show them. Chat and Previous move have no `dockOrder`: they exist only
  in the `stacked` mode, where the dock never shows, and the scrolling
  layout always shows the chat and the move controls.

Plan conditional moves and Review this game are in the dock and the list,
disabled, before they are usable. The tab bar and the "..." menu show them
only when they are usable. The doc comment on `GameAction.bar` gives the
rule. A link action always has `bar: null`, so the tab bar has no link
tabs.

Volume and Keyboard shortcuts are not game actions. The Settings popover
has a volume slider and a keyboard shortcuts link.

`src/views/Game/gameActionOrder.test.tsx` pins the exact order of each of
the three for representative states.

The Settings row in the dock opens the Settings popover to the left of
the collapsed dock, level with the row (`popover({ leftOf, alignTop })`).
From the tab bar and the mobile list, the popover opens below the button,
or above it when there is no room below. `src/lib/popover.tsx` documents
how a popover is placed.

## Adding a view

Give `GobanView` an `actionDock` to get the desktop dock and the mobile
scroll list for the view's actions. A view that gives no `actionDock` keeps
its tab bar and "..." menu in every mode; the dock and the mobile scroll
list never show for it. Offer `leftAside` for a landscape-only column
beside the board; it shows only in `fullHorizontal` and never drops once
offered.
