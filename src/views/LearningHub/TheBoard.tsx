/*
 * Copyright (C) 2012-2020  Online-Go.com
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
import { PuzzleConfig } from "goban";
import { LearningPage, DummyPage } from "./LearningPage";
import { _, pgettext, interpolate } from "translate";
import { LearningHubSection } from "./LearningHubSection";

export class TheBoard extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page1, Page2, Page3];
    }

    static section(): string {
        return "the-board";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning about the board", "The Board!");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning about the board", "Corners, sides, and middle");
    }
}

class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _(
            "You can play anywhere, but a good general strategy is to focus on the corners first, then sides, then the middle. Play a stone in the upper right hand corner.",
        );
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: { black: "", white: "" },

            move_tree: this.makePuzzleMoveTree(
                ["f9", "g9", "h9", "j9", "f8", "g8", "h8", "j8", "f7", "g7", "h7", "j7", "f6", "g6", "h6", "j6"],
                [],
            ),
        };
    }
}

class Page2 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _(
            "Go can be played on any size board, but the most common are 9x9 (which you should start on), 13x13, and the most popular, 19x19. Play on the right side of the board (not in a corner)",
        );
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: { black: "", white: "" },
            width: 13,
            height: 13,

            move_tree: this.makePuzzleMoveTree(
                [
                    "k9",
                    "l9",
                    "m9",
                    "n9",
                    "k8",
                    "l8",
                    "m8",
                    "n8",
                    "k7",
                    "l7",
                    "m7",
                    "n7",
                    "k6",
                    "l6",
                    "m6",
                    "n6",
                    "k5",
                    "l5",
                    "m5",
                    "n5",
                ],
                [],
                13,
                13,
            ),
        };
    }
}

class Page3 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _(
            'You will note that there are several circles on the board, these are called "Star Points". These are not particularly special, they are just useful for orienting yourself with the board. Play on a star point',
        );
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_state: { black: "", white: "" },
            width: 19,
            height: 19,

            move_tree: this.makePuzzleMoveTree(
                ["d16", "k16", "q16", "d10", "k10", "q10", "d4", "k4", "q4"],
                [],
                19,
                19,
            ),
        };
    }
}
