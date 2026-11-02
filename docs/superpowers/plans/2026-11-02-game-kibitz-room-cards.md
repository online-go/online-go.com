# Game Kibitz Room Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On the Game page, list every kibitz room showing the game as a stack of cards at the bottom of the game chat's user list, and change the user-list toggle icon when such rooms exist.

**Architecture:** `ogs` gains a `?game=<id>` filter on `GET /api/v1/kibitz/rooms`. In `ogs-ui`, a hook owned by `GameChat` fetches that list once and follows the `kibitz-rooms` UIPush channel; a stack component renders the rooms as cards inside `ChatUserList` through a new `footer` prop, and `ChatUserCount` swaps its icon for an inline SVG when the list is non-empty. The hook is inert for a player of a game that has not finished.

**Tech Stack:** Django REST Framework (ogs); React 18 + TypeScript, jest + @testing-library/react, PostCSS nested CSS (ogs-ui).

**Spec:** `docs/superpowers/specs/2026-11-02-game-kibitz-room-cards-design.md` (in ogs-ui).

## Global Constraints

- ogs-ui: one component per file with a matching `.css`; no `any`; every user-visible string through `pgettext` / `npgettext` / `interpolate` from `@/lib/translate`; no hover background on non-interactive elements; `yarn type-check`, `yarn lint`, `yarn prettier:file <files>` clean before each commit.
- ogs: `make lint` clean (pyright + ruff + host pytest); request-level tests run in the container with `make pytest` or `docker exec ogs_django_1 pytest <path>`; nothing goes in `ogs/kibitz/` that imports Django at request level.
- Both repos: work in the standard checkouts (`ogs/`, `ogs-ui/`), on feature branches created with `--no-track`; no pushes without the user's go-ahead.
- The ogs-ui pull request description must contain `Depends on online-go/ogs#<number>.`
- Commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

1. A room's `room-updated` push that moves it *off* this game must remove its card (pinned: Task 3 test "drops a room whose room-updated moves it to another game").
2. The game finishing while a player has the page open must make the cards and icon appear without a reload (pinned: Task 3 test "starts fetching when hidden turns false").
3. The review page and the moderators' annul queue mount `GameChat` too and must get no fetch or subscription (pinned: Task 6 test "makes no kibitz request when show_kibitz_rooms is not set").
4. `?game=abc` must be a 400, not a 500 (pinned: Task 2 test "a non-integer game filter is a 400").
5. Anonymous viewers must see the cards (the endpoint is read-only-anonymous; the hook must not require a user) (pinned: Task 3 test "fetches for an anonymous viewer" — the hook takes no user argument, the test passes `hidden=false` with no user mock).

---

### Task 1: Branches and design-doc commit

**Files:**
- Commit: `ogs-ui/docs/superpowers/specs/2026-11-02-game-kibitz-room-cards-design.md`
- Commit: `ogs-ui/docs/superpowers/plans/2026-11-02-game-kibitz-room-cards.md`

- [ ] **Step 1: Bring both mains up to date**

Run: `git -C /Users/mgregory/src/OGS/ogs-ui pull --ff-only`
Run: `git -C /Users/mgregory/src/OGS/ogs pull --ff-only`
Expected: both fast-forward (ogs-ui was 36 behind, ogs 2 behind at planning time).

- [ ] **Step 2: Create the branches**

Run: `git -C /Users/mgregory/src/OGS/ogs-ui checkout -b game-kibitz-room-cards --no-track`
Run: `git -C /Users/mgregory/src/OGS/ogs checkout -b kibitz-rooms-game-filter --no-track`

