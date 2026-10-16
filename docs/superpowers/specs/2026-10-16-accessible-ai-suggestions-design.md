# Accessible AI suggestions

The accessible theme shows the best AI suggestion in the existing blue and all
other suggestion circles in orange (#e69f00). Numeric losses, visit counts,
opacity, and played-move badges keep their existing behavior. Other themes keep
the quality gradient. This applies to played moves outside analyzed branches too.

A theme CSS variable supplies the optional alternative color. The existing AI
review theme effect regenerates the circles when the theme changes. The shared
quality palette and summary badges keep their current category colors.

Validation covers score and win-rate views, different quality losses, unknown
played-move losses, blue played moves, and switching back to the normal palette.
