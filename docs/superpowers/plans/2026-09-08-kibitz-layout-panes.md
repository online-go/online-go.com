# Kibitz Layout, Panes and Variation Colours Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Kibitz a portrait layout where the board and one panel are on
screen together with a draggable split and action-bar pane switching, add a
people column and a game-info strip to the landscape sidebar, make posted
variations colour coded, named and stable in the move tree, and fix five
reported bugs.

**Architecture:** `GobanView` gains one opt-in `portraitSplit` prop that
replaces its single portrait scroll column with a fixed board stage, a drag
handle and an independently scrolling panel area. Kibitz keeps pane selection
in its own state and declares five `type: "action"` tabs; all five panes render
inside one `type: "always"` tab and stay mounted, hidden with CSS, so no panel
is torn down on a switch. Variation colour indexes move into the same state
value as the visible-variation ids so the board composes with the right colour
on the first commit.

**Tech Stack:** React 19, TypeScript, Vite, PostCSS nested syntax, Jest with
@testing-library/react, Playwright for the browser pass. Package manager is
`yarn`.

**Spec:** `docs/superpowers/specs/2026-09-08-kibitz-layout-panes-design.md`

## Global Constraints

- No `any` types. No emojis.
- One component per file. Each component gets its own `.tsx` and matching
  `.css` file. Never define two components in one file.
- Co-locate components used by a single parent in the parent's directory.
  Shared components go in `src/components/`.
- CSS uses PostCSS nested syntax. Shared `$variables` go in
  `src/global_styl/00_constants.css` and must be explicitly imported. Runtime
  `var(--name)` variables are in `src/global_styl/01_variables.css`.
- CSS offsets and spacing use `rem`, and plain values in preference to
  `calc()`.
- No pulsing or throbbing animations. No `translateY` / `translateX` on hover.
  No hover background changes on non-interactive elements.
- Every user-visible string is translated: `pgettext(context, msgid)`,
  `npgettext` for plurals, `interpolate()` for parameters, imported from
  `@/lib/translate`.
- Comments explain complicated code or document a function or class. They are
  never a running commentary on the change being made.
- **Never run `git commit` or `git push`.** Every task ends with verification
  and the changes left in the working tree. anoek reviews and commits.
- **Line numbers in this plan are advisory.** Earlier tasks shift later ones.
  Locate code by symbol name — the function, the prop, the selector — never by
  line number.
- Per-task verification: `yarn test <paths>`, `yarn type-check`, `yarn lint`,
  and `yarn prettier:file <changed files>`. `yarn build` runs once, in the
  final task.
- The dev server is at `http://localhost:8080`. Kibitz preset rooms are at
  `/kibitz/preset-high-ranked-live`. Playwright screenshots must be written
  under `.playwright-mcp/`; other paths are refused.
- The `vite-plugin-checker` overlay can show stale TypeScript errors and
  intercepts clicks. Trust a fresh `yarn type-check`; remove the
  `vite-plugin-checker-error-overlay` element with page JS before clicking.

---

### Task 1: Reproduce and fix the change-board crash

Investigation task. The reported symptom is a red error screen reading
"Cannot read properties of null (reading 'id')" when changing the game in a
room. There is no reproduction yet, so this task produces the reproduction
first and only then the fix. It is first in the plan because its size is
unknown.

**Files:**
- Modify: whichever file the captured stack names. The likely candidates,
  from reading the change-board path, are
  `src/views/Kibitz/KibitzInner.tsx:1299-1311` (the `onChangeBoard` callback),
  `src/views/Kibitz/KibitzController.ts` (`changeBoard`), and
  `src/views/Kibitz/useKibitzCurrentGameConnectionKeeper.ts` (which re-sends
  `game/connect` after the picker closes).
- Test: a new or extended test beside the file the fix lands in.

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing later tasks rely on. Kept first so the rest of the plan is
  not built on a broken change-board path.

- [ ] **Step 1: Start the dev server if it is not already running**

Run: `yarn dev` (or confirm `http://localhost:8080` already answers).

- [ ] **Step 2: Reproduce the crash in the browser**

Open `http://localhost:8080/kibitz/preset-high-ranked-live` signed in, open the
settings gear, choose the change-board action, and pick a game from the picker.

Capture, before doing anything else:
- the full console error including the stack, with
  `mcp__plugin_playwright_playwright__browser_console_messages`
- the failing frame's file and line
- whether the room was a preset room or a user room, and whether the room had
  a current game at the time

If the crash does not reproduce this way, try a user-created room and a room
with no current game (a preset room between games) before concluding it does
not reproduce.

- [ ] **Step 3: If it does not reproduce, stop and report**

Do not guess a fix. Write what was tried and what happened into this task in
the plan file, mark the task blocked, and report to anoek. Continue with
Task 2.

- [ ] **Step 4: Identify the null read**

From the stack, find the exact expression reading `.id` from null. Read the
surrounding function and establish which of these it is:
- a room that has become null between the picker opening and the game being
  chosen (`resolvedRoom`, `activeRoom`, `controller.active_room`)
- a `current_game` that is null while the room waits for the new game
- a goban or engine that has been destroyed while a callback was in flight

State the answer in one sentence before writing any code.

- [ ] **Step 5: Write the failing test**

Write a test that drives the same null through the same function. Use the
existing mock style in `src/views/Kibitz/KibitzController.test.ts` if the fix
is in the controller, or `src/views/Kibitz/KibitzView.test.tsx` if it is in a
component. Example shape, with the real names substituted once Step 4 has
named them:

```tsx
test("changing the board does not throw when the room has no current game", async () => {
    const controller = makeController({ current_game: undefined });
    await expect(controller.changeBoard("room-1", game)).resolves.toBe(false);
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/<the test file> -t "changing the board"`
Expected: FAIL, with the same "Cannot read properties of null" message seen in
the browser.

- [ ] **Step 7: Write the minimal fix**

Guard the null at the point Step 4 identified. Prefer returning early or
skipping the work over inventing a fallback value: a room that has gone away
mid-flight has nothing to change the board of.

- [ ] **Step 8: Run the test to verify it passes**

Run: `yarn test src/views/Kibitz/<the test file>`
Expected: PASS.

- [ ] **Step 9: Confirm in the browser**

Repeat Step 2. Expected: the game changes and no error screen appears.

- [ ] **Step 10: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file <changed files>
```

Leave the changes in the working tree. Do not commit.

---

### Task 2: One state value for visible variations and their colours

Fixes the "new variation from chat is always red" bug. `KibitzInner` holds
`visibleVariationIds` and `variationColorIndexes` in two state values, with a
`useLayoutEffect` updating the second from the first. `useKibitzGobans`
composes the secondary board in a passive effect in the *same* commit, reading
`variationColorIndexes[id] ?? 0` off a ref that still holds the previous
render's map. For a newly visible variation the entry is missing, the fallback
fires, and index 0 — `#ff0000` — is used. Merging the two into one state value
removes the ordering entirely.

**Files:**
- Create: `src/views/Kibitz/kibitzVisibleVariations.ts`
- Create: `src/views/Kibitz/kibitzVisibleVariations.test.ts`
- Modify: `src/views/Kibitz/KibitzInner.tsx` — remove
  `assignVisibleVariationColorIndexes` (lines 319-353), `MAX_VISIBLE_VARIATIONS`
  (line 108), the two `useState` calls (lines 388-391) and the
  `useLayoutEffect` (lines 1010-1014)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `interface KibitzVisibleVariations { ids: string[]; colors: Record<string, number> }`
  - `const EMPTY_VISIBLE_VARIATIONS: KibitzVisibleVariations`
  - `const MAX_VISIBLE_VARIATIONS: number`
  - `function withVisibleVariationIds(previous: KibitzVisibleVariations, ids: string[]): KibitzVisibleVariations`

  Task 4 reads `visibleVariations.colors` to render swatches. Task 5 reads it
  for the chip.

- [ ] **Step 1: Write the failing test**

Create `src/views/Kibitz/kibitzVisibleVariations.test.ts`. Copy the AGPL
header from `src/views/Kibitz/kibitzVariationTree.test.ts` — `yarn lint`
enforces it.

```ts
import {
    EMPTY_VISIBLE_VARIATIONS,
    MAX_VISIBLE_VARIATIONS,
    withVisibleVariationIds,
} from "./kibitzVisibleVariations";

test("assigns the first free colour index to each new variation", () => {
    const state = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a", "b"]);
    expect(state.colors).toEqual({ a: 0, b: 1 });
});

test("a variation added later never takes an index already in use", () => {
    // Regression: a newly visible variation used to fall back to index 0 --
    // red -- while another variation already held red.
    const first = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a"]);
    const second = withVisibleVariationIds(first, ["a", "b"]);
    expect(second.colors.a).toBe(0);
    expect(second.colors.b).not.toBe(second.colors.a);
});

test("keeps the colours of variations that stay visible when one is removed", () => {
    const three = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a", "b", "c"]);
    const two = withVisibleVariationIds(three, ["a", "c"]);
    expect(two.colors.a).toBe(three.colors.a);
    expect(two.colors.c).toBe(three.colors.c);
    expect(two.colors.b).toBeUndefined();
});

test("returns the previous object when nothing changed", () => {
    const state = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ["a"]);
    expect(withVisibleVariationIds(state, ["a"])).toBe(state);
});

test("never assigns an index outside the colour list", () => {
    const ids = Array.from({ length: MAX_VISIBLE_VARIATIONS }, (_, i) => `v${i}`);
    const state = withVisibleVariationIds(EMPTY_VISIBLE_VARIATIONS, ids);
    for (const id of ids) {
        expect(state.colors[id]).toBeGreaterThanOrEqual(0);
        expect(state.colors[id]).toBeLessThan(MAX_VISIBLE_VARIATIONS);
    }
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/kibitzVisibleVariations.test.ts`
Expected: FAIL, "Cannot find module './kibitzVisibleVariations'".

- [ ] **Step 3: Write the module**

Create `src/views/Kibitz/kibitzVisibleVariations.ts` with the AGPL header, then:

