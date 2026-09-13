/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * A live game room's URL must never be able to change how the board looks
 * or how the surrounding UI is laid out for the viewer. Theme, zen/layout
 * mode, coordinate style, hidden panels, etc. are all *local, per-viewer*
 * presentation preferences (see @/lib/preferences and
 * @/lib/goban_theme_json), and stay that way regardless of who created the
 * match or what a `/game/:id?...` link says.
 *
 * Without an explicit allowlist it's easy for a future change to read a
 * new display-affecting query parameter (e.g. `theme=book`, `zen=true`,
 * `layout=compact`) directly off the URL, which would let a malicious match
 * creator force a themed board, forced zen mode, or hidden chat/toolbar
 * onto an opponent just by having them click a crafted link. Route the
 * handful of parameters the Game view is actually allowed to read through
 * this allowlist so any accidental addition of a presentation override is
 * caught immediately rather than silently shipped.
 *
 * `return` is the only presentation-adjacent parameter honored today, and
 * it only controls a post-game navigation target (validated separately by
 * `is_valid_url`) — it has no effect on theme, layout, or which UI elements
 * render.
 */
export const ALLOWED_GAME_URL_PARAMS: ReadonlySet<string> = new Set(["return"]);

/**
 * Returns a URLSearchParams containing only the keys in
 * ALLOWED_GAME_URL_PARAMS, dropping anything else — in particular any
 * attempt to smuggle display/theme/layout overrides (`theme`, `zen`,
 * `coords`, `layout`, ...) in through the game room URL.
 */
export function sanitizeGameSearchParams(searchParams: URLSearchParams): URLSearchParams {
    const sanitized = new URLSearchParams();
    for (const key of ALLOWED_GAME_URL_PARAMS) {
        const value = searchParams.get(key);
        if (value !== null) {
            sanitized.set(key, value);
        }
    }
    return sanitized;
}
