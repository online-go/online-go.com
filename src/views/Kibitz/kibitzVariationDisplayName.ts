/*
 * Copyright (C)  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/** The fields the variation list needs in order to name a row. */
export interface KibitzVariationDisplayNameSource {
    id: string;
    title?: string;
    created_at: number;
}

export interface KibitzVariationDisplayNameFormat {
    /** Label used for a missing title, and for blank titles that share that name. */
    untitledLabel: string;
    /**
     * The shared title as the row will show it: the collapsed name plus the
     * same ordinal suffix the list renders. `ordinal` is 1-based.
     */
    formatSharedTitle: (name: string, ordinal: number) => string;
}

/** The name shown for one row, plus an ordinal when that name is shared. */
export interface KibitzVariationDisplayName {
    /** Title text, without an ordinal. Unique rows keep their stored title. */
    name: string;
    /** Posting-order ordinal when the title is shared. Null when it is unique. */
    ordinal: number | null;
}

/**
 * Display titles for the Kibitz variation list.
 *
 * `variations` is every loaded variation (the chat history this viewer has),
 * including variations that are not on the board. The list renders a subset
 * and looks each row up by id. A title that no other loaded variation shares
 * is returned unchanged: the stored title when it is non-empty, otherwise
 * `untitledLabel`. Blank and whitespace-only titles share the untitled name.
 * Variations share a group when their titles collapse to the same words, so
 * `Ladder A` and `Ladder  A` are one sequence. Every member of a shared group
 * gets an ordinal, including the earliest, whether or not that member is
 * rendered.
 *
 * An ordinal is skipped when `formatSharedTitle` would equal a label already
 * shown: another loaded variation's unique title, or a label assigned earlier
 * in posting order. The comparison uses the text the row will show, trimmed,
 * with internal whitespace collapsed. Stored titles `Ladder`, `Ladder`, and
 * `Ladder (1)` therefore show `Ladder (2)`, `Ladder (3)`, and `Ladder (1)`,
 * and a stored ` Ladder (1) ` reserves `Ladder (1)`.
 *
 * Ordinals follow posting order: `created_at` ascending, then `id`. That is
 * the same order the room uses when it merges variations, and it does not
 * follow the list's visual grouping (current game first). Two viewers who
 * pass the same loaded variations get the same ordinal for each id. Hiding a
 * variation removes it from the rendered rows only. It stays in this input,
 * so the remaining ids keep their ordinals.
 */
export function formatKibitzVariationDisplayNames(
    variations: readonly KibitzVariationDisplayNameSource[],
    format: KibitzVariationDisplayNameFormat,
): Map<string, KibitzVariationDisplayName> {
    const counts = new Map<string, number>();
    for (const variation of variations) {
        const key = sharedTitleKey(variation.title, format.untitledLabel);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const reservedLabels = new Set<string>();
    for (const variation of variations) {
        const key = sharedTitleKey(variation.title, format.untitledLabel);
        if ((counts.get(key) ?? 0) < 2) {
            reservedLabels.add(
                renderedLabelKey(unchangedTitle(variation.title, format.untitledLabel)),
            );
        }
    }

    const byPostingOrder = [...variations].sort(comparePostingOrder);
    const nextOrdinal = new Map<string, number>();
    const names = new Map<string, KibitzVariationDisplayName>();

    for (const variation of byPostingOrder) {
        const key = sharedTitleKey(variation.title, format.untitledLabel);
        if ((counts.get(key) ?? 0) < 2) {
            names.set(variation.id, {
                name: unchangedTitle(variation.title, format.untitledLabel),
                ordinal: null,
            });
            continue;
        }

        let ordinal = (nextOrdinal.get(key) ?? 0) + 1;
        let label = format.formatSharedTitle(key, ordinal);
        while (reservedLabels.has(renderedLabelKey(label))) {
            ordinal += 1;
            const nextLabel = format.formatSharedTitle(key, ordinal);
            if (nextLabel === label) {
                break;
            }
            label = nextLabel;
        }
        nextOrdinal.set(key, ordinal);
        reservedLabels.add(renderedLabelKey(label));
        names.set(variation.id, { name: key, ordinal });
    }

    return names;
}

/** Collapsed title, or the untitled label when the title is missing or blank. */
function sharedTitleKey(title: string | undefined, untitledLabel: string): string {
    const collapsed = renderedLabelKey(title ?? "");
    if (collapsed.length === 0) {
        return renderedLabelKey(untitledLabel);
    }
    return collapsed;
}

/** The title the list showed before duplicate names were disambiguated. */
function unchangedTitle(title: string | undefined, untitledLabel: string): string {
    return title || untitledLabel;
}

/**
 * The label as the row shows it. The name uses `white-space: nowrap`, which
 * still collapses a run of whitespace to one space and drops the ends.
 */
function renderedLabelKey(label: string): string {
    return label.trim().replace(/\s+/g, " ");
}

/** Posting order: earlier `created_at` first, then `id` when the times match. */
function comparePostingOrder(
    left: KibitzVariationDisplayNameSource,
    right: KibitzVariationDisplayNameSource,
): number {
    if (left.created_at !== right.created_at) {
        return left.created_at - right.created_at;
    }
    return left.id.localeCompare(right.id);
}
