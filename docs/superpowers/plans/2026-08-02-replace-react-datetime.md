# Replace react-datetime with native datetime-local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the `react-datetime` dependency from ogs-ui, replacing its three usages with native `<input type="datetime-local">` plus two shared conversion helpers.

**Architecture:** `react-datetime@3.3.1` ships a CJS bundle whose `module.exports` is `{ __esModule: true, default: Component }` while its own typings declare `export = Component`. Vite 8 implements Node ESM interop faithfully, so `import Datetime from "react-datetime"` now resolves to that wrapper object rather than the component, and every site rendering `<Datetime>` throws `Element type is invalid ... but got: object`. Upstream has had this reported since 2021 (issue #770) and is dormant. Rather than shim the interop, this plan removes the dependency: two pure functions convert between `Date` and the local wall-clock string format that `<input type="datetime-local">` uses, and each call site renders a plain native input.

**Tech Stack:** TypeScript, React 19, Vite 8, jest (unit), Playwright (e2e), PostCSS.

## Global Constraints

- No `any` types in new code.
- No emojis anywhere in code or commit messages.
- Comments describe what the code does and why, in present tense. Never narrate the change ("was X", "previously Y", "now Z").
- No train-of-thought comments.
- One component per file. CSS uses PostCSS nested syntax.
- Use `yarn`, never `npm`.
- Run `yarn prettier:file <modified-files>` on only the files you modified, never the whole tree.
- Create the branch with `--no-track` so it does not inherit `origin/main` as upstream.
- **Do not push.** Commit per task as directed, then show the diff and wait for the author's go-ahead before pushing.
- **Do not run Playwright.** Every task verifies statically (`prettier:file`, `type-check`, `lint`, `jest`) plus `yarn build` at the end. All e2e verification is deferred to the Handover section, which the author drives. A task that ends with its static checks green is complete for review purposes.
- Do not translate or otherwise change the existing untranslated English headings in `BanModal.tsx` (`Public reason (displayed to user)`, `Moderator only notes (optional)`, `Ban expiration`). They are pre-existing and out of scope.
- Do not change the pre-existing `onChange: (d: any) => void` prop type on `BanDetails` or the `Modal<Events, BanModalProperties, any>` state type. Pre-existing, out of scope.
- Do not add `min`/`max` constraints to the new inputs. `react-datetime` imposed none; this change preserves behaviour rather than adding validation.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/datetime_input.ts` | **Create.** Two pure functions converting between `Date` and the `<input type="datetime-local">` value format. |
| `src/lib/datetime_input.test.ts` | **Create.** Jest unit tests for the above. Timezone-independent. |
| `src/components/BanModal/BanModal.tsx` | **Modify.** Ban expiration picker. |
| `src/components/BanModal/BanModal.css` | **Modify.** Replace the `.rdt` spacing rule. |
| `src/views/Tournament/Tournament.tsx` | **Modify.** Tournament start time picker and its change handler. |
| `src/views/Styling/Styling.tsx` | **Modify.** Remove the styleguide demo (a native `datetime-local` already sits directly above it). |
| `src/global_styl/react-datetime.css` | **Delete.** Picked up by `@import-glob "./global_styl/*.css"` in `src/ogs.css`, so deleting the file removes it from the bundle with no import line to edit. |
| `package.json` | **Modify.** Drop the `react-datetime` dependency. |

---

### Task 0: Branch

- [ ] **Step 1: Create the branch**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui checkout main
git -C /Users/mgregory/src/OGS/ogs-ui checkout --no-track -b replace-react-datetime
```

- [ ] **Step 2: Confirm a clean tree**

Run: `git -C /Users/mgregory/src/OGS/ogs-ui status`
Expected: `nothing to commit, working tree clean`, on branch `replace-react-datetime`.

---

### Task 1: Conversion helpers

**Files:**
- Create: `src/lib/datetime_input.ts`
- Test: `src/lib/datetime_input.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `toDatetimeLocalValue(date: Date): string` — formats a `Date` as local wall-clock `YYYY-MM-DDTHH:mm`. Returns `""` for an invalid `Date`.
  - `fromDatetimeLocalValue(value: string): Date | undefined` — parses that format as local wall-clock time. Returns `undefined` for an empty or unparseable value.

**Why these semantics:** `<input type="datetime-local">` has no timezone component; its value is always local wall-clock. Both call sites already operate in local time and convert to UTC only when sending to the server, so keeping the helpers local-only preserves existing behaviour exactly. `new Date("2026-08-02T15:04")` is specified to parse date-time forms without an offset as local time, which is why `fromDatetimeLocalValue` can delegate to the `Date` constructor.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/datetime_input.test.ts`:

```ts
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

import { fromDatetimeLocalValue, toDatetimeLocalValue } from "./datetime_input";

/* The Date constructor's multi-argument form builds a local-time date, and the
 * helpers are local-only, so these expectations hold in any timezone. */

describe("toDatetimeLocalValue", () => {
    test("formats a local date as YYYY-MM-DDTHH:mm", () => {
        expect(toDatetimeLocalValue(new Date(2026, 7, 2, 15, 4))).toBe("2026-08-02T15:04");
    });

    test("zero-pads single digit month, day, hour and minute", () => {
        expect(toDatetimeLocalValue(new Date(2026, 0, 9, 3, 7))).toBe("2026-01-09T03:07");
    });

    test("drops seconds", () => {
        expect(toDatetimeLocalValue(new Date(2026, 7, 2, 15, 4, 59))).toBe("2026-08-02T15:04");
    });

    test("returns an empty string for an invalid date", () => {
        expect(toDatetimeLocalValue(new Date("not a date"))).toBe("");
    });
});

describe("fromDatetimeLocalValue", () => {
    test("parses the value as local wall-clock time", () => {
        expect(fromDatetimeLocalValue("2026-08-02T15:04")).toEqual(new Date(2026, 7, 2, 15, 4));
    });

    test("returns undefined for an empty field", () => {
        expect(fromDatetimeLocalValue("")).toBeUndefined();
    });

    test("returns undefined for an unparseable value", () => {
        expect(fromDatetimeLocalValue("not a date")).toBeUndefined();
    });

    test("round-trips a date truncated to the minute", () => {
        const original = new Date(2026, 7, 2, 15, 4);
        expect(fromDatetimeLocalValue(toDatetimeLocalValue(original))).toEqual(original);
    });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test datetime_input`
Expected: FAIL — cannot resolve `./datetime_input`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/datetime_input.ts`:

```ts
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

/* `<input type="datetime-local">` carries no timezone: its value is a local
 * wall-clock string of the form YYYY-MM-DDTHH:mm. These helpers convert between
 * that format and Date, staying in local time throughout. Callers convert to UTC
 * at the point they send a value to the server. */

function pad(value: number, length: number): string {
    return String(value).padStart(length, "0");
}

/** Formats a Date for an `<input type="datetime-local">` value.
 *  An invalid Date yields "", which renders the input empty. */
export function toDatetimeLocalValue(date: Date): string {
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const day = `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;
    const time = `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}`;

    return `${day}T${time}`;
}

/** Parses an `<input type="datetime-local">` value as local wall-clock time.
 *  An empty or unparseable value yields undefined, which both callers treat as
 *  "no date chosen". */
export function fromDatetimeLocalValue(value: string): Date | undefined {
    if (!value) {
        return undefined;
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? undefined : date;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test datetime_input`
Expected: PASS, 8 tests.

- [ ] **Step 5: Format and check**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/lib/datetime_input.ts src/lib/datetime_input.test.ts
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
```

Expected: all clean.

- [ ] **Step 6: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/lib/datetime_input.ts src/lib/datetime_input.test.ts
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "feat(datetime): add datetime-local conversion helpers"
```

---

### Task 2: BanModal ban expiration

**Files:**
- Modify: `src/components/BanModal/BanModal.tsx:19` (import), `:91-119` (`BanDetails`)
- Modify: `src/components/BanModal/BanModal.css:36-38`

**Interfaces:**
- Consumes: `fromDatetimeLocalValue` from Task 1.
- Produces: nothing new. `BanDetails` keeps its existing `onChange` contract, still emitting `ban_expiration` as `Date | undefined`, so `BanModal.render`'s `ban()` — which calls `this.state.details.ban_expiration?.toISOString()` — is unchanged.

**Design note:** `BanDetails` holds the raw input string in state and converts on the way out, so the input stays a controlled component and partially-typed values do not round-trip through `Date`. The current code stores `d._d` (moment's internal `Date`), which is also why clearing the field currently misbehaves.

- [ ] **Step 1: Remove the react-datetime import**

In `src/components/BanModal/BanModal.tsx`, delete line 19:

```tsx
import Datetime from "react-datetime";
```

and add, alongside the other `@/lib` imports:

```tsx
import { fromDatetimeLocalValue } from "@/lib/datetime_input";
```

- [ ] **Step 2: Change the expiration state to hold the input value**

In `BanDetails`, replace:

```tsx
    const [expiration, set_expiration] = React.useState();
```

with:

```tsx
    const [expiration, set_expiration] = React.useState("");
```

- [ ] **Step 3: Convert on the way out**

In the `React.useEffect` inside `BanDetails`, replace:

```tsx
            ban_expiration: expiration,
```

with:

```tsx
            ban_expiration: fromDatetimeLocalValue(expiration),
```

- [ ] **Step 4: Replace the picker**

Replace:

```tsx
            <Datetime value={expiration} onChange={(d: any) => set_expiration(d._d)} />
```

with:

```tsx
            <input
                type="datetime-local"
                className="ban-expiration"
                value={expiration}
                onChange={(e) => set_expiration(e.target.value)}
            />
```

- [ ] **Step 5: Move the spacing rule onto the new input**

In `src/components/BanModal/BanModal.css`, replace:

```css
    .rdt { /* react date time */
        margin-bottom: 0.5rem;
    }
```

with:

```css
    .ban-expiration {
        margin-bottom: 0.5rem;
    }
```

- [ ] **Step 6: Verify statically**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/components/BanModal/BanModal.tsx
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
```

Expected: all clean.

Do not run Playwright. The moderation family (`mod-suspend-appeal-restore.ts`, `mod-system-pm-button.ts`, `ai-detector-sees-suspension-modlog.ts`) all drive this modal and are the behavioural check for this change, but they run once at Handover rather than per task.

- [ ] **Step 7: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/components/BanModal/BanModal.tsx src/components/BanModal/BanModal.css
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "fix(moderation): use a native datetime input for ban expiration"
```

---

### Task 3: Tournament start time

**Files:**
- Modify: `src/views/Tournament/Tournament.tsx:32` (import), `:616-620` (`setStartTime`), `:1152-1155` (picker)

**Interfaces:**
- Consumes: `toDatetimeLocalValue` and `fromDatetimeLocalValue` from Task 1.
- Produces: nothing new. `time_start` stays a `moment().format()` string (ISO 8601 with offset), so line 575's `moment(new Date(...)).utc().format()` on save and line 887's `moment(new Date(...)).format("LLLL")` for display are both unchanged.

**Note:** `moment` is already imported in this file from `@/lib/translate` (line 24). Do not add a new moment import.

- [ ] **Step 1: Remove the react-datetime import**

In `src/views/Tournament/Tournament.tsx`, delete line 32:

```tsx
import Datetime from "react-datetime";
```

and add, alongside the other `@/lib` imports:

```tsx
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/datetime_input";
```

- [ ] **Step 2: Rewrite the change handler**

Replace lines 616-620:

```tsx
    const setStartTime = (t: any) => {
        if (t && t.format) {
            setTournament({ ...tournament, time_start: t.format() });
        }
    };
```

with:

```tsx
    const setStartTime = (ev: React.ChangeEvent<HTMLInputElement>) => {
        const start = fromDatetimeLocalValue(ev.target.value);
        if (start) {
            setTournament({ ...tournament, time_start: moment(start).format() });
        }
    };
```

- [ ] **Step 3: Replace the picker**

Replace lines 1152-1155:

```tsx
                                    <Datetime
                                        onChange={setStartTime}
                                        value={new Date(tournament.time_start)}
                                    />
```

with:

```tsx
                                    <input
                                        type="datetime-local"
                                        id="start-time"
                                        value={toDatetimeLocalValue(new Date(tournament.time_start))}
                                        onChange={setStartTime}
                                    />
```

The `id="start-time"` connects the existing `<label className="control-label" htmlFor="start-time">` at line 1144, which currently points at no element because `react-datetime` never rendered that id.

- [ ] **Step 4: Verify statically**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/views/Tournament/Tournament.tsx
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
```

Expected: all clean. `type-check` is the meaningful gate here — it is what catches a mismatch between the new `React.ChangeEvent<HTMLInputElement>` handler signature and the element it is attached to.

Do not run Playwright. The tournament family navigates to `/tournament/new/<groupId>`, which renders this picker, so it is the behavioural check for this change — but it runs once at Handover rather than per task.

- [ ] **Step 5: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/views/Tournament/Tournament.tsx
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "fix(tournament): use a native datetime input for start time"
```

---

### Task 4: Remove the dependency

**Files:**
- Modify: `src/views/Styling/Styling.tsx:26` (import), `:362` (demo)
- Delete: `src/global_styl/react-datetime.css`
- Modify: `package.json:156`
- Modify: `yarn.lock` (via `yarn install`)

**Interfaces:**
- Consumes: nothing. This task runs last because `Styling.tsx` is the final consumer of `react-datetime`.
- Produces: nothing.

- [ ] **Step 1: Remove the styleguide demo**

In `src/views/Styling/Styling.tsx`, delete line 26:

```tsx
import Datetime from "react-datetime";
```

and delete line 362:

```tsx
                                <Datetime onChange={(time) => console.log(time)} />
```

Line 361 already renders `<input type="datetime-local" placeholder="Date Time" />`, so the styleguide keeps a datetime example.

- [ ] **Step 2: Delete the stylesheet**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui rm src/global_styl/react-datetime.css
```

`src/ogs.css:21` pulls this in via `@import-glob "./global_styl/*.css"`, so there is no import statement to remove.

- [ ] **Step 3: Drop the dependency**

In `package.json`, delete line 156:

```json
        "react-datetime": "^3.3.1",
```

Then refresh the lockfile:

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui install
```

- [ ] **Step 4: Verify nothing references it any more**

Run: `grep -rn "react-datetime" /Users/mgregory/src/OGS/ogs-ui/src /Users/mgregory/src/OGS/ogs-ui/package.json`
Expected: no output.

- [ ] **Step 5: Full verification**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/views/Styling/Styling.tsx
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
yarn --cwd /Users/mgregory/src/OGS/ogs-ui spellcheck
yarn --cwd /Users/mgregory/src/OGS/ogs-ui build
```

Expected: all clean. `yarn build` matters here specifically — the original bug only manifested in a bundled build, and this is the step that proves the dependency is gone from the graph.

- [ ] **Step 6: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/views/Styling/Styling.tsx package.json yarn.lock
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "chore(deps): drop react-datetime"
```

- [ ] **Step 7: Show the diff and stop**

Run: `git -C /Users/mgregory/src/OGS/ogs-ui diff main...replace-react-datetime`

Show the author the diff. Do not push. Implementation is then complete and the Handover section below is the author's to drive.

---

## Handover: verification the author drives

Implementation ends at Task 4. Nothing below is dispatched to a subagent — this is the checklist for the author, in the order that fails fastest.

**1. Load `/dev/styling`.** Against the dev server, with the console open. Expect the page to render with no `Element type is invalid` error. This was one of the three crash sites and is the cheapest possible confirmation that the fix works at all.

**2. Ban expiration, by hand.** As a moderator, open a player's Suspend modal. Expect the modal to open at all — that is the exact failure from the original trace. Set an expiration, confirm the suspension applies, and confirm a suspension with the field left blank still works (blank means no expiration, and must send no `ban_expiration`).

**3. Tournament start time round-trip, by hand.** No e2e test edits the start time, so this path has no automated cover in either direction:

1. Open `/tournament/new` while logged in.
2. Confirm the Start time field pre-fills with the next whole hour in local time.
3. Change it to a different date and time.
4. Create the tournament, reopen it, and confirm the displayed start time matches what was entered.

**4. The three affected e2e families.** Pause between runs to let the stack quiesce.

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@Mod"
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@User"
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@Tournament"
```

**Use `test:e2e`, not `test:e2e:quick`.** `:quick` applies `--grep-invert "@Smoke|@Slow|@Visual|@E2EUtils|@Manual"`, which excludes the one affected `@Slow` test (see the table below).

`@User` is affected because `helpers/user-utils.ts:772` exports `banUserAsModerator`, which drives the ban modal, and two `@User Profile Tests` call it.

Nine tests across the three families render a converted picker:

| Family | Test | Reaches the picker via | `@Slow`? |
|---|---|---|---|
| `@Mod` | Complete suspend-appeal-restore flow | `.BanModal` directly | no |
| `@Mod` | System PM button | `.BanModal` directly | no |
| `@Mod` | Suspended user can login to reach appeal page | `banUserAsModerator` | no |
| `@Mod` | AI Detector sees SUSPENSION ModLog entries | `.BanModal` directly | **yes** |
| `@User` | Suspended users cannot update their profile name | `banUserAsModerator` | no |
| `@User` | Suspended users see deletion request button | `banUserAsModerator` | no |
| `@Tournament` | Round robin start | `/tournament/new/<groupId>` | no |
| `@Tournament` | McMahon start | `/tournament/new/<groupId>` | no |
| `@Tournament` | Disable vacation | `/tournament/new/<groupId>` | no |

All are expected to pass. Before this branch, `@Mod` fails at `expect(modPage.locator(".BanModal")).toBeVisible()`. `@User` and `@Tournament` are expected to be failing too for the same reason — but that expectation is inferred from the code, not observed, since only the moderation failure was captured in a trace.

No `cm/` test touches the ban modal or `banUserAsModerator`, and `tournaments/` has no `@Slow` tests, so the `@CM` family is unaffected.

**5. Mobile and desktop browsers.** Native `datetime-local` renders a browser-supplied picker whose appearance differs from `react-datetime`'s, and differs between browsers. Both call sites are a visible UI change, so CONTRIBUTING's mobile/desktop check matters here more than usual.

Note that PR CI does not run Playwright, so steps 1-4 are the only e2e evidence this change will ever get.

---

## Out of scope

- The five existing native `datetime-local` inputs in `moderator-ui` (`AIReviewRequestStats.tsx`, `FairPlayActions.tsx`, `FairPlaySearch.tsx`). Unifying all seven inputs behind a shared component is separate work.
- The commented-out per-round start time block at `Tournament.tsx:1689-1707`, which also references `Datetime` but is inside a comment.
- Filing the one-line upstream fix against `arqex/react-datetime` (its `config/webpack.config.build.js` sets `libraryExport: 'default'` on the UMD output and omits it on the CJS output). Worth doing as a good-citizen contribution, but the project has not merged a community PR since October 2022 and cannot be relied on.
