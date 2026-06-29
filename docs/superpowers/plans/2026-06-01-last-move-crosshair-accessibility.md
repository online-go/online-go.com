# Last-move crosshair accessibility — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an opt-in accessibility setting that draws a high-contrast horizontal+vertical line through the last played stone (under the stone) on every goban, with user-configurable color and thickness.

**Architecture:** A single getter callback `getLastMoveCrosshair()` exposes the preference to the `goban` engine; both the Canvas and SVG renderers read it at draw time and draw the crosshair under the last-move stone. The main app declares the preference keys, fills the callback in `configure-goban.tsx`, and adds an Accessibility settings section. No watcher — the value is read at each draw, so it applies at a goban's next draw without reload.

**Tech Stack:** TypeScript, React 19, Jest (jsdom), the `goban` submodule (Canvas + SVG renderers), `usePreference` hook.

**Two repositories / two branches:**
- `submodules/goban` (repo `online-go/goban`) — branch `feature/last-move-crosshair`. Tasks 1–3.
- main repo `online-go.com` — branch `feature/last-move-crosshair-accessibility` (already created). Tasks 4–7.
- Tasks 1–3 must merge in `goban` first; Task 7 bumps the submodule pointer in the main repo.

**Shared data shape (used in every task):**
```ts
{ enabled: boolean; color: string; thickness: number }
// thickness is a fraction of one square's size; default 0.1, UI range 0.02–0.4
// color default "#1e6bff"
```

**Test commands:**
- goban: `cd submodules/goban && yarn jest test/unit_tests/<file> -t "<name>"`
- main: `yarn test <path> -t "<name>"`

---

## REPO A — `submodules/goban`

### Task 0: Branch the submodule

- [ ] **Step 1: Create the goban feature branch**

```bash
cd submodules/goban
git checkout -b feature/last-move-crosshair
git status   # expect: On branch feature/last-move-crosshair, clean
```

---

### Task 1: Callback API + InteractiveBase getter

**Files:**
- Modify: `submodules/goban/src/Goban/callbacks.ts:20-69` (add to `GobanCallbacks`)
- Modify: `submodules/goban/src/Goban/InteractiveBase.ts:499-505` (add getter near `getStoneFontScale`)
- Test: `submodules/goban/test/unit_tests/GobanCanvas.test.ts`

- [ ] **Step 1: Write the failing test**

Add at the end of `GobanCanvas.test.ts`:

```ts
describe("last-move crosshair callback", () => {
    afterEach(() => {
        delete (callbacks as any).getLastMoveCrosshair;
    });

    test("getLastMoveCrosshair falls back to disabled when no callback is set", () => {
        const goban = new GobanCanvas(basic3x3Config());
        expect((goban as any).getLastMoveCrosshair()).toEqual({
            enabled: false,
            color: "#1e6bff",
            thickness: 0.1,
        });
        goban.destroy();
    });

    test("getLastMoveCrosshair returns the callback value", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({
            enabled: true,
            color: "#00ff00",
            thickness: 0.2,
        });
        const goban = new GobanCanvas(basic3x3Config());
        expect((goban as any).getLastMoveCrosshair()).toEqual({
            enabled: true,
            color: "#00ff00",
            thickness: 0.2,
        });
        goban.destroy();
    });
});
```

Add `callbacks` to the existing import block at the top of the test file:

```ts
import { callbacks } from "../../src/Goban/callbacks";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts -t "last-move crosshair callback"`
Expected: FAIL — `getLastMoveCrosshair is not a function`.

- [ ] **Step 3: Add the callback to the interface**

In `callbacks.ts`, inside `interface GobanCallbacks` (after `getStoneFontScale?` on line 30):

```ts
    getLastMoveCrosshair?: () => { enabled: boolean; color: string; thickness: number };
```

- [ ] **Step 4: Add the getter in InteractiveBase**

In `InteractiveBase.ts`, immediately after the `getStoneFontScale()` method (ends at line 504):

