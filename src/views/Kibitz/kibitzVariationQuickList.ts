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

import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";

export function getVisiblePostedVariations(
    variations: KibitzVariationSummary[],
    visibleVariationIds: string[],
): KibitzVariationSummary[] {
    const visibleVariationIdSet = new Set(visibleVariationIds);
    return variations.filter((variation) => visibleVariationIdSet.has(variation.id));
}

export function formatVariationBranchLabel(variation: KibitzVariationSummary): string {
    if (typeof variation.analysis_from === "number" && Number.isFinite(variation.analysis_from)) {
        return `M${variation.analysis_from}`;
    }

    return "M?";
}

export function formatVariationLengthLabel(variation: KibitzVariationSummary): string {
    if (typeof variation.move_count === "number" && Number.isFinite(variation.move_count)) {
        return `+${variation.move_count}`;
    }

    return "";
}

export function formatVariationGameSummary(
    game: KibitzWatchedGame | null | undefined,
    gameId: number,
): string {
    const title = game?.title?.trim();
    const gameLabel = title?.length
        ? title
        : interpolate(
              pgettext("Fallback game label for a Kibitz variation divider", "Game #{{game_id}}"),
              {
                  game_id: gameId,
              },
          );

    if (!game) {
        return gameLabel;
    }

    return interpolate(
        pgettext(
            "Summary label for a Kibitz variation divider with game title and matchup",
            "{{game}} - {{black}} vs. {{white}}",
        ),
        {
            game: gameLabel,
            black: game.black.username,
            white: game.white.username,
        },
    );
}
