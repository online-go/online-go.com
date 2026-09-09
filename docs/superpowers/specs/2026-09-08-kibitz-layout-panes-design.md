# Kibitz layout: portrait panes, landscape sidebar, variation colours

Design for a Kibitz pass that covers nine reported items: a portrait layout
where the chat is always on screen next to the board, a pane model driven from
the action bar, a landscape people column and game-info strip, colour-coded
variations, and five bugs.

## Goals

1. Portrait shows the board and one panel at the same time, with a draggable
   split between them.
2. Portrait switches panels from the action bar. Five panels share one area:
   Game chat, Kibitz chat, People, Variations, Rooms.
3. Portrait has no room title.
4. The people list is a toggle in the action bar, not a control next to the
   chat input.
5. Landscape shows the people list to the right of the chat by default, with
   an action-bar toggle.
6. Variations are colour coded, named, and stable in the move tree.
7. Landscape shows the game rules and time settings at all times.
8. The interface says which game a variation belongs to when that game is not
   the room's current game.
9. The listed bugs are fixed.

## Non-goals

- No change to how variations are posted, stored, or transmitted.
- No change to the Game, Review, or Joseki views, except the sidebar minimum
  width in section 4.3, which applies to every `GobanView` consumer.
- No portrait onboarding flow. Help flows stay landscape only.

## 1. Portrait split in GobanView

### 1.1 Layout

`GobanView` gets one new optional prop:

```ts
/** Portrait only: split the view between the board stage and the tab
 *  panels, with a drag handle between them, instead of scrolling both as
 *  one column. The panel area then scrolls on its own and is always on
 *  screen. Ignored in landscape. */
portraitSplit?: boolean;
```

**There is one portrait tree, not two.** The element structure is the same
whether or not `portraitSplit` is set:

```
.GobanView.portrait[.has-portrait-split]
  .GobanView-header             (collapses to zero height when empty)
  .GobanView-mobile-scroll
    .GobanView-stage
    .PortraitSplitter           the drag handle — the only conditional element
    .GobanView-mobile-panels
  slider slot
  TabBar
```

`portraitSplit` adds one class to the root and one element to the column. The
layout change is done in CSS, keyed on `.has-portrait-split`:

- `.GobanView-mobile-scroll` stops being a scroll container and becomes a flex
  column that does not scroll (`overflow: hidden`).
- `.GobanView-stage` takes the stored height instead of sizing to content.
- `.GobanView-mobile-panels` becomes `flex: 1; min-height: 0; overflow-y: auto`,
  so the panels scroll on their own and the board stays on screen.

This is deliberate. A second JSX branch would have to be checked, every time it
changed, for having stayed equivalent to the first for consumers that do not
opt in — and the Game, Review and Joseki pages all render through this
component. One tree cannot drift: the non-split path is not reimplemented, it
is the same JSX with one element absent and one class off. It also means
toggling the prop at runtime does not remount the board.

### 1.2 The handle

A new `PortraitSplitter` component, a sibling of `SidebarResizer` in
`src/components/GobanView/`. It follows the same contract:

- Pointer capture drag, `onPreview` during the drag, `onCommit` on release.
- Double-click, Enter, and Escape reset to the automatic size.
- Arrow Up and Arrow Down nudge, with a larger step when Shift is held.
- `role="separator"`, `aria-orientation="horizontal"`, and live
  `aria-valuenow` / `valuemin` / `valuemax` measured from the DOM.
- `stopImmediatePropagation` on the handled keys, so the Kibitz move
  navigation shortcuts do not also fire.

Both resizers share their `remToPx` helper and their measurement pattern.
Extract the shared parts rather than copying them.

### 1.3 Bounds and persistence

The split is stored as the board stage height in pixels:

```ts
"goban-view-portrait-split": null as number | null,
```

`null` means the automatic height, which is the board's natural square size
capped so that the panel area keeps its minimum. The stored value is clamped
on read as well as on drag, because the value is shared across devices through
the preference store and a phone rotated or replaced must not be left with a
board of zero height.

Bounds:

- Board stage minimum: `8rem`, matching the existing portrait `min-height`.
- Panel area minimum: `8rem`, a new constant next to it.
- Maximum board height: the available column height minus the panel minimum.

