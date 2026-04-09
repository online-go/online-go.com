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
import { Resizable } from "@/components/Resizable";
import { GobanController } from "@/lib/GobanController";
import { interpolate, pgettext } from "@/lib/translate";
import "./KibitzBoardControls.css";

interface KibitzBoardControlsProps {
    controller: GobanController | null;
    variant: "minimal" | "full";
    showMoveTree?: boolean;
    totalMoves?: number;
}

export function KibitzBoardControls({
    controller,
    variant,
    showMoveTree = false,
    totalMoves,
}: KibitzBoardControlsProps): React.ReactElement | null {
    const [moveNumber, setMoveNumber] = React.useState(0);

    React.useEffect(() => {
        if (!controller) {
            setMoveNumber(0);
            return;
        }

        const goban = controller.goban as any;
        const sync = () => {
            setMoveNumber(goban?.engine?.cur_move?.move_number ?? 0);
        };

        sync();
        goban?.on?.("cur_move", sync);

        return () => {
            goban?.off?.("cur_move", sync);
        };
    }, [controller]);

    const setMoveTreeContainer = React.useCallback(
        (instance: Resizable | null) => {
            if (controller && instance) {
                controller.setMoveTreeContainer(instance);
            }
        },
        [controller],
    );

    if (!controller) {
        return null;
    }

    if (variant === "minimal") {
        const canReturnToLive =
            typeof totalMoves === "number" && totalMoves > 0 && moveNumber < totalMoves;

        return (
            <div className="KibitzBoardControls minimal-row">
                <div className="minimal-row-core">
                    <button
                        type="button"
                        className="kibitz-move-control"
                        onClick={controller.previousMove}
                        aria-label={pgettext(
                            "Aria label for the main kibitz board previous-move button",
                            "Previous move",
                        )}
                    >
                        <i className="fa fa-step-backward" />
                    </button>
                    <span className="move-number">
                        {interpolate(
                            pgettext("Move number label in kibitz board controls", "Move {{n}}"),
                            { n: moveNumber },
                        )}
                    </span>
                    <button
                        type="button"
                        className="kibitz-move-control"
                        onClick={controller.nextMove}
                        aria-label={pgettext(
                            "Aria label for the main kibitz board next-move button",
                            "Next move",
                        )}
                    >
                        <i className="fa fa-step-forward" />
                    </button>
                </div>
                {canReturnToLive ? (
                    <button
                        type="button"
                        className="kibitz-return-live-button"
                        onClick={controller.gotoLastMove}
                    >
                        {pgettext(
                            "Button label for returning the kibitz main board to the live move",
                            "Back to live",
                        )}
                    </button>
                ) : null}
            </div>
        );
    }

    return (
        <div className="KibitzBoardControls full">
            <div className="control-row">
                <button
                    type="button"
                    className="kibitz-move-control"
                    onClick={controller.gotoFirstMove}
                    aria-label={pgettext(
                        "Aria label for the secondary kibitz board first-move button",
                        "First move",
                    )}
                >
                    <i className="fa fa-fast-backward" />
                </button>
                <button
                    type="button"
                    className="kibitz-move-control"
                    onClick={controller.previousMove}
                    aria-label={pgettext(
                        "Aria label for the secondary kibitz board previous-move button",
                        "Previous move",
                    )}
                >
                    <i className="fa fa-step-backward" />
                </button>
                <span className="move-number">
                    {interpolate(
                        pgettext("Move number label in kibitz board controls", "Move {{n}}"),
                        { n: moveNumber },
                    )}
                </span>
                <button
                    type="button"
                    className="kibitz-move-control"
                    onClick={controller.nextMove}
                    aria-label={pgettext(
                        "Aria label for the secondary kibitz board next-move button",
                        "Next move",
                    )}
                >
                    <i className="fa fa-step-forward" />
                </button>
                <button
                    type="button"
                    className="kibitz-move-control"
                    onClick={controller.gotoLastMove}
                    aria-label={pgettext(
                        "Aria label for the secondary kibitz board last-move button",
                        "Last move",
                    )}
                >
                    <i className="fa fa-fast-forward" />
                </button>
            </div>
            {showMoveTree ? (
                <Resizable
                    id="kibitz-secondary-move-tree-container"
                    className="kibitz-move-tree-container"
                    ref={setMoveTreeContainer}
                />
            ) : null}
        </div>
    );
}
