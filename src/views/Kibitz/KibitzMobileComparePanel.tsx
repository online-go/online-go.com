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
import { GobanController } from "@/lib/GobanController";
import { alert } from "@/lib/swal_config";
import { interpolate, pgettext } from "@/lib/translate";
import type {
    KibitzProposal,
    KibitzRoomSummary,
    KibitzSecondaryPaneState,
    KibitzVariationSummary,
} from "@/models/kibitz";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import { KibitzProposalQueue } from "./KibitzProposalQueue";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import { KibitzVariationList } from "./KibitzVariationList";
import { KibitzNodeText } from "./KibitzNodeText";
import { KibitzMoveTreeStrip } from "./KibitzMoveTreeStrip";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import "./KibitzMobileComparePanel.css";

interface KibitzMobileComparePanelProps {
    controller: GobanController | null;
    room: KibitzRoomSummary;
    variations: KibitzVariationSummary[];
    queuedRoomProposals: KibitzProposal[];
    visibleVariationIds: string[];
    variationColorIndexes: Record<string, number>;
    blockedVariationFlashId: string | null;
    secondaryPane: KibitzSecondaryPaneState;
    selectedVariation: KibitzVariationSummary | null;
    isDraftingVariation: boolean;
    variationFocusRequestId: number;
    onOpenVariation: (variationId: string, focusVariation?: boolean) => void;
    onToggleVariation: (variationId: string) => void;
    onPostVariation: (controller: GobanController, sourceGameId: number | undefined) => void;
    onDiscardDraft?: () => void;
}

function splitNodeText(text: string): { summary: string; body: string | null } {
    const normalized = text.replace(/\r\n/g, "\n");
    const lines = normalized.split("\n");
    const summary = lines[0] ?? "";
    const body = lines.slice(1).join("\n").trim();

    return {
        summary,
        body: body.length > 0 ? body : null,
    };
}