```ts
    protected getLastMoveCrosshair(): { enabled: boolean; color: string; thickness: number } {
        if (callbacks.getLastMoveCrosshair) {
            return callbacks.getLastMoveCrosshair();
        }
        return { enabled: false, color: "#1e6bff", thickness: 0.1 };
    }
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts -t "last-move crosshair callback"`
Expected: PASS (both tests).

- [ ] **Step 6: Commit**

```bash
cd submodules/goban
git add src/Goban/callbacks.ts src/Goban/InteractiveBase.ts test/unit_tests/GobanCanvas.test.ts
git commit -m "feat: add getLastMoveCrosshair callback and getter"
```

---

### Task 2: Canvas rendering — dedicated under-stone canvas

**Files:**
- Modify: `submodules/goban/src/Goban/CanvasRenderer.ts` — new `crosshair_layer` canvas + `attachCrosshairLayer`/`detachCrosshairLayer`/`drawLastMoveCrosshair`, resize in `redraw`'s force-clear branch, calls from `redraw`/the "clear last move" block/the "draw last move" set block, detach in `destroy`
- Modify: `submodules/goban/src/Goban.css` — `.CrosshairLayer` rule
- Test: `submodules/goban/test/unit_tests/GobanCanvas.test.ts`

> **Why not per-cell.** The grid + stones + marks all render onto a single `board`
> canvas, with no seam between grid and stones. Drawing the crosshair as per-cell
> segments inside `__drawSquare` (the obvious "under the stone" hook) was tried and
> rejected: the line came out **discontinuous** (anti-alias seams between segments)
> and navigating to the previous move **left perpendicular residual segments**
> (square-by-square invalidation of the old cross was incomplete). Both are
> inherent to splitting one line across independently-drawn cells.
>
> Instead: the board background (wood) is CSS on `this.parent`, so the `board`
> canvas is transparent except for grid/stones/marks. A **dedicated crosshair
> canvas inserted behind `board`** (z-index between shadow=10 and stone=20) shows
> over the wood and under the grid/stones, and draws each line as a **single
> stroke**, cleared and redrawn wholesale on every last-move change. This matches
> the SVG dedicated-layer approach (Task 3) and removes all per-cell/`drawingHash`
> machinery.

- [ ] **Step 1: Write the failing tests (dedicated layer)**

Add to `GobanCanvas.test.ts` (`basicScorableBoardConfig()` ends with a last move, so the crosshair shows). The describe needs its own `board_div` setup.

```ts
describe("last-move crosshair (canvas layer)", () => {
    beforeEach(() => {
        board_div = document.createElement("div");
        document.body.appendChild(board_div);
    });
    afterEach(() => {
        delete (callbacks as any).getLastMoveCrosshair;
        board_div.remove();
    });

    test("attaches a dedicated crosshair canvas under the stones when enabled", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({ enabled: true, color: "#1e6bff", thickness: 0.1 });
        const goban = new GobanCanvas(basicScorableBoardConfig());
        goban.redraw(true);
        const layer = (goban as any).crosshair_layer as HTMLCanvasElement | undefined;
        expect(layer).toBeDefined();
        expect(layer?.className).toBe("CrosshairLayer");
        const board = (goban as any).board as HTMLCanvasElement;
        const children = Array.from(board.parentNode!.childNodes);
        expect(children.indexOf(layer as any)).toBeLessThan(children.indexOf(board));
        goban.destroy();
    });

    test("does not attach the crosshair canvas when disabled", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({ enabled: false, color: "#1e6bff", thickness: 0.1 });
        const goban = new GobanCanvas(basicScorableBoardConfig());
        goban.redraw(true);
        expect((goban as any).crosshair_layer).toBeUndefined();
        goban.destroy();
    });

    test("does not attach the crosshair canvas when dont_draw_last_move is set", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({ enabled: true, color: "#1e6bff", thickness: 0.1 });
        const goban = new GobanCanvas(basicScorableBoardConfig({ dont_draw_last_move: true }));
        goban.redraw(true);
        expect((goban as any).crosshair_layer).toBeUndefined();
        goban.destroy();
    });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts -t "canvas layer"`
Expected: FAIL — `crosshair_layer` is undefined when enabled.

- [ ] **Step 3: Add fields, attach/detach, and the draw method**

