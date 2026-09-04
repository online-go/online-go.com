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
import { usePreference } from "@/lib/preferences";
import "./AIReviewBoardToggle.css";

/**
 * Button that toggles the "ai-review-show-on-board" preference: whether the
 * AI review draws anything on the board (suggested moves, their score
 * differences, the move quality of the move played). The icon is four dots
 * in the excellent, good, inaccuracy and blunder colors.
 */
export function AIReviewBoardToggle(): React.ReactElement {
    const [show_on_board, setShowOnBoard] = usePreference("ai-review-show-on-board");

    return (
        <button
            className={"AIReviewBoardToggle" + (show_on_board ? " active" : "")}
            aria-pressed={show_on_board}
            onClick={() => setShowOnBoard(!show_on_board)}
            title={
                show_on_board
                    ? pgettext(
                          "Button that hides the AI review's marks on the board",
                          "Hide AI review on the board",
                      )
                    : pgettext(
                          "Button that shows the AI review's marks on the board",
                          "Show AI review on the board",
                      )
            }
        >
            <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                <circle className="excellent" cx="4" cy="4" r="3" />
                <circle className="good" cx="12" cy="4" r="3" />
                <circle className="inaccuracy" cx="4" cy="12" r="3" />
                <circle className="blunder" cx="12" cy="12" r="3" />
            </svg>
        </button>
    );
}
