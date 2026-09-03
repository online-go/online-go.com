# Kibitz on GobanView Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Kibitz page onto the shared GobanView layout, adding an optional left aside and optional player bars to GobanView, and delete the Kibitz-only board hosting, sizing, transport, and scoreboard code.

**Architecture:** GobanView gains two optional props (`leftAside`, `playerBars`). A new `useKibitzGobans` hook owns the two GobanControllers (main game and secondary draft/variation/preview) and hands GobanView whichever is in the center. A new `KibitzView` component composes GobanView with Kibitz panels; `KibitzInner` keeps its non-layout state and renders `KibitzView`. KibitzRoomStage, KibitzBoard, the sizing module, both scoreboards, and the rest of the layout-only code are deleted.

**Tech Stack:** React 18 function components, TypeScript (no `any`), PostCSS nested CSS, Jest + jsdom + @testing-library/react, yarn.

**Spec:** `docs/superpowers/specs/2026-09-03-kibitz-gobanview-design.md`

## Global Constraints

- No `any` types. No emojis. Use `yarn`, never `npm`.
- One component per file. Each component has its own `.tsx` and matching `.css`.
- All user-visible strings go through `pgettext(context, msgid)` (or `_`, `ngettext`, `interpolate`) from `@/lib/translate`.
- No pulsing animations. No `translateX`/`translateY` on hover. No hover background changes on non-interactive elements.
- CSS uses PostCSS nested syntax. Runtime variables live in `src/global_styl/01_variables.css`.
- Comments explain complicated code or document functions and classes only. No chain-of-thought comments.
- Before each commit: `yarn type-check`, `yarn lint`, `yarn prettier:file <modified files>`. Run `yarn build` once at the end.
- Every source file starts with the AGPL header block copied from any existing `.tsx` file in `src/components/GobanView/`.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017JhzMHkqtu6hG23fWGxQQ3
  ```
- Test command for a single file: `yarn test <path>`.

## File structure

**GobanView (Phase 1)**

| File | Responsibility |
| --- | --- |
| `src/components/GobanView/util.ts` | Gains `user_color`. |
| `src/components/GobanView/util.test.ts` | New. Tests `user_color`. |
| `src/components/GobanView/PlayerBar.tsx` / `.css` | New. One player's icon, name, score line, clock. |
| `src/components/GobanView/PlayerBar.test.tsx` | New. |
| `src/components/GobanView/GobanView.tsx` / `.css` | Gains `leftAside` and `playerBars` props. |
| `src/components/GobanView/index.ts` | Exports `PlayerBar`, `user_color`. |
| `src/global_styl/01_variables.css` | `--goban-view-left-aside-width`. |
| `src/views/Game/util.ts`, `src/views/Game/Game.tsx` | Import `user_color` from GobanView. |

**Kibitz (Phase 2)**

| File | Responsibility |
| --- | --- |
| `src/models/kibitz.d.ts`, `src/views/Kibitz/KibitzController.ts` | Drop the pane `size` mode. |
| `src/views/Kibitz/useKibitzGobans.ts` / `.test.ts` | New. Controller ownership. |
| `src/views/Kibitz/KibitzMiniMainBoard.tsx` / `.css` | New. Non-interactive main board thumbnail. |
| `src/views/Kibitz/KibitzLeftAside.tsx` / `.css` | New. Rooms, variations, mini board column. |
| `src/views/Kibitz/KibitzChatPanel.tsx` / `.css` / `.render.test.tsx` / `.test.ts` | Renamed from `KibitzSharedStreamPanel`; two tabs plus room user list. |
| `src/views/Kibitz/KibitzVariationPanel.tsx` / `.css` | New. Draft and posted variation controls. |
| `src/views/Kibitz/KibitzProposalPanel.tsx` / `.css` | New. Proposal bar and queue wrapper. |
| `src/views/Kibitz/KibitzMoreActionsPopover.tsx` / `.css` | New. Game info, link, SGF, call moderator. |
| `src/views/Kibitz/KibitzView.tsx` / `.css` / `.test.tsx` | New. The GobanView consumer. |
| `src/views/Kibitz/KibitzInner.tsx` | Keeps state, renders `KibitzView`. |
| `src/views/Kibitz/KibitzVariationList.tsx` | Gains the New variation button. |
| `src/views/Kibitz/KibitzRoomList.tsx` | Loses `onCreateVariation`. |
| `src/views/Kibitz/Kibitz.css` | Reduced to root and streamer mode rules. |

**Docs (Phase 3)**

| File | Responsibility |
| --- | --- |
| `docs/kibitz.md` | Durable description of the Kibitz layout and controller ownership. |

---

## Phase 1: GobanView extensions

### Task 1: Move `user_color` into GobanView util

**Files:**
- Modify: `src/components/GobanView/util.ts`
- Create: `src/components/GobanView/util.test.ts`
- Modify: `src/components/GobanView/index.ts`
- Modify: `src/views/Game/util.ts:37-52` (remove the function)
- Modify: `src/views/Game/Game.tsx:34` (import path)

**Interfaces:**
- Produces: `user_color(goban: Goban, player_id: number): "black" | "white" | null` exported from `@/components/GobanView`.

- [x] **Step 1: Write the failing test**

Create `src/components/GobanView/util.test.ts`:

```ts
import { Goban } from "goban";
import { user_color } from "./util";

function fakeGoban(opts: {
    black_id: number;
    white_id: number;
    rengo?: boolean;
    rengo_teams?: { black: Array<{ id: number }>; white: Array<{ id: number }> };
}): Goban {
    const engine = {
        playerColor: (id: number): "black" | "white" | "invalid" =>
            id === opts.black_id ? "black" : id === opts.white_id ? "white" : "invalid",
        rengo: opts.rengo ?? false,
        rengo_teams: opts.rengo_teams,
    };
    return { engine } as unknown as Goban;
}

