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
import { GobanController } from "@/lib/GobanController";
import { Resizable } from "@/components/Resizable";
import { GobanAnalyzeButtonBar } from "@/components/GobanAnalyzeButtonBar/GobanAnalyzeButtonBar";
import { KibitzNodeText } from "./KibitzNodeText";
import { useKibitzHelpTarget } from "./HelpFlows/useKibitzHelpTarget";
import { KIBITZ_HELP_TARGETS } from "./HelpFlows/KibitzHelpTargets";
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import "./KibitzVariationPanel.css";

export interface KibitzVariationPanelProps {
    controller: GobanController;
    mode: "draft" | "variation";
    onPost: (controller: GobanController) => void;
    onDiscard: () => void;
    /** Starts a new draft from the posted variation being viewed. */
    onBranch?: () => void;
}

/**
 * Sidebar controls for the board in the center when it shows a variation.
 * A draft gets the analysis tools and the composer; a posted variation only
 * gets the move tree and its node text.
 */
export function KibitzVariationPanel({
    controller,
    mode,
    onPost,
    onDiscard,
    onBranch,
}: KibitzVariationPanelProps): React.ReactElement {
    const branchActionsTarget = useKibitzHelpTarget(
        mode === "variation" ? KIBITZ_HELP_TARGETS.desktopVariationActions : null,
    );
    const setMoveTree = React.useCallback(
        (resizable: Resizable | null) => controller.setMoveTreeContainer(resizable),
        [controller],
    );

    return (
        <div className={`KibitzVariationPanel ${mode}`}>
            {mode === "draft" && (
                <GobanAnalyzeButtonBar
                    controller={controller}
                    showBackToGame={false}
                    showConditionalPlannerButton={false}
                />
            )}
            <Resizable
                key={controller.goban.game_id ?? "variation"}
                id="kibitz-move-tree-container"
                className="KibitzVariationPanel-moveTree"
                ref={setMoveTree}
            />
            <KibitzNodeText controller={controller} editable={mode === "draft"} />
            {mode === "variation" && onBranch && (
                <div className="KibitzVariationPanel-actions" ref={branchActionsTarget?.ref}>
                    <button type="button" onClick={onBranch}>
                        {pgettext(
                            "Button that starts a new Kibitz variation draft from the posted variation being viewed",
                            "New variation from here",
                        )}
                    </button>
                </div>
            )}
            {mode === "draft" && (
                <div className="KibitzVariationPanel-actions">
                    <KibitzVariationComposer controller={controller} onSubmit={onPost} />
                    <button type="button" className="reject" onClick={onDiscard}>
                        {pgettext("Button that throws away a Kibitz variation draft", "Discard")}
                    </button>
                </div>
            )}
        </div>
    );
}
