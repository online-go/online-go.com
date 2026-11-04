# Kibitz: continue watching in a separate room

Issue: #3901
Status: design, phase 1 ready to implement; phase 2 needs backend agreement

## Purpose

Let spectators in a preset room keep watching and discussing a game together after the preset room switches to another game. Continuing is voluntary. Preset selection and switching do not change.

## Approach

Ship in two phases.

- **Phase 1** uses only existing APIs: a continuation room is an ordinary user room on the watched game. It delivers the user-facing feature now and shows whether people use it.
- **Phase 2** adds server guarantees (ownerless, game-locked, unique, auto-cleanup). It needs backend work and starts with agreeing the contract on #3901.

## Existing building blocks (origin/main)

- Room kinds: `"preset" | "user" | "broadcast"`; user rooms carry `creator_id`.
- `POST kibitz/rooms { source_game_id, title, description }` creates a user room on a game (`KibitzController.createRoom`). The server rejects a duplicate title (`isKibitzRoomTitleTakenError`) and offensive titles.
- `GET kibitz/rooms?game=<id>` plus `useKibitzDirectoryRooms` keep a live list of rooms whose current board is that game (`useGameKibitzRooms`).
- Room directory with create/update/remove broadcasts; game-change system lines in Kibitz chat; spectator-access rule `isKibitzAccessBlockedForUser`.

## Phase 1: frontend only

### Behaviour

In a preset room, for the game it is watching:

- **Find**: the client keeps a live list of user rooms on the current game (`kibitz/rooms?game=`). A room counts as this game's continuation room when its title equals the generated continuation title (below). Without one, the action reads **Continue in new room**; with one, **Join continuation room** (with its viewer count).
- **Create**: `createRoom` with the generated title and the current game, without selecting the new room. If the source preset room and game are unchanged when the request completes, the creator's client posts one Kibitz chat message in the preset room with a link to the new room, then navigates to that room once. A stale response does not post or navigate. The action becomes **Join continuation room** for everyone as the directory update arrives.
- **Join**: navigates to the room using existing room navigation.
- **Announcement**: one system line in the preset room's chat whose text contains the room title, with exactly that title linked to the room, e.g. "Continue watching in a separate room: <room title>". `system_line_markup` only links text that occurs in the line, so the link text must be a substring of the final (localised) text. It stays in chat history after the preset switches.
- **Invitation**: only while a continuation room exists for the current game, show a one-line bar above the preset room's chat with short text ("Continue watching in a separate room"), a **Join** button and a **dismiss** (×) button. Without a continuation room nothing is rendered, so it takes no space. It is driven by the live room list, so it appears for spectators who arrive later and after refresh, and it disappears when the preset switches game (the list then follows the new game).
- **Dismiss**: hides the bar for that viewer for that continuation room only. Remember the last 20 dismissed room ids per viewer through the `data` module (`kibitz.dismissed_continuation_rooms`, typed in `KibitzSchema`); without storage the bar simply reappears after a reload. A later continuation room for another game shows the bar again. Dismissing does not affect the action in the menu or the chat announcement.
- No buttons on the preset room's game-switch banner; it is unchanged.

### Generated title and duplicates

- Title: a fixed, language-neutral format from server-provided game data, e.g. `"<black> vs <white> · #<game_id>"`. It must be identical for every client, so do not localise it or derive it from local state; the game id keeps it unique per game. Visible labels around it are localised as usual.
- Duplicates: before creating, re-check the live list. If two spectators create at once, the server's title-uniqueness check rejects the second; on `title taken`, re-fetch `kibitz/rooms?game=` and switch to **Join** that room. Treat this as best effort; strict uniqueness is phase 2.
- Stale create: if the preset room or its current game changed while the request was in flight, do not post the chat message or navigate to the room. The room itself may already exist; it stays as an ordinary user room.

### Known limits of phase 1 (state these in the PR)

- The creator owns the room and can still rename, change board or delete it.
- Uniqueness relies on the server's title check; a room renamed by its creator stops being recognised as the continuation room.
- The chat announcement is posted by the creator's client, so it is not guaranteed exactly once (retries, closed tab).
- Cleanup follows the existing rules for user rooms.

### UI and states

- Action placement: an item in the existing **More actions** (⋯) menu of the tab bar, not a tab of its own, so it takes no space on desktop or mobile. Hidden for spectators blocked by `isKibitzAccessBlockedForUser`, for signed-out users if room creation needs an account, and outside preset rooms (including in the continuation room itself).
- States: none / creating (disabled, spinner) / exists (Join) / error (normal toast, nothing changes).
- After refresh or reconnect the state comes from the room list, never from local memory, so a refresh cannot create a second room.

### Tests

- Menu item: Create when no matching room, Join when one exists, follows the new game after a preset switch; no continuation tab in the tab bar.
- Create success: one chat message; rendered through the chat line it contains an `<a>` to `/kibitz/<room id>` whose text is the room title. Creator navigates to the new room exactly once. Existing `createRoom` callers still select the created room by default.
- Invitation bar: absent without a continuation room; shows text, Join and dismiss with one; dismiss hides it for that room only and survives a reload; a continuation room for another game shows it again.
- Concurrent create: `title taken` resolves to Join on the existing room, no second message.
- Stale create: response arriving after a preset switch posts nothing and shows no invitation.
- Refresh with an existing room shows Join and the invitation.
- Invitation visibility and removal on switch; blocked/signed-out users see no action.
- Layout check at desktop and at 375 px width.

## Phase 2: backend guarantees

Agree these as properties on #3901 before writing code; the backend maintainers choose the shape (likely flags on user rooms rather than a new room kind):

- One continuation room per (source preset room, game), enforced atomically; concurrent creates return the same room.
- No owner: no rename, board change or delete by anyone; survives the creator leaving.
- Game locked, also after the game finishes.
- Rooms expose a discriminator plus source room and game, so clients recognise them without matching titles.
- The server posts the source-room announcement exactly once.
- Cleanup after the game finished and the room has been inactive for a documented retention period.
- Existing access rules and rate limits apply to creation.

Then the frontend switches recognition from the title to the discriminator, removes management controls for these rooms, and drops the client-side announcement.

## Open questions

- Who may create: any signed-in spectator? Rate limit per user?
- Exact title format, and whether it should include ranks.
- Should the invitation also appear on the game page's Kibitz room list? (Phase 1 gets this for free through `kibitz/rooms?game=`.)
