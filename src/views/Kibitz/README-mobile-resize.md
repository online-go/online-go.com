# Mobile Goban Resize QA

Checklist:

1. Tap the resize handle at max size: no movement.
2. Tap the resize handle at a smaller size: no movement.
3. Move 1-2 px: no resize.
4. Drag smaller: smooth, no release bounce.
5. Drag larger: smooth, no frozen host.
6. Drag to max: no padding overshoot.
7. Drag to max and release: no button jump.
8. Repeat max -> small -> max: no drift.
9. Rotate the device or resize the viewport: stable cache refreshes.
10. Smoke test in iOS Safari, iOS Chrome/WebKit, Android Chrome if available, and Chrome DevTools mobile emulation.

The resize logs should make it obvious whether a failure is in:

- gesture lifecycle
- stable measurement
- helper computation
- target application
- release commit
- post-settle layout
- native Goban content
