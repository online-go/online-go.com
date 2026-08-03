# Goban theme JSON

OGS goban theme JSON is a public, versioned format intended for sharing themes in
places such as the OGS forums. It is deliberately separate from the private
`preferences.*` keys stored by the web client.

The current format discriminator is `online-go.com/goban-theme`, and its current version
is `1`. Exported documents contain:

- the effective selected board, black-stone, and white-stone theme names;
- Custom board and stone configuration only for selections currently using `Custom`;
- global stone scale and shadow settings; and
- fuzzy stone placement.

Personal presentation choices such as coordinates, removal markers, font scale, marker
opacity, variation display, undo indicators, and accessibility settings are excluded.

## Effective theme settings

The JSON stores only the settings that currently affect how the goban looks.

For example, a built-in board theme such as `Kaya` already defines its background, grid,
and label colors. When `Kaya` is selected, the exported `board` object therefore contains
only the theme name. When `Custom` is selected, the `custom` object is required and
contains the custom board settings. A `custom` object is not allowed for a built-in theme.

Black and white stones follow the same rule separately: each stone color can use either a
built-in theme or `Custom`. Custom shadow colors and gradients are exported only when the
selected shadow style is `custom`.

Unused Custom settings are not preserved. For example, if someone configured a custom
board and later selected `Kaya`, the old custom settings are not exported. Importing that
theme resets the unused Custom settings to their documented defaults.

In short, the document describes what the goban looks like now. It is not a backup of
every setting previously entered in the theme editor.

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
