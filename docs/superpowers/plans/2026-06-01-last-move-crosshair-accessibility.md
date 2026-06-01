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

### Task 2: Canvas rendering — drawingHash + draw segments + invalidation

**Files:**
- Modify: `submodules/goban/src/Goban/CanvasRenderer.ts` — `drawingHash` (~2275, last-move block ~2680-2693), `__drawSquare` (insert after star points ~1470, before stone ~1500), last-move-change block (~2178-2182)
- Test: `submodules/goban/test/unit_tests/GobanCanvas.test.ts`

The crosshair must appear in `drawingHash` so the dirty cache (`__draw_state`) invalidates the right squares, then be painted in `__drawSquare` before the stone, and finally have its old/new row+column invalidated on a last-move change.

- [ ] **Step 1: Write the failing test (drawingHash contribution)**

Add to `GobanCanvas.test.ts`. `basicScorableBoardConfig()` plays moves ending at `[2,1]`, so the current last move is column 2, row 1.

```ts
describe("last-move crosshair drawingHash", () => {
    afterEach(() => {
        delete (callbacks as any).getLastMoveCrosshair;
    });

    function crosshairBoard() {
        (callbacks as any).getLastMoveCrosshair = () => ({
            enabled: true,
            color: "#1e6bff",
            thickness: 0.1,
        });
        // last move is at column 2, row 1 (see basicScorableBoardConfig moves)
        return new GobanCanvas(basicScorableBoardConfig());
    }

    test("squares on the last-move row or column include the crosshair token", () => {
        const goban = crosshairBoard();
        // same row (j === 1): column 0
        expect((goban as any).drawingHash(0, 1)).toContain("crosshair");
        // same column (i === 2): row 0
        expect((goban as any).drawingHash(2, 0)).toContain("crosshair");
        goban.destroy();
    });

    test("squares off the row and column do not include the crosshair token", () => {
        const goban = crosshairBoard();
        // i !== 2 and j !== 1
        expect((goban as any).drawingHash(0, 0)).not.toContain("crosshair");
        goban.destroy();
    });

    test("no crosshair token when the feature is disabled", () => {
        (callbacks as any).getLastMoveCrosshair = () => ({
            enabled: false,
            color: "#1e6bff",
            thickness: 0.1,
        });
        const goban = new GobanCanvas(basicScorableBoardConfig());
        expect((goban as any).drawingHash(0, 1)).not.toContain("crosshair");
        goban.destroy();
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts -t "last-move crosshair drawingHash"`
Expected: FAIL — hashes do not contain `"crosshair"`.

- [ ] **Step 3: Add crosshair contribution to `drawingHash`**

In `CanvasRenderer.ts`, inside `drawingHash(i, j)`, immediately after the existing "Draw last move" block (after line 2693, before the next section):

```ts
        /* Last-move crosshair */
        if (this.engine && this.engine.cur_move) {
            const cm = this.engine.cur_move;
            const on_cross = (cm.x === i || cm.y === j) && cm.x >= 0 && cm.y >= 0;
            if (on_cross && (this.engine.phase === "play" || this.engine.phase === "finished")) {
                const ch = this.getLastMoveCrosshair();
                if (ch.enabled) {
                    ret += "crosshair " + ch.color + " " + ch.thickness + ",";
                }
            }
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts -t "last-move crosshair drawingHash"`
Expected: PASS (all three).

- [ ] **Step 5: Commit**

```bash
cd submodules/goban
git add src/Goban/CanvasRenderer.ts test/unit_tests/GobanCanvas.test.ts
git commit -m "feat(canvas): include last-move crosshair in drawingHash"
```

- [ ] **Step 6: Paint the crosshair segments in `__drawSquare`**

In `__drawSquare`, after the star-point drawing block (~line 1469) and **before** the stone-drawing block (~line 1500), add. `cx`/`cy` are already computed at lines 1364-1365 (`cx = l + this.metrics.mid`, `cy = t + this.metrics.mid`); `s = this.square_size` is set at line 1255.

```ts
            /* Last-move crosshair — drawn before the stone so the stone covers the center */
            if (this.engine && this.engine.cur_move) {
                const cm = this.engine.cur_move;
                const playing = this.engine.phase === "play" || this.engine.phase === "finished";
                if (playing && cm.x >= 0 && cm.y >= 0 && (cm.x === i || cm.y === j)) {
                    const ch = this.getLastMoveCrosshair();
                    if (ch.enabled) {
                        const lw = Math.max(1, s * ch.thickness);
                        ctx.save();
                        ctx.strokeStyle = ch.color;
                        ctx.lineWidth = lw;
                        ctx.beginPath();
                        if (cm.y === j) {
                            // horizontal segment spanning this square at cy
                            ctx.moveTo(cx - this.metrics.mid, cy);
                            ctx.lineTo(cx + this.metrics.mid, cy);
                        }
                        if (cm.x === i) {
                            // vertical segment spanning this square at cx
                            ctx.moveTo(cx, cy - this.metrics.mid);
                            ctx.lineTo(cx, cy + this.metrics.mid);
                        }
                        ctx.stroke();
                        ctx.restore();
                    }
                }
            }
```

