This document is primarily for the developers of clients that interface with
online-go.com to aid in the transition to the new clock system.

The goal of this update is to make our clock system more reliable down to the
wire for blitz games and those that want to play during the last tenth of a
second of a Byo-Yomi period, mostly regardless of network conditions.

To do this, we're switching the lag compensation model from reducing the
visible clock time by the amount of latency in the network, to adding that
latency compensation as a grace period before a timeout takes effect. The
client will send the state of the clock as the client saw it when the move
was made.

In summary:

-   Clients should no longer use latency information to artifically reduce the amount of time shown on the clock
-   When a move is made, a `clock` field should be added to the move object that
    contains the current state of the clock, according to the client.
    -   Note: The clock needs to be pretty close to what the server thinks it
        should be, otherwise it will be ignored. This is to prevent notable clock
        cheating.
    -   The format of the object passed in the clock field should adhere to this schema: https://github.com/online-go/goban/blob/main/src/JGOF.ts#L141-L162
-   When pausing a game, the current `clock` should be sent as well to preserve
    the clock in the state that the player paused at.
-   When the clients clock runs out, the client should now send a `game/timed_out` message to the server.
    -   Note: A timeout will occur whether this message is sent or not, however
        doing this expedites the process so for the case when someone has a
        pretty good internet connection, the clients aren't waiting around for the
        grace period timeout to trigger.
    -   The message body for `game/timed_out` should look like the `game/move` without the move,
        https://github.com/online-go/goban/pull/66/files#diff-c46b4a3bf2a9b394ceb534957ab579c2bee4336e0a194d23479387434ec25801R3092-R3096
-   Clients should stop counting down the clock after a move has been submitted.
-   Clients can (and should) send latency information to games with the `game/latency` message, and should listen for `game/:id/latency` updates. There is also a new `latencies` dictionary keyed by player id in the gamedata blob. You should also use this latency information to offset your displaeyd clocks to reduce the amount of jumping around they do when clock updates come in. See https://github.com/online-go/goban/pull/66/commits/4594bde1462d17ea9765eaa714d6f0c8c114b6b1 and https://github.com/online-go/goban/pull/66/commits/13819dbbb4d45b9e2c85b79ad530365ccc890465 for the OGS implementation of this.

Transition:

-   No immediate action is required. Existing clients will continue to function unmodified, the
    only noticable change will be the server will wait for the grace period to expire before timing
    out a client, so there will be a bit of a delay after the clock runs out before the server calls
    the game. Clients can be upgraded to send the `clock` field and the "timed out" message at
    which point the server will use those when they are provided.