Add fields near `last_move_opacity`:

```ts
    private crosshair_layer?: HTMLCanvasElement;
    private crosshair_ctx?: CanvasRenderingContext2D;
```

Add `attachCrosshairLayer()` (mirror `attachShadowLayer`, but `id="crosshair-canvas"`, `className="CrosshairLayer"`, and `this.parent.insertBefore(this.crosshair_layer, this.board)` so it sits **behind** the stone canvas) and `detachCrosshairLayer()` (mirror `detachShadowLayer`). Then add the draw method:

```ts
    private drawLastMoveCrosshair(): void {
        const ch = this.getLastMoveCrosshair();
        const cur = this.engine?.cur_move;
        const shows =
            ch.enabled && !this.dont_draw_last_move && !!cur &&
            cur.x >= 0 && cur.y >= 0 &&
            (this.engine.phase === "play" || this.engine.phase === "finished");
        if (!shows) {
            if (this.crosshair_ctx && this.crosshair_layer) {
                this.crosshair_ctx.clearRect(0, 0, this.crosshair_layer.width, this.crosshair_layer.height);
            }
            return;
        }
        this.attachCrosshairLayer();
        if (!this.crosshair_ctx || !this.crosshair_layer) { return; }
        const ctx = this.crosshair_ctx;
        ctx.clearRect(0, 0, this.crosshair_layer.width, this.crosshair_layer.height);
        const s = this.square_size;
        let ox = this.draw_left_labels ? s : 0;
        let oy = this.draw_top_labels ? s : 0;
        if (this.bounds.left > 0) { ox = -s * this.bounds.left; }
        if (this.bounds.top > 0) { oy = -s * this.bounds.top; }
        const mid = this.metrics.mid;
        const cx = ox + cur.x * s + mid;
        const cy = oy + cur.y * s + mid;
        const x0 = ox + mid, x1 = ox + (this.width - 1) * s + mid;
        const y0 = oy + mid, y1 = oy + (this.height - 1) * s + mid;
        ctx.save();
        ctx.strokeStyle = ch.color;
        ctx.lineWidth = Math.max(1, s * ch.thickness);
        ctx.beginPath();
        ctx.moveTo(x0, cy); ctx.lineTo(x1, cy);
        ctx.moveTo(cx, y0); ctx.lineTo(cx, y1);
        ctx.stroke();
        ctx.restore();
    }
```

- [ ] **Step 4: Wire up the calls**

- In `redraw`'s force-clear branch, next to the `shadow_layer` resize, resize `crosshair_layer` the same way (re-fetch `crosshair_ctx`).
- At the end of `redraw()` (after `drawPenMarks`, before `move_tree_redraw`): `this.drawLastMoveCrosshair();`
- In the "clear last move" block (`if (this.last_move && … !is(cur_move))`), after `this.drawSquare(m.x, m.y);`, add `this.drawLastMoveCrosshair();` (live moves / navigation).
- In the "draw last move" set block, after `this.last_move = this.engine.cur_move;`, add `this.drawLastMoveCrosshair();` (covers the first move).
- In `destroy`, after `this.detachShadowLayer();`, add `this.detachCrosshairLayer();`.

- [ ] **Step 5: Add the CSS layer**

In `submodules/goban/src/Goban.css`, after `.ShadowLayer`:

```css
    .CrosshairLayer {
        position: absolute;
        z-index: var(--z-goban-crosshair-layer, 15);
        left: 0;
        right: 0;
    }
```

(The `--z-goban-crosshair-layer: 15` variable is added in the main repo in Task 4-adjacent CSS; the literal `15` fallback keeps the submodule self-contained.)

