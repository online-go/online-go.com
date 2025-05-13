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

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class Intro extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page1, Page2, Page3, Page4, Page5, Page6];
    }

    static section(): string {
        return "rules-intro";
    }
    static title(): string {
        return pgettext("Tutorial section name on rules introduction", "The Game of Go");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on rules introduction",
            "Build territory one stone at a time",
        );
    }
}

class Page1 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            // "You can play a stone on any intersection, even the outer ones. The goal of the game is to surround the largest areas. Stones don't move but can be captured. Make a move to continue",
            "The game starts with an empty board. Two players, Black and White, take turns placing stones on the board. Black starts. You can play a stone on any empty intersection, even the outer ones. Make a move to continue.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_state: { black: "", white: "" },

            move_tree: this.makePuzzleMoveTree(
                [
                    "a1",
                    "a2",
                    "a3",
                    "a4",
                    "a5",
                    "a6",
                    "a7",
                    "a8",
                    "a9",
                    "b1",
                    "b2",
                    "b3",
                    "b4",
                    "b5",
                    "b6",
                    "b7",
                    "b8",
                    "b9",
                    "c1",
                    "c2",
                    "c3",
                    "c4",
                    "c5",
                    "c6",
                    "c7",
                    "c8",
                    "c9",
                    "d1",
                    "d2",
                    "d3",
                    "d4",
                    "d5",
                    "d6",
                    "d7",
                    "d8",
                    "d9",
                    "e1",
                    "e2",
                    "e3",
                    "e4",
                    "e5",
                    "e6",
                    "e7",
                    "e8",
                    "e9",
                    "f1",
                    "f2",
                    "f3",
                    "f4",
                    "f5",
                    "f6",
                    "f7",
                    "f8",
                    "f9",
                    "g1",
                    "g2",
                    "g3",
                    "g4",
                    "g5",
                    "g6",
                    "g7",
                    "g8",
                    "g9",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "h7",
                    "h8",
                    "h9",
                    "j1",
                    "j2",
                    "j3",
                    "j4",
                    "j5",
                    "j6",
                    "j7",
                    "j8",
                    "j9",
                ],
                [],
            ),
        };
    }
}

class Page2 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black has played the first move. Now it is White's turn. Make a move to continue.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: { black: "c3", white: "" },

            move_tree: this.makePuzzleMoveTree(
                [
                    "a1",
                    "a2",
                    "a3",
                    "a4",
                    "a5",
                    "a6",
                    "a7",
                    "a8",
                    "a9",
                    "b1",
                    "b2",
                    "b3",
                    "b4",
                    "b5",
                    "b6",
                    "b7",
                    "b8",
                    "b9",
                    "c1",
                    "c2",
                    "c4",
                    "c5",
                    "c6",
                    "c7",
                    "c8",
                    "c9",
                    "d1",
                    "d2",
                    "d3",
                    "d4",
                    "d5",
                    "d6",
                    "d7",
                    "d8",
                    "d9",
                    "e1",
                    "e2",
                    "e3",
                    "e4",
                    "e5",
                    "e6",
                    "e7",
                    "e8",
                    "e9",
                    "f1",
                    "f2",
                    "f3",
                    "f4",
                    "f5",
                    "f6",
                    "f7",
                    "f8",
                    "f9",
                    "g1",
                    "g2",
                    "g3",
                    "g4",
                    "g5",
                    "g6",
                    "g7",
                    "g8",
                    "g9",
                    "h1",
                    "h2",
                    "h3",
                    "h4",
                    "h5",
                    "h6",
                    "h7",
                    "h8",
                    "h9",
                    "j1",
                    "j2",
                    "j3",
                    "j4",
                    "j5",
                    "j6",
                    "j7",
                    "j8",
                    "j9",
                ],
                [],
            ),
        };
    }
}

class Page3 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The points next to a stone are called liberties. Fill one of the liberties of the black stone.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: { black: "c3", white: "" },
            marks: { cross: "b3d3c2c4" },
            move_tree: this.makePuzzleMoveTree(["b3", "d3", "c2", "c4"], []),
        };
    }
}

class Page4 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "A stone is captured when all its liberties are occupied by the opponent's stones. Capture the black stone by filling the last liberty of the black stone.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            marks: { cross: "d3" },
            initial_state: { black: "c3", white: "b3c2c4" },

            move_tree: this.makePuzzleMoveTree(["d3"], []),
        };
    }
}

class Page5 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Stones of the same color next to each other form a chain. Fill one of the liberties of the black chain.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: { black: "c3c4d4", white: "" },
            marks: { cross: "b3b4c2c5d3d5e4" },
            move_tree: this.makePuzzleMoveTree(["b3", "b4", "c2", "c5", "d3", "d5", "e4"], []),
        };
    }
}

class Page6 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The black chain has only one liberty left. This is called 'atari'. Capture the black chain that is in atari.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: { black: "c3c4d4", white: "b3b4c2c5d3d5" },
            marks: { cross: "e4" },
            move_tree: this.makePuzzleMoveTree(["e4"], []),
        };
    }
}
