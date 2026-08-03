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

### Task 5: Regression test for the BanDetails wiring

Added after the final whole-branch review, which raised as its only Important finding that neither converted call site has any automated regression cover.

Be accurate about what this buys. PR CI runs `lint.yml` (prettier:check, lint, type-check, spellcheck) and `build.yml` (`yarn build-ci`). It does **not** run jest: `.github/workflows/unit_test.yml:3-7` is `workflow_dispatch:` only, with `push:` and `pull_request:` commented out. `e2e-tests.yml` runs on push to `main`, i.e. post-merge. So this test protects the contract for whoever runs `yarn test` locally, and becomes a genuine PR gate only if `unit_test.yml` is re-enabled on `pull_request` — a separate decision. There is no equivalent task for `Tournament.tsx`: it is a very large view component with heavy module-level dependencies, so an isolated render test there is disproportionate. That site stays manual-only, covered by Handover step 3.

**Files:**
- Modify: `src/components/BanModal/BanModal.tsx` (export `BanDetails`)
- Create: `src/components/BanModal/BanModal.test.tsx`

**Interfaces:**
- Consumes: `BanDetails` from `./BanModal`, and the `fromDatetimeLocalValue` contract it relies on (empty value yields `undefined`).
- Produces: nothing other code depends on.

**What is being pinned:** `BanDetails` emits its state through `onChange` in a `React.useEffect`, so `onChange` fires once on mount and again after every field change. The contract under test is the shape of that emitted object — specifically that `ban_expiration` is `undefined` while the field is blank and a local-time `Date` once a value is chosen. That is exactly the wiring nothing else verifies.

- [ ] **Step 1: Export BanDetails**

`BanDetails` is currently module-private. In `src/components/BanModal/BanModal.tsx`, change:

```tsx
function BanDetails({ onChange }: { onChange: (d: any) => void }): React.ReactElement {
```

to:

```tsx
export function BanDetails({ onChange }: { onChange: (d: any) => void }): React.ReactElement {
```

Change nothing else about the function. Do not alter the `any` in its prop type — that is pre-existing and out of scope.

- [ ] **Step 2: Write the failing test**

Create `src/components/BanModal/BanModal.test.tsx`:

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
import { fireEvent, render } from "@testing-library/react";
import { BanDetails } from "./BanModal";

jest.mock("@/lib/translate", () => ({
    _: (msgid: string) => msgid,
    pgettext: (_context: string, msgid: string) => msgid,
    interpolate: (msgid: string) => msgid,
}));

/* The Date constructor's multi-argument form builds a local-time date, and the
 * expiration field is local wall-clock, so these expectations hold in any timezone. */

function expirationInput(container: HTMLElement): HTMLInputElement {
    const input = container.querySelector('input[type="datetime-local"]');
    if (!input) {
        throw new Error("expiration input not found");
    }
    return input as HTMLInputElement;
}

