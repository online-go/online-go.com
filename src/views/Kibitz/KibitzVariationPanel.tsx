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
import { KibitzVariationComposer } from "./KibitzVariationComposer";
import { KibitzVariationSwatch } from "./KibitzVariationSwatch";
import "./KibitzVariationPanel.css";

interface KibitzVariationPanelProps {
    controller: GobanController;
    mode: "draft" | "variation";
    onPost: (controller: GobanController) => void;
    /** Leaves the variation (a draft is thrown away) and shows the live game. */
    onBackToGame: () => void;
    /** Starts a new draft from the posted variation being viewed. */
    onBranch?: () => void;
    /** Move-tree line colour of the variation being viewed, or null/undefined
     *  when it is not currently drawn on the board. */
    colorIndex?: number | null;
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
    onBackToGame,
    onBranch,
    colorIndex,
}: KibitzVariationPanelProps): React.ReactElement {
    const [moveTreeElement, setMoveTreeElement] = React.useState<HTMLDivElement | null>(null);
    const setMoveTree = React.useCallback(
        (resizable: Resizable | null) => {
            controller.setMoveTreeContainer(resizable);
            setMoveTreeElement(resizable?.div ?? null);
        },
        [controller],
    );

    // A variation runs to the right, so its tree overflows the box sideways
    // long before it overflows downwards — and a mouse wheel has no sideways
    // axis, which leaves the scrollbar as the only way along it. Send the
    // wheel to whichever axis still has somewhere to go.
    React.useEffect(() => {
        const container = moveTreeElement;
        if (!container) {
            return;
        }
        const onWheel = (event: WheelEvent) => {
            if (event.deltaY === 0 || event.deltaX !== 0) {
                return;
            }
            if (container.scrollHeight > container.clientHeight) {
                return;
            }
            if (container.scrollWidth <= container.clientWidth) {
                return;
            }
            container.scrollLeft += event.deltaY;
            event.preventDefault();
        };
        container.addEventListener("wheel", onWheel, { passive: false });
        return () => container.removeEventListener("wheel", onWheel);
    }, [moveTreeElement]);

    return (
        <div className={`KibitzVariationPanel ${mode}`}>
            <div className="KibitzVariationPanel-header">
                <span className="KibitzVariationPanel-title Kibitz-section-header">
                    <KibitzVariationSwatch colorIndex={colorIndex ?? null} />
                    {mode === "draft"
                        ? pgettext(
                              "Heading of the Kibitz sidebar panel while drafting a variation",
                              "New variation",
                          )
                        : pgettext(
                              "Heading of the Kibitz sidebar panel while viewing a posted variation",
                              "Variation",
                          )}
                </span>
            </div>
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
            {mode === "variation" && (
                <div className="KibitzVariationPanel-actions">
                    <button
                        type="button"
                        className="KibitzVariationPanel-back xs"
                        onClick={onBackToGame}
                    >
                        <i className="fa fa-arrow-left" />{" "}
                        {pgettext(
                            "Button that closes a Kibitz variation and shows the live game",
                            "Back to game",
                        )}
                    </button>
                    {onBranch && (
                        <button type="button" className="primary sm" onClick={onBranch}>
                            {pgettext(
                                "Button that starts a new Kibitz variation draft from the posted variation being viewed",
                                "New variation from here",
                            )}
                        </button>
                    )}
                </div>
            )}
            {mode === "draft" && (
                <div className="KibitzVariationPanel-actions">
                    <button
                        type="button"
                        className="KibitzVariationPanel-back xs"
                        onClick={onBackToGame}
                    >
                        {pgettext("Button that abandons a Kibitz variation draft", "Cancel")}
                    </button>
                    <KibitzVariationComposer controller={controller} onSubmit={onPost} />
                </div>
            )}
        </div>
    );
}