- [ ] **Step 6: Run tests + lint + format**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts && yarn eslint src/Goban/CanvasRenderer.ts && yarn prettier --check src/Goban/CanvasRenderer.ts src/Goban.css`
Expected: PASS / clean. (Canvas pixels aren't asserted; the layer attach/position assertions plus manual testing cover the drawing.)

- [ ] **Step 7: Commit**

```bash
cd submodules/goban
git add src/Goban/CanvasRenderer.ts src/Goban.css test/unit_tests/GobanCanvas.test.ts
git commit -m "feat(canvas): draw last-move crosshair on a dedicated under-stone canvas"
```

---

### Task 3: SVG rendering — dedicated crosshair layer

**Files:**
- Modify: `submodules/goban/src/Goban/SVGRenderer.ts` — layer field (~138-144), layer creation (mirror `lines_layer` at ~3597-3651), `redraw()` (~3884), and the last-move-change hook (SVG analog of the canvas erase)
- Test: `submodules/goban/test/unit_tests/GobanSVG.test.ts`

SVG has a clean layer seam: `lines_layer` (grid lines) and `grid_layer` (per-cell stones/marks) are separate. A `crosshair_layer` inserted **after `lines_layer` and before `grid_layer`** renders over the grid and under the stones. The layer holds two `<line>` elements, rebuilt whenever the board redraws or the last move changes.

- [ ] **Step 1: Inspect the SVG test setup and layer creation**

Read the top of `test/unit_tests/GobanSVG.test.ts` for its `config`/constructor helper (mirrors `GobanCanvas.test.ts`), and read `SVGRenderer.ts:3590-3655` to copy the exact `lines_layer` creation/insertion idiom (element namespace, `setAttribute`, `appendChild`/`insertBefore`). Use the same idiom for `crosshair_layer`.

- [ ] **Step 2: Write the failing test**

Add to `GobanSVG.test.ts` (use that file's existing board-construction helper; the name mirrors `basicScorableBoardConfig` — confirm in Step 1 and adjust the call below to match). The helper plays moves ending at `[2,1]`, so there is a last move.

```ts
describe("last-move crosshair (SVG)", () => {
    afterEach(() => {
        delete (callbacks as any).getLastMoveCrosshair;
    });

    test("draws two crosshair lines when enabled", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({
            enabled: true,
            color: "#1e6bff",
            thickness: 0.1,
        });
        const goban = new GobanSVG(basicScorableBoardConfig());
        goban.redraw(true);
        const layer = (goban as any).crosshair_layer as SVGGraphicsElement;
        expect(layer.querySelectorAll("line").length).toBe(2);
        goban.destroy();
    });

    test("draws no crosshair lines when disabled", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({
            enabled: false,
            color: "#1e6bff",
            thickness: 0.1,
        });
        const goban = new GobanSVG(basicScorableBoardConfig());
        goban.redraw(true);
        const layer = (goban as any).crosshair_layer as SVGGraphicsElement | undefined;
        expect(layer?.querySelectorAll("line").length ?? 0).toBe(0);
        goban.destroy();
    });
});
```

Ensure `callbacks` is imported in the SVG test file:

```ts
import { callbacks } from "../../src/Goban/callbacks";
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanSVG.test.ts -t "last-move crosshair"`
Expected: FAIL — `crosshair_layer` is undefined / no lines.

- [ ] **Step 4: Declare the layer field**

In `SVGRenderer.ts`, near the other layer fields (~line 138):

```ts
    private crosshair_layer?: SVGGraphicsElement;
```

- [ ] **Step 5: Create the layer and an update method**

Where `lines_layer` is created and appended (use the exact idiom found in Step 1, ~line 3630-3651), create `crosshair_layer` right after and insert it before `grid_layer` so it sits over the grid and under stones. Then add an update method (place it near the layer-drawing methods):

```ts
    private updateLastMoveCrosshair(): void {
        if (!this.crosshair_layer) {
            return;
        }
        this.crosshair_layer.innerHTML = "";
        if (!this.engine || !this.engine.cur_move) {
            return;
        }
        const cm = this.engine.cur_move;
        const playing = this.engine.phase === "play" || this.engine.phase === "finished";
        if (!playing || cm.x < 0 || cm.y < 0) {
            return;
        }
        const ch = this.getLastMoveCrosshair();
        if (!ch.enabled) {
            return;
        }
        const s = this.square_size;
        const ox = this.draw_left_labels ? s : 0;
        const oy = this.draw_top_labels ? s : 0;
        const cx = ox + cm.x * s + this.metrics.mid;
        const cy = oy + cm.y * s + this.metrics.mid;
        const lw = Math.max(1, s * ch.thickness);
        const mk = (x1: number, y1: number, x2: number, y2: number) => {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", x1.toString());
            line.setAttribute("y1", y1.toString());
            line.setAttribute("x2", x2.toString());
            line.setAttribute("y2", y2.toString());
            line.setAttribute("stroke", ch.color);
            line.setAttribute("stroke-width", lw.toString());
            this.crosshair_layer!.appendChild(line);
        };
        // horizontal: full board width at cy
        mk(ox, cy, ox + this.width * s, cy);
        // vertical: full board height at cx
        mk(cx, oy, cx, oy + this.height * s);
    }
