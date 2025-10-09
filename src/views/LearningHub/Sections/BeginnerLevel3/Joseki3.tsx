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

export class BL3Joseki3 extends LearningHubSection {
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
        return "bl3-joseki-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning deviation 2", "Joseki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on deviation 2", "Joseki deviations");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpeq",
                white: "epdq",
            },
            marks: { A: "dp", B: "cq", C: "fq", 1: "dq" },
            move_tree: this.makePuzzleMoveTree(["dp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "epfq",
                white: "cncpeq",
            },
            marks: { A: "dp", B: "fp", C: "dq", 1: "cn" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "epfpfq",
                white: "cpdqeqfr",
            },
            marks: { A: "cn", B: "jq", C: "gr", 1: "fr" },
            move_tree: this.makePuzzleMoveTree(["gr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cncpdqeq",
                white: "clepfpfq",
            },
            marks: { A: "dm", B: "iq", C: "fr", 1: "cl" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcq",
                white: "dpdq",
            },
            marks: { A: "co", B: "do", C: "dr", 1: "dq" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpcq",
                white: "codp",
            },
            marks: { A: "do", B: "dq", C: "er", 1: "co" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dodp",
                white: "cocpcq",
            },
            marks: { A: "cn", B: "dn", C: "dq", 1: "co" },
            move_tree: this.makePuzzleMoveTree(["dn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dodp",
                white: "cpcqfq",
            },
            marks: { A: "co", B: "fp", C: "dq", 1: "fq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdp",
                white: "cqeq",
            },
            marks: { A: "ep", B: "bq", C: "dq", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpeq",
                white: "epcqdq",
            },
            marks: { A: "eo", B: "fp", C: "fq", 1: "ep" },
            move_tree: this.makePuzzleMoveTree(["fqbpbobqcnerfr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpeqfqgq",
                white: "cqdqerfrgr",
            },
            marks: { A: "hq", B: "iq", C: "hr", 1: "gr" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best answer after White's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "bocpdpeqfqgq",
                white: "cobpcqdqerfr",
            },
            marks: { A: "cn", B: "do", C: "bq", 1: "co" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["cndo"], 19, 19),
            /* cSpell:enable */
        };
    }
}
