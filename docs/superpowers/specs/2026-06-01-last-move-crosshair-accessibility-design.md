# Last-move crosshair — accessibility feature (design)

Date: 2026-06-01
Status: approved (pending spec review)

## Goal

Add an opt-in accessibility setting that, when enabled, highlights the full
horizontal line and the full vertical line passing through the last played stone
on every goban, in a high-contrast color. This lets a low-vision user locate the
last move at a glance.

Behavior, as specified by the requester:

- A new **Accessibility** section in the user settings.
- **Disabled by default.**
- Default highlight color **`#1e6bff`** (high contrast blue).
- The highlight is drawn **under the stone** (the stone stays fully visible).
- It follows the last move on every change.
- It applies on **all gobans**.
- Persistent setting, taken into account at the **next draw** of a goban
  **without page reload** (no requirement to live-refresh boards already on
  screen — they pick it up at their next natural redraw, e.g. the next move).
- The settings UI ideally exposes a **color picker** for the color and a slider
  for the **thickness**.

## Scope decisions (resolved during brainstorming)

- **All real boards, but not thumbnails/preview boards.** The crosshair is read
  from a global preference via the goban configuration callbacks, so every goban
  instance picks it up with no per-goban plumbing. It is shown on the regular
  game/analysis/demo boards. It is **suppressed on `MiniGoban`** instances — the
  small game thumbnails in lists and the sample boards used inside the settings
  pages — where a full-board crosshair is just noise (e.g. it would otherwise
  appear on the "stone font scale" sample board). This uses a per-board opt-out
  flag (see `dont_draw_last_move_crosshair` below); the crosshair setting's own
  preview opts back in. Relative thickness (fraction of square size) keeps the
  remaining small boards from being overwhelmed.
- **Both renderers.** OGS ships a Canvas renderer (default) and an SVG renderer
  (fallback/option). Both are covered so the feature is consistent regardless of
  the user's renderer.
- **Relative thickness.** Thickness is a fraction of one square's size, so it
  scales with board size. Default `0.1`, range `0.02`–`0.4`.

## Two repositories

The board is rendered entirely by the `goban` engine, which lives in the git
submodule `submodules/goban` (separate repo `online-go/goban`). The crosshair
drawing must therefore live in the submodule's renderers, exposed through a
configuration callback that the main app fills in.

- **`goban` submodule:** callback API + Canvas/SVG rendering (Sections 1, 2, 3B).
- **Main repo (`online-go.com`):** preference keys, callback wiring, settings UI
  (Sections 3A, 3C, 3D).

Delivery is two coordinated PRs: the `goban` PR merges first, then the main repo
bumps the submodule pointer and adds the preference/UI wiring.

## Section 1 — Configuration flow (getter, not watcher)

The preference is plumbed as a **plain getter callback**, the same pattern used
by `getCoordinateDisplaySystem`, `getStoneFontScale`, and `getMoveTreeNumbering`
in `submodules/goban/src/Goban/callbacks.ts`. These getters are read at
draw/config time.

A watcher (`watchSelectedThemes`) is deliberately **not** used. Watchers exist
only for themes, which must update live on every open board. The requirement
here is weaker — "taken into account at the next draw" — so a getter is the
correct and simpler precedent:

- `getLastMoveCrosshair()` is read at each draw.
- "next display without reload": any newly mounted goban reads the preference at
  its first redraw. ✔
- "follows the last move on each move": each move triggers a (targeted) redraw,
  which re-reads the getter. ✔
- Boards already on screen take the new setting at their next natural redraw, not
  instantly — exactly matching the requirement, and avoiding watcher
  subscribe/destroy lifecycle and forced fan-out redraws.

```
preferences.ts (main repo)           configure-goban.tsx            goban submodule
 accessibility.last-move-             getLastMoveCrosshair()         callbacks.ts (1 getter)
   crosshair          (bool)   get()    => { enabled,        called   CanvasRenderer  /  SVGRenderer
 ...-crosshair-color  (str) <-------     color, thickness }  <------  read getter at draw, draw
 ...-crosshair-thickness(num)                                         crosshair UNDER last-move stone
```

