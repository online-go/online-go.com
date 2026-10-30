# Kibitz annotation-only variations

Issue: https://github.com/online-go/online-go.com/issues/3860

Allow an analysis message with an empty `moves` string when it has board marks
or pen drawings. Keep the existing analysis message format and reject empty
posts. Use the same content validation for sending, room history and rendering.

An annotation-only post opens its official `from` position on the secondary
board. Apply its marks only when selected, without adding a move, recolouring
the official trunk or changing the main board. The secondary controller is
rebuilt on selection, which isolates posts at the same position. Existing
move-based variations retain their separate branches and line annotations.

Track draft annotation changes across all existing nodes as well as added
branches, including changes made before navigating away from a position.

Verify snapshots, posting and room history, position zero, annotation isolation,
draft changes and existing move variations with focused tests. Server acceptance
and persistence of empty move strings remain an integration check when a live
authenticated test session is available. The durable contract is in
`docs/kibitz.md`.
