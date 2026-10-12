# Bot challenge: check the real game settings (design)

Date: 2026-10-12
Status: approved

## Problem

A player reported that they must guess game settings until a bot accepts the
challenge. The computer challenge modal already greys out bots that it thinks
will reject the game, but that check used the wrong inputs and had bugs, so
bots that looked available still rejected the challenge:

- It checked the `SPEED_OPTIONS` preset for the board size and speed, not the
  time control in the modal. Custom times, and the saved time control loaded
  when the modal opens from Home, were never checked.
- It sent `ranked: true` always. Bot games set `ranked` automatically, and it is
  false for unusual board sizes, custom komi and private games.
- The unranked test was inverted (`allow_unranked` instead of
  `!allow_unranked`). The hard-coded `ranked: true` hid this.
- Dan ranks were off by one compared to gtp2ogs ("1d" was 31, gtp2ogs uses 30),
  and the rank range was applied to unranked games, which gtp2ogs does not do.
- Komi was not checked. Allowed time control systems were not checked by name.
- Non-standard board sizes had no `SPEED_OPTIONS` entry, so every bot was
  hidden.
- The reasons were generic ("Bot cannot play at this speed"), so the player
  could not tell what to change.

## Design

`getAcceptableTimeSetting()` in `src/lib/bots.ts` takes the real
`time_control`, `ranked`, `handicap` and, when the player picked a custom komi,
`komi`. It follows the order and rules of the gtp2ogs challenge validator for
everything that does not depend on the bot's current load. Range failures name
the setting and the accepted range, for example "Main time must be from 1m to
20m" or "Bot only plays on 9x9, 19x19".

`botTimeSettingRanges()` lists the accepted range for each setting of a time
control system.

The reason text below a greyed out bot shows the result of the check.

A gear next to the "AI Player" link opens `BotSettingsModal`, which lists what
the selected bot accepts: board sizes, ranked or unranked, handicap, komi,
player rank for ranked games, and the time ranges for each system at the
selected speed. It is on top of the challenge modal, so Escape closes only it.

The unused bot list in `QuickMatch` is removed. It called the same function and
its result was never rendered.

## Out of scope

- Changing the player's settings automatically to fit a bot.
- A summary always visible in the challenge modal. A first version had one
  below the bot list; it added too much text, so it moved to the gear modal.
- Rejections that depend on the bot's state: blacklist, too many games, not
  accepting challenges. The modal still shows the bot's rejection message.
- Opening the modal again with the same settings after a rejection.
