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
 * Parse a kibitz game-picker manual input into a numeric game id.
 *
 * Accepts either a bare integer ("12345") or a URL containing /game/ID or
 * /game/view/ID. The optional /view segment in the regex covers both forms,
 * so a single match handles all the manually-pastable variants.
 */
export function parseGameId(input: string): number | null {
    const trimmed = input.trim();

    if (/^\d+$/.test(trimmed)) {
        return Number(trimmed);
    }

    const match = trimmed.match(/\/game(?:\/view)?\/(\d+)(?:\/|$|\?)/i);
    if (match) {
        return Number(match[1]);
    }

    return null;
}