- [ ] **Step 7: Invalidate old + new row/column on last-move change**

Replace the existing single-square erase at lines 2178-2182:

```ts
        if (this.last_move && this.engine && !this.last_move.is(this.engine.cur_move)) {
            const m = this.last_move;
            delete this.last_move;
            this.drawSquare(m.x, m.y);
        }
```

with a version that, when the crosshair is on, also redraws the old move's row and column (the new move's row/column are picked up by the surrounding redraw of the new square plus the hash change; the explicit invalidation here erases the old crosshair). Skip `(i, j)` — the square currently being drawn — to avoid re-entering this `__drawSquare` call before its hash is written (line 2273):

```ts
        if (this.last_move && this.engine && !this.last_move.is(this.engine.cur_move)) {
            const m = this.last_move;
            delete this.last_move;
            this.drawSquare(m.x, m.y);
            if (this.getLastMoveCrosshair().enabled && m.x >= 0 && m.y >= 0) {
                for (let k = 0; k < this.width; ++k) {
                    if (!(k === i && m.y === j)) {
                        this.drawSquare(k, m.y); // old row
                    }
                    if (!(m.x === i && k === j)) {
                        this.drawSquare(m.x, k); // old column
                    }
                }
            }
        }
```

> Note: `drawSquare` is hash-guarded (line 1240), so squares whose appearance did not change are skipped — this stays targeted, matching how the renderer already invalidates. A full `redraw()` is intentionally NOT used.

- [ ] **Step 8: Verify no regressions in the canvas suite**

Run: `cd submodules/goban && yarn jest test/unit_tests/GobanCanvas.test.ts`
Expected: PASS (whole file). The drawing steps have no direct unit assertion (canvas pixels are not asserted in this suite); they are covered by the drawingHash tests plus manual testing.

- [ ] **Step 9: Commit**

```bash
cd submodules/goban
git add src/Goban/CanvasRenderer.ts
git commit -m "feat(canvas): draw last-move crosshair under the stone with targeted invalidation"
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

- [ ] **Step 2: Type-check, lint, format, build**

Run, in the main repo:

```bash
yarn type-check
yarn lint
yarn prettier:file src/lib/preferences.ts src/lib/configure-goban.tsx src/views/Settings/AccessibilityPreferences.tsx src/views/Settings/Settings.tsx src/lib/preferences.test.ts src/views/Settings/AccessibilityPreferences.test.tsx
yarn build
```

Expected: all clean / build succeeds.

- [ ] **Step 3: Run the full unit suites**

```bash
yarn test
cd submodules/goban && yarn jest && cd ../..
```

Expected: PASS.

- [ ] **Step 4: Manual testing (required by CONTRIBUTING.md)**

Verify in desktop and mobile browsers, on both Canvas and SVG renderers (Settings → Themes & Visuals to switch, or the `experiments.canvas` data flag):
- Enable the crosshair in Settings → Accessibility; open a game — lines pass through the last stone, under it, across the whole board.
- Play/navigate moves — the crosshair follows each move and the old one is erased.
- Change color and thickness — applied on the next-drawn board (e.g., navigate a move) without reload.
- Lines scale with board size; thumbnails/lists are not overwhelmed.
- Disabled by default for a fresh account.

- [ ] **Step 5: Push and open the main-repo PR**

```bash
git push -u origin feature/last-move-crosshair-accessibility
```

Open the PR using `.github/pull_request_template.md`. Note the dependency on the merged `goban` PR and the submodule bump.

---

## Self-review notes

- **Spec coverage:** settings section (Task 6), disabled-by-default (Task 4), color `#1e6bff` (Tasks 1/3/4), under-stone (Task 2 step 6 draw order; Task 3 layer order), follows last move (Task 2 step 7; Task 3 step 6), all gobans (global callback, Task 5), persistent + next-draw-no-reload (getter design, Tasks 1/5), color picker + thickness slider (Task 6), both renderers (Tasks 2 & 3), relative thickness (Tasks 2/3/4/6).
- **Reentrancy:** addressed in Task 2 step 7 (skip the current `(i, j)`).
- **Type consistency:** the shape `{ enabled: boolean; color: string; thickness: number }` and method name `getLastMoveCrosshair` / hash token `"crosshair"` / callback key `getLastMoveCrosshair` are used identically across all tasks.
- **Known verification points flagged for implementation:** exact SVG layer-insertion idiom and offset math (Task 3 steps 1, 5, 6); the SVG board-config test helper name (Task 3 step 1).
```
