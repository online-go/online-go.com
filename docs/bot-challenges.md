# Bot challenges

Players challenge a bot from the computer challenge modal
(`src/components/ChallengeModal/`, mode `"computer"`). Bots run gtp2ogs, which
accepts or rejects each challenge when it arrives. The modal predicts that
answer so that players do not send challenges that the bot will reject.

## Bot configuration

The server sends the active bots and their gtp2ogs configuration on the
`active-bots` socket event. `src/lib/bots.ts` keeps them. The config type is
`BotConfig` in goban (`_config_version` 0, 1 or 2). Version 0 means the bot sent
no config. Such bots are shown as available.

## The compatibility check

`getAcceptableTimeSetting(bot, options)` returns the options when the bot will
accept them, or `null` and a translated reason. The modal calls it for every bot
with the modal's current board size, `ranked`, handicap, custom komi and time
control. Unavailable bots are greyed out with the reason.

The check follows the gtp2ogs challenge validator:

| Setting             | Rule                                                                        |
| ------------------- | --------------------------------------------------------------------------- |
| Board size          | `allowed_board_sizes`: a list, one size, `"square"` or `"all"`              |
| Ranked              | `allow_ranked` / `allow_unranked`                                           |
| Player rank         | `allowed_rank_range`, ranked games only. "1d" is 30, "30k" is 0, pro is 999 |
| Handicap            | `allow_ranked_handicap` / `allow_unranked_handicap`                         |
| Komi                | `allowed_komi_range`, only when the player picked a custom komi             |
| Time control system | `allowed_time_control_systems`                                              |
| Time settings       | `allowed_<speed>_settings`, see `botTimeSettingRanges()`                    |

Version 1 configs have no rapid settings. A rapid game is checked against the
live settings, and the returned options have the speed changed to `"live"`.

When you change what gtp2ogs checks, change this check and its tests
(`src/lib/bots.test.ts`) to match.

## What the modal can not predict

Some rejections depend on the bot's state when the challenge arrives: the
blacklist, too many games at a speed, too many games with one player, and
`decline_new_challenges`. The modal shows the bot's rejection message for
these (`rejectionDetailsToMessage()` in `ChallengeModal.utils.ts`).
