# Game chat composer

Give the Kibitz Game chat tab a composer using the watched game controller's
goban.sendChat(message, "main") path, as normal spectator game chat does.
Use the normal message sanitizer and validated-email/sign-in checks. The
server retains authority for game-chat permissions and restrictions.

Disable sending without a live controller for the room's current game.
Keep room and game input elements separate to preserve drafts across tab
changes. Key the game input by room and game so a board switch clears its
draft. Keep room chat's existing send path and position metadata unchanged.
Support desktop tabs and portrait panels. Do not open a PR.
