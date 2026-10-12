# Bot challenge: check the real game settings (plan)

Spec: `docs/superpowers/specs/2026-10-12-bot-acceptable-settings-design.md`

1. `src/lib/bots.ts`: `BotChallengeOptions` takes a `time_control` and an
   optional `komi`. Fix the unranked test and the dan rank conversion
   (`botRankNumber`). Apply the rank range only to ranked games. Check the time
   control system, komi, and each time range with a message that names the
   range. Add `botTimeSettingRanges()`.
2. `src/lib/bots.test.ts`: one test per fix and per message.
3. `src/components/ChallengeModal/ChallengeModal.tsx`: build the options from
   the modal state, not from `SPEED_OPTIONS`.
4. `src/views/Play/QuickMatch.tsx`: remove the unused bot list.
5. `docs/bot-challenges.md`: durable description of the check.
6. Verify: `yarn type-check`, `yarn lint`, `yarn prettier:file`, jest, `yarn
build`, and a browser check at 1600x900 and 400x800 with test bots.
