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

export class BSEscape extends LearningHubSection {
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
        return "bs-escape";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning escape", "Escape");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on escape", "");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dgegbhchdi",
                white: "cfcgdheh",
            },
            marks: { A: "fh", B: "ei", triangle: "ehdh" },
            move_tree: this.makePuzzleMoveTree(["fh"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bccccedebfbgbh",
                white: "bdcdbecfcgch",
            },
            marks: { A: "ad", B: "dd", triangle: "becdbd" },
            move_tree: this.makePuzzleMoveTree(["dd"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcdfefdgfgbhch",
                white: "cebgcgegdheh",
            },
            marks: { A: "fh", B: "ei", triangle: "ehdheg" },
            move_tree: this.makePuzzleMoveTree(["fh"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccdebfdfbgcg",
                white: "ddedcecfgg",
            },
            marks: { A: "cd", B: "be", triangle: "cfce" },
            move_tree: this.makePuzzleMoveTree(["cd"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdddbedeefdgch",
                white: "cbbcbdcecfdf",
            },
            marks: { A: "bf", B: "cg", triangle: "dfcfce" },
            move_tree: this.makePuzzleMoveTree(["bf"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "deeeffdgeg",
                white: "cccdcedf",
            },
            marks: { A: "cf", B: "ef", triangle: "df" },
            move_tree: this.makePuzzleMoveTree(["cf"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cedefegecfefcgeggg",
                white: "ccdcedeedfffdgdh",
            },
            marks: { A: "gf", B: "fg", triangle: "ff" },
            move_tree: this.makePuzzleMoveTree(["fg"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfagcgbhdh",
                white: "cdcebfbg",
            },
            marks: { A: "be", B: "af", triangle: "bgbf" },
            move_tree: this.makePuzzleMoveTree(["be"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cfdfefcgegbh",
                white: "fdffdgfgdh",
            },
            marks: { A: "ch", B: "eh", triangle: "dhdg" },
            move_tree: this.makePuzzleMoveTree(["eh"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccbdcededfcgch",
                white: "bfcfefbgdgeg",
            },
            marks: { A: "be", B: "bh", triangle: "bgcfbf" },
            move_tree: this.makePuzzleMoveTree(["bh"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gdffgfeggggh",
                white: "dfefcgfgfh",
            },
            marks: { A: "eh", B: "fi", triangle: "fhfg" },
            move_tree: this.makePuzzleMoveTree(["eh"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose where to play to escape with the marked stones, A or B?");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dbebccfcedde",
                white: "fbdcecgcge",
            },
            marks: { A: "dd", B: "fd", triangle: "ecdc" },
            move_tree: this.makePuzzleMoveTree(["fd"], [], 9, 9),
        };
    }
}
