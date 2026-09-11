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
import { Toggle } from "@/components/Toggle";
import { pgettext } from "@/lib/translate";
import { usePreference } from "@/lib/preferences";
import "./AIReviewBoardToggle.css";

/**
 * Switch that toggles the "ai-review-show-on-board" preference: whether the
 * AI review draws anything on the board (suggested moves, their score
 * differences, the move quality of the move played). A gray icon of board
 * marks on grid lines (circle, triangle in a hollow circle, blank, circle)
 * sits to the left of the switch.
 */
export function AIReviewBoardToggle(): React.ReactElement {
    const [show_on_board, setShowOnBoard] = usePreference("ai-review-show-on-board");

    return (
        <span
            className="AIReviewBoardToggle"
            title={pgettext(
                "Switch that shows or hides the AI review's marks on the board",
                "Show AI review on the board",
            )}
        >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <path className="grid" d="M4 0v16M12 0v16M0 4h16M0 12h16" />
                <circle className="stone" cx="4" cy="4" r="3" />
                <circle className="ring" cx="12" cy="4" r="3" />
                <polygon className="stone" points="12,2 14,5.5 10,5.5" />
                <circle className="stone" cx="12" cy="12" r="3" />
            </svg>
            <Toggle checked={show_on_board} onChange={(checked) => setShowOnBoard(checked)} />
        </span>
    );
}