describe("user_color", () => {
    test("returns the seat color for a player", () => {
        const goban = fakeGoban({ black_id: 1, white_id: 2 });
        expect(user_color(goban, 1)).toBe("black");
        expect(user_color(goban, 2)).toBe("white");
    });

    test("returns null for a spectator", () => {
        const goban = fakeGoban({ black_id: 1, white_id: 2 });
        expect(user_color(goban, 99)).toBeNull();
    });

    test("finds rengo team members", () => {
        const goban = fakeGoban({
            black_id: 1,
            white_id: 2,
            rengo: true,
            rengo_teams: { black: [{ id: 1 }, { id: 5 }], white: [{ id: 2 }, { id: 6 }] },
        });
        expect(user_color(goban, 6)).toBe("white");
    });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/GobanView/util.test.ts`
Expected: FAIL, `user_color` is not exported from `./util`.

- [x] **Step 3: Move the function**

Append to `src/components/GobanView/util.ts` (add `import { Goban } from "goban";` at the top):

```ts
/** Which seat the given player occupies, including rengo team membership.
 *  Returns null for spectators. */
export function user_color(goban: Goban, player_id: number): "black" | "white" | null {
    const engine = goban.engine;
    const color = engine.playerColor(player_id);
    if (color !== "invalid") {
        return color;
    }
    if (engine.rengo && engine.rengo_teams) {
        for (const team of ["black", "white"] as const) {
            if (engine.rengo_teams[team].some((player) => player.id === player_id)) {
                return team;
            }
        }
    }
    return null;
}
```

Delete the same function from `src/views/Game/util.ts` (lines 37 to 52). If `Goban` is no longer used there, drop its import.

In `src/components/GobanView/index.ts` change the util export line to:

```ts
export { goban_view_mode, goban_view_squashed, user_color } from "./util";
```

In `src/views/Game/Game.tsx` line 34, replace `import { goban_view_mode, user_color } from "./util";` with:

```ts
import { goban_view_mode } from "./util";
import { user_color } from "@/components/GobanView";
```

If `Game.tsx` already imports from `@/components/GobanView`, add `user_color` to that import instead.

- [x] **Step 4: Run the test and type-check**

Run: `yarn test src/components/GobanView/util.test.ts && yarn type-check`
Expected: PASS, no type errors.

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/components/GobanView/util.ts src/components/GobanView/util.test.ts src/components/GobanView/index.ts src/views/Game/util.ts src/views/Game/Game.tsx
git add -A src/components/GobanView src/views/Game/util.ts src/views/Game/Game.tsx
git commit -m "refactor: move user_color into GobanView util"
```

---

### Task 2: PlayerBar component

**Files:**
- Create: `src/components/GobanView/PlayerBar.tsx`
- Create: `src/components/GobanView/PlayerBar.css`
- Create: `src/components/GobanView/PlayerBar.test.tsx`
- Modify: `src/components/GobanView/index.ts`

**Interfaces:**
- Consumes: `useGobanController` from `./GobanViewContext`, `generateGobanHook` from `./hooks`.
- Produces: `export function PlayerBar({ color }: { color: "black" | "white" }): React.ReactElement`.

- [x] **Step 1: Write the failing test**

Create `src/components/GobanView/PlayerBar.test.tsx`:

```tsx
import * as React from "react";
import { render, screen } from "@testing-library/react";
import { GobanController } from "@/lib/GobanController";
import { GobanControllerContext } from "./GobanViewContext";
import { PlayerBar } from "./PlayerBar";

jest.mock("@/components/Clock", () => ({
    __esModule: true,
    Clock: ({ color }: { color: string }) => <div data-testid={`clock-${color}`} />,
}));
jest.mock("@/components/PlayerIcon", () => ({
    __esModule: true,
    PlayerIcon: ({ id }: { id: number }) => <div data-testid={`icon-${id}`} />,
}));
jest.mock("@/components/Player", () => ({
    __esModule: true,
    Player: ({ user }: { user: number }) => <span>{`player-${user}`}</span>,
}));

function fakeController(opts: {
    phase: "play" | "stone removal" | "finished";
    outcome?: string;
    mode?: string;
    to_move?: number;
}): GobanController {
    const goban = {
        mode: opts.mode ?? "play",
        engine: {
            phase: opts.phase,
            outcome: opts.outcome ?? "",
            players: {
                black: { id: 11, username: "blackie" },
                white: { id: 22, username: "whitey" },
            },
            playerToMoveOnOfficialBranch: () => opts.to_move ?? 11,
            computeScore: () => ({
                black: { prisoners: 3, total: 40.5 },
                white: { prisoners: 1, total: 38 },
            }),
        },
        on: jest.fn(),
        off: jest.fn(),
    };
    return { goban } as unknown as GobanController;
}

function renderBar(controller: GobanController, color: "black" | "white") {
    return render(
        <GobanControllerContext.Provider value={controller}>
            <PlayerBar color={color} />
        </GobanControllerContext.Provider>,
    );
}

describe("PlayerBar", () => {
    test("shows captures during play", () => {
        renderBar(fakeController({ phase: "play" }), "black");
        expect(screen.getByText("3 captures")).toBeInTheDocument();
        expect(screen.getByTestId("clock-black")).toBeInTheDocument();
        expect(screen.getByTestId("icon-11")).toBeInTheDocument();
        expect(screen.getByText("player-11")).toBeInTheDocument();
    });

    test("shows points when finished by score", () => {
        renderBar(fakeController({ phase: "finished", outcome: "2.5 points" }), "black");
        expect(screen.getByText("40.5 points")).toBeInTheDocument();
    });

    test("keeps captures when finished by resignation", () => {
        renderBar(fakeController({ phase: "finished", outcome: "Resignation" }), "white");
        expect(screen.getByText("1 capture")).toBeInTheDocument();
    });

    test("marks the side to move", () => {
        const { container } = renderBar(fakeController({ phase: "play", to_move: 22 }), "white");
        expect(container.querySelector(".PlayerBar")).toHaveClass("their-turn");
    });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `yarn test src/components/GobanView/PlayerBar.test.tsx`
Expected: FAIL, cannot find module `./PlayerBar`.

- [x] **Step 3: Write PlayerBar**

Create `src/components/GobanView/PlayerBar.tsx`:

```tsx
import * as React from "react";
import { GobanEvents, GobanRenderer } from "goban";
import { _, interpolate, ngettext } from "@/lib/translate";
import { Clock } from "@/components/Clock";
import { PlayerIcon } from "@/components/PlayerIcon";
import { Player } from "@/components/Player";
import { useGobanController } from "./GobanViewContext";
import { subscribeAllEvents } from "./hooks";
import "./PlayerBar.css";

interface PlayerBarProps {
    color: "black" | "white";
}

interface PlayerBarState {
    player_id: number;
    username: string;
    their_turn: boolean;
    score_line: string;
}

const NO_SCORE_OUTCOMES = ["Timeout", "Disconnection", "Resignation", "Abandonment", "Cancellation"];

function deriveState(goban: GobanRenderer, color: "black" | "white"): PlayerBarState {
    const engine = goban.engine;
    const player = engine.players[color];
    const finished = engine.phase === "finished" || engine.phase === "stone removal";
    const outcome = engine.outcome ?? "";
    const show_points =
        finished &&
        goban.mode !== "analyze" &&
        !NO_SCORE_OUTCOMES.includes(outcome) &&
        !outcome.startsWith("Server Decision");
    const score = engine.computeScore(!show_points)[color];
    const score_line = show_points
        ? interpolate(_("{{total}} {{unit}}"), {
              total: score.total,
              unit: ngettext("point", "points", score.total),
          })
        : interpolate(_("{{count}} {{unit}}"), {
              count: score.prisoners,
              unit: ngettext("capture", "captures", score.prisoners),
          });
    return {
        player_id: player.id,
        username: player.username,
        their_turn: engine.phase === "play" && engine.playerToMoveOnOfficialBranch() === player.id,
        score_line,
    };
}

const PLAYER_BAR_EVENTS: Array<keyof Omit<GobanEvents, "load">> = [
    "phase",
    "mode",
    "outcome",
    "stone-removal.accepted",
    "stone-removal.updated",
    "cur_move",
    "last_official_move",
    "gamedata",
];

function usePlayerBarState(goban: GobanRenderer, color: "black" | "white"): PlayerBarState {
    const [state, setState] = React.useState(() => deriveState(goban, color));
    React.useEffect(() => {
        const sync = () => setState(deriveState(goban, color));
        sync();
        return subscribeAllEvents(goban, PLAYER_BAR_EVENTS, sync);
    }, [goban, color]);
    return state;
}

/**
 * One player's strip for the board area: icon on the left, username with
 * the capture or point count stacked beside it, clock on the right.
 * Reads the goban from GobanControllerContext.
 */
export function PlayerBar({ color }: PlayerBarProps): React.ReactElement {
    const controller = useGobanController();
    const goban = controller.goban;
    const state = usePlayerBarState(goban, color);

    return (
        <div className={`PlayerBar ${color}` + (state.their_turn ? " their-turn" : "")}>
            <div className="PlayerBar-icon">
                {state.player_id ? (
                    <PlayerIcon id={state.player_id} size={40} />
                ) : (
                    <div className={`PlayerBar-stone ${color}`} />
                )}
            </div>
            <div className="PlayerBar-text">
                <div className="PlayerBar-name">
                    {state.player_id ? (
                        <Player user={state.player_id} disableCacheUpdate />
                    ) : (
                        <span className="PlayerBar-name-plain">{state.username}</span>
                    )}
                </div>
                <div className="PlayerBar-score">{state.score_line}</div>
            </div>
            <div className="PlayerBar-clock">
                <Clock goban={goban} color={color} compact />
            </div>
        </div>
    );
}
```

`GobanEvents` is exported from the goban package; if the name differs, use the type `subscribeAllEvents` declares for its `events` parameter.

Create `src/components/GobanView/PlayerBar.css`:

```css
.PlayerBar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    height: 3rem;
    flex-shrink: 0;
    padding: 0 0.5rem;
    border-radius: 6px;
    background: var(--shade5);
    color: var(--fg);

    &.their-turn {
        box-shadow: inset 0 0 0 2px var(--primary);
    }

    .PlayerBar-icon {
        width: 40px;
        height: 40px;
        flex-shrink: 0;

        .PlayerBar-stone {
            width: 40px;
            height: 40px;
            border-radius: 50%;

            &.black {
                background: #222;
            }
            &.white {
                background: #eee;
                border: 1px solid #999;
            }
        }
    }

    .PlayerBar-text {
        display: flex;
        flex-direction: column;
        min-width: 0;
        flex-grow: 1;
        line-height: 1.2;

        .PlayerBar-name {
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .PlayerBar-score {
            font-size: 0.85rem;
            color: var(--shade1);
        }
    }

    .PlayerBar-clock {
        flex-shrink: 0;
        margin-left: auto;
        font-size: 1.1rem;
    }
}
```

Add to `src/components/GobanView/index.ts`:

```ts
export { PlayerBar } from "./PlayerBar";
```

- [x] **Step 4: Run the test**

Run: `yarn test src/components/GobanView/PlayerBar.test.tsx && yarn type-check`
Expected: PASS. If `engine.outcome` or `playerToMoveOnOfficialBranch` type names differ, follow the compiler and adjust `deriveState`, not the test.

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/components/GobanView/PlayerBar.tsx src/components/GobanView/PlayerBar.css src/components/GobanView/PlayerBar.test.tsx src/components/GobanView/index.ts
git add src/components/GobanView
git commit -m "feat(GobanView): add PlayerBar component"
```

---

### Task 3: GobanView `playerBars` prop

**Files:**
- Modify: `src/components/GobanView/GobanView.tsx`
- Modify: `src/components/GobanView/GobanView.css`

**Interfaces:**
- Produces: `playerBars?: boolean` on `GobanViewProps`. When true, a `PlayerBar` for the top color renders above the board and one for the bottom color renders below it, in both view modes.

- [x] **Step 1: Add the prop and color hook**

In `GobanView.tsx` add imports:

```ts
import { useUser } from "@/lib/hooks";
import { PlayerBar } from "./PlayerBar";
import { generateGobanHook } from "./hooks";
import { goban_view_mode, goban_view_squashed, user_color, ViewMode } from "./util";
```

Add to `GobanViewProps` after `belowBoard`:

```ts
    /** Render a PlayerBar above and below the board. The current user's
     *  seat (or black for spectators) is on the bottom. */
    playerBars?: boolean;
```

Add above `GobanViewComponent`:

```ts
const usePlayerIds = generateGobanHook(
    (goban: GobanRenderer) => `${goban.engine.players.black.id}:${goban.engine.players.white.id}`,
    ["gamedata"],
);
```

with `import { GobanRenderer } from "goban";`.

Inside `GobanViewComponent`, after `const isPortrait = ...`:

```ts
    const user = useUser();
    usePlayerIds(controller.goban);
    const bottom_color: "black" | "white" = user_color(controller.goban, user.id) ?? "black";
    const top_color: "black" | "white" = bottom_color === "black" ? "white" : "black";
    const topBar = playerBars ? (
        <div className="GobanView-player-bar top">
            <PlayerBar color={top_color} />
        </div>
    ) : null;
    const bottomBar = playerBars ? (
        <div className="GobanView-player-bar bottom">
            <PlayerBar color={bottom_color} />
        </div>
    ) : null;
```

Destructure `playerBars` from props.

- [x] **Step 2: Render the bars**

Portrait branch: inside `.GobanView-mobile-scroll`, render `{topBar}` directly after the `aboveBoard` block and `{bottomBar}` directly before the `belowBoard` block, as siblings of `.GobanView-center`.

Landscape branch: inside `.GobanView-center`, render `{topBar}` before `<GobanContainer>` and `{bottomBar}` after it.

- [x] **Step 3: CSS**

In `GobanView.css`, inside `.GobanView`:

```css
    .GobanView-player-bar {
        flex-shrink: 0;
        padding: 0.3rem 0;
    }

    .GobanView-center .GobanView-player-bar {
        padding: 0.3rem 1.25rem 0.3rem 0.3rem;
    }
```

- [x] **Step 4: Verify**

Run: `yarn type-check && yarn lint && yarn test src/components/GobanView`
Expected: PASS. Then run the dev server (`yarn dev`) and open a game page to confirm nothing changed there (the prop is off).

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/components/GobanView/GobanView.tsx src/components/GobanView/GobanView.css
git add src/components/GobanView
git commit -m "feat(GobanView): optional player bars around the board"
```

---

### Task 4: GobanView `leftAside` prop

**Files:**
- Modify: `src/components/GobanView/GobanView.tsx`
- Modify: `src/components/GobanView/GobanView.css`
- Modify: `src/global_styl/01_variables.css:34`

**Interfaces:**
- Produces: `leftAside?: React.ReactNode` on `GobanViewProps`. Landscape only.

- [x] **Step 1: Add the prop**

In `GobanViewProps`:

```ts
    /** Landscape-only column rendered before the board, styled like the
     *  sidebar. Ignored in portrait; consumers provide takeover tabs for
     *  the same content there. */
    leftAside?: React.ReactNode;
```

Destructure it. In the landscape return, before `<div className="GobanView-center">`:

```tsx
                    {leftAside && <div className="GobanView-left-aside">{leftAside}</div>}
```

Add `(leftAside ? " has-left-aside" : "")` to the landscape root className expression.

- [x] **Step 2: Variable and CSS**

In `src/global_styl/01_variables.css` after line 34 (`--goban-view-sidebar-width: 400px;`):

```css
    --goban-view-left-aside-width: 280px;
```

In `GobanView.css` inside `.GobanView`, after the `.GobanView-sidebar` block:

```css
    .GobanView-left-aside {
        display: flex;
        flex-direction: column;
        width: var(--goban-view-left-aside-width);
        flex-shrink: 0;
        z-index: 2;
        background: var(--shade5);
        border-radius: 8px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        margin: 0 1.25rem var(--goban-view-bottom-margin) 0.3rem;
        overflow-y: auto;
        overflow-x: hidden;
    }
```

- [x] **Step 3: Verify**

Run: `yarn type-check && yarn lint`
Expected: PASS.

- [x] **Step 4: Commit**

```bash
yarn prettier:file src/components/GobanView/GobanView.tsx src/components/GobanView/GobanView.css src/global_styl/01_variables.css
git add src/components/GobanView src/global_styl/01_variables.css
git commit -m "feat(GobanView): optional left aside column"
```

---

## Phase 2: Kibitz on GobanView

### Task 5: Remove the secondary pane size mode

**Files:**
- Modify: `src/models/kibitz.d.ts:143`
- Modify: `src/views/Kibitz/KibitzController.ts` (lines 459, 644, 1095, 1318, 1343, 1371, 1386, 1402, 1414-1467)
- Modify: `src/views/Kibitz/KibitzController.test.ts`

**Interfaces:**
- Produces: `KibitzSecondaryPaneState` without `size`; `KibitzController.closeSecondaryPane(): void` replaces `setSecondaryPaneMode`, `increaseSecondaryPaneSize`, `decreaseSecondaryPaneSize`.

- [x] **Step 1: Write the failing test**

Add to `src/views/Kibitz/KibitzController.test.ts` inside the existing top-level `describe`:

```ts
    test("closeSecondaryPane collapses without a size field", () => {
        const controller = new KibitzController();
        controller.setSecondaryPane({ collapsed: false, variation_id: "v1" });
        controller.closeSecondaryPane();
        expect(controller.secondary_pane).toEqual({ collapsed: true });
        controller.destroy();
    });
```

Check how other tests in that file construct a `KibitzController` (some mock sockets) and mirror the setup.

- [x] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzController.test.ts -t closeSecondaryPane`
Expected: FAIL, `closeSecondaryPane` is not a function.

- [x] **Step 3: Remove `size`**

In `src/models/kibitz.d.ts` delete the line `size?: "small" | "equal";`.

In `KibitzController.ts`:
- Line 459: `private _secondary_pane: KibitzSecondaryPaneState = { collapsed: true };`
- Line 644 and 1095: replace `{ collapsed: true, size: "small" }` with `{ collapsed: true }`.
- In `previewGame`, `startVariationFromCurrentBoard`, `startVariationFromPostedVariation`, `clearPreviewGame`, `openVariation`: delete the `size:` line.
- In `clearPreviewGame`, also set `collapsed: true` so clearing returns the center to the main game.
- Replace `setSecondaryPaneMode`, `increaseSecondaryPaneSize`, and `decreaseSecondaryPaneSize` with:

```ts
    public closeSecondaryPane(): void {
        this.setSecondaryPane({ collapsed: true });
    }
```

- [x] **Step 4: Fix compile errors in callers**

Run `yarn type-check`. Every error will be in `KibitzInner.tsx`, `KibitzRoomStage.tsx`, `KibitzDividerHandle.tsx`, or their tests. Those files are deleted or rewritten in Tasks 12 and 13; for now, in `KibitzInner.tsx` replace the body of `onSetSecondaryPaneMode` (line 2971) and the flush effect (3143-3155) so they call `controller.closeSecondaryPane()` when the mode is `"hidden"` and do nothing otherwise, and in `KibitzRoomStage.tsx` and `KibitzDividerHandle.tsx` replace reads of `secondaryPane.size` with the literal `"equal"`. Update `KibitzRoomStage.scoreboard.test.tsx:188` to drop `size`. The goal of this step is only a green type-check; these files disappear later.

- [x] **Step 5: Run tests**

Run: `yarn test src/views/Kibitz/KibitzController.test.ts && yarn type-check`
Expected: PASS.

- [x] **Step 6: Commit**

```bash
yarn prettier:file src/models/kibitz.d.ts src/views/Kibitz/KibitzController.ts src/views/Kibitz/KibitzController.test.ts src/views/Kibitz/KibitzInner.tsx src/views/Kibitz/KibitzRoomStage.tsx src/views/Kibitz/KibitzDividerHandle.tsx src/views/Kibitz/KibitzRoomStage.scoreboard.test.tsx
git add -A src/models/kibitz.d.ts src/views/Kibitz
git commit -m "refactor(kibitz): drop the secondary pane size mode"
```

---

### Task 6: `useKibitzGobans` hook

**Files:**
- Create: `src/views/Kibitz/useKibitzGobans.ts`
- Create: `src/views/Kibitz/useKibitzGobans.test.tsx`

**Interfaces:**
- Consumes: `GobanController` (`@/lib/GobanController`), `captureCurrentGameBaseSnapshotFromController` and `restoreMainBoardToOfficialTail` (`./kibitzCurrentGameBaseSnapshot`), `applyKibitzVariationToController` (`./kibitzVariationTree`), `getMoveTreeTrunkTail` (`@/lib/GobanController`).
- Produces:

```ts
export type KibitzCenterMode = "main" | "draft" | "variation" | "preview";
export function deriveKibitzCenterMode(pane: KibitzSecondaryPaneState): KibitzCenterMode;
export function parseKibitzBoardDimensions(game: KibitzWatchedGame | null | undefined): { width: number; height: number };
export interface KibitzGobans {
    main: GobanController | null;
    secondary: GobanController | null;
    center: GobanController | null;
    centerMode: KibitzCenterMode;
}
export interface UseKibitzGobansOptions {
    roomId: string | null;
    currentGame: KibitzWatchedGame | null | undefined;
    secondaryPane: KibitzSecondaryPaneState;
    variations: readonly KibitzVariationSummary[];
    visibleVariationIds: readonly string[];
    variationColorIndexes: Record<string, number>;
    variationGameById: ReadonlyMap<number, KibitzWatchedGame>;
    onMainSnapshot?: (snapshot: KibitzCurrentGameBaseSnapshot) => void;
}
export function useKibitzGobans(options: UseKibitzGobansOptions): KibitzGobans;
```

- [x] **Step 1: Write the failing tests**

Create `src/views/Kibitz/useKibitzGobans.test.tsx`:

```tsx
import * as React from "react";
import { act, render } from "@testing-library/react";
import type { KibitzSecondaryPaneState, KibitzWatchedGame } from "@/models/kibitz";
import type { GobanController } from "@/lib/GobanController";

jest.mock("@/lib/GobanController", () => {
    const instances: Array<Record<string, unknown>> = [];
    const GobanControllerMock = jest.fn().mockImplementation((config: Record<string, unknown>) => {
        const listeners = new Map<string, Array<() => void>>();
        const instance = {
            config,
            destroy: jest.fn(),
            setAnalyzeTool: jest.fn(),
            goban: {
                mode: "play",
                parent: { isConnected: true },
                config,
                engine: {
                    move_tree: null,
                    cur_move: { id: 1, move_number: 0, getMoveStringToThisPoint: () => "" },
                    jumpTo: jest.fn(),
                    followPath: jest.fn(),
                    setLastOfficialMove: jest.fn(),
                },
                on: (event: string, cb: () => void) => {
                    listeners.set(event, [...(listeners.get(event) ?? []), cb]);
                },
                off: jest.fn(),
                redraw: jest.fn(),
                setMode: jest.fn(),
            },
            emitGoban: (event: string) => {
                for (const cb of listeners.get(event) ?? []) {
                    cb();
                }
            },
        };
        instances.push(instance);
        return instance;
    });
    return {
        GobanController: GobanControllerMock,
        getMoveTreeTrunkTail: jest.fn(() => null),
        __instances: instances,
    };
});
jest.mock("./kibitzVariationTree", () => ({
    applyKibitzVariationToController: jest.fn(() => ({ variationId: "v1", endpoint: null })),
}));
jest.mock("./kibitzCurrentGameBaseSnapshot", () => ({
    captureCurrentGameBaseSnapshotFromController: jest.fn(() => null),
    restoreMainBoardToOfficialTail: jest.fn(() => null),
}));
jest.mock("@/lib/preferences", () => ({
    get: jest.fn((key: string) => (key === "label-positioning" ? "all" : 1)),
}));

import { deriveKibitzCenterMode, useKibitzGobans, UseKibitzGobansOptions, KibitzGobans } from "./useKibitzGobans";

const instances = (jest.requireMock("@/lib/GobanController") as { __instances: Array<Record<string, unknown>> }).__instances;

const game: KibitzWatchedGame = {
    game_id: 100,
    board_size: "9x9",
    title: "g",
    black: { id: 1, username: "b" },
    white: { id: 2, username: "w" },
};

const collapsed: KibitzSecondaryPaneState = { collapsed: true };

function Harness(props: { options: UseKibitzGobansOptions; onResult: (r: KibitzGobans) => void }) {
    const result = useKibitzGobans(props.options);
    React.useEffect(() => {
        props.onResult(result);
    });
    return null;
}

function baseOptions(overrides: Partial<UseKibitzGobansOptions> = {}): UseKibitzGobansOptions {
    return {
        roomId: "room-1",
        currentGame: game,
        secondaryPane: collapsed,
        variations: [],
        visibleVariationIds: [],
        variationColorIndexes: {},
        variationGameById: new Map([[100, game]]),
        ...overrides,
    };
}

beforeEach(() => {
    instances.length = 0;
});

describe("deriveKibitzCenterMode", () => {
    test("collapsed is main", () => {
        expect(deriveKibitzCenterMode({ collapsed: true })).toBe("main");
    });
    test("draft when a source game is set", () => {
        expect(deriveKibitzCenterMode({ collapsed: false, variation_source_game_id: 100, preview_game_id: 100 })).toBe("draft");
    });
    test("variation when a variation id is set", () => {
        expect(deriveKibitzCenterMode({ collapsed: false, variation_id: "v1" })).toBe("variation");
    });
    test("preview when only a preview game is set", () => {
        expect(deriveKibitzCenterMode({ collapsed: false, preview_game_id: 7 })).toBe("preview");
    });
});

describe("useKibitzGobans", () => {
    test("creates a connected main controller and shows it in the center", () => {
        let latest: KibitzGobans | null = null;
        render(<Harness options={baseOptions()} onResult={(r) => (latest = r)} />);
        expect(instances).toHaveLength(1);
        expect(instances[0].config).toMatchObject({ game_id: 100, width: 9, height: 9, interactive: false });
        expect(latest!.centerMode).toBe("main");
        expect(latest!.center).toBe(latest!.main);
        expect(latest!.secondary).toBeNull();
    });

    test("opening a variation creates a secondary controller and restores main to the tail", () => {
        const { restoreMainBoardToOfficialTail } = jest.requireMock("./kibitzCurrentGameBaseSnapshot");
        let latest: KibitzGobans | null = null;
        const { rerender } = render(<Harness options={baseOptions()} onResult={(r) => (latest = r)} />);
        const variation = { id: "v1", room_id: "room-1", game_id: 100, creator: { id: 1, username: "b" }, created_at: 0, viewer_count: 0, current_viewers: [] };
        rerender(
            <Harness
                options={baseOptions({
                    secondaryPane: { collapsed: false, variation_id: "v1" },
                    variations: [variation],
                    visibleVariationIds: ["v1"],
                })}
                onResult={(r) => (latest = r)}
            />,
        );
        expect(instances).toHaveLength(2);
        expect(instances[1].config).toMatchObject({ interactive: false });
        expect(latest!.centerMode).toBe("variation");
        expect(latest!.center).toBe(latest!.secondary);
        expect(restoreMainBoardToOfficialTail).toHaveBeenCalledWith(latest!.main);
    });

    test("a draft controller is interactive and enters analyze mode", () => {
        const { rerender } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        rerender(
            <Harness
                options={baseOptions({
                    secondaryPane: {
                        collapsed: false,
                        preview_game_id: 100,
                        variation_source_game_id: 100,
                        variation_source_move_path: "aa",
                    },
                })}
                onResult={() => undefined}
            />,
        );
        expect(instances[1].config).toMatchObject({ interactive: true });
        expect((instances[1] as { setAnalyzeTool: jest.Mock }).setAnalyzeTool).toHaveBeenCalledWith("stone", "alternate");
    });

    test("closing the pane destroys the secondary controller", () => {
        const { rerender } = render(
            <Harness options={baseOptions({ secondaryPane: { collapsed: false, preview_game_id: 7 } })} onResult={() => undefined} />,
        );
        expect(instances).toHaveLength(2);
        rerender(<Harness options={baseOptions()} onResult={() => undefined} />);
        expect((instances[1] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
    });

    test("changing the game destroys and recreates the main controller", () => {
        const { rerender } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        rerender(<Harness options={baseOptions({ currentGame: { ...game, game_id: 200 } })} onResult={() => undefined} />);
        expect((instances[0] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
        expect(instances[1].config).toMatchObject({ game_id: 200 });
    });

    test("unmount destroys everything", () => {
        const { unmount } = render(<Harness options={baseOptions()} onResult={() => undefined} />);
        unmount();
        expect((instances[0] as { destroy: jest.Mock }).destroy).toHaveBeenCalled();
    });

    test("main snapshots are reported on goban load", () => {
        const { captureCurrentGameBaseSnapshotFromController } = jest.requireMock("./kibitzCurrentGameBaseSnapshot");
        const snapshot = { gameId: 100, trunkTailMoveNumber: 3 };
        captureCurrentGameBaseSnapshotFromController.mockReturnValueOnce(snapshot);
        const onMainSnapshot = jest.fn();
        render(<Harness options={baseOptions({ onMainSnapshot })} onResult={() => undefined} />);
        act(() => {
            (instances[0] as { emitGoban: (e: string) => void }).emitGoban("load");
        });
        expect(onMainSnapshot).toHaveBeenCalledWith(snapshot);
    });
});
```

- [x] **Step 2: Run the tests to verify they fail**

Run: `yarn test src/views/Kibitz/useKibitzGobans.test.tsx`
Expected: FAIL, cannot find module `./useKibitzGobans`.

- [x] **Step 3: Write the hook**

Create `src/views/Kibitz/useKibitzGobans.ts`:

```ts
import * as React from "react";
import type { GobanRendererConfig, MoveTree } from "goban";
import { GobanController, getMoveTreeTrunkTail } from "@/lib/GobanController";
import * as preferences from "@/lib/preferences";
import type {
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
    KibitzWatchedGame,
} from "@/models/kibitz";
import type { KibitzCurrentGameBaseSnapshot } from "./kibitzCurrentGameBaseSnapshotTypes";
import {
    captureCurrentGameBaseSnapshotFromController,
    restoreMainBoardToOfficialTail,
} from "./kibitzCurrentGameBaseSnapshot";
import { applyKibitzVariationToController } from "./kibitzVariationTree";

export type KibitzCenterMode = "main" | "draft" | "variation" | "preview";

export interface KibitzGobans {
    /** The live game controller. Always mounted somewhere in the DOM. */
    main: GobanController | null;
    /** Draft, posted variation, or preview controller. Null when the center
     *  shows the main game. */
    secondary: GobanController | null;
    /** Whichever controller GobanView should render in the center. */
    center: GobanController | null;
    centerMode: KibitzCenterMode;
}

export interface UseKibitzGobansOptions {
    roomId: string | null;
    currentGame: KibitzWatchedGame | null | undefined;
    secondaryPane: KibitzSecondaryPaneState;
    variations: readonly KibitzVariationSummary[];
    visibleVariationIds: readonly string[];
    variationColorIndexes: Record<string, number>;
    variationGameById: ReadonlyMap<number, KibitzWatchedGame>;
    onMainSnapshot?: (snapshot: KibitzCurrentGameBaseSnapshot) => void;
}

export function deriveKibitzCenterMode(pane: KibitzSecondaryPaneState): KibitzCenterMode {
    if (pane.collapsed) {
        return "main";
    }
    if (pane.variation_source_game_id != null) {
        return "draft";
    }
    if (pane.variation_id) {
        return "variation";
    }
    if (pane.preview_game_id != null) {
        return "preview";
    }
    return "main";
}

export function parseKibitzBoardDimensions(game: KibitzWatchedGame | null | undefined): {
    width: number;
    height: number;
} {
    const boardSize = game?.board_size;
    if (!boardSize) {
        return { width: 19, height: 19 };
    }
    const [width, height] = boardSize.split("x").map(Number);
    if (Number.isFinite(width) && Number.isFinite(height)) {
        return { width, height };
    }
    return { width: 19, height: 19 };
}

function labelConfig(): Pick<
    GobanRendererConfig,
    "draw_top_labels" | "draw_left_labels" | "draw_right_labels" | "draw_bottom_labels"
> {
    const position = preferences.get("label-positioning");
    return {
        draw_top_labels: position === "all" || position.indexOf("top") >= 0,
        draw_left_labels: position === "all" || position.indexOf("left") >= 0,
        draw_right_labels: position === "all" || position.indexOf("right") >= 0,
        draw_bottom_labels: position === "all" || position.indexOf("bottom") >= 0,
    };
}

function baseConfig(game: KibitzWatchedGame | null | undefined): GobanRendererConfig {
    const { width, height } = parseKibitzBoardDimensions(game);
    return {
        board_div: document.createElement("div"),
        square_size: "auto",
        width,
        height,
        variation_stone_opacity: preferences.get("variation-stone-opacity"),
        stone_font_scale: preferences.get("stone-font-scale"),
        ...labelConfig(),
    };
}

/** Re-anchor the engine's last official move at the trunk tail without
 *  moving the current position. Needed before composing a variation onto a
 *  freshly loaded tree. */
function refreshLastOfficialMoveFromTrunk(controller: GobanController): MoveTree | null {
    const { engine } = controller.goban;
    const tail = getMoveTreeTrunkTail(engine.move_tree);
    if (!tail) {
        return null;
    }
    const current = engine.cur_move;
    engine.jumpTo(tail);
    engine.setLastOfficialMove();
    if (current.id !== tail.id) {
        engine.jumpTo(current);
    }
    return tail;
}

/**
 * Owns the Kibitz GobanControllers. The main controller connects to the
 * room's live game and lives as long as that game is the room's game. The
 * secondary controller is created on demand for a draft, a posted
 * variation, or a game preview, and destroyed when the pane closes.
 */
export function useKibitzGobans({
    roomId,
    currentGame,
    secondaryPane,
    variations,
    visibleVariationIds,
    variationColorIndexes,
    variationGameById,
    onMainSnapshot,
}: UseKibitzGobansOptions): KibitzGobans {
    const [main, setMain] = React.useState<GobanController | null>(null);
    const [secondary, setSecondary] = React.useState<GobanController | null>(null);
    const centerMode = deriveKibitzCenterMode(secondaryPane);

    const onMainSnapshotRef = React.useRef(onMainSnapshot);
    onMainSnapshotRef.current = onMainSnapshot;
    const currentGameRef = React.useRef(currentGame);
    currentGameRef.current = currentGame;

    const gameId = currentGame?.game_id ?? null;
    const boardSize = currentGame?.board_size ?? null;

    React.useEffect(() => {
        if (gameId == null) {
            setMain(null);
            return;
        }
        const controller = new GobanController({
            ...baseConfig(currentGameRef.current),
            interactive: false,
            connect_to_chat: true,
            game_id: gameId,
        });
        const sync = () => {
            const snapshot = captureCurrentGameBaseSnapshotFromController(
                controller,
                currentGameRef.current,
                roomId,
                "main-board",
            );
            if (snapshot) {
                onMainSnapshotRef.current?.(snapshot);
            }
        };
        controller.goban.on("load", sync);
        controller.goban.on("gamedata", sync);
        controller.goban.on("last_official_move", sync);
        controller.goban.on("move-made", sync);
        setMain(controller);
        return () => {
            controller.goban.off("load", sync);
            controller.goban.off("gamedata", sync);
            controller.goban.off("last_official_move", sync);
            controller.goban.off("move-made", sync);
            controller.destroy();
            setMain(null);
        };
    }, [gameId, boardSize, roomId]);

    // Any change to what the secondary board shows rebuilds it from scratch.
    const secondaryKey =
        centerMode === "main"
            ? null
            : [
                  centerMode,
                  secondaryPane.preview_game_id ?? "",
                  secondaryPane.variation_id ?? "",
                  secondaryPane.variation_source_game_id ?? "",
                  secondaryPane.variation_draft_base_id ?? "",
                  secondaryPane.variation_source_move_tree_id ?? "",
                  secondaryPane.variation_source_move_path ?? "",
                  centerMode === "variation" ? visibleVariationIds.join(",") : "",
              ].join(":");

    const paneRef = React.useRef(secondaryPane);
    paneRef.current = secondaryPane;
    const variationsRef = React.useRef(variations);
    variationsRef.current = variations;
    const visibleIdsRef = React.useRef(visibleVariationIds);
    visibleIdsRef.current = visibleVariationIds;
    const colorsRef = React.useRef(variationColorIndexes);
    colorsRef.current = variationColorIndexes;
    const gameByIdRef = React.useRef(variationGameById);
    gameByIdRef.current = variationGameById;

    React.useEffect(() => {
        if (!secondaryKey || !main) {
            setSecondary(null);
            return;
        }
        const pane = paneRef.current;
        const mode = deriveKibitzCenterMode(pane);
        const currentGameId = currentGameRef.current?.game_id ?? null;

        const selectedVariation =
            mode === "variation"
                ? variationsRef.current.find((v) => v.id === pane.variation_id) ?? null
                : null;
        const draftBase =
            mode === "draft" && pane.variation_draft_base_id
                ? variationsRef.current.find((v) => v.id === pane.variation_draft_base_id) ?? null
                : null;

        const targetGameId =
            mode === "preview"
                ? pane.preview_game_id ?? null
                : mode === "variation"
                  ? selectedVariation?.game_id ?? null
                  : pane.variation_source_game_id ?? null;
        const targetGame =
            (targetGameId != null ? gameByIdRef.current.get(targetGameId) : undefined) ??
            pane.variation_source_game ??
            (targetGameId === currentGameId ? currentGameRef.current : undefined);

        // The current game's trunk comes from the main controller so the
        // secondary board never opens a second socket for the same game.
        // Other games connect read-only.
        const useMainTrunk = mode !== "preview" && targetGameId === currentGameId;
        const mainSnapshot = useMainTrunk
            ? captureCurrentGameBaseSnapshotFromController(main, currentGameRef.current, roomId)
            : null;

        const controller = new GobanController({
            ...baseConfig(targetGame),
            ...(useMainTrunk && mainSnapshot ? (mainSnapshot.config as GobanRendererConfig) : {}),
            board_div: document.createElement("div"),
            interactive: mode === "draft",
            connect_to_chat: false,
            game_id: useMainTrunk ? undefined : targetGameId ?? undefined,
            move_tree:
                mode === "draft" && pane.variation_source_move_tree
                    ? pane.variation_source_move_tree
                    : mainSnapshot?.config.move_tree,
        });

        let composed = false;
        const compose = () => {
            if (composed) {
                return;
            }
            composed = true;
            refreshLastOfficialMoveFromTrunk(controller);
            if (mode === "variation" && selectedVariation) {
                for (const v of variationsRef.current) {
                    if (
                        v.id !== selectedVariation.id &&
                        v.game_id === selectedVariation.game_id &&
                        visibleIdsRef.current.includes(v.id)
                    ) {
                        applyKibitzVariationToController(controller, v, colorsRef.current[v.id] ?? 0, false);
                    }
                }
                const applied = applyKibitzVariationToController(
                    controller,
                    selectedVariation,
                    colorsRef.current[selectedVariation.id] ?? 0,
                    true,
                );
                if (applied.endpoint) {
                    controller.goban.engine.jumpTo(applied.endpoint);
                }
            } else if (mode === "draft" && draftBase) {
                const applied = applyKibitzVariationToController(
                    controller,
                    draftBase,
                    colorsRef.current[draftBase.id] ?? 0,
                    true,
                );
                if (applied.endpoint) {
                    controller.goban.engine.jumpTo(applied.endpoint);
                }
            } else if (mode === "draft" && pane.variation_source_move_path) {
                controller.goban.engine.followPath(0, pane.variation_source_move_path);
            }
            if (mode === "draft") {
                controller.setAnalyzeTool("stone", "alternate");
            }
            controller.goban.redraw(true);
        };

        if (useMainTrunk || mode === "draft") {
            compose();
        } else {
            // Connected boards compose once the server has sent the game.
            controller.goban.on("load", compose);
        }

        restoreMainBoardToOfficialTail(main);
        setSecondary(controller);
        return () => {
            controller.goban.off("load", compose);
            controller.destroy();
            setSecondary(null);
        };
    }, [secondaryKey, main, roomId]);

    const center = centerMode === "main" ? main : secondary ?? main;

    return { main, secondary, center, centerMode };
}
```

- [x] **Step 4: Run the tests**

Run: `yarn test src/views/Kibitz/useKibitzGobans.test.tsx && yarn type-check`
Expected: PASS. If `GobanRendererConfig` rejects a spread of `mainSnapshot.config`, cast through `Partial<GobanRendererConfig>` at that single spot; never `any`.

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/views/Kibitz/useKibitzGobans.ts src/views/Kibitz/useKibitzGobans.test.tsx
git add src/views/Kibitz/useKibitzGobans.ts src/views/Kibitz/useKibitzGobans.test.tsx
git commit -m "feat(kibitz): useKibitzGobans owns the main and secondary controllers"
```

---

### Task 7: Mini main board and left aside

**Files:**
- Create: `src/views/Kibitz/KibitzMiniMainBoard.tsx` / `.css`
- Create: `src/views/Kibitz/KibitzLeftAside.tsx` / `.css`
- Modify: `src/views/Kibitz/KibitzVariationList.tsx` (add `onCreateVariation` button)
- Modify: `src/views/Kibitz/KibitzRoomList.tsx:33,45,68-105` (remove `onCreateVariation`)

**Interfaces:**
- Consumes: `GobanContainer` from `@/components/GobanContainer`; `KibitzRoomList`, `KibitzVariationList` props as they exist.
- Produces:

```ts
// KibitzMiniMainBoard
interface KibitzMiniMainBoardProps { controller: GobanController; onClick: () => void; }
// KibitzLeftAside
export interface KibitzLeftAsideProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    blockedRoomIds: Set<string>;
    onSelectRoom: (roomId: string) => void;
    onCreateRoom?: () => void;
    canOpenCreateRoomFlow: boolean;
    signInHref: string;
    variations: KibitzVariationSummary[];
    currentGameId: number | null;
    variationGameById: ReadonlyMap<number, KibitzWatchedGame>;
    selectedVariationId: string | null;
    variationFocusRequestId: number;
    variationColorIndexes: Record<string, number>;
    blockedVariationFlashId: string | null;
    onRecallVariation: (variationId: string) => void;
    onHideVariation: (variationId: string) => void;
    onCreateVariation?: () => void;
    miniBoardController: GobanController | null;
    onExitVariation: () => void;
    roomListHelpTargetId?: KibitzHelpTargetId;
    variationListHelpTargetId?: KibitzHelpTargetId;
}
```

- [x] **Step 1: Mini main board**

Create `src/views/Kibitz/KibitzMiniMainBoard.tsx`:

```tsx
import * as React from "react";
import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import { GobanContainer } from "@/components/GobanContainer";
import "./KibitzMiniMainBoard.css";

interface KibitzMiniMainBoardProps {
    controller: GobanController;
    onClick: () => void;
}

/** Thumbnail of the live game shown while the center displays something
 *  else. Clicking it returns the center to the live game. */
export function KibitzMiniMainBoard({ controller, onClick }: KibitzMiniMainBoardProps): React.ReactElement {
    return (
        <button
            type="button"
            className="KibitzMiniMainBoard"
            onClick={onClick}
            title={pgettext("Tooltip on the small live game board in Kibitz", "Return to the live game")}
        >
            <GobanContainer goban={controller.goban} respectContainerBounds />
        </button>
    );
}
```

Create `src/views/Kibitz/KibitzMiniMainBoard.css`:

```css
.KibitzMiniMainBoard {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    margin: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    position: relative;
    overflow: hidden;

    .goban-container {
        position: absolute;
        inset: 0;
        pointer-events: none;

        .Goban {
            position: absolute;
            top: 0;
            left: 0;
        }
    }

    &:focus-visible {
        outline: 2px solid var(--primary);
    }
}
```

- [x] **Step 2: Move the New variation button into the variation list**

In `KibitzVariationList.tsx` add `onCreateVariation?: () => void;` to `KibitzVariationListProps` and destructure it. Find where `title` is rendered (the list header) and render, next to the title:

```tsx
                {onCreateVariation ? (
                    <button
                        type="button"
                        className="xs primary KibitzVariationList-createButton"
                        onClick={onCreateVariation}
                    >
                        {pgettext("Button label for opening Kibitz variation creation", "New variation")}
                    </button>
                ) : null}
```

If the header is not a flex row, wrap the title and button in `<div className="KibitzVariationList-titleRow">` and add to `KibitzVariationList.css`:

```css
    .KibitzVariationList-titleRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
    }
