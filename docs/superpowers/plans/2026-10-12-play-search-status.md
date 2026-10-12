# Play page search status (plan)

Spec: `docs/superpowers/specs/2026-10-12-play-search-status-design.md`

1. `src/views/Play/hooks.ts`: add `useOwnLiveChallenge()` and
   `useCorrespondenceAutomatchers()`. Rebuild `useHaveActiveGameSearch()` on
   `useOwnLiveChallenge()`.
2. `src/views/Play/GameSearchStatus.tsx` and `.css`: the status component.
3. `src/views/Play/GameSearchStatus.test.tsx`: renders nothing when idle; shows
   and cancels an own live challenge; shows, updates and cancels
   correspondence requests from `automatch_manager` events.
4. `src/views/Play/Play.tsx`: render `GameSearchStatus` above `QuickMatch`.
5. `src/views/Play/QuickMatch.tsx`: remove `correspondence_spinner`.
6. `src/views/Play/CustomGames.tsx`: remove the own-challenge card and the
   "Your Automatch Requests" rows, and the imports they leave unused.
7. `docs/play-page.md`: durable description of how the Play page shows pending
   searches.
8. Verify: `yarn type-check`, `yarn lint`, `yarn prettier:file`, the new tests,
   and a browser check at 1600x900 and 400x800.
