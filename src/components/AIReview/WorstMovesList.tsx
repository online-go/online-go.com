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
import { AIReviewWorstMoveEntry, JGOFNumericPlayerColor } from "goban";
import { interpolate, pgettext } from "@/lib/translate";
import { useGobanControllerOrNull } from "@/views/Game/goban_context";

interface WorstMovesListProps {
    moves: AIReviewWorstMoveEntry[];
    onMoveClick: (moveNumber: number) => void;
    maxMovesShown: number;
}

export function WorstMovesList({
    moves,
    onMoveClick,
    maxMovesShown,
}: WorstMovesListProps): React.ReactElement | null {
    const gobanController = useGobanControllerOrNull();
    const goban = gobanController?.goban;

    // Don't render if we have no moves
    if (!moves || moves.length === 0) {
        return null;
    }

    // We need goban to display pretty coordinates, but we can still show the structure
    if (!goban?.engine) {
        return null; // Can't display coordinates without engine
    }

    const more_ct = Math.max(0, moves.length - maxMovesShown);

    return (
        <div className="worst-move-list-container">
            <div className="move-list">
                {moves.slice(0, maxMovesShown).map((de, idx) => {
                    const pretty_coords = goban.engine!.prettyCoordinates(de.move.x, de.move.y);
                    return (
                        <span
                            key={`${idx}-${de.move_number}`}
                            className={
                                de.player === JGOFNumericPlayerColor.BLACK
                                    ? "move black-background"
                                    : "move white-background"
                            }
                            onClick={() => onMoveClick(de.move_number - 1)}
                        >
                            {pretty_coords}
                        </span>
                    );
                })}
                {more_ct > 0 && (
                    <span>
                        {interpolate(
                            pgettext(
                                "Number of big mistake moves not listed",
                                "+ {{more_ct}} more",
                            ),
                            { more_ct },
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}
