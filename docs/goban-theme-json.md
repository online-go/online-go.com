# Goban theme JSON

OGS goban theme JSON is a public, versioned format intended for sharing themes in
places such as the OGS forums. It is deliberately separate from the private
`preferences.*` keys stored by the web client.

The current format discriminator is `online-go.com/goban-theme`, and its current version
is `1`. Exported documents contain:

- the effective selected board, black-stone, and white-stone theme names;
- the complete Custom board and Custom stone configuration, even when it is dormant;
- global stone scale and shadow settings; and
- fuzzy stone placement.

Personal presentation choices such as coordinates, removal markers, font scale, marker
opacity, variation display, undo indicators, and accessibility settings are excluded.

## Selected themes and Custom details

The selected `theme` is authoritative. A board theme such as `Kaya` supplies its own
background, grid, and label colors. The adjacent `custom` values are stored but remain
dormant until the selected board theme is changed to `Custom`.

Black and white stones follow the same rule independently. Built-in stone themes supply
their own artwork and marker colors. A stone's `custom` colors and image URLs become
active only when that stone's selected theme is `Custom`. Import never infers `Custom`
from the presence of custom details.

Keeping dormant details in the document lets a shared theme preserve the author's whole
Custom setup without creating unsupported hybrids such as Kaya with an overridden grid.

## Replacement and defaults

Import replaces every setting in the shareable scope after the complete document has
been parsed, migrated, and validated. It never merges with the recipient's corresponding
settings. This matters for forward compatibility: when a later format adds a setting,
an older theme must receive the new version's documented default instead of accidentally
retaining an unrelated value from the importing device.

Current preference/reset defaults are defined independently from the portable migration
chain. Some defaults are concrete values, some are automatic sentinels, and some are
derived—for example, the default board-label color is computed from the grid color.

## Adding a format version

Persisted-setting migrations and portable-theme migrations solve different problems:

- persisted migrations rename or reshape private browser/account storage keys;
- portable migrations preserve JSON that may remain in forum posts indefinitely.

When the public shape, meaning, or normalized defaults change:

1. Increment the portable format version.
2. Add a pure, directional migration from the preceding version.
3. Fill every newly introduced field with the target version's documented default.
4. Explicitly map renamed or removed built-in theme identifiers.
5. Keep the old types and migration tests so every supported version can migrate
   sequentially to the current format.

Never call persisted preference migrations from the portable migration chain, and never
rely on renderer fallback behavior to repair a portable document.