describe("BanDetails", () => {
    test("reports no expiration while the field is blank", () => {
        const onChange = jest.fn();

        render(<BanDetails onChange={onChange} />);

        expect(onChange).toHaveBeenLastCalledWith({
            public_reason: "",
            moderator_notes: "",
            ban_expiration: undefined,
        });
    });

    test("reports the chosen expiration as a local-time Date", () => {
        const onChange = jest.fn();
        const { container } = render(<BanDetails onChange={onChange} />);

        fireEvent.change(expirationInput(container), { target: { value: "2026-08-02T15:04" } });

        expect(onChange).toHaveBeenLastCalledWith({
            public_reason: "",
            moderator_notes: "",
            ban_expiration: new Date(2026, 7, 2, 15, 4),
        });
    });

    test("returns to no expiration when the field is cleared", () => {
        const onChange = jest.fn();
        const { container } = render(<BanDetails onChange={onChange} />);

        fireEvent.change(expirationInput(container), { target: { value: "2026-08-02T15:04" } });
        fireEvent.change(expirationInput(container), { target: { value: "" } });

        expect(onChange).toHaveBeenLastCalledWith({
            public_reason: "",
            moderator_notes: "",
            ban_expiration: undefined,
        });
    });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test BanModal`
Expected: FAIL. If Step 1 has not been applied, the failure is that `BanDetails` is not exported.

If instead the failure is a module-resolution or import-time error from a transitive dependency of `BanModal.tsx` (it imports `@/lib/requests`, `@/lib/misc`, `@/components/Modal` and `@/lib/player_cache`), add the narrowest `jest.mock` that clears it, following the house pattern in `src/views/Settings/AccountSettings.test.tsx` (which mocks `@/lib/sockets`) and `src/components/GobanThemePicker/GobanCustomStoneUrlInput.test.tsx` (which mocks `@/lib/translate` and `@/lib/hooks`). Report every mock you added and why. Do not mock `@/components/Modal` — `BanModal` extends it, so a non-class mock breaks the module at import time.

- [ ] **Step 4: Apply Step 1 if not already done, and run the tests to verify they pass**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test BanModal`
Expected: PASS, 3 tests.

- [ ] **Step 5: Confirm the whole suite is still green**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test`
Expected: PASS. The branch was at 406 passing before this task, so expect 409.

- [ ] **Step 6: Verify statically**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/components/BanModal/BanModal.tsx src/components/BanModal/BanModal.test.tsx
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
yarn --cwd /Users/mgregory/src/OGS/ogs-ui spellcheck
```

Expected: all clean. `spellcheck` is included because cspell is a CI gate in this repo and this task adds new prose.

- [ ] **Step 7: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/components/BanModal/BanModal.tsx src/components/BanModal/BanModal.test.tsx
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "test(moderation): pin the BanDetails expiration contract"
```

---

### Task 6: Close the account-settings race in the @User profile tests

Added after the author ran the `@User` family against this branch and hit a failure. This is a **pre-existing e2e defect, not caused by the react-datetime work** — it is being fixed here because this branch is what exposed it, and merging with a red `@User` family would be worse.

**The defect.** `AccountSettings.tsx:86-103` runs `refreshAccountSettings` on mount: it sets `loading` true, fetches `me/account_settings`, and in the `.then()` calls `setUsername(settings.username)` and `setLoading(false)`. `AccountSettings.tsx:274` computes `save_button_disabled = (loading || !profile_changed) && password1.length === 0`. The tests `goto("/settings/account")`, wait only for the username input to be *visible*, then `fill()` a new name. The input renders immediately from `React.useState(user.username)` (`AccountSettings.tsx:42`), long before the fetch resolves — so when the response lands it overwrites the typed value, `profile_changed` goes false and Save stays disabled.

Observed margin in the captured trace: the response returned 200 at t=18991.4 ms and `fill()` ran at t=19013.0 ms, 21.6 ms later. The `.then()` callback re-rendered after the fill.

This became reachable only now: since the vite 8 bump, `banUserAsModerator` (`helpers/user-utils.ts:809`) crashed on `.BanModal`, so the suspended test never got this far. The race itself dates to `5cb26ff16` (2025-12-13), which replaced `await userPage.waitForLoadState("networkidle")` with `await expect(usernameInput).toBeVisible()`; visible is not populated.

`normalUserCanUpdateProfileTest` in the same file has the identical pattern and passed by luck — fix both. `suspended-user-deletion-request.ts` never fills an input and needs no change.

**Files:**
- Modify: `e2e-tests/users/suspended-user-profile-updates.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing.

- [ ] **Step 1: Wait for the fetch before reading the initial username (suspended test)**

In `suspendedUserCannotUpdateProfileTest`, replace:

```ts
    log("Getting initial username...");
    await userPage.goto("/settings/account");
```

with:

```ts
    log("Getting initial username...");
    await gotoAccountSettings(userPage);
```

- [ ] **Step 2: Add the shared navigation helper**

Immediately above `export const suspendedUserCannotUpdateProfileTest`, add:

```ts
/* AccountSettings fetches me/account_settings on mount and overwrites the username field with the
 * server value when it resolves. The field renders from cached user data before that, so navigating
 * and waiting only for the field to appear leaves a window where a typed value is silently
 * discarded. Waiting for the response removes the bulk of that window; callers retry their fill to
 * cover the remaining gap between the response arriving and React committing the state update. */
const gotoAccountSettings = async (page: Page) => {
    await Promise.all([
        page.waitForResponse(
            (response) =>
                response.url().includes("/api/v1/me/account_settings") && response.ok(),
        ),
        page.goto("/settings/account"),
    ]);
};
```

Add `Page` to the existing `@playwright/test` import so it reads:

```ts
import { BrowserContext, expect, Page } from "@playwright/test";
```

- [ ] **Step 3: Wait for the fetch on the post-suspension navigation**

Replace:

```ts
    log("Attempting to update username while suspended...");
    await userPage.goto("/settings/account");
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
```

with:

```ts
    log("Attempting to update username while suspended...");
    await gotoAccountSettings(userPage);
    await expect(usernameInput).toBeVisible({ timeout: 15000 });
```

- [ ] **Step 4: Confirm the typed value was accepted (suspended test)**

Replace:

```ts
    const newUsername = "HackedUsername" + Date.now();
    await usernameInput.fill(newUsername);
```

with:

```ts
    const newUsername = "HackedUsername" + Date.now();
    await expect(async () => {
        await usernameInput.fill(newUsername);
        await expect(usernameInput).toHaveValue(newUsername);
    }).toPass({ timeout: 15000 });
```

`waitForResponse` resolves when the response headers arrive, which is before `requests.ts` parses the JSON body and before React commits `setUsername`. Retrying the fill until the value survives covers that remaining gap; a plain assertion would only detect the overwrite, not recover from it.

- [ ] **Step 5: Apply the same two fixes to the normal-user test**

In `normalUserCanUpdateProfileTest`, replace:

```ts
    log("Getting initial username...");
    await userPage.goto("/settings/account");
```

with:

```ts
    log("Getting initial username...");
    await gotoAccountSettings(userPage);
```

and replace:

```ts
    const newUsername = "ChangedUsername" + Date.now();
    await usernameInput.fill(newUsername);
```

with:

```ts
    const newUsername = "ChangedUsername" + Date.now();
    await expect(async () => {
        await usernameInput.fill(newUsername);
        await expect(usernameInput).toHaveValue(newUsername);
    }).toPass({ timeout: 15000 });
```

- [ ] **Step 6: Verify statically**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file e2e-tests/users/suspended-user-profile-updates.ts
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
```

Expected: all clean. Note `lint` only covers `src/`, and `spellcheck` only covers `src/**`, so neither reads this file — `type-check` is the gate that does, since tsconfig includes `e2e-tests`.

Do not run Playwright. The author runs the `@User` family at Handover step 4 and that is the real verification for this task.

- [ ] **Step 7: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add e2e-tests/users/suspended-user-profile-updates.ts
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "test(e2e): wait for account settings to load before editing the username"
```

---

### Task 7: Stop the AI review auto-selection closing unrelated popovers

Added after the author ran the `@CM` family and hit `File a malicious report from the report view` failing. Like Task 6 this is a **pre-existing defect, not caused by the react-datetime work** — but unlike Task 6 it is an app bug, not a test bug, and the branch cannot go green without it.

**The defect.** `src/components/AIReview/hooks.ts:64-66` calls `close_all_popovers()` at the top of `setSelectedAIReview`. That callback has two callers in `AIReview.tsx`:

- `:149-156` `handleAIReviewSelect` — the user picking a review from the review picker. The picker is itself a popover, so closing is correct here.
- `:128-135` — a `useEffect` whose comment reads "This handles the initial auto-selection from useAIReviewList". Not a user action.

The second path fires from a React passive mount effect and closes *every* open popover, including ones the user opened for unrelated reasons. Captured from an instrumented run:

```
69306.0  [POPOVER-DEBUG] open id=1                  <- player popover opened
69486.1  [POPOVER-DEBUG] close_all_popovers open=1
           at hooks.ts:35 -> AIReview.tsx:74 -> commitHookPassiveMountEffects
69487.3  [POPOVER-DEBUG] close id=1 ev=none will_close=true
```

The Reports Center embeds the reported game, which mounts an `AIReview`. When its review list resolves after a moderator has opened a player popover, the popover is destroyed 181 ms later. That is a real moderator-facing bug; the e2e failure is the symptom.

The race is why it is intermittent, and why clearing stale reports changed nothing — that altered timing, not the mechanism.

**Files:**
- Modify: `src/components/AIReview/hooks.ts` (remove the call and its now-unused import)
- Modify: `src/components/AIReview/AIReview.tsx` (add the call to the user-initiated handler)
- Modify: `e2e-tests/helpers/matchers.ts` (bound the scroll — see Step 4)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: nothing. `setSelectedAIReview`'s signature is unchanged.

Scope check performed while writing this task: `setSelectedAIReview` is exported from `hooks.ts:135` and consumed only in `AIReview.tsx` (the two call sites above). No other component depends on it closing popovers.

- [ ] **Step 1: Remove the unconditional close**

In `src/components/AIReview/hooks.ts`, delete line 29:

```ts
import { close_all_popovers } from "@/lib/popover";
```

and change:

```ts
    const setSelectedAIReview = useCallback(
        (aiReview: JGOFAIReview | undefined) => {
            close_all_popovers();

            // Clean up existing AIReviewData instance if it exists
```

to:

```ts
    const setSelectedAIReview = useCallback(
        (aiReview: JGOFAIReview | undefined) => {
            // Clean up existing AIReviewData instance if it exists
```

The import must go or `lint` will fail on an unused import — `close_all_popovers` has no other use in that file.

- [ ] **Step 2: Close popovers only on user selection**

In `src/components/AIReview/AIReview.tsx`, add alongside the other `@/lib` imports:

```ts
import { close_all_popovers } from "@/lib/popover";
```

and change:

```ts
    const handleAIReviewSelect = useCallback(
        (ai_review: JGOFAIReview) => {
            setSelectedAiReviewInList(ai_review);
```

to:

```ts
    const handleAIReviewSelect = useCallback(
        (ai_review: JGOFAIReview) => {
            // The review picker is itself a popover, so choosing a review dismisses it.
            close_all_popovers();

            setSelectedAiReviewInList(ai_review);
```

Leave the dependency array unchanged — `close_all_popovers` is a module-level import, not a reactive value.

- [ ] **Step 3: Verify the app change**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/components/AIReview/hooks.ts src/components/AIReview/AIReview.tsx
yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check
yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test
```

Expected: all clean, 409 tests passing across 53 suites.

- [ ] **Step 4: Bound the scroll in the e2e clickable matcher**

Independent of the app fix, and worth keeping regardless: `playwright.config.ts` sets no `actionTimeout`, so an unbounded `scrollIntoViewIfNeeded` on an element that never appears blocks until the whole test times out. That is what turned this failure into a silent 420-second hang with no call log, and it also starves the surrounding retry loop of its remaining attempts.

In `e2e-tests/helpers/matchers.ts`, change:

```ts
    // Retry scrollIntoViewIfNeeded if element becomes detached during React re-renders
    // This can happen when React hydrates or updates state after initial page load
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await element.scrollIntoViewIfNeeded();
            break;
```

to:

```ts
    // Retry scrollIntoViewIfNeeded if element becomes detached during React re-renders
    // This can happen when React hydrates or updates state after initial page load.
    // The explicit timeout matters: playwright.config.ts sets no actionTimeout, so an
    // unbounded scroll on an element that never appears blocks until the whole test
    // times out, which also starves the retries below of their remaining attempts.
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            await element.scrollIntoViewIfNeeded({ timeout: 5000 });
            break;
```

Then re-run `type-check` (it is the only one of the repo's static checks that reads `e2e-tests/`; `lint` and `spellcheck` are scoped to `src/**`).

Do not run Playwright. The author runs the affected families at Handover.

- [ ] **Step 5: Commit**

Two commits, since the app fix and the test-harness fix are independent.

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/components/AIReview/hooks.ts src/components/AIReview/AIReview.tsx
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "fix(ai-review): only close popovers when the user picks a review"

git -C /Users/mgregory/src/OGS/ogs-ui add e2e-tests/helpers/matchers.ts
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "test(e2e): bound the scroll in expectOGSClickableByName"
```

---

### Task 8: Make native controls follow the app theme

Added after review feedback that the new datetime input renders in the wrong theme: always dark on the reviewer's Firefox (Linux), always light on Chrome.

**The defect.** Nothing in the tree sets the CSS `color-scheme` property — the only match is a `prefers-color-scheme` media query at `01_variables.css:530`, which is a different thing. Without it each browser picks its own default for native controls: Firefox follows the OS/GTK theme, Chrome always renders light. Neither consults the app's theme, so the control disagrees with the page it sits on.

Verified in both engines with a scripted probe: with `color-scheme: dark` set, Firefox 148 and Chromium both render the control dark with light text and a light calendar glyph; without it, both render a light control on a dark page.

This is pre-existing — it also affects the five `datetime-local` inputs in `moderator-ui` — but this branch made it user-visible in the main UI, so it is in scope here.

**Blast radius, which is the reason this needs care:** `color-scheme` affects *every* native control, not just this input — scrollbars, `<select>`, checkboxes, radio buttons, autofill backgrounds. That is the intended improvement, but it is a site-wide visual change and the Handover check below is not optional.

**Files:**
- Modify: `src/global_styl/01_variables.css`

**Interfaces:**
- Consumes: nothing. Produces: nothing.

**Structure note:** the file defines `@define-mixin light` (`:135`), `@define-mixin dark` (`:318`) and `@define-mixin accessible` (`:502`). The mixins are applied at `:525` (`:root`, light by default), `:530` (`prefers-color-scheme: dark`), and `:537`/`:541`/`:545` (`[data-theme=...]`). `accessible` starts with `@mixin dark`, so it inherits whatever `dark` declares — **do not add a third declaration to it.** Two edits only.

- [ ] **Step 1: Declare the light scheme**

In `src/global_styl/01_variables.css`, change:

```css
@define-mixin light {
    /* Build-time variables for color derivation */
    $bg: #fff;
    $fg: #202020;
    $default-button: #e6e6e0;
    $primary: #2480ff;
    $success: #32c738;
    $info: #c376fe;
    $colored-background-fg: $bg;

    --clear: transparent;
```

to:

```css
@define-mixin light {
    /* Build-time variables for color derivation */
    $bg: #fff;
    $fg: #202020;
    $default-button: #e6e6e0;
    $primary: #2480ff;
    $success: #32c738;
    $info: #c376fe;
    $colored-background-fg: $bg;

    /* Renders browser-drawn controls - date pickers, scrollbars, selects,
     * checkboxes, autofill - in this theme instead of the OS default. */
    color-scheme: light;

    --clear: transparent;
```

- [ ] **Step 2: Declare the dark scheme**

Change:

```css
@define-mixin dark {
    /* Build-time variables for color derivation */
    $bg: #1a1a1a;
    $fg: #bbbbbb;
    $default-button: #474747;
    $primary: #1d66cc;
    $success: #289f2d;
    $info: #9c5fcc;
    $colored-background-fg: #eeeeee;

    --clear: transparent;
```

to:

```css
@define-mixin dark {
    /* Build-time variables for color derivation */
    $bg: #1a1a1a;
    $fg: #bbbbbb;
    $default-button: #474747;
    $primary: #1d66cc;
    $success: #289f2d;
    $info: #9c5fcc;
    $colored-background-fg: #eeeeee;

    /* Renders browser-drawn controls - date pickers, scrollbars, selects,
     * checkboxes, autofill - in this theme instead of the OS default. */
    color-scheme: dark;

    --clear: transparent;
```

- [ ] **Step 3: Verify**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/global_styl/01_variables.css
yarn --cwd /Users/mgregory/src/OGS/ogs-ui build
```

Expected: both clean. `build` is the meaningful check here — `type-check` and `lint` do not read CSS, so a PostCSS syntax error would otherwise go unnoticed until runtime.

Then confirm the property reached the compiled output rather than being swallowed by the mixin expansion:

```bash
grep -rn "color-scheme" /Users/mgregory/src/OGS/ogs-ui/dist/*.css | head
```

Expected: at least one `color-scheme:light` and one `color-scheme:dark`. If neither appears, stop and report — the mixin did not expand as intended and the change is inert.

- [ ] **Step 4: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/global_styl/01_variables.css
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "fix(theme): render native controls in the app's colour scheme"
```

---

### Task 9: Narrow the colour-scheme fix to datetime inputs

Task 8 declared `color-scheme` on the theme mixins, which applies it at `:root` and therefore to every browser-drawn control in the app. That is the correct long-term destination, but it makes a dependency removal carry a site-wide visual sweep. At the author's direction this task narrows the fix to the controls this branch actually introduced; the site-wide change becomes its own PR.

**Why the app has so much browser-drawn UI:** there are zero `appearance` declarations in `src/global_styl/`, and only six CSS files in `src` use `appearance: none` at all. So roughly 32 `range`/`color` inputs, every checkbox and radio, and every `<select>` option list are drawn by the browser in a palette the app does not control. Declaring `color-scheme` at the root takes ownership of all of them at once — a worthwhile change, but not this branch's job.

**Mechanism.** A custom property is inert until something consumes it, so the mixins can carry the value with zero blast radius; only the rule that reads it has any effect. Verified in both engines that `color-scheme: var(--custom-prop)` resolves correctly and stays element-scoped: on a page whose root declares nothing, the scoped input computes `dark` while `:root` and an unscoped sibling both compute `normal`.

The follow-up PR then becomes a one-line addition of `color-scheme: var(--control-color-scheme);` to `:root`, with the mixin values already in place.

**Files:**
- Modify: `src/global_styl/01_variables.css` (replace the two declarations from Task 8)
- Modify: `src/global_styl/global.css` (add the scoped rule)

**Interfaces:**
- Consumes: nothing. Produces: the `--control-color-scheme` custom property, read only by the rule added in Step 2.

- [ ] **Step 1: Turn the root declarations into an inert custom property**

In `src/global_styl/01_variables.css`, in the **`light`** mixin, replace:

```css
    /* Renders browser-drawn controls - date pickers, range and colour inputs,
     * checkboxes, radios, select option lists, autofill - in this theme instead
     * of the OS default. Scrollbars are themed explicitly in global.css. */
    color-scheme: light;
```

with:

```css
    /* Colour scheme for browser-drawn controls. Declaring this as a custom property
     * has no effect on its own; only rules that read it are affected. */
    --control-color-scheme: light;
```

and in the **`dark`** mixin, replace the identical comment plus `color-scheme: dark;` with the same comment plus:

```css
    --control-color-scheme: dark;
```

`accessible` opens with `@mixin dark` and needs no declaration of its own — do not add one.

- [ ] **Step 2: Apply it to datetime inputs only**

In `src/global_styl/global.css`, immediately after the `input, select, textarea` rule that ends at line 236, add:

```css
/* Date and time pickers are drawn by the browser, so they need to be told which
 * scheme to use or they follow the OS rather than the active theme. */
input[type="datetime-local"] {
    color-scheme: var(--control-color-scheme);
}
```

Target the input type rather than the two call sites' class and id: it is the same size, does not depend on markup details, and covers any datetime input added later. It also picks up the five pre-existing `datetime-local` inputs in `submodules/moderator-ui`, which have the identical defect.

- [ ] **Step 3: Verify**

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/global_styl/01_variables.css src/global_styl/global.css
yarn --cwd /Users/mgregory/src/OGS/ogs-ui build
```

Expected: both clean. `build` is the meaningful check — `type-check` and `lint` do not read CSS.

Then confirm the root declaration is gone and the scoped rule is present:

```bash
grep -o "color-scheme:[a-z]*" /Users/mgregory/src/OGS/ogs-ui/dist/*.css | sort | uniq -c
grep -o "\-\-control-color-scheme:[a-z]*" /Users/mgregory/src/OGS/ogs-ui/dist/*.css | sort | uniq -c
```

Expected: `--control-color-scheme` appears with both `light` and `dark` values, and the only bare `color-scheme:` occurrences are `var(--control-color-scheme)` inside the datetime rule plus any `prefers-color-scheme` media queries. If a bare `color-scheme:light` or `color-scheme:dark` survives on a `:root` or `[data-theme]` selector, Step 1 was not applied correctly — stop and report.

- [ ] **Step 4: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/global_styl/01_variables.css src/global_styl/global.css
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "fix(theme): scope the colour-scheme fix to datetime inputs"
```

---

## Handover: verification the author drives

Implementation ends at Task 7. Nothing below is dispatched to a subagent — this is the checklist for the author, in the order that fails fastest.

Task 7 added a fourth affected family, `@CM`, and a behaviour change to verify by hand: open the AI review picker on a game and select a review — the picker must still dismiss itself. Then, on a Reports Center report whose game has an AI review, click a player and confirm the popover stays open.

**1. Load `/dev/styling`.** Against the dev server, with the console open. Expect the page to render with no `Element type is invalid` error. This was one of the three crash sites and is the cheapest possible confirmation that the fix works at all.

**2. Ban expiration, by hand.** No e2e test sets an expiration — every one of them fills only the public reason — so this whole path is manual-only.

1. As a moderator, open a player's Suspend modal. Expect it to open at all: that is the exact failure from the original trace.
2. Suspend with the expiration left blank. Blank must send no `ban_expiration` at all — `fromDatetimeLocalValue("")` returns `undefined` and `JSON.stringify` drops the key. This path is exercised incidentally by the e2e suite but never asserted.
3. Suspend with an expiration set. Check the value actually recorded on the server, not just that the suspension applied. The field is local wall-clock and `BanModal.tsx:57` sends `.toISOString()`, so a value entered as 15:04 local must arrive as the correct UTC instant. This local-to-UTC hop has no automated cover of any kind.

**3. Tournament start time round-trip, by hand.** The e2e tests create tournaments with the default time and never touch the field, so `setStartTime` is never invoked by any automated test:

1. Open `/tournament/new` while logged in.
2. Confirm the Start time field pre-fills with the next whole hour in local time. This much the e2e suite does cover, since it renders the default.
3. Change it to a different date and time. Everything from here down is uncovered.
4. Create the tournament, reopen it, and confirm the displayed start time matches what was entered. The value goes local wall-clock to `moment(start).format()` to `.utc().format()` on save (`Tournament.tsx:575`) and back through `moment(...).format("LLLL")` for display (`:888`), so a mismatch here means the timezone hop is wrong.
5. Worth doing once with a value that crosses a DST boundary in your local zone, since that is where a local-time-only helper is most likely to be wrong.

**4. The three affected e2e families.** Pause between runs to let the stack quiesce.

```bash
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@Mod"
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@User"
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@Tournament"
yarn --cwd /Users/mgregory/src/OGS/ogs-ui test:e2e -- --grep "@CM"
```

`@CM` is affected by Task 7's popover fix, not by the datetime conversion. `File a malicious report from the report view` is the test that surfaced it.

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

Known and accepted: Firefox's dropdown picker panel is a calendar with no clock, so the time is set by typing or arrow keys rather than from the panel. Verified on Firefox 148 across en-US, en-GB and de-DE that all six segments are editable and that typing fills date and time in one pass. A reviewer on Firefox ESR (Linux) reported being unable to edit the time; that could not be reproduced and may be build-specific — worth confirming their `about:support` version before treating it as a defect.

**6. The two datetime pickers in each theme.** Task 9 scoped `color-scheme` to `input[type="datetime-local"]`, so this is a two-field check, not a site-wide sweep. In light, dark and accessible themes, confirm the ban expiration field and the tournament start time field render with the field background, segment text and calendar glyph all matching the surrounding page. Nothing else in the app changes — verified in both engines that the scoped rule leaves `:root` and unscoped controls computing `normal`.

If you also have `moderator-ui` open, its five `datetime-local` inputs (AI review request stats, fair play actions and search) are picked up by the same rule and are worth a glance.

**Deliberately not done here:** declaring `color-scheme` at `:root`, which would make every browser-drawn control follow the theme — roughly 32 `range`/`color` inputs, all checkboxes and radios, `<select>` option lists and autofill. That is a worthwhile change and the `--control-color-scheme` values are already in place for it, but it needs its own PR with a full visual sweep rather than riding on a dependency removal.

Note that PR CI does not run Playwright, so steps 1-4 are the only e2e evidence this change will ever get.

---

## Out of scope

- The five existing native `datetime-local` inputs in `moderator-ui` (`AIReviewRequestStats.tsx`, `FairPlayActions.tsx`, `FairPlaySearch.tsx`). Unifying all seven inputs behind a shared component is separate work.
- The commented-out per-round start time block at `Tournament.tsx:1689-1707`, which also references `Datetime` but is inside a comment.
- Filing the one-line upstream fix against `arqex/react-datetime` (its `config/webpack.config.build.js` sets `libraryExport: 'default'` on the UMD output and omits it on the CJS output). Worth doing as a good-citizen contribution, but the project has not merged a community PR since October 2022 and cannot be relied on.
