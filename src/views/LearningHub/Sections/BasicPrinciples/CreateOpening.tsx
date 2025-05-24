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

export class CreateOpening extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [
            Page01,
            Page02,
            Page03,
            Page04,
            Page05,
            Page06,
            Page07,
            Page08,
            Page09,
            Page10,
            Page11,
            Page12,
        ];
    }
    static section(): string {
        return "create_opening";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning escape", "Create Opening");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning escape",
            "Create an opening and escape",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White to play. The marked white chain can not escape by lengthening this chain at A. But white can escape by creating an opening. Capture the marked black stone to create this opening.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dedfcgegchfhdi",
                white: "bfcfefdgdheh",
            },
            marks: { triangle: "dgdheheg", A: "ei" },
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccbdbecfdfagbg",
                white: "bcadcdceafbf",
            },
            move_tree: this.makePuzzleMoveTree(["ae"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bedeeegecfgfagdgegfgbhch",
                white: "bfefffhfbgcggghgdhehfh",
            },
            move_tree: this.makePuzzleMoveTree(["df"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bebfdfefcgfgchfhdi",
                white: "ceeefecfffdgegdh",
            },
            move_tree: this.makePuzzleMoveTree(["de"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccdbedebfdfcg",
                white: "ddceeeefdgdh",
            },
            move_tree: this.makePuzzleMoveTree(["cf"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdedfdgdcegedfefffcgfgch",
                white: "hddeeefehegfdgegggdhfh",
            },
            move_tree: this.makePuzzleMoveTree(["cf"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "edfdgdgedfgfcgfgdhehghci",
                white: "dcddceeefecfffdgegbhch",
            },
            move_tree: this.makePuzzleMoveTree(["bg"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "geafbfdfcgdgbh",
                white: "dcbececfagbg",
            },
            move_tree: this.makePuzzleMoveTree(["ae"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "iagbhbibfcedfdhdfeffeggghgdhfhdifi",
                white: "fagahaebfbccecddeedfefbgdgchciei",
            },
            move_tree: this.makePuzzleMoveTree(["eh"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "beeeafdfefagcgbhch",
                white: "ecgcddaedebfcfbg",
            },
            move_tree: this.makePuzzleMoveTree(["ah"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccfcbddddeafdfbgcg",
                white: "cdcebfcfdgegbhch",
            },
            move_tree: this.makePuzzleMoveTree(["ag"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Escape with the chain in atari by creating an opening.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gchcgdiddefegehedfefcgfgggahbhchdhehfh",
                white: "ebgbhbibccfcicddedfdbeceeecfffagbgeg",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}
