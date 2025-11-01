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
 * Converts SGF coordinate to display coordinate (e.g., "pc" -> "Q17")
 * SGF uses lowercase letters where 'a' = 1, 'b' = 2, etc.
 * Display format uses uppercase letters for columns and numbers for rows (from bottom)
 */
export function sgfToDisplay(sgf: string): string {
    const col = sgf.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
    const row = sgf.charCodeAt(1) - 97; // 'a' = 0, 'b' = 1, etc.

    // Convert to display format (A-T for 19x19, 1-19 from bottom)
    const colLetter = String.fromCharCode(65 + col + (col >= 8 ? 1 : 0)); // Skip 'I'
    const rowNumber = 19 - row;

    return `${colLetter}${rowNumber}`;
}
