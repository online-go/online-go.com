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

import * as React from "react";
import { pgettext } from "@/lib/translate";
import type { KibitzVariationSummary } from "@/models/kibitz";
import "./KibitzVariationList.css";

interface KibitzVariationListProps {
    variations: KibitzVariationSummary[];
    currentGameId?: number | null;
    onOpenVariation: (variationId: string) => void;
    title?: string;
}

function getUserInitials(username: string | undefined): string {
    const trimmedUsername = (username ?? "").trim();

    if (!trimmedUsername) {
        return "?";
    }

    const parts = trimmedUsername.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function KibitzVariationList({
    variations,
    currentGameId,
    onOpenVariation,
    title,
}: KibitzVariationListProps): React.ReactElement {
    const groupedVariations = React.useMemo(() => {
        const groups = new Map<number, KibitzVariationSummary[]>();
        const order: number[] = [];

        for (const variation of variations) {
            const group = groups.get(variation.game_id);

            if (group) {
                group.push(variation);
            } else {
                groups.set(variation.game_id, [variation]);
                order.push(variation.game_id);
            }
        }

        const currentGroupId =
            currentGameId != null && groups.has(currentGameId) ? currentGameId : null;
        const orderedGroupIds =
            currentGroupId != null
                ? [currentGroupId, ...order.filter((gameId) => gameId !== currentGroupId)]
                : order;

        return orderedGroupIds.map((gameId, index) => ({
            gameId,
            variations: groups.get(gameId) ?? [],
            showDivider: index > 0,
        }));
    }, [currentGameId, variations]);

    return (
        <div className="KibitzVariationList">
            <div className="variation-title">
                {title ??
                    pgettext("Heading for the variations list in kibitz", "Shared Variations")}
            </div>
            <div className="variation-scroll">
                {groupedVariations.length > 0 ? (
                    <div className="variation-items">
                        {groupedVariations.map((group) => (
                            <React.Fragment key={group.gameId}>
                                {group.showDivider ? (
                                    <div className="variation-divider">
                                        {pgettext(
                                            "Divider label for Kibitz variations from a previous game",
                                            "Previous game",
                                        )}
                                    </div>
                                ) : null}
                                {group.variations.map((variation) => (
                                    <button
                                        key={variation.id}
                                        type="button"
                                        className="variation-item"
                                        onClick={() => onOpenVariation(variation.id)}
                                    >
                                        <span className="variation-main">
                                            <span className="variation-name">
                                                {variation.title ||
                                                    pgettext(
                                                        "Fallback title for an untitled variation in kibitz",
                                                        "Untitled variation",
                                                    )}
                                            </span>
                                            <span className="variation-meta-row">
                                                <span
                                                    className="variation-avatar"
                                                    aria-hidden="true"
                                                    title={variation.creator.username}
                                                >
                                                    {getUserInitials(variation.creator.username)}
                                                </span>
                                                <span className="variation-meta">
                                                    {variation.creator.username}
                                                </span>
                                            </span>
                                        </span>
                                        {/* TODO: render a MiniGoban preview here once the
                                            variation's source game data + analysis_moves
                                            are plumbed through to the variation list.
                                            The Johnniedarkoo POC drove this from a mock
                                            mock_game_data field; the live equivalent
                                            needs the actual game state + variation moves. */}
                                    </button>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                ) : (
                    <div className="variation-empty">
                        {pgettext(
                            "Empty state for the variations list in kibitz",
                            "No active variations yet.",
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
