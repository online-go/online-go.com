# Play page

The Play page (`src/views/Play/`) has three parts, top to bottom:

1. `GameSearchStatus`: the searches the player is waiting on.
2. `QuickMatch`: automatch options and the "Play Human" / "Play Computer"
   buttons.
3. `CustomGames`: the custom game list and seek graph. It is collapsed by
   default (`automatch.show-custom-games`).

## Showing that the player is waiting

Every kind of pending search is visible without expanding custom games:

| Search                    | Where it shows                                                                                                                |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Live automatch            | `QuickMatch` replaces the play buttons with "Searching for game..." and Cancel. A toast shows the elapsed time on every page. |
| Correspondence automatch  | `GameSearchStatus`, one row per request, each with Cancel.                                                                    |
| Own open live custom game | `GameSearchStatus`, with Cancel and the reason the play buttons are disabled.                                                 |
| Own live rengo game       | `GameSearchStatus`, and the rengo management pane in `CustomGames`.                                                           |

Do not put a pending-search indicator only inside `CustomGames`. Players who
never expand that section must still see it.

## Data sources

The hooks in `src/views/Play/hooks.ts` supply this state:

- `useCorrespondenceAutomatchers()` reads
  `automatch_manager.active_correspondence_automatchers` and updates on the
  manager's `entry`, `start` and `cancel` events.
- `useOwnLiveChallenge()` reads `active_challenges_emitter`. The SeekGraph that
  `CustomGames` creates feeds this emitter, also when the section is collapsed.
  A challenge counts as the player's own live challenge when `user_challenge` is
  set and `0 < time_per_move < 3600`.
- `useHaveActiveGameSearch()` is true during a live automatch or while the
  player has an own live challenge. It disables the play buttons and "Create a
  custom game".
