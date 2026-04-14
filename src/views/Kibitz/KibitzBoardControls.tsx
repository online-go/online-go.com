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
    const [moveNumber, setMoveNumber] = React.useState(() => totalMoves ?? 0);
    const [latestMoveNumber, setLatestMoveNumber] = React.useState(() => totalMoves ?? 0);
    const [moveTreeContainer, setMoveTreeContainer] = React.useState<Resizable | null>(null);
    const previousControllerRef = React.useRef<GobanController | null>(null);

    React.useEffect(() => {
        if (!controller) {
            setMoveNumber(totalMoves ?? 0);
            setLatestMoveNumber(totalMoves ?? 0);
            return;
        }

        const goban = controller.goban as any;
        const sync = () => {
            const currentMoveNumber = goban?.engine?.cur_move?.move_number;
            const officialMoveNumber =
                goban?.engine?.last_official_move?.move_number ?? totalMoves ?? 0;

            setLatestMoveNumber(officialMoveNumber);
            setMoveNumber(
                typeof currentMoveNumber === "number" && currentMoveNumber > 0
                    ? currentMoveNumber
                    : officialMoveNumber,
            );
        };
        const syncEvents = ["cur_move", "last_official_move", "load", "gamedata"];

        sync();
        syncEvents.forEach((eventName) => goban?.on?.(eventName, sync));

        return () => {
            syncEvents.forEach((eventName) => goban?.off?.(eventName, sync));
        };
    }, [controller, totalMoves]);

    React.useEffect(() => {
        if (!showMoveTree) {
            previousControllerRef.current = null;
            return;
        }

        const previousController = previousControllerRef.current;
        const container = moveTreeContainer?.div ?? null;

        if (previousController && previousController !== controller) {
            previousController.setMoveTreeContainer(null);
        }

        if (container) {
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        if (controller && container) {
            controller.setMoveTreeContainer(moveTreeContainer);
        }

        previousControllerRef.current = controller;

        return () => {
            if (controller) {
                controller.setMoveTreeContainer(null);
            }
        };
    }, [controller, moveTreeContainer, showMoveTree]);

    const handleMoveTreeContainerRef = React.useCallback((instance: Resizable | null) => {
        setMoveTreeContainer(instance);
    }, []);

    if (!controller) {
        return null;
    }

    if (variant === "minimal") {
        const canReturnToLive = latestMoveNumber > 0 && moveNumber < latestMoveNumber;

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
                    ref={handleMoveTreeContainerRef}
                />
            ) : null}
        </div>
    );
}
