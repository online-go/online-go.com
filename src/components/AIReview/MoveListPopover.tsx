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
import { game_control } from "@/views/Game/game_control";

interface MoveListPopoverProps {
    moves: number[];
    category: string;
    color: "black" | "white";
    onClose: () => void;
}

export function MoveListPopover({
    moves,
    category,
    color,
    onClose,
}: MoveListPopoverProps): React.ReactElement {
    return (
        <div className="category-move-popover">
            <div className="category-move-header">
                <span>{`${category} Moves (${color})`}</span>
                <button className="close-button" onClick={onClose}>
                    <i className="fa fa-times" />
                </button>
            </div>
            <div className="category-move-content">
                {moves.length > 0 ? (
                    <div className="move-numbers">
                        {moves.map((move) => (
                            <span
                                key={move}
                                className="move-number"
                                onClick={() => {
                                    game_control.emit("gotoMove", move - 1);
                                }}
                            >
                                {move}
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="no-moves">No moves in this category</div>
                )}
            </div>
        </div>
    );
}