```

> Verify `draw_left_labels`/`draw_top_labels` and `this.metrics.mid` against the SVG layout offsets used in `__drawSquare`/`cellDraw` (~lines 2070-2088). Adjust `ox`/`oy` to match exactly how the SVG renderer offsets the grid, so the lines align with intersections.

- [ ] **Step 6: Call the update from `redraw()` and on last-move change**

In `redraw()` (~line 3884), after the cells/grid have been laid out, call `this.updateLastMoveCrosshair();`. Also call it from the SVG last-move-change handler (the analog of the canvas erase — search for where SVG deletes/redraws the previous last-move marker; if the SVG path simply redraws on update, the `redraw()` call suffices). Keep behavior unchanged when the feature is disabled (the method early-returns and clears the layer).

- [ ] **Step 7: Run test to verify it passes**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanSVG.test.ts -t "last-move crosshair"`
Expected: PASS (both).

- [ ] **Step 8: Verify no regressions + lint**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanSVG.test.ts && yarn lint && yarn prettier:check`
Expected: PASS / clean.

- [ ] **Step 9: Commit and push the goban branch**

```bash
cd submodules/goban
git add src/Goban/SVGRenderer.ts test/unit_tests/GobanSVG.test.ts
git commit -m "feat(svg): draw last-move crosshair in a dedicated layer under stones"
git push -u origin feature/last-move-crosshair
```

> Open the `goban` PR. The remaining main-repo tasks depend on this branch being available; Task 7 pins the submodule to the merged commit.

---

## REPO B — main repo (`online-go.com`)

Branch `feature/last-move-crosshair-accessibility` already exists and holds the design + this plan.

### Task 4: Preference keys

**Files:**
- Modify: `src/lib/preferences.ts` (the `defaults` object, near line 49 next to `accessibility.keyboard-coordinate-input`)
- Test: `src/lib/preferences.test.ts` (create if absent)

- [ ] **Step 1: Write the failing test**

Create/append `src/lib/preferences.test.ts`:

```ts
import * as preferences from "@/lib/preferences";