```ts
import { KIBITZ_VARIATION_COLORS } from "./kibitzVariationTree";

/** How many posted variations can be on the board at once: one per line
 *  colour the move tree can draw. */
export const MAX_VISIBLE_VARIATIONS = KIBITZ_VARIATION_COLORS.length;

/**
 * The variations currently drawn on the board, and the move-tree line colour
 * each one was given. The two travel together so that a render which makes a
 * variation visible also carries its colour: a board composed from an id list
 * whose colours had not been assigned yet drew every new line in colour 0.
 */
export interface KibitzVisibleVariations {
    ids: string[];
    colors: Record<string, number>;
}

export const EMPTY_VISIBLE_VARIATIONS: KibitzVisibleVariations = { ids: [], colors: {} };

function assignColorIndexes(
    previous: Record<string, number>,
    ids: string[],
): Record<string, number> {
    const next: Record<string, number> = {};
    const taken = new Set<number>();

    for (const id of ids) {
        const previousIndex = previous[id];
        if (
            typeof previousIndex === "number" &&
            previousIndex >= 0 &&
            previousIndex < MAX_VISIBLE_VARIATIONS &&
            !taken.has(previousIndex)
        ) {
            next[id] = previousIndex;
            taken.add(previousIndex);
            continue;
        }

        const freeIndex = KIBITZ_VARIATION_COLORS.findIndex((_, index) => !taken.has(index));
        const colorIndex = freeIndex >= 0 ? freeIndex : 0;
        next[id] = colorIndex;
        taken.add(colorIndex);
    }

    return next;
}

function sameColors(left: Record<string, number>, right: Record<string, number>): boolean {
    const leftKeys = Object.keys(left);
    return (
        leftKeys.length === Object.keys(right).length &&
        leftKeys.every((key) => left[key] === right[key])
    );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((id, index) => id === right[index]);
}

/** Set the visible variations, keeping the colour of every variation that
 *  stays visible and giving each new one a colour no other variation holds. */
export function withVisibleVariationIds(
    previous: KibitzVisibleVariations,
    ids: string[],
): KibitzVisibleVariations {
    const colors = assignColorIndexes(previous.colors, ids);
    if (sameIds(previous.ids, ids) && sameColors(previous.colors, colors)) {
        return previous;
    }
    return { ids, colors };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/views/Kibitz/kibitzVisibleVariations.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Switch KibitzInner to the merged state**

In `src/views/Kibitz/KibitzInner.tsx`:

Delete `const MAX_VISIBLE_VARIATIONS = KIBITZ_VARIATION_COLORS.length;` (line
108), the whole `assignVisibleVariationColorIndexes` function (lines 319-353),
and the `KIBITZ_VARIATION_COLORS` import if nothing else in the file uses it.
Add:

```tsx
import {
    EMPTY_VISIBLE_VARIATIONS,
    MAX_VISIBLE_VARIATIONS,
    withVisibleVariationIds,
} from "./kibitzVisibleVariations";
```

Replace the two `useState` calls (lines 388-391) with:

```tsx
const [visibleVariations, setVisibleVariations] = React.useState(EMPTY_VISIBLE_VARIATIONS);
const visibleVariationIds = visibleVariations.ids;
const variationColorIndexes = visibleVariations.colors;
```

Delete the `React.useLayoutEffect` at lines 1010-1014 entirely.

Replace both `setVisibleVariationIds(...)` call sites. In `onOpenVariation`
(around line 968):

```tsx
if (nextVisibleVariationIds !== visibleVariationIds) {
    setVisibleVariations((previous) =>
        withVisibleVariationIds(previous, nextVisibleVariationIds),
    );
}
```

In `onToggleVariation` (around line 995):

```tsx
setVisibleVariations((previous) =>
    withVisibleVariationIds(previous, nextVisibleVariationIds),
);
```

`visibleVariationIds` and `variationColorIndexes` keep their names, so the
`useKibitzGobans` call at line 653 and every dependency array stay as they are.

- [ ] **Step 6: Run the Kibitz tests**

Run: `yarn test src/views/Kibitz`
Expected: PASS. If `KibitzInner.test.ts` referenced
`assignVisibleVariationColorIndexes`, move that coverage to
`kibitzVisibleVariations.test.ts` rather than re-exporting the old name.

- [ ] **Step 7: Confirm in the browser**

Open a room with at least two posted variations. Click one variation in the
chat, then a second. Expected: the second line is drawn in a colour other than
red on its first click, and there are never two red branches.

- [ ] **Step 8: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/views/Kibitz/kibitzVisibleVariations.ts src/views/Kibitz/kibitzVisibleVariations.test.ts src/views/Kibitz/KibitzInner.tsx
```

---

### Task 3: Compose variations in a stable order

Fixes "when clicking between variations, the branch order changes".
`useKibitzGobans.compose()` applies every non-selected visible variation, then
the selected one last, so the order nodes are pushed into `parent.branches`
depends on which variation is selected.

**Files:**
- Modify: `src/views/Kibitz/useKibitzGobans.ts:400-420` (the `compose` function)
- Test: `src/views/Kibitz/useKibitzGobans.test.tsx`

**Interfaces:**
- Consumes: nothing from Task 2. The two tasks touch different files.
- Produces: no new exports.

- [ ] **Step 1: Write the failing test**

Append to `src/views/Kibitz/useKibitzGobans.test.tsx`, inside the
`describe("useKibitzGobans", ...)` block. `applyKibitzVariationToController` is
already mocked at the top of the file, so the call order can be asserted
directly.

```tsx
test("composes visible variations in list order whatever is selected", () => {
    readyMainTrunk();
    const variations = [makeVariation("v1"), makeVariation("v2"), makeVariation("v3")];
    const visibleVariationIds = ["v1", "v2", "v3"];

    const composedOrderWhenSelecting = (selected: string): string[] => {
        instances.length = 0;
        applyKibitzVariationToController.mockClear();
        const { unmount } = render(
            <Harness
                options={baseOptions({
                    secondaryPane: { collapsed: false, variation_id: selected },
                    variations,
                    visibleVariationIds,
                })}
                onResult={() => undefined}
            />,
        );
        emit(instances[0], "load");
        const order = applyKibitzVariationToController.mock.calls.map(
            (call) => (call[1] as { id: string }).id,
        );
        unmount();
        return order;
    };

    expect(composedOrderWhenSelecting("v1")).toEqual(["v1", "v2", "v3"]);
    expect(composedOrderWhenSelecting("v3")).toEqual(["v1", "v2", "v3"]);
});

test("marks are applied only to the selected variation", () => {
    readyMainTrunk();
    render(
        <Harness
            options={baseOptions({
                secondaryPane: { collapsed: false, variation_id: "v2" },
                variations: [makeVariation("v1"), makeVariation("v2")],
                visibleVariationIds: ["v1", "v2"],
            })}
            onResult={() => undefined}
        />,
    );
    emit(instances[0], "load");
    const includeMarksById = new Map(
        applyKibitzVariationToController.mock.calls.map((call) => [
            (call[1] as { id: string }).id,
            call[3] as boolean,
        ]),
    );
    expect(includeMarksById.get("v2")).toBe(true);
    expect(includeMarksById.get("v1")).toBe(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/useKibitzGobans.test.tsx -t "composes visible variations in list order"`
Expected: FAIL. Selecting `v1` produces `["v2", "v3", "v1"]` rather than
`["v1", "v2", "v3"]`.

- [ ] **Step 3: Rewrite the compose ordering**

In `src/views/Kibitz/useKibitzGobans.ts`, replace the body of `compose` from
`const focus = ...` down to the end of the `if (focus) { ... }` block with:

```ts
const focus = mode === "variation" ? selectedVariation : draftBase;
if (focus) {
    // Compose in the order the variations appear in the list, whatever is
    // selected. Applying the selected one last made the order that nodes
    // enter parent.branches depend on the selection, so the move tree
    // re-ordered its branches as the user clicked between variations.
    let focusEndpoint: AppliedKibitzVariation["endpoint"] = null;
    if (mode === "variation") {
        for (const v of variations) {
            if (v.game_id !== focus.game_id) {
                continue;
            }
            if (v.id !== focus.id && !latest.current.visibleVariationIds.includes(v.id)) {
                continue;
            }
            const applied = apply(v, v.id === focus.id);
            if (v.id === focus.id) {
                focusEndpoint = applied.endpoint;
            }
        }
    } else {
        focusEndpoint = apply(focus, true).endpoint;
    }
    if (focusEndpoint) {
        controller.goban.engine.jumpTo(focusEndpoint);
    }
} else if (mode === "draft" && pane.variation_source_move_path) {
    controller.goban.engine.followPath(0, pane.variation_source_move_path);
}
```

Extend the existing import so the endpoint type is available:

```ts
import {
    applyKibitzVariationToController,
    type AppliedKibitzVariation,
} from "./kibitzVariationTree";
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/views/Kibitz/useKibitzGobans.test.tsx`
Expected: PASS, including the pre-existing tests in the file.

- [ ] **Step 5: Confirm in the browser**

Open a room, make three variations visible, and click between them. Expected:
the branches in the move tree keep the same vertical order, and only the
selected line's marks are drawn.

- [ ] **Step 6: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/views/Kibitz/useKibitzGobans.ts src/views/Kibitz/useKibitzGobans.test.tsx
```

---

### Task 4: Variation colour swatches

**Files:**
- Create: `src/views/Kibitz/KibitzVariationSwatch.tsx`
- Create: `src/views/Kibitz/KibitzVariationSwatch.css`
- Create: `src/views/Kibitz/KibitzVariationSwatch.test.tsx`
- Modify: `src/views/Kibitz/KibitzVariationList.tsx` (row rendering, props)
- Modify: `src/views/Kibitz/KibitzLeftAside.tsx` (pass the colour map through)
- Modify: `src/views/Kibitz/KibitzChatPanel.tsx` (variation-post buttons)
- Modify: `src/views/Kibitz/KibitzInner.tsx` (pass `variationColorIndexes`
  into `leftAside` and `chat`)
- Modify: `src/views/Kibitz/KibitzView.tsx` (the `chat` prop type widens)

**Interfaces:**
- Consumes: `visibleVariations.colors` from Task 2, as
  `Record<string, number>`.
- Produces: `KibitzVariationSwatch`, props
  `{ colorIndex: number | null | undefined; className?: string }`. Task 5 uses
  it inside the chip.

- [ ] **Step 1: Write the failing test**

Create `src/views/Kibitz/KibitzVariationSwatch.test.tsx` with the AGPL header:

```tsx
import * as React from "react";
import { render } from "@testing-library/react";
import { KibitzVariationSwatch } from "./KibitzVariationSwatch";

test("renders nothing when the variation is not on the board", () => {
    const { container } = render(<KibitzVariationSwatch colorIndex={null} />);
    expect(container).toBeEmptyDOMElement();
});

test("exposes the colour index so the swatch can be identified", () => {
    const { container } = render(<KibitzVariationSwatch colorIndex={2} />);
    const swatch = container.querySelector(".KibitzVariationSwatch");
    expect(swatch).not.toBeNull();
    expect(swatch?.getAttribute("data-color-index")).toBe("2");
});

