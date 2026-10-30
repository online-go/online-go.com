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

/** Empty move strings are valid only when the post contains annotations. */
export function hasKibitzAnalysisContent(
    moves: unknown,
    marks: unknown,
    penMarks: unknown,
): boolean {
    if (typeof moves !== "string") {
        return false;
    }
    if (moves.trim().length > 0) {
        return true;
    }
    if (moves !== "") {
        return false;
    }
    const hasMarks =
        typeof marks === "object" &&
        marks !== null &&
        !Array.isArray(marks) &&
        Object.entries(marks).some(
            ([key, value]) =>
                key.length > 0 && typeof value === "string" && /^([a-zA-Z]{2})+$/.test(value),
        );
    const hasPenMarks =
        Array.isArray(penMarks) &&
        penMarks.some(
            (mark: unknown) =>
                typeof mark === "object" &&
                mark !== null &&
                "color" in mark &&
                typeof mark.color === "string" &&
                mark.color.length > 0 &&
                "points" in mark &&
                Array.isArray(mark.points) &&
                mark.points.length >= 4 &&
                mark.points.length % 2 === 0 &&
                mark.points.every(
                    (point: unknown) => typeof point === "number" && Number.isFinite(point),
                ),
        );
    return hasMarks || hasPenMarks;
}
