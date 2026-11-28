# Kibitz: watch GoTV streams in a room

Issue: #3898
Status: design draft. Step 1 is mostly frontend; later steps need backend agreement.

## The basic idea

Think of a Kibitz room as a table where friends watch Go together. Three things can be on that table, and each one can be swapped on its own:

1. **The conversation.** The people in the room, their chat and the variations they share. This stays put whatever else changes.
2. **The board.** What the shared board shows. It can be:
   - a game being played on OGS,
   - a board someone updates by hand, for a pro match or a lesson,
   - or no board at all.
3. **The TV.** An optional Twitch stream playing beside the board.

You can change the TV channel without the board jumping, and change the board without the TV turning off. So there is no special "stream room": a stream room is a normal room with the TV switched on.

## How the tricky questions are answered

- **The game isn't on OGS.** Someone keeps the board updated by hand while everyone watches the stream.
- **People only want to watch and chat.** Leave the board off. The person in charge can turn it on later without anyone leaving the room.
- **Who's in charge.** The room's owner, plus anyone they choose as a helper. Normally that's one person. Helpers can change the board and the stream; everyone else chats and shares variations as today. There is no voting on streams.
- **Watching a different stream.** The room suggests a stream, but you can switch or hide it on your own screen without affecting anyone else.
- **The video is behind the real game, so the board spoils moves.** By default the board waits a few seconds so it matches the video. The streamer sets how long, each viewer can adjust it, and anyone who doesn't care about spoilers can turn the waiting off. This happens only on the viewer's own screen.
- **Which OGS game the streamer is playing.** Twitch doesn't tell OGS, so the person in charge picks the game with the existing game picker. Nothing is guessed. Later, streamers could set "now playing" on GoTV to fill this in for them.
- **Where Twitch chat goes.** For now, a *Stream chat* button on the stream opens Twitch chat under the video, and the room's own chat stays the main chat. Moving it into the game-chat spot, with a switch between the two, can come later.
- **Small screens.** Twitch needs a minimum player size, which doesn't fit next to the board in the compact layout. On phones the video gets its own tab next to Board and Chat. On desktop it sits above the chat column and can be collapsed.
- **Hand-updated boards and old variations.** When the board moves on, variations made on an earlier position are kept and marked "from an earlier position", not deleted.

## How to get to the room

- **From inside a room:** the owner or a helper opens room settings and chooses *Attach stream* from the live GoTV streams.
- **From GoTV:** each stream card gets a *Watch in Kibitz* button. If a room already shows that stream, you join it. Otherwise a new room is made with the stream on and no board yet, the same way continuation rooms work (#3901).
- **Permanent rooms:** a streamer or event can have a room that always exists. It shows the stream when they're live and an "offline" notice when they're not.

## Build order, smallest step first

1. Let a room owner turn on a stream in their room: the video, Twitch chat in the game-chat spot, and hide/switch for each viewer.
2. Add a *Watch in Kibitz* button on GoTV.
3. Add the delay so the board doesn't spoil moves.
4. Add hand-updated boards and helpers.
5. Give streamers and events permanent rooms, then extras such as an inbox of viewer variations for the streamer, a board view for OBS, polls and predictions.

## Questions for the backend

- Can preset rooms have a stream? Suggestion: not in step 1. Presets stay automatic.
- Should the server only accept channels that GoTV lists, or any Twitch channel?
- Do streams need moderation checks like room titles? At least, each viewer's "allow mature streams" setting should apply.

## Technical notes

New optional room fields. `current_game` stays as it is, so nothing that reads it breaks.

```ts
type KibitzBoardSource =
    | { type: "game"; game_id: number } // OGS game (today's current_game)
    | { type: "demo"; game_id: number } // hand-updated OGS demo board
    | { type: "none" }; // stream and chat only

interface KibitzRoomBroadcast {
    source: "twitch"; // Stream.source
    channel: string; // Stream.channel
    stream_id?: string; // set while live
    title?: string;
    set_by: KibitzRoomUser;
    delay_seconds?: number; // streamer's spoiler delay
}

interface KibitzRoomSummary {
    // ...existing fields
    board_source?: KibitzBoardSource; // absent = derive from current_game
    broadcast?: KibitzRoomBroadcast | null;
    operators?: number[]; // helpers' user ids
}
```

- A demo board is still an OGS game id, so variations (`game_id`, `analysis_from`) work unchanged.
- A viewer's own stream choice and delay are stored per viewer, not on the room.
- Step 1 needs one backend change: store `broadcast` on the room and send it to clients.
- Relevant code: `StreamManager` and `StreamCard` (GoTV); `KibitzChatPanel` game-chat path, `KibitzPortraitPanes`, `KibitzRoomSettingsPopover`, `KibitzGamePickerOverlay` (Kibitz).
