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

export class BL2Haengma4 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl2-haengma-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning stretch after cross cut", "Haengma");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on stretch after cross cut",
            "Stretch after cross cut",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Another well-known proverb is: 'Stretch after a cross-cut'. Usually it is not good to give atari to a cutting stone of a cross-cut. Often it is best to stretch from one of the two cut-off stones. In this example Black plays a cross-cut with move 1. White should stretch at A. White to play. Stretch after this cross-cut.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpfpdqeq",
                white: "epfq",
            },
            marks: { 1: "fp", A: "gq" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdq",
                white: "dpcq",
            },
            marks: { A: "co", B: "bq", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["bq"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpgq",
                white: "gpfq",
            },
            marks: { A: "fo", B: "eq", C: "gr" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdq",
                white: "cmdpcq",
            },
            marks: { A: "co", B: "do", C: "eq" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpfpcq",
                white: "cpdq",
            },
            marks: { A: "do", B: "ep", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqdqgqerfr",
                white: "cpdpbqeqfqbrgr",
            },
            marks: { A: "gp", B: "hq", C: "hr" },
            move_tree: this.makePuzzleMoveTree(["hr"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncpdq",
                white: "dpcq",
            },
            marks: { A: "co", B: "eq", C: "cr" },
            move_tree: this.makePuzzleMoveTree(["cr"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fogoephp",
                white: "eohofpgp",
            },
            marks: { A: "fn", B: "do", C: "eq" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. Choose the best continuation (stretch) after this cross-cut, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eocpdpgp",
                white: "doepeq",
            },
            marks: { A: "dn", B: "en", C: "fo" },
            move_tree: this.makePuzzleMoveTree(["dn"], [], 19, 19),
        };
    }
}
