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
import "./UndoIcon.css";

interface UndoIconProps {
    /** Small glyph drawn over the corner of the undo arrow: a question mark
     *  to ask for or withdraw an undo, a check to accept the opponent's
     *  request, a cross to reject it. */
    badge: "question" | "check" | "times";
}

/** The undo arrow with a badge in its top-right corner. Used by the action
 *  bar and by the game actions menu so the undo controls read as one family
 *  wherever they appear. */
export function UndoIcon({ badge }: UndoIconProps): React.ReactElement {
    return (
        <span className="UndoIcon">
            <i className="fa fa-undo" />
            <i className={`fa fa-${badge} UndoIcon-badge`} />
        </span>
    );
}