```

In `KibitzRoomList.tsx` remove the `onCreateVariation` prop, its destructuring, and the `{onCreateVariation ? (...) : null}` block. Change the surrounding condition `onCreateRoom || onCreateVariation` to `onCreateRoom`. Update `KibitzRoomList.test.tsx` if it references the variation button.

- [x] **Step 3: Left aside**

Create `src/views/Kibitz/KibitzLeftAside.tsx`:

```tsx
import * as React from "react";
import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import type { KibitzRoomSummary, KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { KibitzRoomList } from "./KibitzRoomList";
import { KibitzVariationList } from "./KibitzVariationList";
import { KibitzMiniMainBoard } from "./KibitzMiniMainBoard";
import type { KibitzHelpTargetId } from "./HelpFlows/KibitzHelpTargets";
import "./KibitzLeftAside.css";

export interface KibitzLeftAsideProps {
    rooms: KibitzRoomSummary[];
    activeRoomId: string;
    blockedRoomIds: Set<string>;
    onSelectRoom: (roomId: string) => void;
    onCreateRoom?: () => void;
    canOpenCreateRoomFlow: boolean;
    signInHref: string;
    variations: KibitzVariationSummary[];
    currentGameId: number | null;
    variationGameById: ReadonlyMap<number, KibitzWatchedGame>;
    selectedVariationId: string | null;
    variationFocusRequestId: number;
    variationColorIndexes: Record<string, number>;
    blockedVariationFlashId: string | null;
    onRecallVariation: (variationId: string) => void;
    onHideVariation: (variationId: string) => void;
    onCreateVariation?: () => void;
    /** The live game controller, shown as a thumbnail only while the
     *  center displays something else. Pass null to hide it. */
    miniBoardController: GobanController | null;
    onExitVariation: () => void;
    roomListHelpTargetId?: KibitzHelpTargetId;
    variationListHelpTargetId?: KibitzHelpTargetId;
}

export function KibitzLeftAside(props: KibitzLeftAsideProps): React.ReactElement {
    return (
        <div className="KibitzLeftAside">
            <KibitzRoomList
                rooms={props.rooms}
                activeRoomId={props.activeRoomId}
                onSelectRoom={props.onSelectRoom}
                onCreateRoom={props.onCreateRoom}
                canOpenCreateRoomFlow={props.canOpenCreateRoomFlow}
                signInHref={props.signInHref}
                blockedRoomIds={props.blockedRoomIds}
                helpTargetId={props.roomListHelpTargetId}
            />
            <KibitzVariationList
                title={pgettext("Heading for the Kibitz variation list", "Variations")}
                variations={props.variations}
                currentGameId={props.currentGameId}
                gameById={props.variationGameById}
                selectedVariationId={props.selectedVariationId}
                variationFocusRequestId={props.variationFocusRequestId}
                variationColorIndexes={props.variationColorIndexes}
                blockedVariationFlashId={props.blockedVariationFlashId}
                onRecallVariation={props.onRecallVariation}
                onHideVariation={props.onHideVariation}
                onCreateVariation={props.onCreateVariation}
                helpTargetId={props.variationListHelpTargetId}
            />
            {props.miniBoardController && (
                <div className="KibitzLeftAside-miniBoard">
                    <KibitzMiniMainBoard
                        controller={props.miniBoardController}
                        onClick={props.onExitVariation}
                    />
                </div>
            )}
        </div>
    );
}
```

Create `src/views/Kibitz/KibitzLeftAside.css`:

```css
.KibitzLeftAside {
    display: flex;
    flex-direction: column;
    min-height: 100%;
    gap: 0.75rem;
    padding: 0.75rem;

    .KibitzRoomList {
        flex-shrink: 1;
        min-height: 8rem;
        overflow-y: auto;
    }

    .KibitzVariationList {
        flex-shrink: 1;
        min-height: 6rem;
        overflow-y: auto;
    }

    .KibitzLeftAside-miniBoard {
        margin-top: auto;
        flex-shrink: 0;
    }
}
```

Check `HelpFlows/KibitzHelpTargets.ts` exports a `KibitzHelpTargetId` type (the `useKibitzHelpTarget` signature uses it). If it is not exported, export it there.

- [x] **Step 4: Verify**

Run: `yarn type-check && yarn lint && yarn test src/views/Kibitz/KibitzRoomList.test.tsx src/views/Kibitz/KibitzVariationList.test.tsx`
Expected: PASS after updating any test that asserted the variation button inside the room list.

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/views/Kibitz/KibitzMiniMainBoard.tsx src/views/Kibitz/KibitzMiniMainBoard.css src/views/Kibitz/KibitzLeftAside.tsx src/views/Kibitz/KibitzLeftAside.css src/views/Kibitz/KibitzVariationList.tsx src/views/Kibitz/KibitzVariationList.css src/views/Kibitz/KibitzRoomList.tsx src/views/Kibitz/KibitzRoomList.test.tsx
git add -A src/views/Kibitz
git commit -m "feat(kibitz): left aside with rooms, variations and mini main board"
```

---

### Task 8: KibitzChatPanel (two tabs, room user list)

**Files:**
- Rename: `src/views/Kibitz/KibitzSharedStreamPanel.tsx` to `KibitzChatPanel.tsx`; `.css`, `.test.ts`, `.render.test.tsx` likewise.

**Interfaces:**
- Produces:

```ts
export interface KibitzChatPanelProps {
    room: KibitzRoomSummary;
    items: KibitzStreamItem[];
    variations: KibitzVariationSummary[];
    onOpenVariation: (variationId: string, focusVariation?: boolean) => void;
    /** Live game controller whose chat_log feeds the Game tab. */
    gameController: GobanController | null;
}
export function KibitzChatPanel(props: KibitzChatPanelProps): React.ReactElement;
export function createChatLineFromGobanLine(roomChannel: string, line: protocol.GameChatLine, includeMalkovich: boolean): PaneEntry | null;  // unchanged
```

- [x] **Step 1: Rename**

```bash
git mv src/views/Kibitz/KibitzSharedStreamPanel.tsx src/views/Kibitz/KibitzChatPanel.tsx
git mv src/views/Kibitz/KibitzSharedStreamPanel.css src/views/Kibitz/KibitzChatPanel.css
git mv src/views/Kibitz/KibitzSharedStreamPanel.test.ts src/views/Kibitz/KibitzChatPanel.test.ts
git mv src/views/Kibitz/KibitzSharedStreamPanel.render.test.tsx src/views/Kibitz/KibitzChatPanel.render.test.tsx
```

Replace every `KibitzSharedStreamPanel` identifier and CSS class prefix in those four files with `KibitzChatPanel` (`sed -i '' 's/KibitzSharedStreamPanel/KibitzChatPanel/g'`).

- [x] **Step 2: Update the render test to the tab layout**

In `KibitzChatPanel.render.test.tsx`:
- Add a mock for `@/components/ChatUserList`:

```tsx
jest.mock("@/components/ChatUserList", () => ({
    __esModule: true,
    ChatUserList: ({ channel }: { channel: string }) => <div data-testid="user-list">{channel}</div>,
    ChatUserCount: ({ onClick, active }: { onClick: () => void; active: boolean }) => (
        <button type="button" data-testid="user-toggle" data-active={active} onClick={onClick} />
    ),
}));
```
- Remove the `@/components/GobanView` mock; the panel now takes `gameController` as a prop. Render with `gameController={null}`.
- Remove `mode`, `isMobileLayout`, `onSendMessage`, `compact` from the rendered props.
- Keep the `"Game chat"` and `"Kibitz chat"` label assertions: those become the tab labels.
- Replace the second test (mobile mode) with:

```tsx
    test("room tab toggles the user list", () => {
        render(<KibitzChatPanel {...baseProps()} />);
        fireEvent.click(screen.getByText("Kibitz chat"));
        expect(screen.queryByTestId("user-list")).toBeNull();
        fireEvent.click(screen.getByTestId("user-toggle"));
        expect(screen.getByTestId("user-list")).toHaveTextContent("kibitz-room-1");
    });
```

where `baseProps()` returns the existing room (`channel: "kibitz-room-1"`), items, variations, `onOpenVariation: jest.fn()`, `gameController: null`. Import `fireEvent` from `@testing-library/react`.

- [x] **Step 3: Run the tests to verify they fail**

Run: `yarn test src/views/Kibitz/KibitzChatPanel.render.test.tsx`
Expected: FAIL on props and on the missing user toggle.

- [x] **Step 4: Trim the panel**

In `KibitzChatPanel.tsx`:

1. Replace the props interface with `KibitzChatPanelProps` above. Delete `mode`, `isMobileLayout`, `compact`, `onSendMessage`. Where `mode === "demo"` was checked, treat as always live (delete the demo branches; `onSendMessage` call sites go).
2. Replace `const watchedController = useGobanControllerOrNull();` with `const watchedController = gameController;` and remove the GobanView import.
3. Delete the desktop split code: `DesktopSplitState`, `DESKTOP_SPLIT_STORAGE_KEY`, `DEFAULT_DESKTOP_SPLIT`, `DESKTOP_SPLITS`, `isDesktopSplitState`, `readDesktopSplit`, `splitPercentage`, `snapDesktopSplitFromRatio`, `clampPercentage`, `ratioFromPointerPosition`, the split state and its localStorage effect, `finishDesktopDrag`, `handleDesktopDividerPointerDown`, the pointer listener effect, the divider JSX, and the `flexBasis` styles.
4. Rename `MOBILE_TAB_STORAGE_KEY` to `TAB_STORAGE_KEY = "kibitz.chat_tab"` and use its tab state (`"game" | "room"`) for both view modes. Keep `readMobileTab` renamed to `readTab`.
5. Add state `const [showUserList, setShowUserList] = React.useState(false);`.
6. Replace the mobile switcher JSX and the two-pane layout with:

```tsx
    return (
        <div className="KibitzChatPanel" ref={streamHelpTarget?.ref}>
            <div className="KibitzChatPanel-tabs" role="tablist">
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "game"}
                    className={"KibitzChatPanel-tab" + (tab === "game" ? " active" : "")}
                    onClick={() => setTab("game")}
                >
                    {pgettext("Kibitz chat tab for the watched game's chat", "Game chat")}
                    {gameUnread && tab !== "game" ? <span className="KibitzChatPanel-unread" /> : null}
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "room"}
                    className={"KibitzChatPanel-tab" + (tab === "room" ? " active" : "")}
                    onClick={() => setTab("room")}
                >
                    {pgettext("Kibitz chat tab for the kibitz room's chat", "Kibitz chat")}
                    {roomUnread && tab !== "room" ? <span className="KibitzChatPanel-unread" /> : null}
                </button>
            </div>
            <div className={"KibitzChatPanel-body" + (showUserList && tab === "room" ? " show-user-list" : "")}>
                <div className="KibitzChatPanel-log">
                    {tab === "game" ? renderEntries(gameEntries, "game") : renderEntries(roomEntries, "room")}
                </div>
                {tab === "room" && showUserList ? <ChatUserList channel={room.channel} /> : null}
            </div>
            {tab === "room" ? (
                <div className="KibitzChatPanel-composer chat-input-container input-group">
                    <TabCompleteInput
                        id={"kibitz-chat-input-" + room.id}
                        className="chat-input"
                        placeholder={chatDisabled ? disabledPlaceholder : roomPlaceholder}
                        disabled={chatDisabled}
                        onKeyPress={onRoomKeyPress}
                    />
                    <ChatUserCount
                        channel={room.channel}
                        active={showUserList}
                        onClick={() => setShowUserList((v) => !v)}
                    />
                </div>
            ) : (
                disabledComposer
            )}
        </div>
    );
```

Keep the existing `renderEntries`, `roomEntries`, `gameEntries`, `onRoomKeyPress`, `disabledComposer`, the room proxy effect, the game chat effect, and the `useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopStream)` call (name its result `streamHelpTarget`). Keep the unread flags (`gameUnread`, `roomUnread`) if they exist as booleans; otherwise derive them from the existing unread bookkeeping or drop the dots. Import `ChatUserList, ChatUserCount` from `@/components/ChatUserList`. Keep the exact strings `"Game chat"` and `"Kibitz chat"` (they are asserted by the tests).

7. In `KibitzChatPanel.css`, delete the `-mobileSwitcher*` and `-divider*` rules and add:

```css
.KibitzChatPanel {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;

    .KibitzChatPanel-tabs {
        display: flex;
        flex-shrink: 0;
        border-bottom: 1px solid var(--shade3);

        .KibitzChatPanel-tab {
            flex: 1;
            background: transparent;
            border: none;
            padding: 0.4rem 0.5rem;
            color: var(--shade1);
            cursor: pointer;
            position: relative;

            &.active {
                color: var(--fg);
                box-shadow: inset 0 -2px 0 var(--primary);
            }
        }

        .KibitzChatPanel-unread {
            position: absolute;
            top: 0.35rem;
            right: 0.5rem;
            width: 0.5rem;
            height: 0.5rem;
            border-radius: 50%;
            background: var(--primary);
        }
    }

    .KibitzChatPanel-body {
        flex-grow: 1;
        min-height: 0;
        display: flex;
        position: relative;

        .KibitzChatPanel-log {
            flex-grow: 1;
            min-width: 0;
            overflow-y: auto;
        }

        .ChatUserList {
            width: 10rem;
            flex-shrink: 0;
            overflow-y: auto;
            border-left: 1px solid var(--shade3);
        }
    }

    .KibitzChatPanel-composer {
        flex-shrink: 0;
        display: flex;
        align-items: flex-end;
    }
}
```

Adjust the existing nested rules under the renamed root so the `chat-lines`, `kibitz-chat-entry`, and `variation-post` rules still apply.

- [x] **Step 5: Run the tests**

Run: `yarn test src/views/Kibitz/KibitzChatPanel && yarn type-check`
Expected: both test files PASS. The type-check will fail only in `KibitzInner.tsx` where the old panel was rendered; update those two render sites to `<KibitzChatPanel room=... items=... variations=... onOpenVariation=... gameController={mainBoardController} />` so the tree compiles (they get replaced in Task 12).

- [x] **Step 6: Commit**

```bash
yarn prettier:file src/views/Kibitz/KibitzChatPanel.tsx src/views/Kibitz/KibitzChatPanel.css src/views/Kibitz/KibitzChatPanel.test.ts src/views/Kibitz/KibitzChatPanel.render.test.tsx src/views/Kibitz/KibitzInner.tsx
git add -A src/views/Kibitz
git commit -m "refactor(kibitz): two-tab chat panel with room user list"
```

---

### Task 9: Variation panel and proposal panel

**Files:**
- Create: `src/views/Kibitz/KibitzVariationPanel.tsx` / `.css`
- Create: `src/views/Kibitz/KibitzProposalPanel.tsx` / `.css`

**Interfaces:**
- Consumes: `GobanAnalyzeButtonBar` (`@/components/GobanAnalyzeButtonBar`, props `controller`, `showBackToGame`, `showConditionalPlannerButton`), `Resizable` (`@/components/Resizable`), `KibitzNodeText` (`{controller, editable, disabled?}`), `KibitzVariationComposer` (`{controller, onSubmit, showSubmitButton?}`), `KibitzProposalBar` (`{proposal?, onVote}`), `KibitzProposalQueue` (`{proposals}`).
- Produces:

```ts
export interface KibitzVariationPanelProps {
    controller: GobanController;
    mode: "draft" | "variation";
    onPost: (controller: GobanController) => void;
    onDiscard: () => void;
}
export interface KibitzProposalPanelProps {
    activeProposal: KibitzProposal | undefined;
    queuedProposals: KibitzProposal[];
    onVote: (proposalId: string, choice: "change" | "keep") => void;
}
```

- [x] **Step 1: Variation panel**

Create `src/views/Kibitz/KibitzVariationPanel.tsx`:

```tsx
import * as React from "react";
import { pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import { Resizable } from "@/components/Resizable";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar";
import { KibitzNodeText } from "./KibitzNodeText";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import "./KibitzVariationPanel.css";

export interface KibitzVariationPanelProps {
    controller: GobanController;
    mode: "draft" | "variation";
    onPost: (controller: GobanController) => void;
    onDiscard: () => void;
}

/**
 * Sidebar controls for the board in the center when it shows a variation.
 * A draft gets the analysis tools and the composer; a posted variation only
 * gets the move tree and its node text.
 */
export function KibitzVariationPanel({ controller, mode, onPost, onDiscard }: KibitzVariationPanelProps): React.ReactElement {
    const setMoveTree = React.useCallback(
        (resizable: Resizable | null) => controller.setMoveTreeContainer(resizable),
        [controller],
    );

    return (
        <div className={`KibitzVariationPanel ${mode}`}>
            {mode === "draft" && (
                <GobanAnalyzeButtonBar
                    controller={controller}
                    showBackToGame={false}
                    showConditionalPlannerButton={false}
                />
            )}
            <Resizable
                key={controller.goban.game_id ?? "variation"}
                id="kibitz-move-tree-container"
                className="KibitzVariationPanel-moveTree"
                ref={setMoveTree}
            />
            <KibitzNodeText controller={controller} editable={mode === "draft"} />
            {mode === "draft" && (
                <div className="KibitzVariationPanel-actions">
                    <KibitzVariationComposer controller={controller} onSubmit={onPost} />
                    <button type="button" className="reject" onClick={onDiscard}>
                        {pgettext("Button that throws away a Kibitz variation draft", "Discard")}
                    </button>
                </div>
            )}
        </div>
    );
}
```

Check `Resizable`'s ref type: `GobanController.setMoveTreeContainer(resizable: Resizable | null)` accepts the class instance, so a callback ref typed `(resizable: Resizable | null) => void` matches. If `Resizable` is a class component the `ref` prop accepts it directly.

Create `src/views/Kibitz/KibitzVariationPanel.css`:

```css
.KibitzVariationPanel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .KibitzVariationPanel-moveTree {
        height: 10em;
        background-color: #888888;
        border-radius: 0.2em;
    }

    .KibitzVariationPanel-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
}
```

- [x] **Step 2: Proposal panel**

Create `src/views/Kibitz/KibitzProposalPanel.tsx`:

```tsx
import * as React from "react";
import type { KibitzProposal } from "@/models/kibitz";
import { KibitzProposalBar } from "./KibitzProposalBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import "./KibitzProposalPanel.css";

export interface KibitzProposalPanelProps {
    activeProposal: KibitzProposal | undefined;
    queuedProposals: KibitzProposal[];
    onVote: (proposalId: string, choice: "change" | "keep") => void;
}

export function KibitzProposalPanel({ activeProposal, queuedProposals, onVote }: KibitzProposalPanelProps): React.ReactElement | null {
    if (!activeProposal && queuedProposals.length === 0) {
        return null;
    }
    return (
        <div className="KibitzProposalPanel">
            <KibitzProposalBar proposal={activeProposal} onVote={onVote} />
            <KibitzProposalQueue proposals={queuedProposals} />
        </div>
    );
}
```

Create `src/views/Kibitz/KibitzProposalPanel.css`:

```css
.KibitzProposalPanel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}
```

Check `KibitzProposal` is exported from `@/models/kibitz` (it is referenced by `KibitzProposalQueue.tsx:40`; copy that file's import path).

- [x] **Step 3: Verify and commit**

Run: `yarn type-check && yarn lint`
Expected: PASS.

```bash
yarn prettier:file src/views/Kibitz/KibitzVariationPanel.tsx src/views/Kibitz/KibitzVariationPanel.css src/views/Kibitz/KibitzProposalPanel.tsx src/views/Kibitz/KibitzProposalPanel.css
git add src/views/Kibitz/KibitzVariationPanel.* src/views/Kibitz/KibitzProposalPanel.*
git commit -m "feat(kibitz): sidebar variation and proposal panels"
```

---

### Task 10: More actions popover

**Files:**
- Create: `src/views/Kibitz/KibitzMoreActionsPopover.tsx` / `.css`

**Interfaces:**
- Consumes: `openGameInfoModal(config, black, white, annulled, creator_id)` from `@/views/Game/GameInfoModal`; `openGameLinkModal(goban)` from `@/views/Game/GameLinkModal`; `openReport({reported_game_id})` from `@/components/Report`; `api1` from `@/lib/requests`.
- Produces:

```ts
export interface KibitzMoreActionsPopoverProps {
    controller: GobanController;  // the main game controller
    onClose: () => void;
}
export function KibitzMoreActionsPopover(props: KibitzMoreActionsPopoverProps): React.ReactElement;
export function openKibitzMoreActions(button: HTMLElement, controller: GobanController): PopOver;
```

- [x] **Step 1: Write the component**

Create `src/views/Kibitz/KibitzMoreActionsPopover.tsx`:

```tsx
import * as React from "react";
import { _ } from "@/lib/translate";
import { api1 } from "@/lib/requests";
import { popover, PopOver } from "@/lib/popover";
import { GobanController } from "@/lib/GobanController";
import { openReport } from "@/components/Report";
import { openGameInfoModal } from "@/views/Game/GameInfoModal";
import { openGameLinkModal } from "@/views/Game/GameLinkModal";
import "@/views/Game/GameSidebarPanels.css";
import "./KibitzMoreActionsPopover.css";

export interface KibitzMoreActionsPopoverProps {
    controller: GobanController;
    onClose: () => void;
}

export function KibitzMoreActionsPopover({ controller, onClose }: KibitzMoreActionsPopoverProps): React.ReactElement {
    const goban = controller.goban;
    const engine = goban.engine;
    const game_id = Number(goban.config.game_id);
    const sgf_url = api1(`games/${game_id}/sgf`);
    let sgf_disabled = false;
    try {
        sgf_disabled = goban.isAnalysisDisabled(true);
    } catch {
        sgf_disabled = false;
    }

    const wrap = (fn: () => void) => () => {
        fn();
        onClose();
    };

    return (
        <div className="GamePopover KibitzMoreActionsPopover">
            <div className="GameSidebarPanel">
                <button
                    type="button"
                    className="GameSidebarPanel-item"
                    onClick={wrap(() =>
                        openGameInfoModal(
                            goban.config,
                            engine.players.black,
                            engine.players.white,
                            engine.config.annulled ?? false,
                            goban.config.creator_id ?? 0,
                        ),
                    )}
                >
                    <i className="fa fa-info-circle" />
                    <span>{_("Game information")}</span>
                </button>
                <button type="button" className="GameSidebarPanel-item" onClick={wrap(() => openGameLinkModal(goban))}>
                    <i className="fa fa-share-alt" />
                    <span>{_("Link to game")}</span>
                </button>
                <a
                    className={"GameSidebarPanel-item" + (sgf_disabled ? " disabled" : "")}
                    href={sgf_url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(ev) => {
                        if (sgf_disabled) {
                            ev.preventDefault();
                            return;
                        }
                        onClose();
                    }}
                >
                    <i className="fa fa-download" />
                    <span>{_("Download SGF")}</span>
                </a>
                <button
                    type="button"
                    className="GameSidebarPanel-item"
                    onClick={wrap(() => openReport({ reported_game_id: game_id }))}
                >
                    <i className="fa fa-exclamation-triangle" />
                    <span>{_("Call moderator")}</span>
                </button>
            </div>
        </div>
    );
}

/** Opens the popover under `button`, right edge aligned to the button. */
export function openKibitzMoreActions(button: HTMLElement, controller: GobanController): PopOver {
    let instance: PopOver | null = null;
    const close = () => instance?.close();
    instance = popover({
        elt: <KibitzMoreActionsPopover controller={controller} onClose={close} />,
        below: button,
        minWidth: 220,
    });
    const rect = button.getBoundingClientRect();
    instance.container.style.left = "auto";
    instance.container.style.right = `${Math.max(0, window.innerWidth - rect.right)}px`;
    return instance;
}
```

Look at `GameInfoModal.tsx:431` and `Game.tsx` around the `openGameInfoModal` call to confirm where `annulled` and `creator_id` come from on the Game page, and copy those expressions if they differ from the above.

Create `src/views/Kibitz/KibitzMoreActionsPopover.css`:

```css
.KibitzMoreActionsPopover {
    min-width: 220px;
}
```

- [x] **Step 2: Verify and commit**

Run: `yarn type-check && yarn lint`

```bash
yarn prettier:file src/views/Kibitz/KibitzMoreActionsPopover.tsx src/views/Kibitz/KibitzMoreActionsPopover.css
git add src/views/Kibitz/KibitzMoreActionsPopover.*
git commit -m "feat(kibitz): more actions popover"
```

---

### Task 11: KibitzView

**Files:**
- Create: `src/views/Kibitz/KibitzView.tsx` / `.css`
- Create: `src/views/Kibitz/KibitzView.test.tsx`

**Interfaces:**
- Consumes: everything produced in Tasks 6 to 10, `GobanView` with `leftAside` and `playerBars`, `KibitzRoomSettingsPopover` (read its props at `KibitzRoomSettingsPopover.tsx` and the way `KibitzRoomStage.tsx:2140` opened it with `popover()`), `KibitzPresetChangePendingBanner` (props at its file), `useKibitzHelpTarget`, `KIBITZ_HELP_TARGETS`.
- Produces:

```ts
export interface KibitzViewProps {
    room: KibitzRoomSummary;
    gobans: KibitzGobans;
    isPortrait: boolean;
    streamerMode: boolean;
    onStreamerModeChange: (enabled: boolean) => void;
    leftAside: KibitzLeftAsideProps;
    chat: Omit<KibitzChatPanelProps, "gameController">;
    proposals: KibitzProposalPanelProps;
    onPostVariation: (controller: GobanController) => void;
    onExitVariation: () => void;
    onReturnToLive: () => void;
    roomSettings: {
        canEditRoom: boolean;
        canDeleteRoom: boolean;
        onChangeBoard?: () => void;
        onSaveRoomDetails: (title: string, description: string) => Promise<boolean>;
        onDeleteRoom: () => Promise<boolean>;
    };
    banner?: React.ReactNode;
    children?: React.ReactNode;
}
export function KibitzView(props: KibitzViewProps): React.ReactElement;
```

- [x] **Step 1: Write the failing render test**

Create `src/views/Kibitz/KibitzView.test.tsx`:

```tsx
import * as React from "react";
import { render, screen } from "@testing-library/react";
import type { GobanController } from "@/lib/GobanController";
import { KibitzView, KibitzViewProps } from "./KibitzView";

jest.mock("@/components/KBShortcut", () => ({ __esModule: true, KBShortcut: () => null }));
jest.mock("@/components/GobanContainer", () => ({
    __esModule: true,
    GobanContainer: () => <div data-testid="goban-container" />,
}));
jest.mock("@/components/GobanView/PlayerBar", () => ({
    __esModule: true,
    PlayerBar: ({ color }: { color: string }) => <div data-testid={`bar-${color}`} />,
}));
jest.mock("@/components/GobanView/MoveNumberSlider", () => ({
    __esModule: true,
    MoveNumberSlider: () => <div data-testid="slider" />,
}));
jest.mock("./KibitzLeftAside", () => ({
    __esModule: true,
    KibitzLeftAside: ({ miniBoardController }: { miniBoardController: unknown }) => (
        <div data-testid="left-aside" data-mini={miniBoardController ? "yes" : "no"} />
    ),
}));
jest.mock("./KibitzChatPanel", () => ({ __esModule: true, KibitzChatPanel: () => <div data-testid="chat" /> }));
jest.mock("./KibitzVariationPanel", () => ({
    __esModule: true,
    KibitzVariationPanel: ({ mode }: { mode: string }) => <div data-testid={`variation-panel-${mode}`} />,
}));
jest.mock("./KibitzProposalPanel", () => ({ __esModule: true, KibitzProposalPanel: () => <div data-testid="proposals" /> }));
jest.mock("./KibitzRoomSettingsPopover", () => ({ __esModule: true, KibitzRoomSettingsPopover: () => null }));
jest.mock("./KibitzMoreActionsPopover", () => ({ __esModule: true, openKibitzMoreActions: jest.fn() }));
jest.mock("./HelpFlows/useKibitzHelpTarget", () => ({ useKibitzHelpTarget: () => null }));
jest.mock("@/lib/hooks", () => ({ useUser: () => ({ id: 1, anonymous: false }) }));

function fakeController(): GobanController {
    return {
        goban: {
            config: { game_id: 100 },
            engine: {
                players: { black: { id: 1 }, white: { id: 2 } },
                playerColor: () => "invalid",
                rengo: false,
                cur_move: { move_number: 5 },
                last_official_move: { move_number: 5 },
            },
            on: jest.fn(),
            off: jest.fn(),
        },
        on: jest.fn(),
        off: jest.fn(),
    } as unknown as GobanController;
}

function baseProps(overrides: Partial<KibitzViewProps> = {}): KibitzViewProps {
    const main = fakeController();
    return {
        room: { id: "r1", title: "Room", channel: "kibitz-r1" } as KibitzViewProps["room"],
        gobans: { main, secondary: null, center: main, centerMode: "main" },
        isPortrait: false,
        streamerMode: false,
        onStreamerModeChange: jest.fn(),
        leftAside: {} as KibitzViewProps["leftAside"],
        chat: {} as KibitzViewProps["chat"],
        proposals: { activeProposal: undefined, queuedProposals: [], onVote: jest.fn() },
        onPostVariation: jest.fn(),
        onExitVariation: jest.fn(),
        onReturnToLive: jest.fn(),
        roomSettings: {
            canEditRoom: false,
            canDeleteRoom: false,
            onSaveRoomDetails: jest.fn(),
            onDeleteRoom: jest.fn(),
        },
        ...overrides,
    };
}

// jsdom reports a 1024x768 window, which goban_view_mode classifies as
// "wide", so these tests exercise the landscape layout.
describe("KibitzView", () => {
    test("main mode shows the board, bars, chat and no variation panel", () => {
        render(<KibitzView {...baseProps()} />);
        expect(screen.getByTestId("goban-container")).toBeInTheDocument();
        expect(screen.getByTestId("bar-white")).toBeInTheDocument();
        expect(screen.getByTestId("bar-black")).toBeInTheDocument();
        expect(screen.getByTestId("chat")).toBeInTheDocument();
        expect(screen.queryByTestId(/variation-panel/)).toBeNull();
        expect(screen.getByTestId("left-aside")).toHaveAttribute("data-mini", "no");
        expect(screen.queryByTitle("Return to game")).toBeNull();
    });

    test("draft mode shows the draft panel, mini board and return action", () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "draft" };
        render(<KibitzView {...props} />);
        expect(screen.getByTestId("variation-panel-draft")).toBeInTheDocument();
        expect(screen.getByTestId("left-aside")).toHaveAttribute("data-mini", "yes");
        expect(screen.getByTitle("Return to game")).toBeInTheDocument();
    });

    test("variation mode shows the read-only panel", () => {
        const props = baseProps();
        const secondary = fakeController();
        props.gobans = { ...props.gobans, secondary, center: secondary, centerMode: "variation" };
        render(<KibitzView {...props} />);
        expect(screen.getByTestId("variation-panel-variation")).toBeInTheDocument();
    });

    test("streamer mode hides the asides", () => {
        const { container } = render(<KibitzView {...baseProps({ streamerMode: true })} />);
        expect(container.querySelector(".Kibitz.is-streamer-mode")).not.toBeNull();
    });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `yarn test src/views/Kibitz/KibitzView.test.tsx`
Expected: FAIL, cannot find module `./KibitzView`.

- [x] **Step 3: Write KibitzView**

Create `src/views/Kibitz/KibitzView.tsx`:

```tsx
import * as React from "react";
import { _, pgettext } from "@/lib/translate";
import { GobanController } from "@/lib/GobanController";
import { popover, PopOver } from "@/lib/popover";
import { GobanView, GobanViewRef, generateGobanHook } from "@/components/GobanView";
import { KBShortcut } from "@/components/KBShortcut";
import type { KibitzRoomSummary } from "@/models/kibitz";
import type { KibitzGobans } from "./useKibitzGobans";
import { KibitzLeftAside, KibitzLeftAsideProps } from "./KibitzLeftAside";
import { KibitzChatPanel, KibitzChatPanelProps } from "./KibitzChatPanel";
import { KibitzVariationPanel } from "./KibitzVariationPanel";
import { KibitzProposalPanel, KibitzProposalPanelProps } from "./KibitzProposalPanel";
import { KibitzRoomSettingsPopover } from "./KibitzRoomSettingsPopover";
import { openKibitzMoreActions } from "./KibitzMoreActionsPopover";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import "./KibitzView.css";

export interface KibitzViewProps {
    room: KibitzRoomSummary;
    gobans: KibitzGobans;
    isPortrait: boolean;
    streamerMode: boolean;
    onStreamerModeChange: (enabled: boolean) => void;
    leftAside: KibitzLeftAsideProps;
    chat: Omit<KibitzChatPanelProps, "gameController">;
    proposals: KibitzProposalPanelProps;
    onPostVariation: (controller: GobanController) => void;
    onExitVariation: () => void;
    onReturnToLive: () => void;
    roomSettings: {
        canEditRoom: boolean;
        canDeleteRoom: boolean;
        onChangeBoard?: () => void;
        onSaveRoomDetails: (title: string, description: string) => Promise<boolean>;
        onDeleteRoom: () => Promise<boolean>;
    };
    /** Rendered above the sidebar panels, e.g. the preset change banner. */
    banner?: React.ReactNode;
    /** Non-tab children passed through to GobanView (overlays, debug panel). */
    children?: React.ReactNode;
}

const useBehindLive = generateGobanHook(
    (goban: GobanController["goban"] | null) =>
        !!goban && goban.engine.cur_move.move_number < goban.engine.last_official_move.move_number,
    ["cur_move", "last_official_move"],
);

/**
 * The Kibitz page laid out on GobanView: rooms and variations on the left,
 * the board with player bars in the center, proposals, variation controls
 * and chat on the right.
 */
export function KibitzView(props: KibitzViewProps): React.ReactElement | null {
    const { room, gobans, isPortrait, streamerMode } = props;
    const gobanViewRef = React.useRef<GobanViewRef>(null);
    const settingsPopoverRef = React.useRef<PopOver | null>(null);
    const roomTitleTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.desktopRoomTitle);
    const behindLive = useBehindLive(gobans.centerMode === "main" ? gobans.main?.goban ?? null : null);

    if (!gobans.center) {
        return null;
    }

    const viewingOther = gobans.centerMode !== "main";
    const miniBoardController = viewingOther ? gobans.main : null;

    const openSettings = (event?: React.MouseEvent<HTMLButtonElement>) => {
        if (!event) {
            return;
        }
        settingsPopoverRef.current?.close();
        const close = () => {
            settingsPopoverRef.current?.close();
            settingsPopoverRef.current = null;
        };
        settingsPopoverRef.current = popover({
            elt: (
                <KibitzRoomSettingsPopover
                    room={room}
                    canEditRoom={props.roomSettings.canEditRoom}
                    canDeleteRoom={props.roomSettings.canDeleteRoom}
                    onChangeBoard={props.roomSettings.onChangeBoard}
                    onSaveRoomDetails={props.roomSettings.onSaveRoomDetails}
                    onDeleteRoom={props.roomSettings.onDeleteRoom}
                    streamerMode={streamerMode}
                    onStreamerModeChange={props.onStreamerModeChange}
                    onClose={close}
                />
            ),
            below: event.currentTarget,
            minWidth: 280,
        });
    };

    const closeTakeovers = () => gobanViewRef.current?.setActiveTakeover(null);
    const exitVariation = () => {
        closeTakeovers();
        props.onExitVariation();
    };

    const leftAside = (
        <KibitzLeftAside
            {...props.leftAside}
            miniBoardController={miniBoardController}
            onExitVariation={exitVariation}
        />
    );

    return (
        <GobanView
            ref={gobanViewRef}
            controller={gobans.center}
            className={"Kibitz" + (streamerMode ? " is-streamer-mode" : "")}
            header={<span ref={roomTitleTarget?.ref}>{room.title}</span>}
            leftAside={!isPortrait && !streamerMode ? leftAside : undefined}
            playerBars
        >
            {viewingOther && <KBShortcut shortcut="esc" action={exitVariation} />}

            <GobanView.Tab id="kibitz-main" type="always">
                {props.banner}
                <KibitzProposalPanel {...props.proposals} />
                {viewingOther && gobans.secondary && gobans.centerMode !== "preview" && (
                    <KibitzVariationPanel
                        controller={gobans.secondary}
                        mode={gobans.centerMode === "draft" ? "draft" : "variation"}
                        onPost={props.onPostVariation}
                        onDiscard={exitVariation}
                    />
                )}
                <KibitzChatPanel {...props.chat} gameController={gobans.main} />
            </GobanView.Tab>

            <GobanView.Tab
                id="kibitz-settings"
                type="action"
                align="left"
                icon="gear"
                title={_("Settings")}
                onClick={openSettings}
            />

            {isPortrait && (
                <GobanView.Tab
                    id="kibitz-rooms"
                    type="takeover"
                    align="left"
                    icon="list"
                    title={pgettext("Tab that lists Kibitz rooms", "Rooms")}
                >
                    {leftAside}
                </GobanView.Tab>
            )}

            {viewingOther && (
                <GobanView.Tab
                    id="kibitz-return-to-game"
                    type="action"
                    align="center"
                    icon="arrow-left"
                    title={pgettext("Action that leaves a Kibitz variation and shows the live game", "Return to game")}
                    onClick={exitVariation}
                />
            )}

            {!viewingOther && behindLive && (
                <GobanView.Tab
                    id="kibitz-return-to-live"
                    type="action"
                    align="center"
                    icon="forward"
                    title={pgettext("Action that jumps a Kibitz board to the latest move", "Return to live")}
                    onClick={props.onReturnToLive}
                />
            )}

            <GobanView.Tab
                id="kibitz-more"
                type="action"
                align="right"
                icon="ellipsis-h"
                title={_("More actions")}
                onClick={(event) => {
                    if (event && gobans.main) {
                        openKibitzMoreActions(event.currentTarget, gobans.main);
                    }
                }}
            />

            {props.children}
        </GobanView>
    );
}
```

The portrait Rooms takeover holds the whole left aside (rooms, variations, mini board), matching the spec's single `kibitz-rooms` row.

Read `KibitzRoomSettingsPopover.tsx` props and adjust the `openSettings` element to its actual prop names. Read `KibitzPresetChangePendingBanner.tsx` to see what `banner` should receive (Task 12 passes it).

Create `src/views/Kibitz/KibitzView.css`:

```css
.GobanView.Kibitz {
    .GobanView-header {
        font-size: 1.1rem;
    }

    .KibitzChatPanel {
        min-height: 20rem;
        flex-grow: 1;
    }

    &.is-streamer-mode {
        .GobanView-sidebar {
            display: none;
        }
    }
}
```

- [x] **Step 4: Run the test**

Run: `yarn test src/views/Kibitz/KibitzView.test.tsx && yarn type-check`
Expected: PASS. Type errors about mock shapes belong in the test; fix them there.

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/views/Kibitz/KibitzView.tsx src/views/Kibitz/KibitzView.css src/views/Kibitz/KibitzView.test.tsx
git add src/views/Kibitz/KibitzView.*
git commit -m "feat(kibitz): KibitzView lays the room out on GobanView"
```

---

### Task 12: Wire KibitzInner to KibitzView

**Files:**
- Modify: `src/views/Kibitz/KibitzInner.tsx` (large reduction)
- Delete: `src/views/Kibitz/KibitzInner.snapshot.test.tsx`

**Interfaces:**
- Consumes: `useKibitzGobans`, `KibitzView`, `useKibitzCurrentGameConnectionKeeper` (unchanged), `KibitzGamePickerOverlay`, `KibitzDebugPanel`, `KibitzPresetChangePendingBanner`.

This task keeps every non-layout item listed below and deletes the rest. Work in the order given so the type-checker guides each step.

- [x] **Step 1: Delete the snapshot test**

```bash
git rm src/views/Kibitz/KibitzInner.snapshot.test.tsx
```

It asserts the old DOM. Coverage moves to `KibitzView.test.tsx` and `KibitzInner.test.ts` (pure logic, kept).

- [x] **Step 2: Remove layout state and effects from KibitzInner**

Delete these, with any helper only they used:
- `MOBILE_SPLIT_STORAGE_KEY`, `DESKTOP_SIDEBAR_WIDTH_STORAGE_KEY` (lines 325, 329) and every `desktopSidebarWidthPx`, `isDesktopSidebarDragging`, `mobileSplitRatio`, `mobileDividerDragging` state, ref, handler, and effect.
- `mobileCompanionPanel`, `mobileOverlayMode`, `onSelectMobileCompanionPanel`, `onOpenMobileRooms`, `handleMobileBoardTransientDragControllerChange`, `handleMobileBoardSizeChange`, and the `isMobileLayout` branches inside `onSelectRoom`, `onOpenCreateRoom`, `onOpenChangeBoard`, `onCreateVariation`, `onClearPreview`. Replace `isMobileLayout` with `isPortrait` from `useViewMode` below where the picker needs it (`pickerOpen` becomes `Boolean(pickerMode)`).
- `pendingSecondaryPaneMode`, `onSetSecondaryPaneMode`, `currentSecondaryPaneMode`, and the flush effect (lines 108, 688-689, 1986-1988, 2971, 3143-3155, 3358, 3369).
- `mainBoardController` state, `setMainBoardController`, `isCurrentMainBoardController`, `mainBoardControllerEpochRef`, `mainBoardControllerContextRef`, `visibleMainBoardHydration`, `handleMainBoardHydrationChange`, `logMainBoardState`, `useKibitzCurrentGameBaseBroker(...)` call and import. Keep `currentGameBaseSnapshot`, `acceptCurrentGameBaseSnapshot`, the `fetchCurrentGameBaseSnapshot` effect, `getCurrentGameBaseSnapshotForVariation`, `showCurrentGameBaseNotReadyToast`, and `currentGameBaseSnapshotFreshnessMoveNumber` (simplify the latter to `currentGameBaseSnapshot?.trunkTailMoveNumber ?? 0` if it depended on hydration state).
- The `document.body.classList.toggle("kibitz-streamer-mode", ...)` effect (3584-3590) and `effectiveStreamerMode`.
- The `variationPanels` element (3318-3336) and the three return branches' JSX (3679 to the end). The `KibitzRoomStage`, `KibitzPresence`, `KibitzPresencePanel`, `KibitzMobileMainGameScoreboard`, `KibitzMobileComparePanel`, `KibitzMobileGamePicker` imports go unless the mobile picker is still needed for the change-board flow on portrait; if so keep `KibitzMobileGamePicker` and open it from `onOpenChangeBoard` when `isPortrait`.
- Help targets registered only for the mobile shell or the stage: `mobileRoomTitle`, `mobileRoomMenu`, `mobilePanelSwitcher`, `mobileVariationsTab`, `mobileVariationsPanel`, `mobileVariationBoard`, `mobileVariationActions`, `mobileMainBoard`, `desktopMainBoard`, `desktopVariationBoard`, `desktopVariationActions`. Keep `desktopRoomList`, `desktopVariations`, `desktopStream`, `desktopVariationList` (passed down) and update `useKibitzHelpTriggers`'s `flowReadiness` argument to only reference targets that still exist; edit `HelpFlows/KibitzHelpFlows.tsx` and `KibitzHelpTargets.ts` to drop steps that pointed at removed targets.

- [x] **Step 3: Add the hook and view mode**

Near the other hooks in `KibitzInner`:

```ts
    const view_mode = useViewMode(null);
    const isPortrait = view_mode === "portrait";

    const gobans = useKibitzGobans({
        roomId: resolvedRoom?.id ?? null,
        currentGame: resolvedRoom?.current_game,
        secondaryPane,
        variations: displayedVariations,
        visibleVariationIds,
        variationColorIndexes,
        variationGameById,
        onMainSnapshot: acceptCurrentGameBaseSnapshot,
    });
```

with `import { useViewMode } from "@/components/GobanView";` and `import { useKibitzGobans } from "./useKibitzGobans";`. `useViewMode(null)` falls back to the window-based mode; check its implementation in `src/components/GobanView/hooks.ts:60` and, if it does not listen for resizes when given null, replace with a small `React.useState(goban_view_mode())` plus a `window` resize listener.

Replace the `useKibitzCurrentGameConnectionKeeper({...})` call's `boardController` argument with `gobans.main` and `pickerOpen` with `Boolean(pickerMode)`.

Where `getCurrentGameBaseSnapshotForVariation` previously consulted the main board controller, use `captureCurrentGameBaseSnapshotFromController(gobans.main, resolvedRoom?.current_game, resolvedRoom?.id)` first and fall back to `currentGameBaseSnapshot`.

The game-chat variation effect (line 3168, `goban.on("chat" ...)`) subscribed to `mainBoardController.goban`; point it at `gobans.main?.goban` with `gobans.main` in its dependency list.

- [x] **Step 4: Add exit and return handlers**

```ts
    const onExitVariation = React.useCallback(() => {
        controller.closeSecondaryPane();
    }, [controller]);

    const onReturnToLive = React.useCallback(() => {
        const main = gobans.main;
        if (!main) {
            return;
        }
        main.gotoLastMove();
        if (main.goban.mode === "analyze") {
            main.goban.setMode("play");
        }
    }, [gobans.main]);
```

`onClearPreview` (line 2744) keeps its "open the next visible variation, else clear" behaviour; the `KibitzVariationList` hide path already calls it.

- [x] **Step 5: Replace the three return branches**

Replace everything from the first `if (rooms.length === 0)` return branch (line 3679) to the end of the component with:

```tsx
    if (isBlockedRoom) {
        return blockedRoomView;   // the existing early-return element from line 3674, unchanged
    }

    if (!resolvedRoom) {
        return (
            <div className="Kibitz Kibitz-empty">
                {rooms.length === 0
                    ? pgettext("Kibitz placeholder shown when no rooms exist", "No Kibitz rooms yet")
                    : pgettext("Kibitz loading state", "Loading Kibitz...")}
                {canOpenCreateRoomFlow && (
                    <button type="button" className="primary" onClick={onOpenCreateRoom}>
                        {pgettext("Button label for opening the Kibitz create room picker", "Create room")}
                    </button>
                )}
                {pickerOverlay}
            </div>
        );
    }

    return (
        <KibitzView
            room={resolvedRoom}
            gobans={gobans}
            isPortrait={isPortrait}
            streamerMode={streamerMode}
            onStreamerModeChange={setStreamerMode}
            banner={
                <KibitzPresetChangePendingBanner
                    room={resolvedRoom}
                    // copy the remaining props from the current banner render site
                />
            }
            leftAside={{
                rooms,
                activeRoomId: resolvedRoom.id,
                blockedRoomIds,
                onSelectRoom,
                onCreateRoom: onOpenCreateRoom,
                canOpenCreateRoomFlow,
                signInHref: createRoomSignInHref,
                variations: displayedVariations,
                currentGameId: resolvedRoom.current_game?.game_id ?? null,
                variationGameById,
                selectedVariationId: secondaryPane.variation_id ?? null,
                variationFocusRequestId,
                variationColorIndexes,
                blockedVariationFlashId,
                onRecallVariation: (id) => onOpenVariation(id, true),
                onHideVariation: onToggleVariation,
                onCreateVariation,
                miniBoardController: null,
                onExitVariation,
                roomListHelpTargetId: KIBITZ_HELP_TARGETS.desktopRoomList,
                variationListHelpTargetId: KIBITZ_HELP_TARGETS.desktopVariationList,
            }}
            chat={{
                room: resolvedRoom,
                items: stream,
                variations: displayedVariations,
                onOpenVariation,
            }}
            proposals={{
                activeProposal,
                queuedProposals: queuedRoomProposals,
                onVote: (proposalId, choice) => controller.voteOnProposal(proposalId, choice),
            }}
            onPostVariation={(boardController) =>
                onPostVariation(boardController, secondaryPane.variation_source_game_id)
            }
            onExitVariation={onExitVariation}
            onReturnToLive={onReturnToLive}
            roomSettings={{
                canEditRoom: canManageRoom,
                canDeleteRoom: permissions.can_delete_room,
                onChangeBoard: handleOpenChangeBoard,
                onSaveRoomDetails: (title, description) =>
                    controller.updateRoomDetails(resolvedRoom.id, title, description),
                onDeleteRoom: handleDeleteRoom,
            }}
        >
            {showDebug && <KibitzDebugPanel debug={debug} /* copy remaining props */ />}
            {pickerOverlay}
        </KibitzView>
    );
```

`KibitzView` overrides `miniBoardController` and `onExitVariation` inside `leftAside`, so the `null` placeholder here is only to satisfy the type. `activeProposal` and `queuedRoomProposals` already exist in `KibitzInner` (the inventory shows `mobileHasActiveVote={Boolean(activeProposal)}` and `<KibitzProposalQueue proposals={queuedRoomProposals} />`). Copy the banner and debug panel props from their existing render sites before deleting those sites.

- [x] **Step 6: Type-check until clean**

Run `yarn type-check` repeatedly. Every remaining error is either an unused import, a deleted identifier still referenced, or a leftover mobile branch. Remove them. Do not stub anything with `any`.

Run: `yarn test src/views/Kibitz/KibitzInner.test.ts src/views/Kibitz/KibitzView.test.tsx src/views/Kibitz/useKibitzGobans.test.tsx`
Expected: PASS.

- [x] **Step 7: Manual check**

Run `yarn dev`, open `/kibitz`. Confirm: rooms on the left, board with bars in the center, chat on the right; opening a variation shows the mini board and the variation panel; Escape and the mini board return to the live game; the gear opens room settings; the ellipsis opens the actions popover. Narrow the window below portrait width and confirm the Rooms takeover and inline panels.

- [x] **Step 8: Commit**

```bash
yarn prettier:file src/views/Kibitz/KibitzInner.tsx src/views/Kibitz/HelpFlows/KibitzHelpFlows.tsx src/views/Kibitz/HelpFlows/KibitzHelpTargets.ts src/views/Kibitz/HelpFlows/useKibitzHelpTriggers.ts
git add -A src/views/Kibitz
git commit -m "feat(kibitz): render the room through KibitzView"
```

---

### Task 13: Delete the old layout modules

**Files:**
- Delete (each with its `.css` and test files where they exist): `KibitzRoomStage`, `KibitzBoard`, `kibitzBoardSizing`, `kibitzBoardSizeDebug`, `KibitzDividerHandle`, `KibitzDesktopMainGameScoreboard`, `KibitzMobileMainGameScoreboard`, `kibitzScoreboardPlayerDisplay`, `KibitzMainGameStats`, `KibitzPresence`, `KibitzPresencePanel`, `KibitzMobileComparePanel`, `useKibitzCurrentGameBaseBroker`, `KibitzBoardControls`, `KibitzMoveTreeStrip`.
- Modify: `src/views/Kibitz/Kibitz.css`, `src/views/Kibitz/index.ts`, `src/views/Kibitz/style-imports.d.ts` if it lists CSS files.

- [x] **Step 1: Delete**

```bash
cd src/views/Kibitz
git rm KibitzRoomStage.tsx KibitzRoomStage.css KibitzRoomStage.test.ts KibitzRoomStage.scoreboard.test.tsx \
  KibitzBoard.tsx KibitzBoard.css KibitzBoard.test.ts KibitzBoard.host-ready.test.tsx \
  kibitzBoardSizing.ts kibitzBoardSizeDebug.ts \
  KibitzDividerHandle.tsx KibitzDividerHandle.css \
  KibitzDesktopMainGameScoreboard.tsx KibitzDesktopMainGameScoreboard.css KibitzDesktopMainGameScoreboard.test.tsx \
  KibitzMobileMainGameScoreboard.tsx KibitzMobileMainGameScoreboard.css KibitzMobileMainGameScoreboard.test.tsx \
  kibitzScoreboardPlayerDisplay.tsx kibitzScoreboardPlayerDisplay.css \
  KibitzMainGameStats.tsx KibitzMainGameStats.css KibitzMainGameStats.test.tsx \
  KibitzPresence.tsx KibitzPresence.css KibitzPresence.test.tsx KibitzPresencePanel.tsx KibitzPresencePanel.css \
  KibitzMobileComparePanel.tsx KibitzMobileComparePanel.css KibitzMobileComparePanel.test.tsx \
  useKibitzCurrentGameBaseBroker.ts useKibitzCurrentGameBaseBroker.test.tsx \
  KibitzBoardControls.tsx KibitzBoardControls.css KibitzBoardControls.test.tsx \
  KibitzMoveTreeStrip.tsx KibitzMoveTreeStrip.css
cd -
```

If any of these files does not exist, drop it from the command. If `kibitzBoardSizing.ts` has a test file, remove it too.

- [x] **Step 2: Fix references**

Run `yarn type-check`. Fix imports of the deleted modules in surviving files:
- `kibitzCurrentGameBaseSnapshot.ts` may import `KibitzBoardLoadConfig` from its own types file (fine) or helpers from `KibitzBoard.tsx` (move them in).
- `KibitzGamePickerOverlay.tsx` and `KibitzMobileGamePicker.tsx` may import `KibitzBoard` for previews. Replace each with a `GobanContainer` over a locally created read-only `GobanController` (`game_id` set, `interactive: false`), destroyed on unmount, or with the existing `MiniGoban` component from `@/components/MiniGoban` if it already fits. Check which one those files use today and prefer the smaller change.
- Tests that mock deleted modules: delete the mock lines.

- [x] **Step 3: Trim Kibitz.css**

Keep only `.Kibitz.Kibitz-empty` styling and delete the grid layout, sidebar, left rail, resizer, streamer mode, mobile shell, and media query rules that referred to removed class names. Streamer mode now lives in `KibitzView.css`.

- [x] **Step 4: Verify**

Run: `yarn type-check && yarn lint && yarn test src/views/Kibitz src/components/GobanView`
Expected: PASS.

- [x] **Step 5: Commit**

```bash
yarn prettier:file src/views/Kibitz/*.ts src/views/Kibitz/*.tsx src/views/Kibitz/*.css
git add -A src/views/Kibitz
git commit -m "refactor(kibitz): remove the old stage, board host, sizing and scoreboards"
```

---

## Phase 3: Documentation and final verification

### Task 14: Durable doc, graph update, build

**Files:**
- Create: `docs/kibitz.md`
- Modify: `docs/superpowers/plans/2026-09-03-kibitz-gobanview.md` (tick boxes, note deviations)

- [x] **Step 1: Write `docs/kibitz.md`**

```markdown
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
in a Rooms takeover tab.

Action bar: settings gear (left), Return to game or Return to live (center),
More actions (right).

## Controllers

`useKibitzGobans` (`src/views/Kibitz/useKibitzGobans.ts`) owns two
`GobanController`s. The main controller connects to the room's live game
with `game_id` set and lives until the room changes game. It is always
mounted, in the center or in the thumbnail. The secondary controller is
built for a draft, a posted variation or a game preview and destroyed on
exit. For the current game its trunk is a snapshot of the main controller,
so no second socket is opened for the same game; other games connect
read-only. GobanView receives whichever controller the center shows.

`useKibitzCurrentGameConnectionKeeper` re-sends `game/connect` for the main
game after the game picker closes, because mini gobans in the picker send
`game/disconnect` for the same game id when they unmount.

## State

`KibitzController` holds rooms, the active room, stream items, proposals,
variations and the secondary pane. The secondary pane (`collapsed`,
`variation_id`, `preview_game_id`, `variation_source_*`) fully determines
what the center shows; `deriveKibitzCenterMode` maps it to
`main | draft | variation | preview`.
```

- [x] **Step 2: Update the graph and build**

```bash
graphify update .
yarn build
```

Expected: build succeeds.

- [x] **Step 3: Amend the plan**

Tick completed steps and record any deviation taken during execution in a short "Deviations" section at the end of this plan.

- [x] **Step 4: Commit**

```bash
git add docs/kibitz.md docs/superpowers/plans/2026-09-03-kibitz-gobanview.md graphify-out
git commit -m "docs: describe the Kibitz layout and controller ownership"
```

- [x] **Step 5: Before opening the PR**

Remind the author to test manually in a desktop browser and a mobile browser: room switching, opening and exiting a variation, drafting and posting, previewing a game from the picker, chat in both tabs, the room user list, and the More actions items. Use the repository PR template at `.github/pull_request_template.md`.

## Deviations

- Task 5: transitional no-op of the old pane-open paths, resolved by Task 13.
- Task 6: two fix rounds — mainReady gate for the null main snapshot; connected boards compose on load; main effect deps reduced to [gameId]; gate only applies to same-game boards.
- Task 7: `KibitzHelpTargetId` exported; create-variation button moved to the variation list.
- Task 8: room composer got its own disabled placeholder; `.KibitzChatPanel-log` made a flex column so `.chat-lines` scrolls.
- Task 10: `openGameInfoModal` arguments taken from `controller.annulled` and `controller.creator_id || goban.review_owner_id || 0` (the plan's expressions did not type-check).
- Task 11: streamer mode keeps the tab bar; portrait Rooms takeover suppressed in streamer mode; settings popover closed on unmount.
- Task 12: body class `kibitz-streamer-mode` restored; waiting layout for rooms without a game; "New variation from here" restored; `roomManagement` help flow and `desktopRoomSettings` target removed; `PlayerIcon` size 64 (40 is not a CDN size) fitted into the 40px box by CSS; view mode from `goban_view_mode()` plus a resize listener.
- Task 13: `KibitzBoardPreview` added for picker/proposal thumbnails; `KibitzMobileGamePicker` and `Kibitz.css` deleted as unreferenced; `e2e-tests/kibitz/*` still reference old class names and must be updated separately.
- Task 12: mobile help flows (`mobileFirstRun`, `mobileFirstVariations`, `mobilePostedVariation`, `desktopPostedVariation`) and their target ids were removed because their surfaces no longer exist; portrait has no onboarding flow (follow-up).
- Spec: the mini main board cannot hide coordinate labels because it shares the main goban; labels follow the main board.
- Final review: thumbnail derived from controller identity, not center mode; the left aside stays mounted (hidden with CSS) in streamer mode so the main board always has a connected parent.
