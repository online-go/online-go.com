# Kibitz sidebar

Allow a 240px minimum resize width while retaining the 384px default.
An accessible chevron collapses the rooms/variations panel to a 28px
restore rail. Collapse is persisted independently of the saved resize
width; restoring reuses that width. The layout resolver accounts for
the rail so the board reclaims the released space. Portrait and compact
layouts retain their existing Rooms/Variations controls.

GobanView accepts optional minimum and collapsed widths. Existing consumers
keep their defaults. Only Kibitz opts into the smaller minimum and collapse.
No PR or remote publication is part of this task.