### 1.4 Board centring (bug 7c)

In portrait the stage is as wide as the column while `.GobanView-center` keeps
`aspect-ratio: 1`. When the stage is capped in height, the board fits to the
shorter side and sits against the left edge.

**Measured cause (differs from the original hypothesis above):** the landscape
`has-player-bars` centring trick does not apply here (it depends on
`--goban-view-board-size`, which is the full view height in portrait, not the
stage height — a no-op on a portrait viewport). The actual left-alignment is
not fixable via flex alignment on `.GobanView-center` either, for two
independent reasons.

First, `.GobanView-center` is a **column** flex container, so its
`align-items` governs width, not height. `.goban-container`'s own
`flex-grow: 1; flex-basis: 100%` is a main-axis (height) claim and says
nothing about width; what pins its width to the full row is the inherited
`align-items: stretch` on `.GobanView-center`. Setting `align-items: center`
there would therefore not be a no-op — it would release that stretch and drop
`.goban-container` to its shrink-to-fit width, which is near zero because its
only content is the absolutely-positioned board and absolutely-positioned
children do not contribute to shrink-to-fit sizing. The board would vanish
rather than move.

Second, the rendered board is `position: absolute`, which flex alignment does
not affect at all. `.goban-container`'s own base rule already
carries `align-items: center; justify-content: center` for exactly this
reason, and it has always been dead code against the absolutely-positioned
board.

The DOM shape of the absolutely-positioned board also differs between
consumers: Kibitz's renderer nests a plain `position: static` div inside the
`.Goban` wrapper (so `GobanContainer.tsx`'s JS-computed `left`/`top` never
takes effect — the wrapper's own CSS `top: 0; left: 0` decides the position);
`/game/N`'s renderer nests a second, also-`position: absolute` `.Goban`-classed
element instead, and there the JS centring already works correctly on its own.
A fix that repositions `.Goban` (tried and reverted: `left: 50%; transform:
translateX(-50%)`) fixes the first shape but breaks the second, because moving
the wrapper moves the containing block the second shape's JS math assumes is
stationary at the container's origin.

The fix instead targets `.goban-container`'s own box, leaving `.Goban` (in
either shape) untouched: give `.goban-container` its own cross-axis alignment
so it stops stretching to the stage's full width, and let its `aspect-ratio`
resolve its width from its already-definite height.

```css
.has-portrait-split .GobanView-center .goban-container {
    align-self: center;
    aspect-ratio: 1;
    max-width: 100%;
}
```

The rule is scoped to `.has-portrait-split`, which is Kibitz alone today. The
split is the only portrait layout that takes height off the board, so it is
the only one where the container stops being square; the scrolling portrait
column that the game, joseki and puzzle pages use keeps the board placement it
already had. `/game/N` uses the other DOM shape described above, whose JS
centring reads the container box, so a change there needs its own
verification.

