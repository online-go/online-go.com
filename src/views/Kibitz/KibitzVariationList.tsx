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

import * as React from "react";
import { interpolate, pgettext } from "@/lib/translate";
import type { KibitzVariationSummary, KibitzWatchedGame } from "@/models/kibitz";
import { Player } from "@/components/Player";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import { formatVariationBranchLabel, formatVariationLengthLabel } from "./kibitzVariationQuickList";
import "./KibitzVariationList.css";

interface KibitzVariationListProps {
    variations: KibitzVariationSummary[];
    currentGameId?: number | null;
    gameById?: ReadonlyMap<number, KibitzWatchedGame>;
    selectedVariationId?: string | null;
    variationFocusRequestId?: number;
    variationColorIndexes?: Record<string, number>;
    blockedVariationFlashId?: string | null;
    onRecallVariation: (variationId: string) => void;
    onHideVariation?: (variationId: string) => void;
    /** Starts a new draft; shown as "+ Variation" at the bottom. */
    onCreateVariation?: () => void;
    /** Removes every variation from the board; shown as "Clear all" at the bottom. */
    onClearAll?: () => void;
    helpTargetId?: (typeof KIBITZ_HELP_TARGETS)[keyof typeof KIBITZ_HELP_TARGETS];
}

export function KibitzVariationList({
    variations,
    currentGameId,
    gameById,
    selectedVariationId = null,
    variationFocusRequestId = 0,
    blockedVariationFlashId = null,
    onRecallVariation,
    onHideVariation,
    onCreateVariation,
    onClearAll,
    helpTargetId,
}: KibitzVariationListProps): React.ReactElement {
    const variationListTarget = useKibitzHelpTarget(helpTargetId);
    const selectedVariationElementRef = React.useRef<HTMLDivElement | null>(null);
    const previousFocusRequestIdRef = React.useRef<number>(variationFocusRequestId);
    const groupedVariations = React.useMemo(() => {
        const groups = new Map<number, KibitzVariationSummary[]>();

        for (const variation of variations) {
            const group = groups.get(variation.game_id);

            if (group) {
                group.push(variation);
            } else {
                groups.set(variation.game_id, [variation]);
            }
        }

        const orderedGroupIds = [...groups.keys()].sort((left, right) => {
            if (left === right) {
                return 0;
            }

            if (currentGameId != null) {
                if (left === currentGameId) {
                    return -1;
                }

                if (right === currentGameId) {
                    return 1;
                }
            }

            return left - right;
        });

        return orderedGroupIds.map((gameId, index) => ({
            gameId,
            variations: groups.get(gameId) ?? [],
            showDivider: index > 0,
        }));
    }, [currentGameId, variations]);
    const hasCurrentGameGroup = groupedVariations.some((group) => group.gameId === currentGameId);
    const hasPreviousGameGroups = groupedVariations.some((group) => group.gameId !== currentGameId);

    React.useEffect(() => {
        if (previousFocusRequestIdRef.current === variationFocusRequestId) {
            return;
        }

        previousFocusRequestIdRef.current = variationFocusRequestId;

        if (!selectedVariationId) {
            return;
        }

        selectedVariationElementRef.current?.scrollIntoView({
            block: "center",
            behavior: "smooth",
        });
    }, [selectedVariationId, variationFocusRequestId]);

    return (
        <div className="KibitzVariationList" ref={variationListTarget?.ref}>
            <div className="variation-scroll">
                {groupedVariations.length > 0 ? (
                    <div className="variation-items">
                        {currentGameId != null && hasCurrentGameGroup && hasPreviousGameGroups ? (
                            <div className="variation-divider variation-divider-current">
                                {pgettext(
                                    "Divider label for the current game in Kibitz variations",
                                    "Current Game",
                                )}
                            </div>
                        ) : null}
                        {groupedVariations.map((group) => {
                            const dividerGame = gameById?.get(group.gameId) ?? null;
                            const isCurrentGameGroup = group.gameId === currentGameId;

                            return (
                                <React.Fragment key={group.gameId}>
                                    {!isCurrentGameGroup ? (
                                        <div className="variation-divider">
                                            {dividerGame ? (
                                                <div className="variation-divider-grid">
                                                    <div className="variation-divider-titleRowMain">
                                                        <a
                                                            className="variation-divider-game-link"
                                                            href={`/game/${group.gameId}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={pgettext(
                                                                "Aria label for opening a Kibitz variation source game",
                                                                "Open original game",
                                                            )}
                                                        >
                                                            {interpolate(
                                                                pgettext(
                                                                    "Divider label for Kibitz variations from a previous game",
                                                                    "Previous game: {{game}}",
                                                                ),
                                                                {
                                                                    game:
                                                                        dividerGame.title ||
                                                                        interpolate(
                                                                            pgettext(
                                                                                "Fallback game label for a Kibitz variation divider",
                                                                                "Game #{{game_id}}",
                                                                            ),
                                                                            {
                                                                                game_id:
                                                                                    group.gameId,
                                                                            },
                                                                        ),
                                                                },
                                                            )}
                                                        </a>
                                                    </div>
                                                    <div className="variation-divider-players">
                                                        <span className="variation-divider-player">
                                                            <Player
                                                                user={dividerGame.black}
                                                                icon
                                                                iconSize={16}
                                                                flag
                                                                rank
                                                                nodetails
                                                                noextracontrols
                                                                tabIndex={-1}
                                                            />
                                                        </span>
                                                        <span
                                                            className="variation-divider-vs"
                                                            aria-hidden="true"
                                                        >
                                                            {pgettext(
                                                                "Versus label shown in a Kibitz variation divider",
                                                                "vs",
                                                            )}
                                                        </span>
                                                        <span className="variation-divider-player">
                                                            <Player
                                                                user={dividerGame.white}
                                                                icon
                                                                iconSize={16}
                                                                flag
                                                                rank
                                                                nodetails
                                                                noextracontrols
                                                                tabIndex={-1}
                                                            />
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                interpolate(
                                                    pgettext(
                                                        "Divider label for Kibitz variations from a previous game",
                                                        "Previous game: {{game}}",
                                                    ),
                                                    {
                                                        game: interpolate(
                                                            pgettext(
                                                                "Fallback game label for a Kibitz variation divider",
                                                                "Game #{{game_id}}",
                                                            ),
                                                            {
                                                                game_id: group.gameId,
                                                            },
                                                        ),
                                                    },
                                                )
                                            )}
                                        </div>
                                    ) : null}
                                    {group.variations.map((variation) => {
                                        const isSelected = selectedVariationId === variation.id;
                                        const isBlockedFlash =
                                            blockedVariationFlashId === variation.id;
                                        const lengthLabel = formatVariationLengthLabel(variation);
                                        const branchLabel = formatVariationBranchLabel(variation);

                                        return (
                                            <div
                                                key={variation.id}
                                                ref={
                                                    isSelected
                                                        ? selectedVariationElementRef
                                                        : undefined
                                                }
                                                className={
                                                    "variation-item" +
                                                    (isSelected ? " selected" : "") +
                                                    (isBlockedFlash ? " limit-flash" : "")
                                                }
                                            >
                                                <button
                                                    type="button"
                                                    className={
                                                        "variation-recall" +
                                                        (isBlockedFlash ? " limit-flash" : "")
                                                    }
                                                    onClick={() => onRecallVariation(variation.id)}
                                                >
                                                    <span className="variation-main">
                                                        <span className="variation-name">
                                                            {interpolate(
                                                                pgettext(
                                                                    "Posted analysis variation label",
                                                                    "Variation: {{name}}",
                                                                ),
                                                                {
                                                                    name:
                                                                        variation.title ||
                                                                        pgettext(
                                                                            "Fallback title for an untitled variation in kibitz",
                                                                            "Untitled variation",
                                                                        ),
                                                                },
                                                            )}
                                                        </span>
                                                        <span className="variation-meta-row">
                                                            <span className="variation-meta-labels">
                                                                <span className="variation-branch">
                                                                    {branchLabel}
                                                                </span>
                                                                {lengthLabel ? (
                                                                    <span className="variation-length">
                                                                        {lengthLabel}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                            <span className="variation-meta-spacer" />
                                                            <span className="variation-author-row">
                                                                <Player
                                                                    user={variation.creator}
                                                                    disableCacheUpdate
                                                                />
                                                            </span>
                                                        </span>
                                                    </span>
                                                </button>
                                                {onHideVariation ? (
                                                    <button
                                                        type="button"
                                                        className={
                                                            "variation-toggle" +
                                                            (isBlockedFlash ? " limit-flash" : "")
                                                        }
                                                        aria-label={pgettext(
                                                            "Tooltip for removing a Kibitz variation from the board",
                                                            "Remove from board",
                                                        )}
                                                        title={pgettext(
                                                            "Tooltip for removing a Kibitz variation from the board",
                                                            "Remove from board",
                                                        )}
                                                        onClick={() =>
                                                            onHideVariation(variation.id)
                                                        }
                                                    >
                                                        <i
                                                            className="fa fa-times"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })}
                    </div>
                ) : (
                    <div className="variation-empty">
                        {pgettext(
                            "Empty state for the variations list in kibitz",
                            "No active variations. Open one from chat.",
                        )}
                    </div>
                )}
            </div>
            {onCreateVariation || (onClearAll && variations.length > 0) ? (
                <div className="KibitzVariationList-footer">
                    {onCreateVariation ? (
                        <button
                            type="button"
                            className="KibitzVariationList-footerAction"
                            onClick={onCreateVariation}
                        >
                            <i className="fa fa-plus" aria-hidden="true" />{" "}
                            {pgettext(
                                "Row at the bottom of the Kibitz variation list that starts a new variation",
                                "Variation",
                            )}
                        </button>
                    ) : null}
                    {onClearAll && variations.length > 0 ? (
                        <button
                            type="button"
                            className="KibitzVariationList-footerAction KibitzVariationList-clearAll"
                            onClick={onClearAll}
                        >
                            {pgettext(
                                "Row at the bottom of the Kibitz variation list that removes every variation from the board",
                                "Clear all",
                            )}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}
