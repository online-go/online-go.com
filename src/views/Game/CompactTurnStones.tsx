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
import { interpolate, pgettext } from "@/lib/translate";
import { rulesText } from "@/lib/misc";
import "./CompactTurnStones.css";

interface CompactTurnStonesProps {
    /** Colour whose stone is drawn over the other one. Null draws them
     *  level, for when no side is waiting to play. */
    to_move: "black" | "white" | null;
    /** Move number shown under the stones. Negative hides the line. */
    move_number: number;
    /** Rule set shown above the stones. Omitted or unknown hides the line. */
    rules?: string;
}

/**
 * The centrepiece of the compact player header: a black stone left of
 * centre and a white stone overlapping it to the right, with the side to
 * move drawn on top, the rule set above, and the move number underneath.
 */
export function CompactTurnStones({
    to_move,
    move_number,
    rules,
}: CompactTurnStonesProps): React.ReactElement {
    const stoneClass = (color: "black" | "white") =>
        `CompactTurnStones-stone ${color}` + (to_move === color ? " on-top" : "");
    const rules_label = rules ? rulesText(rules) : null;

    return (
        <div className="CompactTurnStones">
            {rules_label && rules_label !== "[unknown]" && (
                <div
                    className="CompactTurnStones-rules"
                    title={interpolate(pgettext("Rule set of the game", "Rules: {{rules}}"), {
                        rules: rules_label,
                    })}
                >
                    {rules_label}
                </div>
            )}
            <div className="CompactTurnStones-stones">
                <span className={stoneClass("black")} data-testid="compact-stone-black" />
                <span className={stoneClass("white")} data-testid="compact-stone-white" />
            </div>
            {move_number >= 0 && (
                <div
                    className="CompactTurnStones-move-number"
                    title={interpolate(pgettext("Current move number", "Move {{move_number}}"), {
                        move_number,
                    })}
                >
                    {move_number}
                </div>
            )}
        </div>
    );
}