export function KibitzMobileComparePanel({
    controller,
    room,
    variations,
    queuedRoomProposals,
    visibleVariationIds,
    variationColorIndexes,
    blockedVariationFlashId,
    secondaryPane,
    selectedVariation,
    isDraftingVariation,
    variationFocusRequestId,
    onOpenVariation,
    onToggleVariation,
    onPostVariation,
    onDiscardDraft,
}: KibitzMobileComparePanelProps): React.ReactElement {
    const variationsPanelTarget = useKibitzHelpTarget(KIBITZ_HELP_TARGETS.mobileVariationsPanel);
    const [nodeText, setNodeText] = React.useState(controller?.goban.engine.cur_move?.text ?? "");

    const panelModeKey = React.useMemo(() => {
        if (isDraftingVariation) {
            return `draft-${secondaryPane.variation_draft_base_id ?? secondaryPane.preview_game_id ?? ""}`;
        }

        if (selectedVariation) {
            return `variation-${selectedVariation.id}`;
        }

        if (secondaryPane.preview_game_id != null) {
            return `preview-${secondaryPane.preview_game_id}`;
        }

        return "empty";
    }, [
        isDraftingVariation,
        secondaryPane.preview_game_id,
        secondaryPane.variation_draft_base_id,
        selectedVariation,
    ]);

    React.useEffect(() => {
        if (!controller) {
            setNodeText("");
            return;
        }

        const syncNodeText = () => {
            setNodeText(controller.goban.engine.cur_move?.text ?? "");
        };

        controller.goban.on("load", syncNodeText);
        controller.goban.on("cur_move", syncNodeText);
        syncNodeText();

        return () => {
            controller.goban.off("load", syncNodeText);
            controller.goban.off("cur_move", syncNodeText);
        };
    }, [controller]);

    const handleDiscardDraft = React.useCallback(() => {
        void alert
            .fire({
                customClass: {
                    confirmButton: "reject",
                    cancelButton: "",
                },
                text: pgettext(
                    "Confirmation text for discarding a Kibitz variation draft",
                    "Discard this draft? Any variation that isn't shared will be lost.",
                ),
                confirmButtonText: pgettext(
                    "Confirmation button for discarding a Kibitz variation draft",
                    "Discard draft",
                ),
                cancelButtonText: pgettext(
                    "Cancel button for discarding a Kibitz variation draft",
                    "Cancel",
                ),
                showCancelButton: true,
                focusConfirm: true,
            })
            .then(({ value: confirmed }) => {
                if (confirmed) {
                    onDiscardDraft?.();
                }
            });
    }, [onDiscardDraft]);

    const hasNotes = !isDraftingVariation && nodeText.trim().length > 0;
    const nodeTextParts = React.useMemo(() => splitNodeText(nodeText), [nodeText]);
    const hasFoldoutBody = nodeTextParts.body != null;

    return (
        <div className="KibitzMobileComparePanel" ref={variationsPanelTarget?.ref}>
            <KibitzMoveTreeStrip controller={controller} layoutKey={panelModeKey} />
            {isDraftingVariation ? (
                <div className="KibitzMobileComparePanel-tools">
                    {controller ? (
                        <>
                            {secondaryPane.variation_source_game_id != null ? (
                                <div className="KibitzMobileComparePanel-toolRow KibitzMobileComparePanel-analyzeRow">
                                    <GobanAnalyzeButtonBar
                                        controller={controller}
                                        showBackToGame={false}
                                        showConditionalPlannerButton={false}
                                    />
                                </div>
                            ) : null}
                            {secondaryPane.variation_source_game_id != null ? (
                                <div className="KibitzMobileComparePanel-toolRow KibitzMobileComparePanel-composeRow">
                                    <KibitzVariationComposer
                                        controller={controller}
                                        showSubmitButton={false}
                                        onSubmit={(variationController) =>
                                            onPostVariation(
                                                variationController,
                                                secondaryPane.variation_source_game_id,
                                            )
                                        }
                                    />
                                </div>
                            ) : null}
                            <div className="KibitzMobileComparePanel-toolRow KibitzMobileComparePanel-nodeRow">
                                <KibitzNodeText controller={controller} editable={true} />
                            </div>
                        </>
                    ) : null}
                </div>
            ) : null}
            {!isDraftingVariation && hasNotes ? (
                hasFoldoutBody ? (
                    <details className="KibitzMobileComparePanel-notes">
                        <summary>
                            <span
                                className="KibitzMobileComparePanel-notesTriangle"
                                aria-hidden="true"
                            />
                            <span className="KibitzMobileComparePanel-notesSummaryText">
                                {nodeTextParts.summary}
                            </span>
                        </summary>
                        <div className="KibitzMobileComparePanel-notesBody">
                            {nodeTextParts.body}
                        </div>
                    </details>
                ) : (
                    <div className="KibitzMobileComparePanel-notes KibitzMobileComparePanel-notesSingle">
                        <span className="KibitzMobileComparePanel-notesSummaryText">
                            {nodeTextParts.summary}
                        </span>
                    </div>
                )
            ) : null}
            {isDraftingVariation ? (
                <div className="KibitzMobileComparePanel-actions">
                    <button
                        type="button"
                        className="KibitzMobileComparePanel-actionButton primary"
                        onClick={() => {
                            if (controller) {
                                onPostVariation(controller, secondaryPane.variation_source_game_id);
                            }
                        }}
                        disabled={!controller}
                    >
                        {pgettext(
                            "Button label for posting a Kibitz variation draft",
                            "Post variation",
                        )}
                    </button>
                    {onDiscardDraft ? (
                        <button
                            type="button"
                            className="KibitzMobileComparePanel-actionButton"
                            onClick={handleDiscardDraft}
                        >
                            {pgettext(
                                "Button label for discarding a Kibitz variation draft",
                                "Discard draft",
                            )}
                        </button>
                    ) : null}
                </div>
            ) : null}
            <div className="KibitzMobileComparePanel-sharedSection">
                <div className="KibitzMobileComparePanel-sharedHeader">
                    <span>
                        {pgettext(
                            "Heading for the shared variations section in the mobile kibitz compare panel",
                            "Shared variations",
                        )}
                    </span>
                    <span className="KibitzMobileComparePanel-sharedHeaderMeta">
                        {interpolate(
                            pgettext(
                                "Count label for shared variations in the mobile kibitz compare panel",
                                "{{count}} total",
                            ),
                            { count: variations.length },
                        )}
                    </span>
                </div>
                <div className="KibitzMobileComparePanel-sharedBody">
                    {variations.length > 0 ? (
                        <KibitzVariationList
                            variations={variations}
                            currentGameId={room.current_game?.game_id}
                            visibleVariationIds={visibleVariationIds}
                            selectedVariationId={secondaryPane.variation_id}
                            variationFocusRequestId={variationFocusRequestId}
                            variationColorIndexes={variationColorIndexes}
                            blockedVariationFlashId={blockedVariationFlashId}
                            onRecallVariation={onOpenVariation}
                            onToggleVariation={onToggleVariation}
                            title=""
                        />
                    ) : (
                        <div className="KibitzMobileComparePanel-empty">
                            {pgettext(
                                "Empty state for the mobile kibitz shared variations section",
                                "No active variations yet.",
                            )}
                        </div>
                    )}
                    {queuedRoomProposals.length > 0 ? (
                        <KibitzProposalQueue proposals={queuedRoomProposals} />
                    ) : null}
                </div>
            </div>
        </div>
    );
}