Putting the same two declarations on `.GobanView-center` instead (matching
the row's own suggestion of centring "the portrait board area") was tried
first and reverted: `.GobanView-center`'s height is itself derived from a
`flex-basis: auto` computation that currently depends on its width being the
stretched, definite value the aspect-ratio anchors to. Removing that stretch
makes both dimensions indefinite at once and collapses the element to its
`min-height: 8rem` floor even with plenty of headroom — a real regression to
the auto-height (unsplit, unconstrained) case. `.goban-container`'s height has
no such circularity (it is always a definite percentage of
`.GobanView-center`'s already-resolved height), so the same two declarations
are safe one level down.

See `.superpowers/sdd/2026-09-08-kibitz-layout-panes/task-10-report.md` for
the full before/after measurements.

## 2. Kibitz portrait panes

### 2.1 The pane set

Five panes share the area below the split. Exactly one is active at any time;
the area is never empty.

| Pane         | Icon       | Contents                                 |
| ------------ | ---------- | ---------------------------------------- |
| `game-chat`  | `comment`  | `KibitzChatPanel` in game mode           |
| `room-chat`  | `comments` | `KibitzChatPanel` in room mode           |
| `people`     | `users`    | `ChatUserList` for the room channel      |
| `variations` | `sitemap`  | `KibitzVariationList`                    |
| `rooms`      | `list`     | `KibitzRoomList` and the mini main board |

Pane state lives in `KibitzView`, persisted through `data.ts` as
`kibitz.portrait_pane`. Migration: a stored `kibitz.chat_tab` of `"game"` or
`"room"` seeds the new key once. The old key stays: the landscape chat panel
still owns it, and the seeding runs in both orientations.

### 2.2 How panes reach the tab bar

`GobanView` needs no new tab type. Kibitz declares five `type: "action"` tabs
with `active={activePane === id}` and an `onClick` that sets `activePane`. All
five panes render inside one `type: "always"` tab; the inactive four are
hidden with CSS.

Every pane stays mounted. `GobanView.renderPanel` already works this way — it
renders a panel's children unconditionally and hides them with
`display: none` — and Kibitz follows the same rule inside its own pane
wrapper. So `KibitzChatPanel` mounts once for the life of the room:
`chat_manager.join` is not called again on a pane switch, the goban chat
subscription is not torn down, and the log keeps its scroll position while the
user reads the room list.

`KibitzChatPanel` gains two props:

- `mode: "game" | "room"`. In portrait `KibitzView` passes it and the panel
  renders no tab strip. In landscape the panel keeps its own two-tab strip and
  owns the mode itself.
- `visible: boolean`. A hidden pane measures `scrollHeight` as zero, so the
  panel's scroll-to-bottom layout effects cannot position the log while the
  pane is hidden and must re-run when it is revealed. The panel already gates
  those effects on `roomVisible` / `gameVisible`; this prop is ANDed into both.

The unread dots belong on the action-bar buttons, which `KibitzView` declares,
but `roomUnread` and `gameUnread` are local to the panel. The panel reports
them through an `onUnreadChange({ room, game })` callback and `KibitzView`
mirrors them into state for the tab decorations. Both unread counters keep
working in portrait without any further change, because the panel derives
`roomEntries` and `gameEntries` regardless of which one it renders.

### 2.3 Tab bar density

Nine buttons sit in one row in portrait: five panes, Settings, Analysis, the
centre Return action, and More. Narrow the button width and the gap in
portrait so they fit without overflow. No second row, and no `priority`
overflow for these tabs.

### 2.4 What this removes

- The `kibitz-rooms` takeover tab. Rooms is a pane, so nothing overlays the
  board and bug 7a (Rooms and Variations labels overlapping) cannot occur.
- `KibitzLeftAside` is landscape only from now on. Its two collapsible
  sections split into the `rooms` and `variations` panes for portrait; the
  landscape aside itself is unchanged.
- `ChatUserCount` in the chat composer. People is a pane in portrait and a
  toggle in landscape (section 4.1).

### 2.5 Chat panel height (bug 7b)

`.KibitzChatPanel` sets `height: 100%` inside `.GobanView-mobile-panels`,
which grows inside a scroll column that is already taller than the viewport.
The result is a very tall log box with the composer far below it.

The split gives the panel area a definite height, so the panel gets a bounded
box and the composer sits directly under the log. No separate fix is needed,
but the outcome must be measured in the browser and confirmed.

## 3. Portrait header and the variation chip

`KibitzView` passes a header only when it has something to say.

- Centre shows the live game: `header` is `undefined`. `.GobanView-header`
  collapses to zero height in portrait. Goal 3 is met.
- Centre shows a variation or a draft: `header` is `<KibitzVariationChip>`.

`KibitzVariationChip` is a new component in `src/views/Kibitz/`:

- A swatch in the variation's line colour (section 5.3).
- The variation title, or the untitled fallback already used in the list.
- The author, through `Player`.
- When the variation belongs to a game that is not the room's current game,
  a "of {{game}}" suffix naming that game. This satisfies goal 8 — knowing
  which game an older variation belongs to.
- While drafting, the draft label instead of a title.

The same component renders in the landscape sidebar header, beside the room
title, so one implementation serves both orientations.

## 4. Landscape sidebar additions

### 4.1 People column (goal 5)

`KibitzChatPanel` renders `ChatUserList` as a right-hand column when both are
true:

- The user has the column enabled. Persisted as `kibitz.people_column`,
  default on.
- The panel is wide enough. Measure the panel with a `ResizeObserver` and
  require at least `22rem`, so the log keeps a usable width. Below the
  threshold the list overlays the log as it does today. The threshold has to
  clear the automatic sidebar width of a common laptop — 400px at 1366px wide
  and 409px at 1600px — because the action tab is the only route to the
  people list.

A `kibitz-people` action tab in the bar toggles the preference, with `active`
reflecting it. In portrait this tab is the People pane instead; the two do not
both appear.

`.KibitzChatPanel-body .ChatUserList` already has the column styling. Keep it.

### 4.2 Game info strip (goal 7)

A new `KibitzGameInfoStrip` renders under the room title in the landscape
sidebar header. One quiet line, wrapping to two when the sidebar is narrow:

- Ruleset, through `rulesText` from `@/lib/misc`.
- Time control, through `shortShortTimeControl` from
  `@/components/TimeControl/util`.
- Board size.
- Komi.
- Handicap and rengo, each only when it applies.

Rules, board size, time control and komi always show. Every game has a komi,
it varies from game to game, and it cannot be read off the ruleset, so it is
not conditional.

The values come from the main controller's goban (`engine.rules`,
`config.time_control`, `engine.handicap`, `engine.komi`, `engine.rengo`), not
from `KibitzWatchedGame`. Nothing is added to the Kibitz API types. A
`generateGobanHook` keyed on `gamedata` keeps the strip current when the room
changes game.

The strip is landscape only. Portrait has no room for it and goal 3 asks for
the header row to be empty there.

### 4.3 Sidebar minimum board width (item 9)

`sidebarWidthBoundsPx` in `SidebarResizer` clamps the maximum to 75% of the
root width and ignores the left aside, so on Kibitz the handle can be dragged
until the board pane has no width left.

Replace the fraction with a measured bound:

```
max = rootWidth - leftAsideWidth - MIN_BOARD_PANE_WIDTH
```

`leftAsideWidth` is the measured width of `.GobanView-left-aside`, or zero
when there is none. `MIN_BOARD_PANE_WIDTH` is a new exported constant beside
the existing minimum, starting at `24rem`. `max` is never allowed below `min`.

This applies to every `GobanView` consumer, which is the intent: no view
should be able to hide its own board.

## 5. Variation colours

### 5.1 Colour assignment is synchronous (bug 6d)

Today `KibitzInner` holds `visibleVariationIds` in one state value and
`variationColorIndexes` in another, updated by a `useEffect` that runs after
the commit. `useKibitzGobans` composes the board in that same commit and reads
`variationColorIndexes[id] ?? 0`. For a newly visible variation the entry does
not exist yet, so the fallback fires and index 0 — `#ff0000` — is used. A
second click finds the entry and the colour corrects itself. This is exactly
the reported behaviour: a new variation from chat is always red, and there are
two red branches until it is clicked again.

Fix: make the ids and their colours one state value.

```ts
interface KibitzVisibleVariations {
    ids: string[];
    colors: Record<string, number>;
}
```

Every update goes through one `setState` that runs
`assignVisibleVariationColorIndexes` on the new id list. The effect is deleted.
`useKibitzGobans` then always composes with the colour that belongs to the
variation, and the `?? 0` fallback becomes unreachable. Keep it as a guard but
it should never fire.

### 5.2 Branch order is stable (bug 6c)

`useKibitzGobans.compose()` applies every non-selected visible variation
first, then the selected one. Insertion order into `parent.branches` therefore
depends on which variation is selected, and the move tree re-orders its
branches when the user clicks between variations.

Fix: apply visible variations in one fixed order — the order they appear in
the variation list — whatever is selected. Then jump to the selected
variation's endpoint. Selection no longer affects the tree's shape.

`applyKibitzVariationToController`'s `selected` argument controls whether
marks are applied, not order, so it is passed as before.

### 5.3 Swatches (goal 6)

A new `KibitzVariationSwatch` renders a small square filled with
`KIBITZ_VARIATION_COLORS[colorIndex]`, with the colour index also exposed as a
`data-` attribute so tests can assert it without reading computed styles. It
takes a nullable index and renders nothing when the variation is not currently
on the board.

It appears in four places:

- Each row of `KibitzVariationList`.
- Each variation-post button in `KibitzChatPanel`.
- `KibitzVariationPanel`'s heading.
- `KibitzVariationChip` (section 3).

The colour map has to reach all four. It is passed down from `KibitzInner`,
which already owns it, rather than read from a context.

Colours are meaningful only for variations that are on the board. A variation
that is listed but not visible shows no swatch, which also gives the list a
visible distinction between the two states that it does not have today.

### 5.4 Name (goal 6)

`KibitzVariationChip` from section 3, in the sidebar header in landscape and
in the header row in portrait.

## 6. Remaining bugs

### 6.1 Analysis does not toggle off (bug 7d)

`kibitz-new-variation` is an `action` tab. It renders `active` while the
centre shows a draft but its click always starts a new draft.

Fix: when the tab is already active, the click exits the draft through the
same path as Back to game, including the unsaved-moves confirmation.

### 6.2 Change board crashes (goal 9)

"Cannot read properties of null (reading 'id')" when changing the game in a
room. There is no reproduction yet, and the cause is not to be guessed.

This item is investigated with the `systematic-debugging` skill: reproduce on
the dev server first, find the failing read, then fix it. It is scheduled
early in the plan because its size is unknown. If it turns out to be large or
to sit outside this work, it becomes its own piece of work and the plan says
so rather than absorbing it.

## 7. Files

New:

- `src/components/GobanView/PortraitSplitter.tsx`
- `src/views/Kibitz/KibitzVariationChip.tsx` and `.css`
- `src/views/Kibitz/KibitzVariationSwatch.tsx` and `.css`
- `src/views/Kibitz/KibitzGameInfoStrip.tsx` and `.css`

Changed:

- `src/components/GobanView/GobanView.tsx`, `.css` — the `portraitSplit` mode
- `src/components/GobanView/SidebarResizer.tsx` — measured maximum width
- `src/lib/preferences.ts` — `goban-view-portrait-split`
- `src/views/Kibitz/KibitzView.tsx`, `.css` — panes, header, tabs
- `src/views/Kibitz/KibitzInner.tsx` — merged visible-variation state, pane
  state plumbing
- `src/views/Kibitz/useKibitzGobans.ts` — stable compose order
- `src/views/Kibitz/KibitzChatPanel.tsx`, `.css` — `mode` prop, people column
- `src/views/Kibitz/KibitzVariationList.tsx`, `KibitzVariationPanel.tsx` —
  swatches
- `docs/kibitz.md` — the durable document, updated as each section lands

One component per file, each with its own `.css`, per the repository rules.

## 8. Testing

Unit tests, with Jest (`yarn test <path>`; the repo uses Jest, not Vitest):

- `assignVisibleVariationColorIndexes` keeps colours stable when a variation
  is added or removed, and a newly visible variation never takes a colour
  already in use. A regression test asserts the new variation is not index 0
  when index 0 is taken.
- `useKibitzGobans` composes branches in list order whatever is selected.
- Pane selection persists and restores, including the `kibitz.chat_tab`
  migration.
- Switching panes away from a chat and back does not remount
  `KibitzChatPanel`, and the log is scrolled to the latest line on reveal.
- `PortraitSplitter` clamps to its bounds, including a stored value that is
  out of range for the current viewport.
- `sidebarWidthBoundsPx` subtracts the left aside and the board minimum.
- `KibitzGameInfoStrip` renders only the fields that apply.

Browser passes, per the repository's testing note, at 1600x900 and 400x800 on
the dev server at `localhost:8080`, signed in, in a room with a live game.
Each phase ends with `yarn test`, `yarn type-check`, `yarn lint`, and
`yarn prettier:file` on the changed files. `yarn build` runs once at the end.

Nothing in this work is committed. Every phase ends with the changes left in
the working tree for review.

## 9. Order of work

1. Reproduce and fix the change-board crash (6.2). Its size is unknown, so it
   goes first.
2. Variation colours (section 5). Self-contained, and it is what makes the
   chip and the swatches possible.
3. Landscape sidebar (section 4). People column, info strip, sidebar bound.
4. Portrait split in GobanView (section 1), with the existing Kibitz portrait
   layout still in place, so the split is verified on its own.
5. Kibitz panes and header (sections 2 and 3). The largest change, and it
   depends on all of the above.
6. Analysis toggle (6.1) and the browser pass over every reported item.

`docs/kibitz.md` is amended as each section lands, not at the end.