test("ignores an index outside the colour list", () => {
    const { container } = render(<KibitzVariationSwatch colorIndex={99} />);
    expect(container).toBeEmptyDOMElement();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzVariationSwatch.test.tsx`
Expected: FAIL, "Cannot find module './KibitzVariationSwatch'".

- [ ] **Step 3: Write the component**

`src/views/Kibitz/KibitzVariationSwatch.tsx`, with the AGPL header:

```tsx
import * as React from "react";
import { KIBITZ_VARIATION_COLORS } from "./kibitzVariationTree";
import "./KibitzVariationSwatch.css";

interface KibitzVariationSwatchProps {
    /** The variation's move-tree line colour, or null when the variation is
     *  not currently drawn on the board. */
    colorIndex: number | null | undefined;
    className?: string;
}

/**
 * A small square in a variation's move-tree line colour, so a row in the
 * variation list, a post in the chat and the line on the board can be matched
 * by eye. Renders nothing for a variation that is not on the board, which is
 * what distinguishes a listed variation from a visible one.
 */
export function KibitzVariationSwatch({
    colorIndex,
    className,
}: KibitzVariationSwatchProps): React.ReactElement | null {
    if (
        typeof colorIndex !== "number" ||
        colorIndex < 0 ||
        colorIndex >= KIBITZ_VARIATION_COLORS.length
    ) {
        return null;
    }

    return (
        <span
            className={"KibitzVariationSwatch" + (className ? ` ${className}` : "")}
            data-color-index={colorIndex}
            style={{ backgroundColor: KIBITZ_VARIATION_COLORS[colorIndex] }}
            aria-hidden="true"
        />
    );
}
```

`src/views/Kibitz/KibitzVariationSwatch.css`:

```css
.KibitzVariationSwatch {
    display: inline-block;
    flex-shrink: 0;
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 0.15rem;
    border: 1px solid var(--shade3);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/views/Kibitz/KibitzVariationSwatch.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Render the swatch in the variation list**

In `src/views/Kibitz/KibitzVariationList.tsx`, add to
`KibitzVariationListProps`:

```tsx
/** Move-tree line colour of each variation that is on the board, by id. */
colorIndexes?: Record<string, number>;
```

Destructure `colorIndexes` in the component signature with a `{}` default, and
inside the `group.variations.map` render, put the swatch at the start of
`.variation-name`:

```tsx
<span className="variation-name">
    <KibitzVariationSwatch colorIndex={colorIndexes[variation.id] ?? null} />
    {interpolate(
        pgettext("Posted analysis variation label", "Variation: {{name}}"),
        {
            name:
                variation.title ||
                pgettext(
                    "Fallback title for an untitled variation in kibitz",
                    "Untitled variation",
                ),
        },
    )}
</span>
```

Import the swatch. In `KibitzVariationList.css`, give `.variation-name`
`display: flex; align-items: center; gap: 0.35rem;` so the swatch sits on the
text baseline row rather than in the flow.

- [ ] **Step 6: Render the swatch on chat variation posts**

In `src/views/Kibitz/KibitzChatPanel.tsx`, add to `KibitzChatPanelProps`:

```tsx
/** Move-tree line colour of each variation that is on the board, by id. */
variationColorIndexes: Record<string, number>;
```

Destructure it, and inside the `variation-post` button put the swatch before
the label:

```tsx
<button
    type="button"
    className="variation-post variation"
    data-variation-post="true"
    data-variation-id={entry.item.variation_id}
    onClick={() =>
        entry.item.variation_id && onOpenVariation(entry.item.variation_id, true)
    }
>
    <KibitzVariationSwatch
        colorIndex={
            entry.item.variation_id
                ? (variationColorIndexes[entry.item.variation_id] ?? null)
                : null
        }
    />
    {label}
</button>
```

In `KibitzChatPanel.css`, give `.variation-post` `display: inline-flex;
align-items: center; gap: 0.35rem;`.

- [ ] **Step 7: Render the swatch in the variation panel**

In `src/views/Kibitz/KibitzVariationPanel.tsx`, add an optional
`colorIndex?: number | null` prop and render
`<KibitzVariationSwatch colorIndex={colorIndex ?? null} />` immediately before
the text inside `.KibitzVariationPanel-title`. Give that element
`display: flex; align-items: center; gap: 0.35rem;` in
`KibitzVariationPanel.css`.

- [ ] **Step 8: Thread the colour map through**

In `src/views/Kibitz/KibitzLeftAside.tsx` add
`variationColorIndexes: Record<string, number>` to `KibitzLeftAsideProps` and
pass it to `KibitzVariationList` as `colorIndexes`.

In `src/views/Kibitz/KibitzInner.tsx`, add `variationColorIndexes` to the
`leftAside` object (around line 1418) and to the `chat` object (around line
1437).

In `src/views/Kibitz/KibitzView.tsx`, pass a `colorIndex` to
`KibitzVariationPanel`:

```tsx
const panelVariationId =
    gobans.centerMode === "variation" ? props.leftAside.selectedVariationId : null;
const panelColorIndex = panelVariationId
    ? (props.leftAside.variationColorIndexes?.[panelVariationId] ?? null)
    : null;
```

The optional read is required: `KibitzView.test.tsx` passes
`leftAside: {} as KibitzViewProps["leftAside"]`, so an unguarded index throws in
the existing variation-mode test. Do not relax the prop type to match.

- [ ] **Step 9: Run the Kibitz tests**

Run: `yarn test src/views/Kibitz`
Expected: PASS. Existing render tests that construct
`KibitzChatPanelProps` need `variationColorIndexes: {}` added; that is the
only expected breakage.

- [ ] **Step 10: Confirm in the browser**

Open a room with two or more visible variations. Expected: each list row, each
chat post and the variation panel heading carry a square in the same colour as
that line in the move tree, and a listed-but-hidden variation carries none.

- [ ] **Step 11: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/views/Kibitz/KibitzVariationSwatch.tsx src/views/Kibitz/KibitzVariationSwatch.css src/views/Kibitz/KibitzVariationSwatch.test.tsx src/views/Kibitz/KibitzVariationList.tsx src/views/Kibitz/KibitzVariationList.css src/views/Kibitz/KibitzChatPanel.tsx src/views/Kibitz/KibitzChatPanel.css src/views/Kibitz/KibitzVariationPanel.tsx src/views/Kibitz/KibitzVariationPanel.css src/views/Kibitz/KibitzLeftAside.tsx src/views/Kibitz/KibitzInner.tsx src/views/Kibitz/KibitzView.tsx
```

---

### Task 5: The variation chip

Names the variation being viewed, in its colour, and says which game it
belongs to when that is not the room's current game. Rendered in the landscape
sidebar header now; Task 11 reuses it as the portrait header.

**Files:**
- Create: `src/views/Kibitz/KibitzVariationChip.tsx`
- Create: `src/views/Kibitz/KibitzVariationChip.css`
- Create: `src/views/Kibitz/KibitzVariationChip.test.tsx`
- Modify: `src/views/Kibitz/KibitzView.tsx` (the `header` prop)
- Modify: `src/views/Kibitz/KibitzView.css`

**Interfaces:**
- Consumes: `KibitzVariationSwatch` from Task 4.
- Produces: `KibitzVariationChip` with props

```ts
interface KibitzVariationChipProps {
    mode: "draft" | "variation";
    variation: KibitzVariationSummary | null;
    colorIndex: number | null;
    /** The game the variation belongs to, when that is not the room's
     *  current game. Null otherwise. */
    otherGame: KibitzWatchedGame | null;
}
```

  Task 11 renders the same component as the portrait header.

- [ ] **Step 1: Write the failing test**

Create `src/views/Kibitz/KibitzVariationChip.test.tsx` with the AGPL header,
mocking `@/components/Player` and `@/lib/translate` the same way
`KibitzVariationList.test.tsx` does (copy those two `jest.mock` blocks
verbatim).

```tsx
const variation: KibitzVariationSummary = {
    id: "v1",
    room_id: "room-1",
    game_id: 100,
    creator: { id: 1, username: "alice", ranking: 0, professional: false, ui_class: "" },
    created_at: 0,
    viewer_count: 0,
    current_viewers: [],
    title: "Tenuki instead",
};

test("names the variation and its author", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={null}
        />,
    );
    expect(screen.getByText("Tenuki instead")).toBeInTheDocument();
    expect(screen.getByTestId("Player")).toHaveTextContent("alice");
});

test("shows the variation's colour", () => {
    const { container } = render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={null}
        />,
    );
    expect(
        container.querySelector(".KibitzVariationSwatch")?.getAttribute("data-color-index"),
    ).toBe("1");
});

test("says which game an older variation belongs to", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={variation}
            colorIndex={1}
            otherGame={{
                game_id: 42,
                board_size: "19x19",
                title: "Round 3",
                black: { id: 1, username: "b", ranking: 0, professional: false, ui_class: "" },
                white: { id: 2, username: "w", ranking: 0, professional: false, ui_class: "" },
            }}
        />,
    );
    expect(screen.getByText(/Round 3/)).toBeInTheDocument();
});

test("labels a draft rather than naming it", () => {
    render(
        <KibitzVariationChip mode="draft" variation={null} colorIndex={null} otherGame={null} />,
    );
    expect(screen.getByText("New variation")).toBeInTheDocument();
});

