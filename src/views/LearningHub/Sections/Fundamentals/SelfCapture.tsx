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
/* cSpell:disable */

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class SelfCapture extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03];
    }
    static section(): string {
        return "self-capture";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning self-capture", "Self-capture");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on self-capture",
            "Do not capture your own stones",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Playing at A or B is called 'self-capture' (no liberties for White) and is not allowed. But playing at C is allowed, because it captures the marked stones, creating liberties for White. Capture the marked black stones.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ceeedfffegehhagbibhc",
                white: "eddefegffg",
            },
            width: 9,
            height: 9,
            marks: { A: "ia", B: "hb", C: "ef", triangle: "eeff" },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Both players are in atari. Placing a stone where you have no liberties is not allowed, unless you can capture stones. Capture one or more black stones.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efffcgdgggehfh",
                white: "eefecfdfgfeg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

// class Page07 extends LearningPage {
//     constructor(props: LearningPageProperties) {
//         super(props);
//     }

//     text() {
//         return _("White to play. Both players are in atari. Capture one or more black stones.");
//     }
//     config(): GobanConfig {
//         return {
//             mode: "puzzle",
//             initial_player: "white",
//             initial_state: {
//                 black: "eedfffdgehdi",
//                 white: "decfefcgdh",
//             },
//             width: 9,
//             height: 9,
//             move_tree: this.makePuzzleMoveTree(["eg"], [], 9, 9),
//         };
//     }
// }

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Both players are in atari. Placing a stone where you have no liberties is not allowed, unless you can capture stones. Capture one or more black stones.",
        );
    }
    config(): GobanConfig {
        return {
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "becfagbgchdhehciei",
                white: "cgdgegahbhfhbifi",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["di"], [], 9, 9),
        };
    }
}
