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

export class Ladders extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [
            Page1,
            Page2,
            Page3,
            //Page5,
            //Page6,
            //Page7,
        ];
    }

    static section(): string {
        return "ladders";
    }
    static title(): string {
        return pgettext("Tutorial section on ladders", "Ladders!");
    }
    //static subtext():string { return pgettext("Tutorial section on ladders", ""); }
    static subtext(): string {
        return "";
    }
}

class Page1 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _('This zig zag pattern is called a "ladder". Capture the white stones by continuing the ladder.');
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",

            initial_state: { black: "fceddegedfffeg", white: "fdgdeefeef" },
            move_tree: this.makePuzzleMoveTree(
                ["h6g7g8h7j7h8h9j8j9", "h6g7g8h7j7h8j8h9g9h5j9", "h6g7g8h7h8j7j6j8j9", "h6g7g8h7h8j7j8j6j5"],
                ["h6g7g8h7j7h8j8h9j9j6"],
            ),
        };
    }
}

class Page2 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Capture the white stones using a ladder.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",

            initial_state: { black: "gccecfdg", white: "df" },
            move_tree: this.makePuzzleMoveTree(["e4d5d6e5f5e6e7f6g6f7f8"], ["d5e4"]),
        };
    }
}

class Page3 extends LearningPage {
    constructor(props) {
        super(props);
    }

    text() {
        return _("Stones in the path of a ladder break the ladder. Stay alive!");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",

            initial_state: { black: "fcef", white: "eedfegfg" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "f4g4f5f6g5h5g6e6g7",
                    "f4g4f5f6g5h5g6e6g8",
                    "f4g4f5f6g5h5g6e6h7h6g7",
                    "f4g4f5f6g5h5g6e6h6g7h4",
                    "f4g4f5f6g5h5g6e6h6g7h7",
                    "f4g4f5f6g5h5g6e6h4g3h6j5j4j6j7",
                    "f4g4f5f6g5h5g6e6h4g3h6j5j6j4j3",
                    "f4g4f5f6g5h5g6e6h4g3g7",
                    "f4g4f5f6g5h5g6e6h4g3h7h6g7",
                    "f4g4f5f6g5h5g6e6g3h4g7",
                    "f4g4f5f6g5h5g6e6g3h4h6g7h7g8h8f8h3",
                    "f4g4f5f6g5h5g6e6g3h4h7h6g7",
                ],
                [
                    "f4g4f5f6g5h5g6e6d3g7",
                    "f4g4f5f6g5h5g6e6d5g7",
                    "f4g4f5f6g5h5g6e6e7g7",
                    "f4g4f5f6g5h5g6e6d6g7",
                    "f4g4f5f6g5h5g6e6f8g7",
                    "f4g4f5f6g5h5g6e6e8g7",
                    "f4g4f5f6g5h5g6e6h8g7",
                    "f4g4f5f6g5h5g6e6h3g7",
                    "f4g4f5f6g5h5g6e6g3h4h6g7h7g8f8h8",
                    "f4g4f5f6g6g5",
                    "g4f4",
                    "f5f4",
                    "g5f4",
                ],
            ),
        };
    }
}