A single getter returning `{ enabled, color, thickness }` (rather than three
separate getters) keeps the submodule API tidy.

## Section 2 — Rendering, per renderer

Each renderer has its own drawing code; the design follows the idiom already
present in each, rather than imposing a uniform approach.

### Canvas (`submodules/goban/src/Goban/CanvasRenderer.ts`) — dedicated under-stone canvas

The Canvas renderer draws the grid, stones, and marks all onto a single `board`
canvas (square-by-square), with no layer seam between grid and stones. An early
draft drew the crosshair as per-square segments inside `__drawSquare` (before
each stone) and invalidated the affected row/column via the `drawingHash` dirty
cache. That approach was abandoned: it produced a **visibly discontinuous line**
(anti-alias seams between per-square segments) and **left perpendicular residual
segments when navigating to the previous move** (invalidating the old cross
square-by-square was incomplete). Both are inherent to splitting one line across
many independently-drawn cells.

The board background (wood) is applied as **CSS on the parent element**
(`setTheme` copies `getBackgroundCSS()` onto `this.parent`), so the `board`
canvas is transparent everywhere except the grid/stones/marks. This makes a
dedicated canvas viable:

- Add a **dedicated `crosshair_layer` canvas**, inserted **before `board`** in the
  DOM (mirroring `shadow_layer`), at a z-index between the shadow layer (10) and
  the stone layer (20) — new variable `--z-goban-crosshair-layer: 15`. Because the
  stone canvas above it is transparent, the crosshair shows over the wood and
  **under the grid lines and stones** → "under the stone".
- Draw the horizontal and vertical lines as **two single strokes** spanning the
  board, clamped to the first/last intersection centres. One stroke each → no
  seams, perfectly continuous.
- `drawLastMoveCrosshair()` **clears the whole crosshair canvas and redraws** on
  every last-move change, so the previous cross is always fully erased (no
  residual segments) regardless of how moves/navigation are dispatched.
- Call it from `redraw()` (full redraws/resize), from the existing "clear last
  move" detection (live moves and navigation are targeted draws), and from the
  "draw last move" set block (covers the first move, which has no prior
  `last_move` to trigger the clear path).
- The canvas is **attached lazily** — only created the first time the crosshair
  is actually shown — so boards that never enable the setting pay nothing. It is
  resized alongside the other layers in `redraw`'s force-clear branch and removed
  in `destroy`.

This matches the SVG renderer's dedicated-layer approach below; the crosshair is
no longer part of `drawingHash`/`__drawSquare` at all.

### SVG (`submodules/goban/src/Goban/SVGRenderer.ts`)

The SVG renderer has real layers (`grid_layer`, `shadow_layer`, `pen_layer`,
`lines_layer`, ...) and per-intersection `GCell` `<g>` groups for stones. Adding
a dedicated layer is consistent with this renderer's conventions.

- Create a `crosshair_layer` (`<g>`) positioned **beneath the stone cells**
  (after `grid_layer`/`shadow_layer`, before the cell groups) so z-order gives
  "under the stone" for free.