test("falls back for an untitled variation", () => {
    render(
        <KibitzVariationChip
            mode="variation"
            variation={{ ...variation, title: undefined }}
            colorIndex={0}
            otherGame={null}
        />,
    );
    expect(screen.getByText("Untitled variation")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzVariationChip.test.tsx`
Expected: FAIL, "Cannot find module './KibitzVariationChip'".

- [ ] **Step 3: Write the component**

`src/views/Kibitz/KibitzVariationChip.tsx`, with the AGPL header:

```tsx
import * as React from "react";
import { interpolate, pgettext } from "@/lib/translate";
import { Player } from "@/components/Player";
import type { KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzVariationSwatch } from "./KibitzVariationSwatch";
import "./KibitzVariationChip.css";

interface KibitzVariationChipProps {
    mode: "draft" | "variation";
    variation: KibitzVariationSummary | null;
    colorIndex: number | null;
    /** The game the variation belongs to, when that is not the room's current
     *  game. Null otherwise. */
    otherGame: KibitzWatchedGame | null;
}

/**
 * Says what the centre board is showing while it shows something other than
 * the live game: the variation's colour, its name, its author, and the game it
 * belongs to when that is not the game the room is watching.
 */
export function KibitzVariationChip({
    mode,
    variation,
    colorIndex,
    otherGame,
}: KibitzVariationChipProps): React.ReactElement {
    const name =
        mode === "draft"
            ? pgettext(
                  "Label shown while the Kibitz centre board holds an unposted draft",
                  "New variation",
              )
            : variation?.title ||
              pgettext(
                  "Fallback title for an untitled variation in kibitz",
                  "Untitled variation",
              );

    return (
        <span className={`KibitzVariationChip ${mode}`}>
            <KibitzVariationSwatch colorIndex={colorIndex} />
            <span className="KibitzVariationChip-name">{name}</span>
            {mode === "variation" && variation ? (
                <span className="KibitzVariationChip-author">
                    <Player user={variation.creator} disableCacheUpdate />
                </span>
            ) : null}
            {otherGame ? (
                <span className="KibitzVariationChip-game">
                    {interpolate(
                        pgettext(
                            "Says which game a Kibitz variation belongs to when it is not the room's current game",
                            "of {{game}}",
                        ),
                        {
                            game:
                                otherGame.title ||
                                interpolate(
                                    pgettext(
                                        "Fallback game label for a Kibitz variation divider",
                                        "Game #{{game_id}}",
                                    ),
                                    { game_id: otherGame.game_id },
                                ),
                        },
                    )}
                </span>
            ) : null}
        </span>
    );
}
```

`src/views/Kibitz/KibitzVariationChip.css`:

```css
.KibitzVariationChip {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;

    .KibitzVariationChip-name {
        font-weight: bold;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .KibitzVariationChip-author,
    .KibitzVariationChip-game {
        color: var(--shade1);
        font-size: 0.85rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/views/Kibitz/KibitzVariationChip.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Render the chip in the landscape header**

In `src/views/Kibitz/KibitzView.tsx`, `KibitzViewProps` needs the data the chip
takes. `props.leftAside` already carries `variations`,
`selectedVariationId`, `variationGameById` and (after Task 4)
`variationColorIndexes`, so derive the chip inside `KibitzView` rather than
adding props:

```tsx
// KibitzView.test.tsx passes `leftAside: {} as ...`, so every read here is
// written to survive a partially-populated aside.
const asideVariations = props.leftAside.variations ?? [];
const selectedVariation =
    gobans.centerMode === "variation"
        ? (asideVariations.find((v) => v.id === props.leftAside.selectedVariationId) ?? null)
        : null;
const chipGameId = selectedVariation?.game_id ?? null;
const chipOtherGame =
    chipGameId != null && chipGameId !== room.current_game?.game_id
        ? (props.leftAside.variationGameById?.get(chipGameId) ?? null)
        : null;
const variationChip =
    gobans.centerMode === "main" ? null : (
        <KibitzVariationChip
            mode={gobans.centerMode === "draft" ? "draft" : "variation"}
            variation={selectedVariation}
            colorIndex={
                selectedVariation
                    ? (props.leftAside.variationColorIndexes?.[selectedVariation.id] ?? null)
                    : null
            }
            otherGame={chipOtherGame}
        />
    );
```

The optional reads are there because the existing test fixture supplies an
empty aside, not because the props are genuinely optional. Do not relax the
prop types to match.

Then the `header` prop becomes the room title with the chip beneath it:

```tsx
header={
    <div className="Kibitz-header">
        <span
            className="Kibitz-room-title"
            data-game-id={room.current_game?.game_id}
            ref={roomTitleTarget?.ref}
        >
            {room.title}
        </span>
        {variationChip}
    </div>
}
```

In `KibitzView.css` give `.Kibitz-header` `display: flex; flex-direction:
column; gap: 0.2rem; min-width: 0;`.

- [ ] **Step 6: Run the tests**

Run: `yarn test src/views/Kibitz`
Expected: PASS. `KibitzView.test.tsx` may assert on the header's shape; update
those assertions to the new structure rather than reverting the markup.

- [ ] **Step 7: Confirm in the browser**

At 1600x900, open a posted variation. Expected: the sidebar header shows the
room title with the chip under it, in that variation's colour. Open a
variation belonging to a previous game. Expected: the chip names that game.

- [ ] **Step 8: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/views/Kibitz/KibitzVariationChip.tsx src/views/Kibitz/KibitzVariationChip.css src/views/Kibitz/KibitzVariationChip.test.tsx src/views/Kibitz/KibitzView.tsx src/views/Kibitz/KibitzView.css
```

---

### Task 6: The sidebar cannot hide the board

The landscape drag handle clamps to 75% of the view width and ignores the left
aside, so on Kibitz it can be dragged until the board pane has no width. This
lands in `SidebarResizer`, so every `GobanView` consumer gets the protection.

**Files:**
- Modify: `src/components/GobanView/SidebarResizer.tsx:21-61`
- Test: `src/components/GobanView/SidebarResizer.test.tsx` (create)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `const MIN_BOARD_PANE_REM = 24`
  - `function sidebarWidthBoundsPx(root: HTMLElement | null): { min: number; max: number }`
    — already exists, now exported for the test.

- [ ] **Step 1: Write the failing test**

Create `src/components/GobanView/SidebarResizer.test.tsx` with the AGPL header:

```tsx
import { sidebarWidthBoundsPx } from "./SidebarResizer";

function makeRoot(viewWidth: number, asideWidth: number | null): HTMLElement {
    const root = document.createElement("div");
    Object.defineProperty(root, "offsetWidth", { value: viewWidth, configurable: true });
    root.style.setProperty("--goban-view-sidebar-width", "400px");
    if (asideWidth !== null) {
        const aside = document.createElement("div");
        aside.className = "GobanView-left-aside";
        Object.defineProperty(aside, "offsetWidth", {
            value: asideWidth,
            configurable: true,
        });
        root.appendChild(aside);
    }
    document.body.appendChild(root);
    return root;
}

afterEach(() => {
    document.body.innerHTML = "";
});

test("leaves room for the board when there is no left aside", () => {
    // 1600 view - 0 aside - 384 board minimum (24rem at 16px)
    expect(sidebarWidthBoundsPx(makeRoot(1600, null)).max).toBe(1216);
});

test("subtracts the left aside as well as the board minimum", () => {
    expect(sidebarWidthBoundsPx(makeRoot(1600, 300)).max).toBe(916);
});

test("never reports a maximum below the minimum", () => {
    const bounds = sidebarWidthBoundsPx(makeRoot(500, 300));
    expect(bounds.max).toBe(bounds.min);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/GobanView/SidebarResizer.test.tsx`
Expected: FAIL — `sidebarWidthBoundsPx` is not exported, and once exported the
maximum is 1200 (75% of 1600), not 1216.

- [ ] **Step 3: Replace the fraction with a measured bound**

The comment block above the sidebar-width variables in
`src/components/GobanView/GobanView.css` documents the old bound: "the override
is bounded to the fallback width and 75% of the view". Update that sentence to
describe the new bound. The repo's rule is to delete what has become false
rather than leave it beside the correction.

In `src/components/GobanView/SidebarResizer.tsx`, delete
`const MAX_SIDEBAR_WIDTH_FRACTION = 0.75;` and add:

```ts
/** The narrowest the board pane may become. Below this a 19x19 board stops
 *  being legible, so the sidebar is not allowed to take the width. */
const MIN_BOARD_PANE_REM = 24;
```

Replace `sidebarWidthBoundsPx` with:

```ts
/** The range the sidebar width can be set to, in pixels. The maximum leaves
 *  the left aside its measured width and the board pane its minimum, so the
 *  handle can never be dragged far enough to hide the board. */
export function sidebarWidthBoundsPx(root: HTMLElement | null): { min: number; max: number } {
    const view_width = root?.offsetWidth ?? window.innerWidth;
    const aside_width =
        root?.querySelector<HTMLElement>(".GobanView-left-aside")?.offsetWidth ?? 0;
    const min = minSidebarWidthPx(root);
    const max = Math.max(min, view_width - aside_width - remToPx(MIN_BOARD_PANE_REM));
    return { min: Math.round(min), max: Math.round(max) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/components/GobanView/SidebarResizer.test.tsx`
Expected: PASS, 3 tests.

- [ ] **Step 5: Confirm in the browser**

At 1600x900 on a Kibitz room, drag the sidebar handle as far left as it will
go. Expected: it stops with the board still visible beside the left aside.
Repeat on `/game/1`, which has no left aside. Expected: it stops with the board
still visible.

- [ ] **Step 6: Verify and stop**

```bash
yarn test src/components/GobanView
yarn type-check
yarn lint
yarn prettier:file src/components/GobanView/SidebarResizer.tsx src/components/GobanView/SidebarResizer.test.tsx
```

---

### Task 7: The game info strip

**Files:**
- Create: `src/views/Kibitz/KibitzGameInfoStrip.tsx`
- Create: `src/views/Kibitz/KibitzGameInfoStrip.css`
- Create: `src/views/Kibitz/KibitzGameInfoStrip.test.tsx`
- Modify: `src/views/Kibitz/KibitzView.tsx` (render it in `.Kibitz-header`)

**Interfaces:**
- Consumes: the `.Kibitz-header` wrapper introduced in Task 5.
- Produces: `KibitzGameInfoStrip`, props
  `{ controller: GobanController | null }`.

- [ ] **Step 1: Write the failing test**

Create `src/views/Kibitz/KibitzGameInfoStrip.test.tsx` with the AGPL header.
Mock translate as in `KibitzVariationList.test.tsx`, and stub the controller:

```tsx
function makeController(engine: Record<string, unknown>, timeControl: unknown) {
    return {
        goban: {
            engine: { rules: "japanese", handicap: 0, komi: 6.5, ...engine },
            config: { time_control: timeControl },
            on: () => undefined,
            off: () => undefined,
        },
    } as unknown as GobanController;
}

test("renders nothing without a controller", () => {
    const { container } = render(<KibitzGameInfoStrip controller={null} />);
    expect(container).toBeEmptyDOMElement();
});

test("shows the ruleset, the board size and the time control", () => {
    render(
        <KibitzGameInfoStrip
            controller={makeController({ width: 19, height: 19 }, {
                system: "byoyomi",
                speed: "live",
                main_time: 600,
                periods: 5,
                period_time: 30,
            })}
        />,
    );
    expect(screen.getByText(/Japanese/i)).toBeInTheDocument();
    expect(screen.getByText("19x19")).toBeInTheDocument();
});

test("omits handicap and komi when they do not apply", () => {
    const { container } = render(
        <KibitzGameInfoStrip
            controller={makeController({ width: 19, height: 19, handicap: 0 }, null)}
        />,
    );
    expect(container.querySelector(".KibitzGameInfoStrip-handicap")).toBeNull();
});

test("shows the handicap when there is one", () => {
    const { container } = render(
        <KibitzGameInfoStrip
            controller={makeController({ width: 19, height: 19, handicap: 4 }, null)}
        />,
    );
    expect(container.querySelector(".KibitzGameInfoStrip-handicap")).not.toBeNull();
});

test("marks a rengo game", () => {
    const { container } = render(
        <KibitzGameInfoStrip
            controller={makeController({ width: 19, height: 19, rengo: true }, null)}
        />,
    );
    expect(container.querySelector(".KibitzGameInfoStrip-rengo")).not.toBeNull();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzGameInfoStrip.test.tsx`
Expected: FAIL, "Cannot find module './KibitzGameInfoStrip'".

- [ ] **Step 3: Write the component**

`src/views/Kibitz/KibitzGameInfoStrip.tsx`, with the AGPL header. Read the
values off the goban rather than adding fields to `KibitzWatchedGame`, and use
`generateGobanHook` from `@/components/GobanView` so the strip follows the room
onto a new game.

```tsx
import * as React from "react";
import { interpolate, pgettext } from "@/lib/translate";
import { rulesText } from "@/lib/misc";
import { shortShortTimeControl } from "@/components/TimeControl/util";
import { generateGobanHook } from "@/components/GobanView";
import type { GobanController } from "@/lib/GobanController";
import "./KibitzGameInfoStrip.css";

interface KibitzGameInfoStripProps {
    /** The live game's controller. Null while the room has no game. */
    controller: GobanController | null;
}

const useGameSettings = generateGobanHook(
    (goban: GobanController["goban"] | null) =>
        goban
            ? [
                  goban.engine.rules,
                  goban.engine.width,
                  goban.engine.height,
                  goban.engine.handicap,
                  goban.engine.komi,
              ].join(":")
            : "",
    ["gamedata"],
);

/**
 * The watched game's fixed settings, kept on screen so a spectator joining
 * mid-game knows what they are looking at without opening game information.
 */
export function KibitzGameInfoStrip({
    controller,
}: KibitzGameInfoStripProps): React.ReactElement | null {
    useGameSettings(controller?.goban ?? null);

    if (!controller) {
        return null;
    }

    const engine = controller.goban.engine;
    const time_control = controller.goban.config?.time_control;

    return (
        <div className="KibitzGameInfoStrip">
            <span className="KibitzGameInfoStrip-rules">{rulesText(engine.rules)}</span>
            <span className="KibitzGameInfoStrip-size">{`${engine.width}x${engine.height}`}</span>
            {time_control ? (
                <span className="KibitzGameInfoStrip-time">
                    {shortShortTimeControl(time_control)}
                </span>
            ) : null}
            {engine.handicap ? (
                <span className="KibitzGameInfoStrip-handicap">
                    {interpolate(
                        pgettext("Handicap shown in the Kibitz game info strip", "H{{count}}"),
                        { count: engine.handicap },
                    )}
                </span>
            ) : null}
            {engine.rengo ? (
                <span className="KibitzGameInfoStrip-rengo">
                    {pgettext("Marks a rengo game in the Kibitz game info strip", "Rengo")}
                </span>
            ) : null}
        </div>
    );
}
```

If `engine.rengo` or `engine.width` are not on the engine's type, read the
correct property names from `submodules/goban/src/engine/GobanEngine.ts` and
use those. Do not cast to `any`.

`src/views/Kibitz/KibitzGameInfoStrip.css`:

```css
.KibitzGameInfoStrip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.15rem 0.6rem;
    color: var(--shade1);
    font-size: 0.8rem;
    line-height: 1.3;
    min-width: 0;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/views/Kibitz/KibitzGameInfoStrip.test.tsx`
Expected: PASS, 5 tests.

- [ ] **Step 5: Render it in the landscape header**

In `src/views/Kibitz/KibitzView.tsx`, inside `.Kibitz-header` from Task 5, add
below the room title and above the chip:

```tsx
{!isPortrait && <KibitzGameInfoStrip controller={gobans.main} />}
```

The strip is landscape only: portrait has no header row (Task 11).

- [ ] **Step 6: Confirm in the browser**

At 1600x900 on a room with a live game. Expected: the ruleset, board size and
time control read correctly under the room title, and the line wraps rather
than overflowing when the sidebar is dragged narrow.

- [ ] **Step 7: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/views/Kibitz/KibitzGameInfoStrip.tsx src/views/Kibitz/KibitzGameInfoStrip.css src/views/Kibitz/KibitzGameInfoStrip.test.tsx src/views/Kibitz/KibitzView.tsx
```

---

### Task 8: The people column in landscape

Moves the people list out of the chat composer and into a column beside the
chat log, on by default, toggled from the action bar.

**Files:**
- Modify: `src/lib/data_schema.ts:229-234` (`KibitzSchema`)
- Modify: `src/views/Kibitz/KibitzChatPanel.tsx`
- Modify: `src/views/Kibitz/KibitzChatPanel.css`
- Modify: `src/views/Kibitz/KibitzView.tsx` (the toggle tab)
- Test: `src/views/Kibitz/KibitzChatPanel.render.test.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks beyond Task 4's
  `variationColorIndexes` prop already being on `KibitzChatPanelProps`.
- Produces: `KibitzChatPanelProps` gains
  `showPeople: boolean`. Task 11 adds `mode`, `visible` and `onUnreadChange`
  to the same interface.

- [ ] **Step 1: Add the preference key**

In `src/lib/data_schema.ts`, extend `KibitzSchema`:

```ts
export interface KibitzSchema {
    /** Which chat the Kibitz sidebar shows. */
    chat_tab: "room" | "game";
    /** Collapsed sections of the Kibitz left aside. */
    "left_aside.collapsed": { rooms: boolean; variations: boolean };
    /** Show the people column beside the landscape Kibitz chat. */
    people_column: boolean;
}
```

- [ ] **Step 2: Write the failing test**

`src/views/Kibitz/KibitzChatPanel.render.test.tsx` builds props with a
`baseProps()` factory (around line 197) and renders with
`render(<KibitzChatPanel {...} />)`. Extend `baseProps()` with the new fields,
which every existing test in the file then inherits:

```tsx
function baseProps() {
    return {
        room: makeRoom(),
        items: [] as KibitzStreamItem[],
        variations: [] as KibitzVariationSummary[],
        onOpenVariation: jest.fn(),
        gameController: null,
        variationColorIndexes: {} as Record<string, number>,
        showPeople: false,
    };
}
```

The column is gated on a measured width, so the tests need a `ResizeObserver`
that reports one. Add near the top of the file, before the imports of the
component under test:

```tsx
let observedWidth = 600;
beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
        configurable: true,
        get() {
            return observedWidth;
        },
    });
    global.ResizeObserver = class {
        constructor(private cb: () => void) {}
        observe() {
            this.cb();
        }
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
});
```

Then add the three tests:

```tsx
test("shows the people column when the panel is wide enough and it is enabled", () => {
    observedWidth = 600;
    const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
    expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).not.toBeNull();
});

test("hides the people column when it is switched off", () => {
    observedWidth = 600;
    const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={false} />);
    expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).toBeNull();
});

test("drops the column when the panel is too narrow to share", () => {
    observedWidth = 200;
    const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
    expect(container.querySelector(".KibitzChatPanel-body .ChatUserList")).toBeNull();
});

test("does not show the user count button in the composer any more", () => {
    observedWidth = 600;
    const { container } = render(<KibitzChatPanel {...baseProps()} showPeople={true} />);
    expect(container.querySelector(".KibitzChatPanel-composer .ChatUserCount")).toBeNull();
});
```

`ChatUserList` is already mocked in this file if the existing tests reference
it; if not, mock it the way the file mocks its other imports.

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzChatPanel.render.test.tsx`
Expected: FAIL — `showPeople` is not a prop and `ChatUserCount` is still in the
composer.

- [ ] **Step 4: Implement the column**

In `src/views/Kibitz/KibitzChatPanel.tsx`:

Add `showPeople: boolean;` to `KibitzChatPanelProps` and destructure it.

Delete the `showUserList` state and the `ChatUserList` / `ChatUserCount` usage
in the composer. Replace with a measured width and the column:

```tsx
/** Below this the log has no room to share, so the people list is not shown
 *  as a column even when it is switched on. */
const PEOPLE_COLUMN_MIN_REM = 28;

const bodyRef = React.useRef<HTMLDivElement | null>(null);
const [hasRoomForPeople, setHasRoomForPeople] = React.useState(false);

React.useEffect(() => {
    const body = bodyRef.current;
    if (!body || typeof ResizeObserver === "undefined") {
        return;
    }
    const root_font_size =
        parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const measure = () => {
        setHasRoomForPeople(body.clientWidth >= PEOPLE_COLUMN_MIN_REM * root_font_size);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(body);
    return () => observer.disconnect();
}, []);
```

Give `.KibitzChatPanel-body` the `ref={bodyRef}`, and render:

```tsx
{showPeople && hasRoomForPeople ? <ChatUserList channel={room.channel} /> : null}
```

The composer keeps only the `TabCompleteInput`. Remove the `ChatUserCount`
import if nothing else uses it.

- [ ] **Step 5: Add the toggle tab**

In `src/views/Kibitz/KibitzView.tsx`, read and write the preference and declare
the tab. `usePreference` does not cover `data.ts` keys, so use `data`:

```tsx
const [showPeople, setShowPeople] = React.useState(() =>
    data.get("kibitz.people_column", true),
);
const togglePeople = React.useCallback(() => {
    setShowPeople((previous) => {
        const next = !previous;
        data.set("kibitz.people_column", next);
        return next;
    });
}, []);
```

Pass `showPeople={showPeople}` to `KibitzChatPanel` in both places it is
rendered (the waiting layout and the main layout), and declare the tab beside
the settings tab:

```tsx
{!isPortrait && (
    <GobanView.Tab
        id="kibitz-people"
        type="action"
        align="left"
        icon="users"
        title={pgettext("Action that shows or hides the Kibitz people list", "People")}
        active={showPeople}
        onClick={togglePeople}
    />
)}
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn test src/views/Kibitz`
Expected: PASS. Tests constructing `KibitzChatPanelProps` need
`showPeople: false` added.

- [ ] **Step 7: Confirm in the browser**

At 1600x900. Expected: the people list is a column to the right of the chat
log by default, the People button in the action bar switches it off and on,
and the choice survives a reload. Drag the sidebar narrow. Expected: the column
drops out and the log keeps its width.

- [ ] **Step 8: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/lib/data_schema.ts src/views/Kibitz/KibitzChatPanel.tsx src/views/Kibitz/KibitzChatPanel.css src/views/Kibitz/KibitzChatPanel.render.test.tsx src/views/Kibitz/KibitzView.tsx
```

---

### Task 9: The portrait split in GobanView

Adds the opt-in portrait layout. No Kibitz change yet: this task is verified on
its own by opting a scratch consumer in, so that a regression here is not
tangled with Task 11.

**Files:**
- Create: `src/components/GobanView/PortraitSplitter.tsx`
- Create: `src/components/GobanView/PortraitSplitter.test.tsx`
- Create: `src/components/GobanView/resizerUtil.ts`
- Modify: `src/components/GobanView/SidebarResizer.tsx` (use the shared helper)
- Modify: `src/components/GobanView/GobanView.tsx` (the `portraitSplit` prop,
  the stage-height state, two refs and one conditional element in the existing
  portrait tree — no second branch)
- Modify: `src/components/GobanView/GobanView.css` (lines 382-497)
- Modify: `src/components/GobanView/index.ts` (export `PortraitSplitter` if the
  file exports its siblings)
- Modify: `src/lib/preferences.ts:88` (add the new key)
- Modify: `src/views/Kibitz/KibitzView.tsx` (Step 8 turns `portraitSplit` on and
  leaves it on for Task 11)

**Interfaces:**
- Consumes: `sidebarWidthBoundsPx` and `MIN_BOARD_PANE_REM` from Task 6 stay as
  they are; only `remToPx` moves.
- Produces:
  - `resizerUtil.ts`: `export function remToPx(rem: number): number`
  - `PortraitSplitter` props:
    `{ rootRef; stageRef; scrollRef; onPreview: (h: number) => void; onCommit: (h: number | null) => void }`
  - `GobanViewProps` gains `portraitSplit?: boolean`
  - preference `"goban-view-portrait-split": null as number | null`

- [ ] **Step 1: Extract the shared helper**

Create `src/components/GobanView/resizerUtil.ts` with the AGPL header:

```ts
/** Convert a rem measurement to pixels using the document's root font size. */
export function remToPx(rem: number): number {
    const root_font_size = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return rem * root_font_size;
}

/** The smallest the board stage may become in the portrait split. Matches the
 *  portrait board's CSS min-height so the two never drift apart. */
export const MIN_PORTRAIT_STAGE_REM = 8;

/** The smallest the panel area may become in the portrait split. */
export const MIN_PORTRAIT_PANEL_REM = 8;

/** The range the portrait board stage height can be set to, in pixels. */
export function portraitStageBoundsPx(available_height: number): {
    min: number;
    max: number;
} {
    const min = Math.round(remToPx(MIN_PORTRAIT_STAGE_REM));
    const max = Math.max(min, Math.round(available_height - remToPx(MIN_PORTRAIT_PANEL_REM)));
    return { min, max };
}

/** Clamp a stored stage height into the range this viewport allows. Stored
 *  heights travel between devices, so a value from a taller screen must not
 *  leave the board or the panels with no room here. */
export function clampPortraitStage(height: number, available_height: number): number {
    const { min, max } = portraitStageBoundsPx(available_height);
    return Math.round(Math.min(max, Math.max(min, height)));
}
```

In `SidebarResizer.tsx`, delete its local `remToPx` and import it from
`./resizerUtil`.

- [ ] **Step 2: Write the failing test**

Create `src/components/GobanView/PortraitSplitter.test.tsx` with the AGPL
header:

```ts
import { clampPortraitStage, portraitStageBoundsPx } from "./resizerUtil";

test("keeps the panel area its minimum", () => {
    // 800 available, 8rem (128px) reserved for the panels
    expect(portraitStageBoundsPx(800).max).toBe(672);
});

test("keeps the board its minimum", () => {
    expect(portraitStageBoundsPx(800).min).toBe(128);
});

test("never reports a maximum below the minimum on a squat viewport", () => {
    const bounds = portraitStageBoundsPx(200);
    expect(bounds.max).toBe(bounds.min);
});

test("clamps a stored height from a taller screen", () => {
    expect(clampPortraitStage(1400, 800)).toBe(672);
});

test("clamps a stored height that would hide the board", () => {
    expect(clampPortraitStage(10, 800)).toBe(128);
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `yarn test src/components/GobanView/PortraitSplitter.test.tsx`
Expected: FAIL, "Cannot find module './resizerUtil'" until Step 1 is saved;
then PASS. If it passes at this point, that is correct — Step 1 is the
implementation for these five assertions. Move on.

- [ ] **Step 4: Write the splitter component**

`src/components/GobanView/PortraitSplitter.tsx` with the AGPL header. Mirror
`SidebarResizer`'s structure exactly — pointer capture, keyboard handling,
`aria` values, `stopImmediatePropagation` — but on the vertical axis:

```tsx
import * as React from "react";
import { pgettext } from "@/lib/translate";
import { clampPortraitStage, portraitStageBoundsPx, remToPx } from "./resizerUtil";

const KEYBOARD_STEP_REM = 1;
const KEYBOARD_LARGE_STEP_REM = 5;

interface PortraitSplitterProps {
    /** The GobanView root, used to bound the stage to the column height. */
    rootRef: React.RefObject<HTMLDivElement | null>;
    /** The board stage, measured when a drag or key press starts. */
    stageRef: React.RefObject<HTMLDivElement | null>;
    /** Called on every pointer move while dragging with the clamped height. */
    onPreview: (height: number) => void;
    /** Called when the drag ends or a key changes the height. Null resets the
     *  stage to its automatic height. */
    onCommit: (height: number | null) => void;
}

/**
 * The drag handle between the board and the panels in the portrait split.
 * Dragging it down grows the board. Double-tap, Enter or Escape reset it to
 * the automatic height; the up and down arrows nudge it.
 */
export function PortraitSplitter({
    rootRef,
    stageRef,
    onPreview,
    onCommit,
}: PortraitSplitterProps): React.ReactElement {
    const [is_dragging, setIsDragging] = React.useState(false);
    const drag_ref = React.useRef<{
        pointer_id: number;
        start_y: number;
        start_height: number;
        height: number;
    } | null>(null);

    const availableHeight = React.useCallback(
        () => rootRef.current?.clientHeight ?? window.innerHeight,
        [rootRef],
    );

    const clampHeight = React.useCallback(
        (height: number) => clampPortraitStage(height, availableHeight()),
        [availableHeight],
    );

    const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0 || !stageRef.current) {
            return;
        }
        event.preventDefault();
        const start_height = stageRef.current.offsetHeight;
        drag_ref.current = {
            pointer_id: event.pointerId,
            start_y: event.clientY,
            start_height,
            height: start_height,
        };
        event.currentTarget.setPointerCapture?.(event.pointerId);
        setIsDragging(true);
    };

    const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = drag_ref.current;
        if (!drag || drag.pointer_id !== event.pointerId) {
            return;
        }
        drag.height = clampHeight(drag.start_height + (event.clientY - drag.start_y));
        onPreview(drag.height);
    };

    const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
        const drag = drag_ref.current;
        if (!drag || drag.pointer_id !== event.pointerId) {
            return;
        }
        drag_ref.current = null;
        if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
        setIsDragging(false);
        onCommit(drag.height);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
        const current_height = stageRef.current?.offsetHeight;
        if (current_height === undefined) {
            return;
        }
        const step = remToPx(event.shiftKey ? KEYBOARD_LARGE_STEP_REM : KEYBOARD_STEP_REM);
        let next: number | null | undefined;
        switch (event.key) {
            case "ArrowUp":
                next = clampHeight(current_height - step);
                break;
            case "ArrowDown":
                next = clampHeight(current_height + step);
                break;
            case "Enter":
            case "Escape":
                next = null;
                break;
            default:
                return;
        }
        // Kibitz binds the arrow keys to move navigation; keep those
        // shortcuts from firing while the handle has focus.
        event.preventDefault();
        event.stopPropagation();
        event.nativeEvent.stopImmediatePropagation();
        onCommit(next);
    };

    const bounds = portraitStageBoundsPx(availableHeight());

    return (
        <div
            className={"GobanView-portrait-splitter" + (is_dragging ? " is-dragging" : "")}
            role="separator"
            aria-orientation="horizontal"
            aria-label={pgettext(
                "Accessible name of the handle that resizes the board and the panels below it",
                "Resize board",
            )}
            aria-valuenow={stageRef.current?.offsetHeight}
            aria-valuemin={bounds.min}
            aria-valuemax={bounds.max}
            title={pgettext(
                "Tooltip on the handle that resizes the board and the panels below it",
                "Drag to resize, double-tap to reset",
            )}
            tabIndex={0}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={endDrag}
            onDoubleClick={() => onCommit(null)}
            onKeyDown={onKeyDown}
        />
    );
}
```

- [ ] **Step 5: Add the preference**

In `src/lib/preferences.ts`, after line 89:

```ts
"goban-view-portrait-split": null as number | null,
```

- [ ] **Step 6: Wire the prop into GobanView**

In `src/components/GobanView/GobanView.tsx`, add to `GobanViewProps`:

```ts
/** Portrait only: split the view between the board stage and the tab panels,
 *  with a drag handle between them, instead of scrolling both as one column.
 *  The panel area then scrolls on its own and the board is always on screen.
 *  Ignored in landscape. */
portraitSplit?: boolean;
```

Destructure it, and beside the existing sidebar-width state add the stage
height state, the drag state, and a `stageRef`, following the same
`usePreference` + drag-preview pattern the sidebar width already uses.

**Keep one portrait tree.** Do not add a second branch. The existing portrait
JSX stays exactly as it is; the only changes to it are:

1. put `ref={stageRef}` on the existing `.GobanView-stage`, and give it the
   stored height when the split is active:

```tsx
<div
    className="GobanView-stage"
    ref={stageRef}
    style={
        splitActive && stageHeight !== null
            ? ({ height: `${stageHeight}px` } as React.CSSProperties)
            : undefined
    }
>
```

2. render the handle between the stage and the panels, conditionally — this is
   the only element the prop adds:

```tsx
{splitActive && (
    <PortraitSplitter
        rootRef={rootRef}
        stageRef={stageRef}
        onPreview={setDragStageHeight}
        onCommit={commitStageHeight}
    />
)}
```

3. put `ref={panelsRef}` on the existing `.GobanView-mobile-panels`.

`.GobanView-mobile-scroll` keeps wrapping both, in both modes. Step 7's CSS
turns it from a scrolling column into a non-scrolling flex column when the
split is on.

Add `(splitActive ? " has-portrait-split" : "")` and
`(dragStageHeight !== null ? " is-resizing-stage" : "")` to the portrait root's
className, where `const splitActive = isPortrait && !!portraitSplit;`.

A consumer that does not pass `portraitSplit` renders the same elements with
the same classes as before, because the same JSX produced them.

- [ ] **Step 7: Add the CSS**

In `src/components/GobanView/GobanView.css`, inside the `&.portrait` block. Read
what the existing `&.portrait` rules already set on `.GobanView-mobile-scroll`,
`.GobanView-stage` and `.GobanView-mobile-panels` before adding, and make sure
each declaration below actually overrides what is there — a rule that loses the
cascade is the defect this plan has already shipped twice.

```css
&.has-portrait-split {
    /* The column no longer scrolls as a whole: the board is pinned and the
       panels below it scroll on their own. */
    .GobanView-mobile-scroll {
        overflow: hidden;
        display: flex;
        flex-direction: column;
    }

    .GobanView-stage {
        flex-shrink: 0;
        max-height: none;
        min-height: 8rem;
        overflow: hidden;
    }

    .GobanView-portrait-splitter {
        flex-shrink: 0;
        height: 0.75rem;
        cursor: row-resize;
        touch-action: none;
        background: var(--shade4);
        border-top: 1px solid var(--shade3);
        border-bottom: 1px solid var(--shade3);

        &.is-dragging {
            background: var(--shade3);
        }
    }

    .GobanView-mobile-panels {
        flex-grow: 1;
        flex-basis: 0;
        min-height: 0;
        overflow-y: auto;
        overflow-x: hidden;
    }
}

/* An empty header takes no room, so a consumer can drop its title without
   leaving a band above the board. */
.GobanView-header:empty {
    display: none;
}
```

- [ ] **Step 8: Verify the split in the browser**

Temporarily pass `portraitSplit` from `KibitzView`'s `GobanView` call. At
400x800: the board is on screen with the panels below it, the handle drags the
boundary, double-tap resets, the panel area scrolls on its own and the board
does not scroll away. Then reload and confirm the height was remembered.

Leave `portraitSplit` in place — Task 11 needs it.

- [ ] **Step 9: Confirm nothing else changed**

At 400x800, open `/game/1`. Expected: unchanged single-column portrait
behaviour, because `portraitSplit` is not set there.

- [ ] **Step 10: Verify and stop**

```bash
yarn test src/components/GobanView
yarn type-check
yarn lint
yarn prettier:file src/components/GobanView/PortraitSplitter.tsx src/components/GobanView/PortraitSplitter.test.tsx src/components/GobanView/resizerUtil.ts src/components/GobanView/SidebarResizer.tsx src/components/GobanView/GobanView.tsx src/components/GobanView/GobanView.css src/components/GobanView/index.ts src/lib/preferences.ts src/views/Kibitz/KibitzView.tsx
```

---

### Task 10: Centre the portrait board

The portrait stage is as wide as the column while `.GobanView-center` keeps
`aspect-ratio: 1`, so a height-capped board sits against the left edge.

**Files:**
- Modify: `src/components/GobanView/GobanView.css:410-430`

**Interfaces:**
- Consumes: the portrait CSS block from Task 9.
- Produces: nothing.

- [ ] **Step 1: Measure the cause in the browser**

At 400x800 on a Kibitz room, in the console:

```js
const stage = document.querySelector(".GobanView.portrait .GobanView-stage");
const board = document.querySelector(".GobanView.portrait .goban-container");
console.log(stage.getBoundingClientRect(), board.getBoundingClientRect());
```

Expected, if the diagnosis is right: the stage spans the full column while the
board is narrower and its left edge matches the stage's. Record the two rects.

- [ ] **Step 2: If the measured cause is different, fix that instead**

Write the measured cause into this task, amend the spec's section 1.4, and
implement the fix the measurement points at rather than the one below.

- [ ] **Step 3: Centre the board — NOT with the landscape trick**

The landscape centring uses `width: min(100%, var(--goban-view-board-size))`.
**Do not copy that here; it is a no-op in portrait.**
`--goban-view-board-size` is `calc(100cqh - var(--goban-view-board-inset))`
(`GobanView.css:87`) resolved against `container-type: size` on the GobanView
**root** (`GobanView.css:69`), so in portrait it is the whole view height, not
the stage height. On a portrait viewport that value exceeds the column width, so
`min(100%, ...)` collapses to `100%` and nothing is centred.

Centre with flex alignment on the portrait board area instead. In the
`&.portrait` block:

```css
.GobanView-center {
    align-items: center;
    justify-content: center;
}
```

If the board is still left-aligned after that, the offset is inside
`.goban-container` rather than around it; measure again and centre the element
the measurement names. The acceptance for this task is the measurement in
Step 4, not any particular declaration.

- [ ] **Step 4: Confirm in the browser**

Re-run the Step 1 measurement. Expected: the board's left and right margins
inside the column are equal to within a pixel. Check at 400x800 and at
360x640, and with the split dragged both large and small.

- [ ] **Step 5: Confirm landscape is unchanged**

At 1600x900 on a Kibitz room and on `/game/1`. Expected: no change to board
position.

- [ ] **Step 6: Verify and stop**

```bash
yarn test src/components/GobanView
yarn type-check
yarn lint
yarn prettier:file src/components/GobanView/GobanView.css
```

---

### Task 11: The Kibitz portrait panes

The largest task. Turns the portrait layout into five panes switched from the
action bar, drops the portrait title, and removes the Rooms takeover.

**Files:**
- Create: `src/views/Kibitz/KibitzPortraitPanes.tsx`
- Create: `src/views/Kibitz/KibitzPortraitPanes.css`
- Create: `src/views/Kibitz/kibitzPortraitPane.ts`
- Create: `src/views/Kibitz/kibitzPortraitPane.test.ts`
- Create: `src/views/Kibitz/KibitzPortraitPanes.test.tsx`
- Modify: `src/lib/data_schema.ts` (`KibitzSchema`)
- Modify: `src/views/Kibitz/KibitzView.tsx`
- Modify: `src/views/Kibitz/KibitzView.css`
- Modify: `src/views/Kibitz/KibitzChatPanel.tsx` (`mode`, `visible`,
  `onUnreadChange`)
- Modify: `src/components/GobanView/TabBar.css` (portrait button density)

**Interfaces:**
- Consumes: `portraitSplit` (Task 9), `KibitzVariationChip` (Task 5),
  `showPeople` (Task 8), `variationColorIndexes` (Task 4).
- Produces:
  - `kibitzPortraitPane.ts`:
    `type KibitzPortraitPane = "game-chat" | "room-chat" | "people" | "variations" | "rooms"`,
    `const KIBITZ_PORTRAIT_PANES: readonly KibitzPortraitPane[]`,
    `function readPortraitPane(): KibitzPortraitPane`,
    `function writePortraitPane(pane: KibitzPortraitPane): void`
  - `KibitzPortraitPanes` props:
    `{ active: KibitzPortraitPane; chat: KibitzChatPanelProps; leftAside: KibitzLeftAsideProps; roomChannel: string }`
  - `KibitzChatPanelProps` gains
    `mode?: "game" | "room"`, `visible?: boolean`,
    `onUnreadChange?: (unread: { room: boolean; game: boolean }) => void`

- [ ] **Step 1: Add the preference key and write the failing migration test**

In `src/lib/data_schema.ts`, extend `KibitzSchema`:

```ts
/** Which panel the portrait Kibitz layout shows below the board. */
portrait_pane: "game-chat" | "room-chat" | "people" | "variations" | "rooms";
```

Leave `chat_tab` in place: the migration reads it.

Create `src/views/Kibitz/kibitzPortraitPane.test.ts` with the AGPL header:

```ts
import * as data from "@/lib/data";
import { readPortraitPane, writePortraitPane } from "./kibitzPortraitPane";

beforeEach(() => {
    data.remove("kibitz.portrait_pane");
    data.remove("kibitz.chat_tab");
});

test("defaults to the room chat", () => {
    expect(readPortraitPane()).toBe("room-chat");
});

test("round-trips a stored pane", () => {
    writePortraitPane("variations");
    expect(readPortraitPane()).toBe("variations");
});

test("migrates the old chat tab and clears it", () => {
    data.set("kibitz.chat_tab", "game");
    expect(readPortraitPane()).toBe("game-chat");
    expect(data.get("kibitz.chat_tab", undefined)).toBeUndefined();
});

test("ignores a stored value that is not a pane", () => {
    data.set("kibitz.portrait_pane", "nonsense" as never);
    expect(readPortraitPane()).toBe("room-chat");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/kibitzPortraitPane.test.ts`
Expected: FAIL, "Cannot find module './kibitzPortraitPane'".

- [ ] **Step 3: Write the pane module**

`src/views/Kibitz/kibitzPortraitPane.ts` with the AGPL header:

```ts
import * as data from "@/lib/data";

export type KibitzPortraitPane =
    | "game-chat"
    | "room-chat"
    | "people"
    | "variations"
    | "rooms";

export const KIBITZ_PORTRAIT_PANES: readonly KibitzPortraitPane[] = [
    "game-chat",
    "room-chat",
    "people",
    "variations",
    "rooms",
];

const DEFAULT_PANE: KibitzPortraitPane = "room-chat";

function isPane(value: unknown): value is KibitzPortraitPane {
    return KIBITZ_PORTRAIT_PANES.includes(value as KibitzPortraitPane);
}

/** Which pane the portrait layout shows. Seeds itself once from the chat tab
 *  the two-tab portrait layout used, then forgets that key. */
export function readPortraitPane(): KibitzPortraitPane {
    const stored = data.get("kibitz.portrait_pane", undefined);
    if (isPane(stored)) {
        return stored;
    }

    const legacy = data.get("kibitz.chat_tab", undefined);
    if (legacy === "game" || legacy === "room") {
        const migrated: KibitzPortraitPane = legacy === "game" ? "game-chat" : "room-chat";
        data.set("kibitz.portrait_pane", migrated);
        data.remove("kibitz.chat_tab");
        return migrated;
    }

    return DEFAULT_PANE;
}

export function writePortraitPane(pane: KibitzPortraitPane): void {
    data.set("kibitz.portrait_pane", pane);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn test src/views/Kibitz/kibitzPortraitPane.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Give KibitzChatPanel a mode, a visibility and an unread report**

In `src/views/Kibitz/KibitzChatPanel.tsx`, add to `KibitzChatPanelProps`:

```tsx
/** Portrait only: which chat to show. The panel renders no tab strip when
 *  this is set, because the tab bar switches between the two instead. */
mode?: "game" | "room";
/** False while the pane holding this panel is hidden. A hidden pane measures
 *  as zero, so the log cannot be scrolled to the latest line until it is
 *  shown again. */
visible?: boolean;
/** Reports the unread state of both chats so the tab bar can show a dot on
 *  the chat that is not on screen. */
onUnreadChange?: (unread: { room: boolean; game: boolean }) => void;
```

Replace the internal tab state so an external mode wins:

```tsx
const [internalTab, setInternalTab] = React.useState<ChatTab>(readTab);
const tab: ChatTab = mode ?? internalTab;
const setTab = setInternalTab;
```

Fold `visible` into the two visibility flags:

```tsx
const paneVisible = visible ?? true;
const roomVisible = paneVisible && tab === "room";
const gameVisible = paneVisible && tab === "game";
```

Both existing scroll `useLayoutEffect`s already depend on those flags, so
revealing a pane re-runs them and the log lands on the latest line.

Persist only when the panel owns the mode:

```tsx
React.useEffect(() => {
    if (!mode) {
        data.set("kibitz.chat_tab", internalTab);
    }
}, [internalTab, mode]);
```

Report unread upward:

```tsx
React.useEffect(() => {
    onUnreadChange?.({ room: roomUnread, game: gameUnread });
}, [roomUnread, gameUnread, onUnreadChange]);
```

Render the tab strip only when the panel owns the mode:

```tsx
{!mode && (
    <div className="KibitzChatPanel-tabs" role="tablist">
        ...unchanged...
    </div>
)}
```

- [ ] **Step 6: Write the panes component**

`src/views/Kibitz/KibitzPortraitPanes.tsx` with the AGPL header. Every pane is
rendered; the inactive four are hidden with the `hidden` attribute, so nothing
unmounts on a switch.

```tsx
import * as React from "react";
import { ChatUserList } from "@/components/ChatUserList";
import { KibitzChatPanel, KibitzChatPanelProps } from "./KibitzChatPanel";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzVariationList } from "./KibitzVariationList";
import { KibitzMiniMainBoard } from "./KibitzMiniMainBoard";
import type { KibitzLeftAsideProps } from "./KibitzLeftAside";
import type { KibitzPortraitPane } from "./kibitzPortraitPane";
import "./KibitzPortraitPanes.css";

interface KibitzPortraitPanesProps {
    active: KibitzPortraitPane;
    chat: KibitzChatPanelProps;
    leftAside: KibitzLeftAsideProps;
    roomChannel: string;
}

/**
 * The five panels that share the area below the board in portrait. All of
 * them stay mounted and the inactive ones are hidden, so switching panes
 * never re-joins a chat channel, drops the watched game's chat subscription
 * or loses the log's scroll position.
 */
export function KibitzPortraitPanes({
    active,
    chat,
    leftAside,
    roomChannel,
}: KibitzPortraitPanesProps): React.ReactElement {
    return (
        <div className="KibitzPortraitPanes">
            <div className="KibitzPortraitPanes-pane" hidden={active !== "game-chat"}>
                <KibitzChatPanel {...chat} mode="game" visible={active === "game-chat"} />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "room-chat"}>
                <KibitzChatPanel {...chat} mode="room" visible={active === "room-chat"} />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "people"}>
                <ChatUserList channel={roomChannel} />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "variations"}>
                <KibitzVariationList
                    variations={leftAside.variations}
                    currentGameId={leftAside.currentGameId}
                    gameById={leftAside.variationGameById}
                    colorIndexes={leftAside.variationColorIndexes}
                    selectedVariationId={leftAside.selectedVariationId}
                    variationFocusRequestId={leftAside.variationFocusRequestId}
                    blockedVariationFlashId={leftAside.blockedVariationFlashId}
                    onRecallVariation={leftAside.onRecallVariation}
                    onHideVariation={leftAside.onHideVariation}
                    onCreateVariation={leftAside.onCreateVariation}
                    onClearAll={leftAside.onClearVariations}
                />
            </div>
            <div className="KibitzPortraitPanes-pane" hidden={active !== "rooms"}>
                <KibitzRoomList
                    rooms={leftAside.rooms}
                    activeRoomId={leftAside.activeRoomId}
                    onSelectRoom={leftAside.onSelectRoom}
                    onCreateRoom={leftAside.onCreateRoom}
                    canOpenCreateRoomFlow={leftAside.canOpenCreateRoomFlow}
                    signInHref={leftAside.signInHref}
                    blockedRoomIds={leftAside.blockedRoomIds}
                />
                {leftAside.miniBoardController && (
                    <KibitzMiniMainBoard
                        controller={leftAside.miniBoardController}
                        onClick={leftAside.onExitVariation}
                    />
                )}
            </div>
        </div>
    );
}
```

Two rules this code depends on: `[hidden]` must actually hide, and only one
place may mount the mini board. `KibitzView` already computes
`miniBoardController` as null whenever the centre shows the main board, and
the landscape aside is not rendered in portrait, so only this pane mounts it.

`src/views/Kibitz/KibitzPortraitPanes.css`:

```css
.KibitzPortraitPanes {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;

    .KibitzPortraitPanes-pane {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        min-height: 0;

        &[hidden] {
            display: none;
        }
    }
}
```

- [ ] **Step 7: Write the panes test**

Create `src/views/Kibitz/KibitzPortraitPanes.test.tsx` with the AGPL header.
Mock the four child components so the test is about mounting, not their
contents:

```tsx
jest.mock("./KibitzChatPanel", () => ({
    __esModule: true,
    KibitzChatPanel: ({ mode }: { mode: string }) => {
        React.useEffect(() => {
            mounts.push(mode);
        }, [mode]);
        return <div data-testid={`chat-${mode}`} />;
    },
}));
```

```tsx
test("keeps every pane mounted when the active pane changes", () => {
    const { rerender } = render(<KibitzPortraitPanes {...props("room-chat")} />);
    expect(mounts).toEqual(["game", "room"]);
    rerender(<KibitzPortraitPanes {...props("people")} />);
    // No remount: switching panes must not re-join the chat channel.
    expect(mounts).toEqual(["game", "room"]);
});

test("hides the panes that are not active", () => {
    const { container } = render(<KibitzPortraitPanes {...props("variations")} />);
    const panes = [...container.querySelectorAll(".KibitzPortraitPanes-pane")];
    expect(panes.filter((pane) => !pane.hasAttribute("hidden"))).toHaveLength(1);
});
```

Write a `props(active)` helper that builds the required props from the same
fixtures `KibitzVariationList.test.tsx` uses.

- [ ] **Step 8: Run the tests**

Run: `yarn test src/views/Kibitz/KibitzPortraitPanes.test.tsx`
Expected: PASS, 2 tests.

- [ ] **Step 9: Rework KibitzView's portrait branch**

In `src/views/Kibitz/KibitzView.tsx`:

Add the pane state:

```tsx
const [pane, setPane] = React.useState(readPortraitPane);
const [chatUnread, setChatUnread] = React.useState({ room: false, game: false });
const selectPane = React.useCallback((next: KibitzPortraitPane) => {
    setPane(next);
    writePortraitPane(next);
}, []);
```

Pass `portraitSplit={isPortrait}` to `GobanView`.

Make the header conditional. Portrait gets the chip alone, and nothing at all
on the live game:

```tsx
header={isPortrait ? variationChip : <div className="Kibitz-header">...</div>}
```

`variationChip` is null in main mode, so `.GobanView-header:empty` from Task 9
collapses the row and the portrait title is gone.

Replace the `kibitz-main` tab's chat with the panes in portrait:

```tsx
<GobanView.Tab id="kibitz-main" type="always">
    {props.banner}
    <KibitzProposalPanel {...props.proposals} />
    {viewingOther && gobans.secondary && (
        <KibitzVariationPanel ... />
    )}
    {isPortrait ? (
        <KibitzPortraitPanes
            active={pane}
            chat={{ ...props.chat, gameController: gobans.main, showPeople: false,
                    onUnreadChange: setChatUnread }}
            leftAside={{ ...props.leftAside, miniBoardController, onExitVariation: exitVariation }}
            roomChannel={room.channel}
        />
    ) : (
        <KibitzChatPanel
            {...props.chat}
            gameController={gobans.main}
            showPeople={showPeople}
        />
    )}
</GobanView.Tab>
```

Delete the `kibitz-rooms` takeover tab entirely, and the `onRoomsOpened`
plumbing that only existed to refresh the directory when it opened — move that
call into `selectPane` when the next pane is `"rooms"`.

Declare the five pane tabs, portrait only:

```tsx
{isPortrait &&
    KIBITZ_PORTRAIT_PANES.map((id) => (
        <GobanView.Tab
            key={id}
            id={`kibitz-pane-${id}`}
            type="action"
            align="left"
            icon={PANE_ICONS[id]}
            title={PANE_TITLES[id]()}
            active={pane === id}
            onClick={() => selectPane(id)}
        />
    ))}
```

`PANE_ICONS` is a module-level `Record<KibitzPortraitPane, string>` of
`comment`, `comments`, `users`, `sitemap`, `list`. `PANE_TITLES` is a
`Record<KibitzPortraitPane, () => string>` of `pgettext` calls — functions, not
values, so the strings are read after the language is set.

For the unread dots, the tab bar renders only an icon, so pass a node rather
than a string for the two chat panes:

```tsx
icon={
    <span className="Kibitz-pane-icon">
        <i className={`fa fa-${PANE_ICONS[id]}`} />
        {id === "game-chat" && chatUnread.game && pane !== id ? (
            <span className="Kibitz-pane-unread" />
        ) : null}
        {id === "room-chat" && chatUnread.room && pane !== id ? (
            <span className="Kibitz-pane-unread" />
        ) : null}
    </span>
}
```

In `KibitzView.css`, give `.Kibitz-pane-icon` `position: relative;` and
`.Kibitz-pane-unread` the same dot styling `.KibitzChatPanel-unread` uses.

- [ ] **Step 10: Tighten the portrait tab bar**

In `src/components/GobanView/TabBar.css`, inside the portrait rules, reduce
`.GobanView-tab-button` width and the group `gap` enough for nine buttons at
360px. Measure rather than guess: at 360x640 the bar must not overflow and no
button may be narrower than 2.25rem, which is the accessible touch minimum
this codebase uses elsewhere. If nine will not fit at 2.25rem, reduce the
horizontal padding on `.GobanView-tab-bar` first.

- [ ] **Step 11: Run the tests**

Run: `yarn test src/views/Kibitz src/components/GobanView`
Expected: PASS. `KibitzView.test.tsx` asserts on the Rooms takeover; rewrite
those assertions against the panes rather than restoring the takeover.

- [ ] **Step 12: Confirm in the browser**

At 400x800 on a Kibitz room with a live game:
- The board and one panel are on screen together; no room title above the board.
- Each of the five action-bar buttons switches the panel below the board.
- The chat log sits directly above its input with no gap.
- Opening Rooms does not cover the board and shows no duplicated headings.
- Switching to People and back to a chat keeps the log's scroll position and
  lands on the latest line.
- Opening a variation shows the chip where the title used to be.
- Dragging the split works and survives a reload.
- The board is centred.

- [ ] **Step 13: Verify and stop**

```bash
yarn test src/views/Kibitz src/components/GobanView
yarn type-check
yarn lint
yarn prettier:file <every file listed above>
```

---

### Task 12: The Analysis button toggles off

**Files:**
- Modify: `src/views/Kibitz/KibitzView.tsx` (the `kibitz-new-variation` tab)
- Test: `src/views/Kibitz/KibitzView.test.tsx`

**Interfaces:**
- Consumes: `exitVariation` from `KibitzView`, which already runs the
  unsaved-moves confirmation through `props.onExitVariation`.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

`src/views/Kibitz/KibitzView.test.tsx` builds props with a `baseProps()`
factory (around line 80) and renders with `render(<KibitzView {...props} />)`,
selecting tab buttons by title (`screen.getByTitle("Return to game")`). Follow
that, inside the existing `describe("KibitzView", ...)` block:

```tsx
test("the analysis action leaves the draft when it is already active", async () => {
    const props = baseProps();
    const secondary = fakeController();
    props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "draft" };
    props.onCreateVariation = jest.fn();
    props.onExitVariation = jest.fn();
    render(<KibitzView {...props} />);
    await userEvent.click(screen.getByTitle("New variation"));
    expect(props.onExitVariation).toHaveBeenCalledTimes(1);
    expect(props.onCreateVariation).not.toHaveBeenCalled();
});

test("the analysis action starts a draft when it is not active", async () => {
    const props = baseProps();
    props.onCreateVariation = jest.fn();
    props.onExitVariation = jest.fn();
    render(<KibitzView {...props} />);
    await userEvent.click(screen.getByTitle("New variation"));
    expect(props.onCreateVariation).toHaveBeenCalledTimes(1);
    expect(props.onExitVariation).not.toHaveBeenCalled();
});
```

`baseProps()` does not set `onCreateVariation`, so add it there or on the
returned object as above; the tab only renders when it is present. Import
`userEvent` from `@testing-library/user-event` if the file does not already.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzView.test.tsx -t "analysis action"`
Expected: FAIL — the first test calls `onCreateVariation` instead of
`onExitVariation`.

- [ ] **Step 3: Make the tab toggle**

In `src/views/Kibitz/KibitzView.tsx`:

```tsx
{props.onCreateVariation && (
    <GobanView.Tab
        id="kibitz-new-variation"
        type="action"
        align="left"
        icon="sitemap"
        title={pgettext("Action that starts a new Kibitz variation", "New variation")}
        active={gobans.centerMode === "draft"}
        disabled={!gobans.main}
        onClick={
            gobans.centerMode === "draft" ? exitVariation : props.onCreateVariation
        }
    />
)}
```

`exitVariation` already routes through `props.onExitVariation`, which asks
before discarding a draft that has unposted moves.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test src/views/Kibitz/KibitzView.test.tsx`
Expected: PASS.

- [ ] **Step 5: Confirm in the browser**

At 400x800 and 1600x900: press Analysis, then press it again. Expected: the
first press opens the draft, the second leaves it. With a move played in the
draft, the second press asks before discarding.

- [ ] **Step 6: Verify and stop**

```bash
yarn test src/views/Kibitz
yarn type-check
yarn lint
yarn prettier:file src/views/Kibitz/KibitzView.tsx src/views/Kibitz/KibitzView.test.tsx
```

---

### Task 13: Documentation, full browser pass and build

**Files:**
- Modify: `docs/kibitz.md`
- Modify: `docs/superpowers/specs/2026-09-08-kibitz-layout-panes-design.md` if
  any task found the spec wrong

**Interfaces:**
- Consumes: everything.
- Produces: the reviewed, unverified-nothing state anoek commits.

- [ ] **Step 1: Update the durable document**

In `docs/kibitz.md`, rewrite the Layout section. It currently says portrait is
"GobanView's single column, with the left aside content behind one takeover
tab, 'Rooms'". Replace with the split and the five panes, and note that the
landscape sidebar now carries the game-info strip, the people column and the
variation chip. Delete what has become false rather than appending to it.

Add a short Variations paragraph: each visible variation holds one move-tree
line colour, the colour travels with the visible-variation list so a newly
opened variation is composed in its own colour, and variations are composed in
list order so the branch order does not move.

- [ ] **Step 2: Walk every reported item in the browser**

At 400x800 and again at 1600x900, confirm each of the nine items. Take one
screenshot per viewport into `.playwright-mcp/` for the report.

1. Portrait: chat tabs are in the action bar, the chat is on screen with the
   board, the split drags.
2. Portrait: no title.
3. The people list is an action-bar toggle, not a control by the chat input.
4. Landscape: the people list is a right-hand column by default and toggles off.
5. Portrait: Variations is a pane sharing the area with the chats and people.
6. Variation colours: swatches in the list and in chat, a named chip, stable
   branch order, and a new variation from chat never opens red when red is
   taken.
7. Portrait polish: no overlapping Rooms and Variations labels, no gap above
   the chat input, the board is centred, Analysis toggles off.
8. Landscape: rules, time and board size on screen at all times; an older
   variation says which game it belongs to; changing the game in a room does
   not throw.
9. The sidebar handle stops with the board still visible.

Any item that does not pass is a defect in this work: fix it, do not report it
as done.

- [ ] **Step 3: Run the whole test suite**

Run: `yarn test`
Expected: PASS, with no test skipped or weakened to get there.

- [ ] **Step 4: Run the static checks and the build**

```bash
yarn type-check
yarn lint
yarn build
```

Expected: all three clean. `yarn build` is slow, which is why it runs only
here.

- [ ] **Step 5: Refresh the knowledge graph**

Run: `graphify update .`

- [ ] **Step 6: Report and stop**

Report to anoek: what changed, what was verified and how, which screenshots
were taken, and anything left undone with the reason. Remind them to do a
manual pass in a real mobile browser and a real desktop browser before opening
the PR, since Playwright at 400x800 is not a touch device.

Leave every change in the working tree. Do not commit and do not push.

---

## Self-Review

**Spec coverage**

| Spec section | Task |
| --- | --- |
| 1.1 Portrait layout | 9 |
| 1.2 The handle | 9 |
| 1.3 Bounds and persistence | 9 |
| 1.4 Board centring (7c) | 10 |
| 2.1 The pane set | 11 |
| 2.2 How panes reach the tab bar | 11 |
| 2.3 Tab bar density | 11 |
| 2.4 What this removes (7a) | 11 |
| 2.5 Chat panel height (7b) | 11 |
| 3 Header and the chip (item 2, 6b, goal 8) | 5, 11 |
| 4.1 People column (item 4) | 8 |
| 4.2 Game info strip (item 8) | 7 |
| 4.3 Sidebar minimum board width (item 9) | 6 |
| 5.1 Colour assignment synchronous (6d) | 2 |
| 5.2 Branch order stable (6c) | 3 |
| 5.3 Swatches (6a) | 4 |
| 5.4 Name (6b) | 5 |
| 6.1 Analysis toggle (7d) | 12 |
| 6.2 Change board crash | 1 |
| 7 Files | all |
| 8 Testing | every task, plus 13 |
| 9 Order of work | the task order |

No spec section is unassigned.

**Type consistency**

- `variationColorIndexes: Record<string, number>` is the name used on
  `KibitzInner`'s state alias, `KibitzLeftAsideProps`, `KibitzChatPanelProps`
  and `KibitzPortraitPanes`. `KibitzVariationList` takes the same map under its
  own prop name `colorIndexes`, which Tasks 4 and 11 both use.
- `KibitzVariationSwatch` takes `colorIndex: number | null | undefined`
  everywhere; the chip passes `colorIndex: number | null`.
- `withVisibleVariationIds(previous, ids)` is the only writer of
  `KibitzVisibleVariations`, used at both call sites in Task 2.
- `remToPx` lives in `resizerUtil.ts` after Task 9 and is imported by both
  resizers.
- `readPortraitPane` / `writePortraitPane` are the only readers and writers of
  `kibitz.portrait_pane`.

**Known gap, deliberately left open**

Task 1 cannot carry pre-written code because the crash has no reproduction
yet. Its steps are concrete about how to obtain one and it stops rather than
guessing. If it does not reproduce, the task reports and the plan continues.
