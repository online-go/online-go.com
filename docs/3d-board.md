# 3D board

The 3D board is opt-in. It draws the board in perspective with three.js, using
the renderer from the goban library. Moves, input, the move tree and the rest
of the page work as they do with the SVG board. If WebGL is unavailable or the
3D board fails to start, the SVG board stays.

## Where it is used

- Games, reviews, puzzles and both Kibitz boards follow the user's 3D
  preferences.
- Joseki shows only the board, seen from above, with no table or bowls. Its
  coordinates stay fixed. **More actions** has **Rotate board** and
  **Mirror board** while 3D is on. These views reset when the page reloads.
- The old canvas renderer and 3D cannot both be on. Turning one on turns the
  other off.

## Loading

The 3D code starts loading when the app starts if the 3D board is on.
When a page opens with the 3D board on, the board area stays empty until the
first 3D frame. Then the board fades in.
If 3D fails or takes more than 3 seconds to draw the first frame, the SVG board
appears.

## Settings

The board settings popover (the gear in the board bar) has **Use a 3D board**.
While it is on, a group under it has **Style**, **Table and bowls** and
**View** (the viewing angle and a quarter-turn rotate button).

**Settings → Theme** has the full set: style, table and bowls, lighting,
viewing angle and **Hold V and drag to turn the board**.

| Preference                      | Default  | Meaning                                                |
| ------------------------------- | -------- | ------------------------------------------------------ |
| `board-renderer-3d`             | `false`  | Use the 3D board.                                      |
| `board-renderer-3d-style`       | `floor`  | `floor` (traditional floor goban) or `tabletop`.       |
| `board-renderer-3d-room`        | `true`   | Show the table, bowls and room.                        |
| `board-renderer-3d-lighting`    | `studio` | `studio` or `daylight`.                                |
| `board-renderer-3d-tilt`        | `auto`   | `auto` uses the angle for the style; or 0, 15, 25, 35. |
| `board-renderer-3d-rotation`    | `0`      | Camera rotation in quarter turns: 0, 90, 180, 270.     |
| `board-renderer-3d-mouse-orbit` | `true`   | Holding V and dragging with the mouse turns the board. |

`GobanController` reads these preferences and updates the 3D board when they
change. A page can fix some options for its own board through the `three`
option of `GobanController`, and change the view later with `setThreeView`.

## Turning the board

- **Camera button:** the button in the top right of the 3D board starts camera
  mode, with a mouse or by touch. In camera mode, a drag turns the board
  instead of placing a stone. Drag sideways to rotate, or up and down to change
  the angle. Select **Done** to go back to playing.
- **V and drag:** with a mouse, hold V and drag with the primary button. This
  is on by default and can be turned off on the Settings page.