- The layer holds **two `<line>` elements**: horizontal (left→right edge at the
  last move's `cy`) and vertical (top→bottom at `cx`).
- On each `redraw()` and on last-move change, reposition/rewrite the two lines,
  or clear the layer when there is no last move.

### Gating (both renderers)

The crosshair follows the same conditions as the existing last-move marker: a
last move is present with a stone, phase is `play` or `finished`, and
`!dont_draw_last_move`. No last move → no crosshair (empty board, etc.).

It is additionally gated on a new **per-board config flag
`dont_draw_last_move_crosshair`** (added to the goban config in `GobanBase`, read
into `InteractiveBase` like `dont_draw_last_move`). When set, the board never
draws the crosshair even if the global setting is on — but, unlike
`dont_draw_last_move`, it leaves the regular last-move marker intact. This is how
thumbnails and preview boards opt out (see 3D).

## Section 3 — Preferences and UI

### 3A. Preference keys — `src/lib/preferences.ts`

Add to the `defaults` object (disabled by default):

```ts
"accessibility.last-move-crosshair": false,
"accessibility.last-move-crosshair-color": "#1e6bff",
"accessibility.last-move-crosshair-thickness": 0.1, // fraction of a square's size
```

(Precedent: `accessibility.keyboard-coordinate-input` already exists.)

### 3B. goban callback API

- `submodules/goban/src/Goban/callbacks.ts`:
  ```ts
  getLastMoveCrosshair?: () => { enabled: boolean; color: string; thickness: number };
  ```
- `InteractiveBase.ts`: a protected getter reading `callbacks.getLastMoveCrosshair()`
  with fallback `{ enabled: false, color: "#1e6bff", thickness: 0.1 }`, mirroring
  `getStoneFontScale`. Both renderers call it at draw time.

### 3C. Wiring — `src/lib/configure-goban.tsx`

Add alongside the existing getters (`getStoneFontScale`, etc.):

```ts
getLastMoveCrosshair: () => ({
    enabled: preferences.get("accessibility.last-move-crosshair"),
    color: preferences.get("accessibility.last-move-crosshair-color"),
    thickness: preferences.get("accessibility.last-move-crosshair-thickness"),
}),
```

### 3D. Settings UI — `src/views/Settings/AccessibilityPreferences.tsx`

- New file, registered in `Settings.tsx`: add `{ key: "accessibility", label:
  _("Accessibility") }` to the tab list, a `case "accessibility":` in the switch,
  and the import.
- Content, built with `PreferenceLine` + `usePreference`:
  - `Toggle` to enable the crosshair.
  - **Shown only when enabled,** laid out as a row with the controls on the left
    and a live preview on the right: `<input type="color">` (color) and
    `<input type="range">` (thickness, min `0.02`, max `0.4`, step `0.01`), plus a
    small `MiniGoban` preview (5×5 board, last move at the centre with stones on
    its row/column). Native color/range inputs are the established idiom in
    `GamePreferences`, `ThemePreferences`, and `SoundPreferences`; the live preview
    mirrors the board-label-positioning setting.
  - The preview re-mounts via a `key` built from color+thickness so it reflects
    changes immediately, and passes `lastMoveCrosshair` to opt back into the
    crosshair (see next point).
- **`MiniGoban` suppresses the crosshair by default.** `MiniGoban` (game
  thumbnails in lists, and the sample boards inside settings pages) sets
  `dont_draw_last_move_crosshair: true` on its goban config, so the crosshair only
  appears on the regular large boards. A new `lastMoveCrosshair?: boolean` prop
  opts back in — used only by the crosshair setting's own preview.
- All user-visible strings translated via `pgettext` / `llm_pgettext`.
- Out of scope: the existing `accessibility.keyboard-coordinate-input` setting
  stays in `GamePreferences` for now; this section contains only the crosshair.
  It can be relocated later if desired.

## Testing

- **goban unit tests** (Jest, jsdom): assert the Canvas `crosshair_layer` canvas
  is attached (before the `board` canvas, so under the stones) when the setting is
  enabled and there is a last move, and is not attached when disabled or when
  `dont_draw_last_move` / `dont_draw_last_move_crosshair` is set. Likewise assert
  the SVG `crosshair_layer` contains two `<line>`s when enabled and none when
  disabled / `dont_draw_last_move` / `dont_draw_last_move_crosshair` / no last move.
- **Main repo**: `AccessibilityPreferences` renders the toggle, and color/thickness
  controls appear only when enabled.
- **Manual** (required by CONTRIBUTING): verify on desktop and mobile, on Canvas
  and SVG renderers, that the crosshair sits under the stone, spans the whole
  board, follows each move, scales with board size, and that toggling the setting
  applies to the next-drawn board without reload. Check thumbnails/lists are not
  overwhelmed.

## Non-goals

- No live refresh of boards already on screen at the moment the setting changes.
- The enable/color/thickness setting itself is global (one value per user); the
  only per-board control is the `dont_draw_last_move_crosshair` opt-out used by
  thumbnails/previews — there is no per-board color/thickness.
- No change to the existing last-move marker.
