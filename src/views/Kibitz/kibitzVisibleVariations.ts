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

import { KIBITZ_VARIATION_COLORS } from "./kibitzVariationTree";

/** How many posted variations can be on the board at once: one per line
 *  colour the move tree can draw. */
export const MAX_VISIBLE_VARIATIONS = KIBITZ_VARIATION_COLORS.length;

/**
 * The variations currently drawn on the board, and the move-tree line colour
 * each one was given. The two travel together so that a render which makes a
 * variation visible also carries its colour: a board composed from an id list
 * whose colours had not been assigned yet drew every new line in colour 0.
 */
export interface KibitzVisibleVariations {
    ids: string[];
    colors: Record<string, number>;
}

export const EMPTY_VISIBLE_VARIATIONS: KibitzVisibleVariations = { ids: [], colors: {} };

function assignColorIndexes(
    previous: Record<string, number>,
    ids: string[],
): Record<string, number> {
    const next: Record<string, number> = {};
    const taken = new Set<number>();

    for (const id of ids) {
        const previousIndex = previous[id];
        if (
            typeof previousIndex === "number" &&
            previousIndex >= 0 &&
            previousIndex < MAX_VISIBLE_VARIATIONS &&
            !taken.has(previousIndex)
        ) {
            next[id] = previousIndex;
            taken.add(previousIndex);
            continue;
        }

        const freeIndex = KIBITZ_VARIATION_COLORS.findIndex((_, index) => !taken.has(index));
        const colorIndex = freeIndex >= 0 ? freeIndex : 0;
        next[id] = colorIndex;
        taken.add(colorIndex);
    }

    return next;
}

function sameColors(left: Record<string, number>, right: Record<string, number>): boolean {
    const leftKeys = Object.keys(left);
    return (
        leftKeys.length === Object.keys(right).length &&
        leftKeys.every((key) => left[key] === right[key])
    );
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
    return left.length === right.length && left.every((id, index) => id === right[index]);
}

/** Set the visible variations, keeping the colour of every variation that
 *  stays visible and giving each new one a colour no other variation holds. */
export function withVisibleVariationIds(
    previous: KibitzVisibleVariations,
    ids: string[],
): KibitzVisibleVariations {
    const colors = assignColorIndexes(previous.colors, ids);
    if (sameIds(previous.ids, ids) && sameColors(previous.colors, colors)) {
        return previous;
    }
    return { ids, colors };
}