describe("last-move crosshair preferences", () => {
    test("defaults are disabled, blue, thickness 0.1", () => {
        expect(preferences.get("accessibility.last-move-crosshair")).toBe(false);
        expect(preferences.get("accessibility.last-move-crosshair-color")).toBe("#1e6bff");
        expect(preferences.get("accessibility.last-move-crosshair-thickness")).toBe(0.1);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/lib/preferences.test.ts -t "last-move crosshair preferences"`
Expected: FAIL — keys not in `defaults` (TypeScript error on the key, or `undefined` returned).

- [ ] **Step 3: Add the keys**

In `src/lib/preferences.ts`, inside `defaults`, directly after `"accessibility.keyboard-coordinate-input": false,`:

```ts
    "accessibility.last-move-crosshair": false,
    "accessibility.last-move-crosshair-color": "#1e6bff",
    "accessibility.last-move-crosshair-thickness": 0.1,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn test src/lib/preferences.test.ts -t "last-move crosshair preferences"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/preferences.ts src/lib/preferences.test.ts
git commit -m "feat: add last-move crosshair accessibility preferences"
```

---

### Task 5: Wire the callback in configure-goban

**Files:**
- Modify: `src/lib/configure-goban.tsx` (near `getStoneFontScale`, ~line 110)

- [ ] **Step 1: Add the callback**

In `src/lib/configure-goban.tsx`, in the callbacks object after `getStoneFontScale: (): number => preferences.get("stone-font-scale"),` (line 110):

```ts
        getLastMoveCrosshair: (): { enabled: boolean; color: string; thickness: number } => ({
            enabled: preferences.get("accessibility.last-move-crosshair"),
            color: preferences.get("accessibility.last-move-crosshair-color"),
            thickness: preferences.get("accessibility.last-move-crosshair-thickness"),
        }),
```

- [ ] **Step 2: Type-check**

Run: `yarn type-check`
Expected: clean (requires the goban submodule on the `feature/last-move-crosshair` branch so the callback type exists; check out that branch in `submodules/goban` if not already).

- [ ] **Step 3: Commit**

```bash
git add src/lib/configure-goban.tsx
git commit -m "feat: wire getLastMoveCrosshair preference into goban config"
```

---

### Task 6: Accessibility settings section

**Files:**
- Create: `src/views/Settings/AccessibilityPreferences.tsx`
- Create: `src/views/Settings/AccessibilityPreferences.css`
- Modify: `src/views/Settings/Settings.tsx` (import ~line 55, tab list ~line 144, switch ~line 205)
- Test: `src/views/Settings/AccessibilityPreferences.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/views/Settings/AccessibilityPreferences.test.tsx`:

```tsx
import * as React from "react";
import { render, screen } from "@testing-library/react";
import * as preferences from "@/lib/preferences";
import { AccessibilityPreferences } from "./AccessibilityPreferences";

describe("AccessibilityPreferences", () => {
    test("color and thickness controls are hidden when the crosshair is disabled", () => {
        preferences.set("accessibility.last-move-crosshair", false);
        const { container } = render(<AccessibilityPreferences state={{}} />);
        expect(container.querySelector('input[type="color"]')).toBeNull();
        expect(container.querySelector('input[type="range"]')).toBeNull();
    });

    test("color and thickness controls are shown when the crosshair is enabled", () => {
        preferences.set("accessibility.last-move-crosshair", true);
        const { container } = render(<AccessibilityPreferences state={{}} />);
        expect(container.querySelector('input[type="color"]')).not.toBeNull();
        expect(container.querySelector('input[type="range"]')).not.toBeNull();
        preferences.set("accessibility.last-move-crosshair", false);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn test src/views/Settings/AccessibilityPreferences.test.tsx`
Expected: FAIL — module `./AccessibilityPreferences` not found.

- [ ] **Step 3: Create the component**

Create `src/views/Settings/AccessibilityPreferences.tsx`:

```tsx
/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";

import { llm_pgettext } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import { Toggle } from "@/components/Toggle";
import { PreferenceLine } from "@/lib/SettingsCommon";
import { SettingGroupPageProps } from "@/lib/SettingsCommon";

import "./AccessibilityPreferences.css";

export function AccessibilityPreferences(_props: SettingGroupPageProps): React.ReactElement {
    const [crosshair, setCrosshair] = usePreference("accessibility.last-move-crosshair");
    const [color, setColor] = usePreference("accessibility.last-move-crosshair-color");
    const [thickness, setThickness] = usePreference("accessibility.last-move-crosshair-thickness");

    return (
        <div className="AccessibilityPreferences">
            <PreferenceLine
                title={llm_pgettext(
                    "Accessibility setting that highlights the last move with crossed lines",
                    "Highlight the last move with a crosshair",
                )}
                description={llm_pgettext(
                    "Description of the last-move crosshair accessibility setting",
                    "Draws a high-contrast horizontal and vertical line through the last played stone on every board, to make it easy to find.",
                )}
            >
                <Toggle checked={crosshair} onChange={setCrosshair} />
            </PreferenceLine>

            {crosshair && (
                <>
                    <PreferenceLine
                        title={llm_pgettext("Crosshair line color", "Crosshair color")}
                    >
                        <input
                            type="color"
                            value={color}
                            onChange={(ev) => setColor(ev.target.value)}
                        />
                    </PreferenceLine>
                    <PreferenceLine
                        title={llm_pgettext("Crosshair line thickness", "Crosshair thickness")}
                    >
                        <input
                            type="range"
                            value={thickness}
                            min={0.02}
                            max={0.4}
                            step={0.01}
                            onChange={(ev) => setThickness(parseFloat(ev.target.value))}
                        />
                    </PreferenceLine>
                </>
            )}
        </div>
    );
}
```

- [ ] **Step 4: Create the CSS file**

Create `src/views/Settings/AccessibilityPreferences.css`:

```css
.AccessibilityPreferences {
    input[type="color"] {
        height: 2rem;
        width: 3rem;
    }
}
```

- [ ] **Step 5: Register the section in Settings.tsx**

Add the import after line 55 (`import { HomeScreenPreferences } ...`):

```ts
import { AccessibilityPreferences } from "./AccessibilityPreferences";
```

Add to the `groups` array (after the `game` entry, ~line 117):

```ts
        { key: "accessibility", label: _("Accessibility") },
```

Add to the `switch (selected)` (after the `game` case, ~line 168):

```ts
        case "accessibility":
            SelectedPage = AccessibilityPreferences;
            break;
```

- [ ] **Step 6: Run test to verify it passes**

Run: `yarn test src/views/Settings/AccessibilityPreferences.test.tsx`
Expected: PASS (both).

- [ ] **Step 7: Commit**

```bash
git add src/views/Settings/AccessibilityPreferences.tsx src/views/Settings/AccessibilityPreferences.css src/views/Settings/AccessibilityPreferences.test.tsx src/views/Settings/Settings.tsx
git commit -m "feat: add Accessibility settings section with last-move crosshair controls"
```

---

### Task 7: Submodule bump + full verification

**Files:**
- Modify: `submodules/goban` pointer (after the goban PR merges)

- [ ] **Step 1: Point the submodule at the merged goban commit**

After the `goban` PR merges to its main branch:

```bash
cd submodules/goban
git fetch origin
git checkout <merged-goban-main-branch>
git pull
cd ../..
git add submodules/goban
git commit -m "chore: bump goban submodule for last-move crosshair"
```

- [ ] **Step 2: Add the z-index variable**

In `src/global_styl/01_variables.css`, in the `/* Z-indices */` group, add between the shadow and stone layers:

```css
    --z-goban-crosshair-layer: 15;
```

- [ ] **Step 3: Type-check, lint, format, build**

Run, in the main repo:

```bash
yarn type-check
yarn lint
yarn prettier:file src/lib/preferences.ts src/lib/configure-goban.tsx src/views/Settings/AccessibilityPreferences.tsx src/views/Settings/Settings.tsx src/lib/preferences.test.ts src/views/Settings/AccessibilityPreferences.test.tsx
yarn prettier:check src/global_styl/01_variables.css
yarn build
```

Expected: all clean / build succeeds.

- [ ] **Step 4: Run the full unit suites**

```bash
yarn test
cd submodules/goban && yarn jest && cd ../..
```

Expected: PASS.

- [ ] **Step 5: Manual testing (required by CONTRIBUTING.md)**

Verify in desktop and mobile browsers, on both Canvas and SVG renderers (Settings → Themes & Visuals to switch, or the `experiments.canvas` data flag):
- Enable the crosshair in Settings → Accessibility; open a game — lines pass through the last stone, under it, across the whole board.
- Play/navigate moves — the crosshair follows each move and the old one is erased.
- Change color and thickness — applied on the next-drawn board (e.g., navigate a move) without reload.
- Lines scale with board size; thumbnails/lists are not overwhelmed.
- Disabled by default for a fresh account.

- [ ] **Step 6: Push and open the main-repo PR**

```bash
git push -u origin feature/last-move-crosshair-accessibility
```

Open the PR using `.github/pull_request_template.md`. Note the dependency on the merged `goban` PR and the submodule bump.

---

## Refinements (added after the initial implementation)

These were added in response to review feedback; do them before Task 7's final verification.

### Task 8: Live preview in the settings

**Files:** `src/views/Settings/AccessibilityPreferences.tsx` (+ `.css`, `.test.tsx`)

Mirror the board-label-positioning setting's live preview. When the crosshair is
enabled, render a row with the color/thickness controls on the left and a small
`MiniGoban` on the right (no "Preview" label — placing it below the color input
let the native color popup cover it):

```tsx
const crosshair_sample_board: GobanEngineConfig = {
    width: 5, height: 5,
    moves: [ { x: 0, y: 2 }, { x: 4, y: 2 }, { x: 2, y: 4 }, { x: 2, y: 2 } ], // last move centred
};
// …inside the enabled block:
<div className="crosshair-options">
    <div className="crosshair-controls">{/* color + thickness PreferenceLines */}</div>
    <MiniGoban
        className="crosshair-preview"
        key={`${color}-${thickness}`}   // re-mount so the board reads the new pref
        json={crosshair_sample_board}
        noLink={true} width={5} height={5} displayWidth={150}
        labels_positioning={"none"}
        lastMoveCrosshair={true}         // opt in (see Task 9)
    />
</div>
```

CSS: `.crosshair-options { display:flex; align-items:flex-start; gap:1.5rem; flex-wrap:wrap; }`,
`.crosshair-controls { flex:1 1 20rem; }`, `.MiniGoban.crosshair-preview { width:150px; height:150px; }`.
In the unit test, `jest.mock("@/components/MiniGoban", …)` so the controls assertions don't spin up a real board.

### Task 9: Suppress the crosshair on thumbnails/preview boards

The crosshair is read from a global preference, so it also appears on small
`MiniGoban` boards — game thumbnails in lists and the sample boards inside the
settings pages (e.g. the stone-font-scale sample). Suppress it there.

**goban submodule** (`feature/last-move-crosshair`):
- Add config field `dont_draw_last_move_crosshair?: boolean` to `GobanBase` config,
  read it into `InteractiveBase` (`this.dont_draw_last_move_crosshair = !!config.dont_draw_last_move_crosshair;`).
- Gate the crosshair on `!this.dont_draw_last_move_crosshair` in **both** renderers
  (Canvas `drawLastMoveCrosshair`, SVG `updateLastMoveCrosshair`). Unlike
  `dont_draw_last_move`, this leaves the regular last-move marker intact.
- Tests: with the flag set, the Canvas `crosshair_layer` is not attached and the
  SVG `crosshair_layer` has no lines (even with the feature enabled).

**Main repo** (`feature/last-move-crosshair-accessibility`):
- `MiniGoban.tsx`: add `dont_draw_last_move_crosshair: !props.lastMoveCrosshair` to
  the `GobanController` config (suppress by default) and a `lastMoveCrosshair?: boolean`
  prop. The crosshair setting's preview (Task 8) passes `lastMoveCrosshair={true}`.

Net effect: crosshair on regular game/analysis/demo boards only; off on thumbnails
and setting previews; on in the crosshair setting's own preview.

---

## Self-review notes

- **Spec coverage:** settings section (Task 6), disabled-by-default (Task 4), color `#1e6bff` (Tasks 1/3/4), under-stone (Task 2 dedicated canvas behind the transparent stone layer; Task 3 layer order), follows last move (Task 2 calls from the last-move blocks; Task 3 step 6), scope = real boards but not thumbnails/previews (global callback in Task 5 + per-board `dont_draw_last_move_crosshair` opt-out in Task 9), persistent + next-draw-no-reload (getter design, Tasks 1/5), color picker + thickness slider + live preview (Tasks 6, 8), both renderers (Tasks 2 & 3), relative thickness (Tasks 2/3/4/6).
- **Both renderers use a dedicated layer.** Canvas draws on its own under-stone canvas (Task 2); SVG on a dedicated `<g>` (Task 3). Each is cleared and redrawn wholesale on a last-move change, so the line is continuous and the previous cross is fully erased (no per-cell seams, no residual perpendicular segments on navigation). An earlier per-cell/`drawingHash` Canvas draft exhibited both defects and was replaced.
- **Type consistency:** the shape `{ enabled: boolean; color: string; thickness: number }` and the callback/method name `getLastMoveCrosshair` are used identically across all tasks.
- **Z-index variable:** `--z-goban-crosshair-layer: 15` is added to `src/global_styl/01_variables.css` (main repo); the submodule CSS uses a literal `15` fallback so it works standalone.
