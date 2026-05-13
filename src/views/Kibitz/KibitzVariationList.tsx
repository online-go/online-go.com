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
import { getKibitzVariationColor } from "./kibitzVariationTree";
import { KibitzUserAvatar } from "./KibitzUserAvatar";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import "./KibitzVariationList.css";

interface KibitzVariationListProps {
    variations: KibitzVariationSummary[];
    currentGameId?: number | null;
    visibleVariationIds?: string[];
    selectedVariationId?: string | null;
    variationFocusRequestId?: number;
    variationColorIndexes?: Record<string, number>;
    blockedVariationFlashId?: string | null;
    onRecallVariation: (variationId: string) => void;
    onToggleVariation?: (variationId: string) => void;
    title?: string;
    helpTargetId?: (typeof KIBITZ_HELP_TARGETS)[keyof typeof KIBITZ_HELP_TARGETS];
}

export function KibitzVariationList({
    variations,
    currentGameId,
    visibleVariationIds = [],
    selectedVariationId = null,
    variationFocusRequestId = 0,
    variationColorIndexes = {},
    blockedVariationFlashId = null,
    onRecallVariation,
    onToggleVariation,
    title,
    helpTargetId,
}: KibitzVariationListProps): React.ReactElement {
    const variationListTarget = useKibitzHelpTarget(helpTargetId);
    const selectedVariationElementRef = React.useRef<HTMLDivElement | null>(null);
    const previousFocusRequestIdRef = React.useRef<number>(variationFocusRequestId);
    const visibleVariationIdSet = React.useMemo(
        () => new Set(visibleVariationIds),
        [visibleVariationIds],
    );
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
            {title === "" ? null : (
                <div className="variation-title">
                    {title ??
                        pgettext("Heading for the variations list in kibitz", "Shared Variations")}
                </div>
            )}
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
                                {group.variations.map((variation) => {
                                    const isVisible = visibleVariationIdSet.has(variation.id);
                                    const isSelected = selectedVariationId === variation.id;
                                    const isBlockedFlash = blockedVariationFlashId === variation.id;
                                    const toggleLabel = isVisible
                                        ? pgettext(
                                              "Tooltip for hiding a Kibitz variation in the tree",
                                              "Hide variation",
                                          )
                                        : pgettext(
                                              "Tooltip for showing a Kibitz variation in the tree",
                                              "Show variation",
                                          );

                                    return (
                                        <div
                                            key={variation.id}
                                            ref={
                                                isSelected ? selectedVariationElementRef : undefined
                                            }
                                            className={
                                                "variation-item" +
                                                (isSelected ? " selected" : "") +
                                                (isVisible ? " visible" : "") +
                                                (isBlockedFlash ? " limit-flash" : "")
                                            }
                                            style={
                                                isSelected
                                                    ? ({
                                                          "--variation-selected-color":
                                                              getKibitzVariationColor(
                                                                  variationColorIndexes[
                                                                      variation.id
                                                                  ] ?? 0,
                                                              ),
                                                      } as React.CSSProperties)
                                                    : undefined
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
                                                <span
                                                    className="variation-color-chip"
                                                    style={
                                                        isVisible || isSelected
                                                            ? {
                                                                  backgroundColor:
                                                                      getKibitzVariationColor(
                                                                          variationColorIndexes[
                                                                              variation.id
                                                                          ] ?? 0,
                                                                      ),
                                                              }
                                                            : undefined
                                                    }
                                                    aria-hidden="true"
                                                />
                                                <span className="variation-main">
                                                    <span className="variation-name">
                                                        {variation.title ||
                                                            pgettext(
                                                                "Fallback title for an untitled variation in kibitz",
                                                                "Untitled variation",
                                                            )}
                                                    </span>
                                                    <span className="variation-meta-row">
                                                        <KibitzUserAvatar
                                                            user={variation.creator}
                                                            size={16}
                                                            className="variation-avatar"
                                                            iconClassName="variation-avatar-image"
                                                        />
                                                        <span className="variation-meta">
                                                            {variation.creator.username}
                                                        </span>
                                                    </span>
                                                </span>
                                            </button>
                                            {onToggleVariation ? (
                                                <button
                                                    type="button"
                                                    className={
                                                        "variation-toggle" +
                                                        (isBlockedFlash ? " limit-flash" : "")
                                                    }
                                                    aria-pressed={isVisible}
                                                    aria-label={toggleLabel}
                                                    title={toggleLabel}
                                                    onClick={() => onToggleVariation(variation.id)}
                                                >
                                                    <i
                                                        className={
                                                            "fa " +
                                                            (isVisible ? "fa-eye" : "fa-eye-slash")
                                                        }
                                                        aria-hidden="true"
                                                    />
                                                </button>
                                            ) : null}
                                        </div>
                                    );
                                })}
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
