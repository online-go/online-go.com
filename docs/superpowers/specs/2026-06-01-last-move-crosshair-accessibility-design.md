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

- **All gobans.** This is the simplest option, not a wider one: the crosshair is
  read from a global preference via the goban configuration callbacks, so every
  goban instance picks it up with no per-goban plumbing. Restricting to
  "interactive boards only" would require an extra per-goban flag and is more
  work. Relative thickness (fraction of square size) keeps small thumbnails from
  being overwhelmed.
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

### Canvas (`submodules/goban/src/Goban/CanvasRenderer.ts`)

The Canvas renderer uses a single canvas drawn square-by-square; there is no
global layer seam (a square's background, grid, and stone are painted together).
The crosshair is therefore drawn **inside `__drawSquare`**, after the grid/star
points and **before the stone** (~line 1470), so the stone painted afterward
covers the center → "under the stone". Stones on the same row/column are likewise
drawn after their square's crosshair segment, so the full lines pass under them
and read as continuous highlighted lines.

For each square: if the feature is enabled and a last move exists, draw the
horizontal segment across the square at `cy` when `j === cur_move.y`, and the
vertical segment at `cx` when `i === cur_move.x`. Adjacent segments join into
full lines.

**Invalidation follows the coded convention** — the hash-guarded dirty cache, not
a full redraw:

- `drawSquare(i,j)` repaints only when `__draw_state[j][i] !== drawingHash(i,j)`
  (line 1240); the hash is written back at line 2273.
- `drawingHash(i,j)` encodes everything affecting a square's appearance; the last
  move already contributes `"last_move,"` (line 2688).
- The crosshair must contribute to `drawingHash(i,j)`: when enabled and
  (`i === cur_move.x` || `j === cur_move.y`), append `"crosshair," + color +
  thickness`. This makes every square on the last-move row/column hash
  differently, and re-hash when the last move moves or the color/thickness/enable
  state changes — so the dirty cache invalidates exactly the right squares.
- On a last-move change, invalidate the affected region by calling `drawSquare`
  over the **old row+column** (erase) and **new row+column** (draw), extending
  the existing single-square erase at lines 2178-2182. The hash guard skips
  unchanged squares, so this stays targeted and efficient — matching how the
  codebase already invalidates (targeted `drawSquare`, never a full `redraw()` on
  a move).

**Implementation concern for the plan:** the last-move-change detection at line
2178 runs inside `__drawSquare`; the existing code already calls
`this.drawSquare(m.x, m.y)` from there. Extending this to a row/column loop must
avoid re-entering the square currently being drawn (whose hash has not yet been
written at line 2273) to prevent recursion. Resolve the exact, non-reentrant hook
during implementation.

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
  - **Shown only when enabled:** `<input type="color">` (color) and
    `<input type="range">` (thickness, min `0.02`, max `0.4`, step `0.01`).
    Native color/range inputs are the established idiom in `GamePreferences`,
    `ThemePreferences`, and `SoundPreferences`.
- All user-visible strings translated via `pgettext` / `llm_pgettext`.
- Out of scope: the existing `accessibility.keyboard-coordinate-input` setting
  stays in `GamePreferences` for now; this section contains only the crosshair.
  It can be relocated later if desired.

## Testing

- **goban unit tests** (Jest, jsdom): a `drawingHash` test asserting the
  crosshair token appears for squares on the last-move row/column when enabled and
  is absent when disabled or off-row/column. Sanity test that the SVG crosshair
  layer contains two lines when enabled and is empty when disabled / no last move.
- **Main repo**: `AccessibilityPreferences` renders the toggle, and color/thickness
  controls appear only when enabled.
- **Manual** (required by CONTRIBUTING): verify on desktop and mobile, on Canvas
  and SVG renderers, that the crosshair sits under the stone, spans the whole
  board, follows each move, scales with board size, and that toggling the setting
  applies to the next-drawn board without reload. Check thumbnails/lists are not
  overwhelmed.

## Non-goals

- No live refresh of boards already on screen at the moment the setting changes.
- No per-board override; the setting is global.
- No change to the existing last-move marker.
