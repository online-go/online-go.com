/*
 * Copyright (C) 2012-2022  Online-Go.com
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

import { Goban } from "goban";

export class PuzzleNavigation {
    _goban: Goban;

    constructor() {}

    set goban(newValue: Goban) {
        this._goban = newValue;
    }

    nav_up = () => {
        this.checkAndEnterAnalysis();
        this._goban.prevSibling();
    };
    nav_down = () => {
        this.checkAndEnterAnalysis();
        this._goban.nextSibling();
    };
    nav_first = () => {
        this.checkAndEnterAnalysis();
        this._goban.showFirst();
    };
    nav_prev_10 = () => {
        this.checkAndEnterAnalysis();
        for (let i = 0; i < 10; ++i) {
            // update display only for final navigation result
            this._goban.showPrevious(i < 9);
        }
    };
    nav_prev = () => {
        this.checkAndEnterAnalysis();
        this._goban.showPrevious();
    };
    nav_next = () => {
        this.checkAndEnterAnalysis();
        this._goban.showNext();
    };
    nav_next_10 = () => {
        this.checkAndEnterAnalysis();
        for (let i = 0; i < 10; ++i) {
            // update display only for final navigation result
            this._goban.showNext(i < 9);
        }
    };
    nav_last = () => {
        this.checkAndEnterAnalysis();
        this._goban.jumpToLastOfficialMove();
    };

    checkAndEnterAnalysis() {
        if (this._goban.mode === "puzzle") {
            this._goban.setMode("analyze", true);
            return true;
        }
        if (this._goban.mode === "analyze") {
            return true;
        }
        return false;
    }

    checkAndEnterPuzzleMode() {
        if (this._goban.mode !== "puzzle") {
            this._goban.setAnalyzeTool("stone", "alternate");
            this._goban.setMode("puzzle", true);
        }
        return true;
    }
}
