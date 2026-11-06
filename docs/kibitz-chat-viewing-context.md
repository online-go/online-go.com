# Kibitz chat viewing context

Kibitz sends room chat on the existing `chat/send` channel. The `game_id` and
`move_number` fields on a typed chat body identify the watched game's official
position at send time and control the move separator.

The optional `viewing_position` object has its own `game_id` and `move_number`.
A variation includes a `variation` object with `from` (the official move at
which the path starts), `moves` (the Goban-encoded path from that move to the
viewed node), and an optional display `name`. The path captures the position
even if the variation is local, continued, or later removed from chat.

The server must accept this optional object on Kibitz bodies of type `chat`.
It must preserve it in both the broadcast and stored chat body and return it
when replaying channel history on join or reconnect. The outer game-time
fields and existing history without viewing context retain their meaning.
The frontend repository does not contain the server handler. Persistence
requires verification against a server that implements this contract.
