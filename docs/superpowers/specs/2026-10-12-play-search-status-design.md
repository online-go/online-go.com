# Play page search status (design)

Date: 2026-10-12
Status: approved

## Problem

A player reported that they could not tell whether they were waiting for a
game. The code confirms several gaps:

- A correspondence automatch started from the Home page "Play" button gives no
  feedback. The "Finding a game..." toast is shown only for live speeds, and the
  Play page's "Finding you a game..." card is local state that only the Play
  page's own button sets.
- The "Your Automatch Requests" list and the "Waiting for opponent..." card for
  the player's own live custom game are inside the custom games section. That
  section is collapsed by default (`automatch.show-custom-games`).
- When the player has an open live custom game, "Play Human" and "Play
  Computer" are disabled. Nothing tells the player why.
- `CustomGames` reads `automatch_manager` but does not listen to its events, so
  the request list does not update when a request starts or stops.

## Design

A new `GameSearchStatus` component at the top of the Play page, above
QuickMatch. It is always visible when there is something to show, and renders
nothing otherwise.

- **Own live custom game.** "Waiting for an opponent to accept your custom
  game", a note that the player must cancel it to start a different game, and a
  Cancel button (`DELETE challenges/<id>`).
- **Correspondence automatch requests.** A title, the existing "This can take
  several minutes. You will be notified..." note, and one row per request with
  its board sizes, time control system and opponent rank range, plus a Cancel
  button.
- The live automatch search keeps its current display ("Searching for game..."
  in place of the play buttons, and the global toast).

Data comes from two hooks in `src/views/Play/hooks.ts`:

- `useOwnLiveChallenge()` reads `active_challenges_emitter`, which the SeekGraph
  in `CustomGames` feeds whether or not the section is expanded.
  `useHaveActiveGameSearch()` is rebuilt on top of it.
- `useCorrespondenceAutomatchers()` listens to `automatch_manager` `entry`,
  `start` and `cancel` events.

Removed, because the new component replaces them:

- The "Waiting for opponent..." card and the "Your Automatch Requests" rows in
  `CustomGames`.
- The `correspondence_spinner` card in `QuickMatch`, which pointed at the hidden
  list. After a correspondence search starts, the play buttons stay available
  and the request shows in `GameSearchStatus`.

The live rengo management pane stays in `CustomGames`. It is a management
tool, not a status line.

## Out of scope

- A site-wide indicator on pages other than Play.
- Showing the toast again for a live search after a page reload.