- [ ] **Step 3: Commit the spec, then the plan, on the ogs-ui branch**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add docs/superpowers/specs/2026-11-02-game-kibitz-room-cards-design.md
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "docs: game page kibitz room cards design"
git -C /Users/mgregory/src/OGS/ogs-ui add docs/superpowers/plans/2026-11-02-game-kibitz-room-cards.md
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "docs: game page kibitz room cards plan"
```

---

### Task 2: `?game=` filter on `GET /api/v1/kibitz/rooms` (ogs)

**Files:**
- Modify: `ogs/services/django/ogs/kibitz/views.py:107-129` (`KibitzRoomList`)
- Test: `ogs/services/django/ogs/api/views/kibitz_rooms_test.py`

**Interfaces:**
- Produces: `GET /api/v1/kibitz/rooms?game=<int>` → JSON list of `KibitzRoomDirectorySerializer` rows whose `current_game_id` equals `<int>`, each with `viewer_count`. No `game` → unchanged full list. Non-integer `game` → 400 `{"error": "game must be an integer"}`. Unknown game → `[]`.

- [ ] **Step 1: Write the failing tests**

Append to `kibitz_rooms_test.py` (imports of `KibitzRoom`, `KibitzRoomList`, `views`, `patch`, `MagicMock`, `status`, `factory` fixture already exist):

```python
def _list_rooms(factory, params: dict[str, str], rooms: list[KibitzRoom]):
    """GET the room list with `params`, serving `rooms` from the filtered queryset.

    Returns the response and the select_related queryset mock so a test can
    check which filter the view applied."""
    request = factory.get("/api/v1/kibitz/rooms", params)
    with (
        patch.object(KibitzRoom.objects, "select_related") as select_related,
        patch.object(views, "get_viewer_counts_or_zeros", return_value={}),
    ):
        qs = select_related.return_value
        qs.filter.return_value = qs
        qs.order_by.return_value = rooms
        response = cast(Any, KibitzRoomList.as_view()(request))
    return response, qs


def test_the_room_list_filters_by_game(factory):
    room = KibitzRoom(id="user-1", channel="kibitz-user-1", title="Watching 42", kind="user")
    response, qs = _list_rooms(factory, {"game": "42"}, [room])
    assert response.status_code == status.HTTP_200_OK
    qs.filter.assert_called_once_with(current_game_id=42)
    assert [r["id"] for r in response.data] == ["user-1"]


def test_the_room_list_is_unfiltered_without_a_game(factory):
    _, qs = _list_rooms(factory, {}, [])
    qs.filter.assert_not_called()


def test_a_non_integer_game_filter_is_a_400(factory):
    response, qs = _list_rooms(factory, {"game": "abc"}, [])
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data == {"error": "game must be an integer"}
    qs.filter.assert_not_called()
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `docker exec ogs_django_1 pytest /ogs/services/django/ogs/api/views/kibitz_rooms_test.py -k "room_list or game_filter" -v`
Expected: `test_the_room_list_filters_by_game` FAILS (`filter` not called); `test_a_non_integer_game_filter_is_a_400` FAILS (200 instead of 400).

- [ ] **Step 3: Implement the filter in `KibitzRoomList.get`**

In `views.py`, `KibitzRoomList.get(self, request: Request) -> Response`: read `request.query_params.get("game")`; if present, parse with `int()` and return the 400 above on `ValueError`; build `qs = KibitzRoom.objects.select_related(...)` (same four relations as today), apply `qs = qs.filter(current_game_id=game_id)` when a game was given, then `rooms = list(qs.order_by("-last_activity_at"))` and the existing count-stamping and serialization. Update the class docstring: the GET handler returns every room, or with `?game=<id>` only the rooms whose current board is that game.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `docker exec ogs_django_1 pytest /ogs/services/django/ogs/api/views/kibitz_rooms_test.py -v`
Expected: all PASS, including the pre-existing tests.

- [ ] **Step 5: Lint**

