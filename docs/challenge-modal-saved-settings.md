# Challenge modal saved settings

The challenge modal opens with the settings that the player used last time.
Each kind of challenge keeps its own copy, so a challenge of one kind does not
change the next challenge of another kind. The keys are in the local `data`
store and are not replicated to other devices. `SAVED_SETTINGS_KEYS` in
`src/components/ChallengeModal/ChallengeModal.tsx` is the single list of them.

| Mode       | Opened from                  | Challenge details            | Restrict Rank                      | Clock                                                                        |
| ---------- | ---------------------------- | ---------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| `open`     | Custom Game                  | `challenge.challenge.live`   | `challenge.restrict_rank`          | `time_control.speed`, `time_control.system`, `time_control.<speed>.<system>` |
| `player`   | Challenge button on a player | `challenge.player.details`   | `challenge.player.restrict_rank`   | `challenge.player.time_control`                                              |
| `computer` | Play against the computer    | `challenge.computer.details` | `challenge.computer.restrict_rank` | `challenge.computer.time_control`                                            |

`challenge.bot` (the last bot picked) is shared by all modes.

## Loading

A `player` or `computer` key that has no value yet falls back to the `open`
value. A player who has never sent a direct challenge or a computer challenge
starts from their Custom Game settings. After the first one, each mode uses its
own copy.

Settings passed in `config` (a rematch, a Quick Match computer game) replace the
loaded values.

When the player changes the game speed or the time control system in the
modal, the picker loads the values for that combination from the shared
`time_control.<speed>.<system>` keys. Only the `open` mode writes those keys.

## Saving

The modal saves when the player sends the challenge. These challenges are not
saved, because their settings come from one game:

- A rematch (`persistColor === false`, online-go.com issue 2253).
- A fork (`initialState` is set).

## The "live" suffix

`challenge.challenge.live` is the only copy of the Custom Game settings. Older
code read the suffix from `challenge.speed`, but nothing ever wrote that key,
so the suffix was always `live`. The key keeps this name so that saved settings
continue to load.
