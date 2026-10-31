# Implementation

1. Add a guarded game send handler and separate, labelled game composer.
2. Preserve tab drafts and reset game drafts when the room/game changes.
3. Cover sending, permissions, controller mismatch, tab isolation and game
   changes with rendering tests. Run types, lint and formatting.
4. Update docs/kibitz.md and the local production-backed preview. Verify
   desktop and portrait composer rendering without sending live messages.