Run: `make -C /Users/mgregory/src/OGS/ogs lint`
Expected: pyright, ruff and host pytest clean (pre-existing warnings in untouched files are not this task's).

- [ ] **Step 6: Commit**

```bash
git -C /Users/mgregory/src/OGS/ogs add services/django/ogs/kibitz/views.py services/django/ogs/api/views/kibitz_rooms_test.py
git -C /Users/mgregory/src/OGS/ogs commit -m "feat(kibitz): filter GET kibitz/rooms by game"
```

---

### Task 3: `useGameKibitzRooms` hook (ogs-ui)

**Files:**
- Modify: `ogs-ui/src/models/kibitz.d.ts:72-84` (`KibitzRoomSummary`)
- Create: `ogs-ui/src/views/Game/useGameKibitzRooms.ts`
- Test: `ogs-ui/src/views/Game/useGameKibitzRooms.test.ts`

**Interfaces:**
- Consumes: Task 2's endpoint via `get("kibitz/rooms", { game: game_id })` from `@/lib/requests` (the GET helper turns the second argument into a query string).
- Produces: `export function useGameKibitzRooms(game_id: number | undefined, hidden: boolean): KibitzRoomSummary[]` — rooms whose `current_game_id === game_id`, sorted by `viewer_count` descending (stable for ties), `[]` while `game_id` is undefined or `hidden` is true. `KibitzRoomSummary` gains `current_game_id?: number | null`.

- [ ] **Step 1: Add `current_game_id` to the type**

In `kibitz.d.ts`, add `current_game_id?: number | null;` to `KibitzRoomSummary` after `creator_id`.

- [ ] **Step 2: Write the failing tests**

`useGameKibitzRooms.test.ts`, using `renderHook` and `act` from `@testing-library/react`, with the same `jest.mock` blocks for `@/lib/requests`, `@/lib/sockets` and `@/components/UIPush/UIPush` as `src/components/Chat/ChatKibitzRoom.test.tsx` (copy them; the push mock's `fire` is what drives the tests). Fixtures:

```ts
const room_a = { id: "user-aaaa", channel: "kibitz-user-aaaa", title: "A", kind: "user", viewer_count: 2, current_game_id: 42 };
const room_b = { id: "user-bbbb", channel: "kibitz-user-bbbb", title: "B", kind: "user", viewer_count: 5, current_game_id: 42 };
```

`mockBackend(rooms)` resolves `get` when called with `("kibitz/rooms", { game: 42 })` and rejects anything else.

Tests (names are the `it(...)` strings; each assertion is the test's only claim):

- "fetches the rooms for the game and sorts them by viewer count": render `(42, false)` with `[room_a, room_b]`; `await waitFor` until `result.current.map(r => r.id)` equals `["user-bbbb", "user-aaaa"]`; `expect(mock_get).toHaveBeenCalledWith("kibitz/rooms", { game: 42 })`.
- "fetches for an anonymous viewer": same as above with no user mocked at all; the hook never reads `data.get("user")`.
- "returns no rooms and makes no request while hidden": render `(42, true)`; `expect(mock_get).not.toHaveBeenCalled()`; `expect(result.current).toEqual([])`; `expect(mock_push_manager.subscribe).not.toHaveBeenCalled()`.
- "starts fetching when hidden turns false": render with `initialProps: { hidden: true }`, `rerender({ hidden: false })`, then `await waitFor(() => expect(result.current).toHaveLength(2))`.
- "returns no rooms and makes no request without a game id": render `(undefined, false)`; no `get` call, `[]`.
- "subscribes to kibitz-rooms before the first fetch": after render, `expect(mock_push_manager.subscribe).toHaveBeenCalledWith("kibitz-rooms")` and the subscribe call's invocation order index is lower than `mock_get`'s (`mock_push_manager.subscribe.mock.invocationCallOrder[0] < mock_get.mock.invocationCallOrder[0]`).
- "adds a room from a room-created push for this game": start empty, fire `room-created` with `room_a`, expect `[room_a.id]`.
- "ignores room-created pushes for other games": start empty, fire `room-created` with `{ ...room_a, current_game_id: 7 }`, expect `[]`.
- "drops a room whose room-updated moves it to another game": start `[room_a]`, fire `room-updated` with `{ ...room_a, current_game_id: 7 }`, expect `[]`.
- "adds a room whose room-updated moves it onto this game": start `[]`, fire `room-updated` with `room_b`, expect `["user-bbbb"]`.
- "updates the viewer count and re-sorts from viewer-count-changed": start `[room_a, room_b]` (b first), fire `viewer-count-changed` `{ channel: "kibitz-user-aaaa", viewer_count: 9 }`, expect order `["user-aaaa", "user-bbbb"]` and `result.current[0].viewer_count === 9`.
- "drops a room on room-removed": start `[room_a]`, fire `room-removed` `{ id: "user-aaaa" }`, expect `[]`.
- "refetches on rooms-refresh": start `[room_a]`, change `mockBackend` to `[room_a, room_b]`, fire `rooms-refresh`, `await waitFor` length 2.
- "unsubscribes on unmount": `unmount()`, expect `unsubscribe` called with `"kibitz-rooms"`.

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/views/Game/useGameKibitzRooms.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 4: Implement `useGameKibitzRooms` in `useGameKibitzRooms.ts`**

Signature as in Interfaces. State is `KibitzRoomSummary[]`. One `useEffect` keyed on `[game_id, hidden]` that returns early (and resets state to `[]`) when `game_id === undefined || hidden`; otherwise registers the five push handlers, subscribes, fetches, listens to socket `connect`, and cleans all of it up. The membership test for `room-created`/`room-updated` is `payload.current_game_id === game_id`: matching payloads replace-or-append by `id`; non-matching payloads remove by `id`. A `sortRoomsByViewers(rooms)` helper (module-private) applies `viewer_count` descending with a stable sort, and every state write goes through it. Document the hook with a doc comment in the style of `ChatKibitzRoom`'s.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/views/Game/useGameKibitzRooms.test.ts`
Expected: PASS.

- [ ] **Step 6: Checks and commit**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/views/Game/useGameKibitzRooms.ts src/views/Game/useGameKibitzRooms.test.ts src/models/kibitz.d.ts`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint`
Expected: all clean.

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/views/Game/useGameKibitzRooms.ts src/views/Game/useGameKibitzRooms.test.ts src/models/kibitz.d.ts
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "feat(game): hook listing the kibitz rooms showing a game"
```

---

### Task 4: `KibitzUsersIcon` and the `has_kibitz` toggle state (ogs-ui)

**Files:**
- Create: `ogs-ui/src/components/ChatUserList/KibitzUsersIcon.tsx`
- Create: `ogs-ui/src/components/ChatUserList/KibitzUsersIcon.css`
- Modify: `ogs-ui/src/components/ChatUserList/ChatUserList.tsx:29-32,89-113` (`ChatUserCountProperties`, `ChatUserCount`)
- Modify: `ogs-ui/src/components/ChatUserList/index.ts` (add `export * from "./KibitzUsersIcon";`)
- Test: `ogs-ui/src/components/ChatUserList/ChatUserCount.test.tsx`

**Interfaces:**
- Produces: `export function KibitzUsersIcon(): React.ReactElement` — an inline `<svg class="KibitzUsersIcon" aria-hidden="true" focusable="false">` drawing the Font Awesome 4 `fa-users` silhouette (three heads-and-shoulders, centre one forward) with a speech bubble (rounded rectangle with a small tail) above the centre head. Sized by CSS to `height: 1em; width: 1.5em` (the `fa-users` glyph box) with `vertical-align: -0.125em`, `fill: currentColor`.
- Produces: `ChatUserCountProperties` gains `has_kibitz?: boolean`. When true, `ChatUserCount` renders `<KibitzUsersIcon />` in place of `<i className="fa fa-users" />` and sets `title` to `pgettext("Tooltip on the game chat user-list toggle when kibitz rooms are showing this game", "Kibitz rooms are watching this game")`. Everything else unchanged.

- [ ] **Step 1: Write the failing test**

`ChatUserCount.test.tsx`: mock `@/lib/chat_manager` so `chat_manager.join` returns `{ on: jest.fn(), part: jest.fn(), channel: { users_by_name: [] } }`; mock `@/lib/translate` as in `ChatKibitzRoom.test.tsx`; mock `@/lib/preferences` with `get: jest.fn()` and `set: jest.fn()`.

- "shows the users icon when there is no kibitz": render `<ChatUserCount channel="game-1" onClick={jest.fn()} active={false} />`; `expect(document.querySelector("i.fa-users")).not.toBeNull()`; `expect(document.querySelector("svg.KibitzUsersIcon")).toBeNull()`.
- "shows the kibitz users icon when has_kibitz is set": render with `has_kibitz`; `expect(document.querySelector("svg.KibitzUsersIcon")).not.toBeNull()`; `expect(document.querySelector("i.fa-users")).toBeNull()`; `expect(screen.getByRole("button")).toHaveAttribute("title", "Kibitz rooms are watching this game")`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/components/ChatUserList/ChatUserCount.test.tsx`
Expected: second test FAILS (no svg).

- [ ] **Step 3: Implement `KibitzUsersIcon` and the prop**

Draw the SVG in a `viewBox="0 0 24 16"`: heads along the bottom 10 units as in `fa-users` (centre head at x=12 larger, side heads at x≈5 and x≈19 smaller and behind), bubble occupying roughly y 0–5 above the centre head with a tail pointing down-left. The CSS file holds the sizing from Interfaces under `.KibitzUsersIcon`. Import the CSS from the component. `ChatUserCount` picks the icon and title from `props.has_kibitz`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/components/ChatUserList/ChatUserCount.test.tsx`
Expected: PASS.

- [ ] **Step 5: Look at it**

The icon is not under test for shape. With the stack running at http://localhost:1080, temporarily render `<ChatUserCount has_kibitz ... />` (or finish Task 6 first and look then) and compare the two states side by side: same button height and width, bubble legible at the chat's button size. Adjust the path, then revert any temporary change.

- [ ] **Step 6: Checks and commit**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/components/ChatUserList/KibitzUsersIcon.tsx src/components/ChatUserList/KibitzUsersIcon.css src/components/ChatUserList/ChatUserList.tsx src/components/ChatUserList/ChatUserCount.test.tsx`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint`

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/components/ChatUserList/
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "feat(chat): kibitz state for the user-list toggle icon"
```

---

### Task 5: `GameKibitzRooms` card stack and the `ChatUserList` footer (ogs-ui)

**Files:**
- Create: `ogs-ui/src/views/Game/GameKibitzRooms.tsx`
- Create: `ogs-ui/src/views/Game/GameKibitzRooms.css`
- Modify: `ogs-ui/src/components/ChatUserList/ChatUserList.tsx:25-27,67-86` (`ChatUserListProperties`, `ChatUserList`)
- Modify: `ogs-ui/src/components/ChatUserList/ChatUserList.css`
- Test: `ogs-ui/src/views/Game/GameKibitzRooms.test.tsx`

**Interfaces:**
- Consumes: `KibitzRoomSummary` (Task 3).
- Produces: `export function GameKibitzRooms({ rooms }: { rooms: KibitzRoomSummary[] }): React.ReactElement | null` — `null` when `rooms` is empty; otherwise `<div class="GameKibitzRooms">` with `<div class="kibitz-header">` (text `pgettext("Heading above the kibitz room cards in the game chat user list", "Kibitz")` + `<i class="fa fa-comments">`) and one `<button type="button" class="kibitz-room-card">` per room in the given order, each with `.room-title`, a `.room-info-row` holding `.room-live-line` (the description, omitted when empty) and `.room-viewer-count` (same markup, SVG and `npgettext` tooltip as `ChatKibitzRoom`: "{{count}} person here" / "{{count}} people here"). Click → `browserHistory.push(`/kibitz/${room.id}`)`.
- Produces: `ChatUserListProperties` gains `footer?: React.ReactNode`, rendered after the user entries inside `.ChatUserList`, wrapped in `<div class="user-list-footer">` with `margin-top: auto; width: 100%` so it sits at the bottom of the column when the list is short and scrolls with it when long.

- [ ] **Step 1: Write the failing tests**

`GameKibitzRooms.test.tsx`: mock `@/lib/ogsHistory` and `@/lib/translate` as in `ChatKibitzRoom.test.tsx`. Fixtures `room_a` (`description: "Post-mortem"`, `viewer_count: 2`) and `room_b` (no description, `viewer_count: 5`), both `kind: "user"`.

- "renders nothing with no rooms": `render(<GameKibitzRooms rooms={[]} />)`; container `toBeEmptyDOMElement()`.
- "renders one card per room in the given order": rooms `[room_b, room_a]`; `screen.getAllByRole("button").map(b => b.querySelector(".room-title")?.textContent)` equals `["B", "A"]`; `screen.getByText("Kibitz")` present.
- "shows the description and viewer count": rooms `[room_a]`; `screen.getByText("Post-mortem")`; `.room-viewer-count` has `title` `"2 people here"` and text `"2"`.
- "omits the description line when the room has none": rooms `[room_b]`; `document.querySelector(".room-live-line")` is `null`.
- "navigates to the room on click": click the first button; `browserHistory.push` called with `"/kibitz/user-aaaa"`.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/views/Game/GameKibitzRooms.test.tsx`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement `GameKibitzRooms` and its CSS**

Component per Interfaces. `GameKibitzRooms.css` takes the `.ChatKibitzRoom` rules from `src/components/Chat/ChatKibitzRoom.css` that apply (top border, header, `.kibitz-room-card` button reset and hover, `.room-title`, `.room-info-row`, `.room-live-line`, `.room-viewer-count`, `.room-viewer-icon`, `.room-viewer-number`) under `.GameKibitzRooms`, and drops the `.room-matchup` block. The Chat page card is not changed (spec non-goal); the duplication is deliberate and noted in a one-line comment at the top of the new CSS.

- [ ] **Step 4: Add the `footer` prop to `ChatUserList`**

Per Interfaces. Add `.user-list-footer { margin-top: auto; width: 100%; }` inside `.ChatUserList` in `ChatUserList.css`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/views/Game/GameKibitzRooms.test.tsx src/components/ChatUserList`
Expected: PASS.

- [ ] **Step 6: Checks and commit**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/views/Game/GameKibitzRooms.tsx src/views/Game/GameKibitzRooms.css src/views/Game/GameKibitzRooms.test.tsx src/components/ChatUserList/ChatUserList.tsx src/components/ChatUserList/ChatUserList.css`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint`

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/views/Game/GameKibitzRooms.tsx src/views/Game/GameKibitzRooms.css src/views/Game/GameKibitzRooms.test.tsx src/components/ChatUserList/ChatUserList.tsx src/components/ChatUserList/ChatUserList.css
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "feat(game): kibitz room card stack for the chat user list"
```

---

### Task 6: Wire it into `GameChat` and `Game` (ogs-ui)

**Files:**
- Modify: `ogs-ui/src/views/Game/GameChat.tsx:38-42,67-99,279,345-350`
- Modify: `ogs-ui/src/views/Game/Game.tsx:931-935` (`chat_props`)
- Test: `ogs-ui/src/views/Game/GameChatKibitz.test.tsx`

**Interfaces:**
- Consumes: `useGameKibitzRooms` (Task 3), `ChatUserCount.has_kibitz` (Task 4), `GameKibitzRooms` and `ChatUserList.footer` (Task 5), `useUserIsParticipant` and `usePhase` from `./GameHooks`.
- Produces: `GameChatProperties` gains `show_kibitz_rooms?: boolean`. `Game.tsx` sets `show_kibitz_rooms: Boolean(game_id)` in `chat_props`. `SidebarGameChat` spreads props through unchanged. `AnnulQueueModal` passes nothing new, so it stays off.

- [ ] **Step 1: Write the failing tests**

`GameChatKibitz.test.tsx` renders `GameChat` inside a `GobanControllerContext.Provider` (from `./goban_context`) whose value is a minimal stub: `{ goban: null, selected_chat_log: "main", on: jest.fn(), off: jest.fn(), setSelectedChatLog: jest.fn() }` cast through `unknown` to `GobanController`. Mock `./GameHooks` so `useUserIsParticipant` and `usePhase` are `jest.fn()`s the test controls; mock `./useGameKibitzRooms` as `jest.fn(() => [])`; mock `@/lib/data` so `data.get("user")` returns `{ id: 1, anonymous: false, email_validated: true, is_moderator: false }`; mock `@/lib/preferences`, `@/lib/chat_manager` (as Task 4), `@/components/TabCompleteInput`, `@/components/Player`, `@/lib/sockets` with the minimum that lets `GameChat` mount. If mounting `GameChat` needs more stubbing than fits in ~60 lines, extract `useGameKibitzVisibility(goban): boolean` into `useGameKibitzRooms.ts` (returns `participant && phase !== "finished"`) and test that with `renderHook` instead, keeping the `GameChat` assertions to the two prop-gating cases below.

- "makes no kibitz request when show_kibitz_rooms is not set": render with `channel="game-5" game_id={5}`; `expect(useGameKibitzRooms).toHaveBeenCalledWith(undefined, expect.anything())`.
- "asks for the game's rooms when show_kibitz_rooms is set": render with `show_kibitz_rooms`; `expect(useGameKibitzRooms).toHaveBeenCalledWith(5, false)` (participant false).
- "hides the rooms from a player while the game is in progress": `useUserIsParticipant` → true, `usePhase` → `"play"`; called with `(5, true)`.
- "shows the rooms to a player once the game is finished": participant true, phase `"finished"`; called with `(5, false)`.
- "marks the toggle when rooms exist": `useGameKibitzRooms` → `[room_a]`; `document.querySelector("svg.KibitzUsersIcon")` not null.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/views/Game/GameChatKibitz.test.tsx`
Expected: FAIL (prop unknown, hook never called).

- [ ] **Step 3: Wire `GameChat`**

In `GameChat`: `const phase = usePhase(goban);` `const kibitz_hidden = userIsPlayer && phase !== "finished";` `const kibitz_rooms = useGameKibitzRooms(props.show_kibitz_rooms ? props.game_id : undefined, kibitz_hidden);`. Pass `footer={<GameKibitzRooms rooms={kibitz_rooms} />}` to `ChatUserList` and `has_kibitz={kibitz_rooms.length > 0}` to `ChatUserCount`.

- [ ] **Step 4: Wire `Game.tsx`**

Add `show_kibitz_rooms: Boolean(game_id)` to `chat_props`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test src/views/Game`
Expected: PASS, including `GameChatPlacement.test.tsx`.

- [ ] **Step 6: Check it in the running stack**

With the ogs branch checked out (the stack bind-mounts `ogs/` so Django hot-reloads), on http://localhost:1080: open a live game as a third account, create a kibitz room on it from `/kibitz`, return to the game, open the chat user list: one card with the room title, description and count; the toggle shows the bubble icon with the list closed. Change the room's board to another game: card and icon go. Confirm as one of the players that nothing shows until the game ends. Confirm a review page shows nothing.

- [ ] **Step 7: Checks and commit**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui prettier:file src/views/Game/GameChat.tsx src/views/Game/Game.tsx src/views/Game/GameChatKibitz.test.tsx`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui type-check`
Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui lint`

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add src/views/Game/GameChat.tsx src/views/Game/Game.tsx src/views/Game/GameChatKibitz.test.tsx
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "feat(game): kibitz room cards in the game chat user list"
```

---

### Task 7: Durable docs and final checks

**Files:**
- Modify: `ogs-ui/docs/kibitz.md` (new section after "## Layout")
- Modify: `ogs/services/django/ogs/kibitz/views.py` docstring (done in Task 2; verify)

- [ ] **Step 1: Document the Game page cards**

Add `## Game page cards` to `ogs-ui/docs/kibitz.md`, present tense, ~10 lines: where the cards live (game chat user list footer), what they show, the `GET kibitz/rooms?game=` source and `kibitz-rooms` push following in `useGameKibitzRooms`, the player rule (hidden while participant and the game is not finished), and the `KibitzUsersIcon` toggle state. Mention that `ChatKibitzRoom` on the Chat page is the sibling keyed by channel.

- [ ] **Step 2: Full test runs**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui test`
Run: `make -C /Users/mgregory/src/OGS/ogs lint`
Run: `docker exec ogs_django_1 pytest /ogs/services/django/ogs/api/views/kibitz_rooms_test.py`
Expected: all green.

- [ ] **Step 3: Build once**

Run: `yarn --cwd /Users/mgregory/src/OGS/ogs-ui build`
Expected: succeeds.

- [ ] **Step 4: Commit the doc**

```bash
git -C /Users/mgregory/src/OGS/ogs-ui add docs/kibitz.md
git -C /Users/mgregory/src/OGS/ogs-ui commit -m "docs(kibitz): game page kibitz room cards"
```

- [ ] **Step 5: Hand back**

Show the user both branches' diffs and wait for the go-ahead before any push. The ogs-ui PR description must contain `Depends on online-go/ogs#<number>.` once the ogs PR exists.
