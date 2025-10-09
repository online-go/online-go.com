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

export class BL3Joseki2 extends LearningHubSection {
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
        return "bl3-joseki-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning joseki", "Joseki");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on joseki", "Joseki deviations");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dodp",
                white: "fq",
            },
            marks: { A: "dq", B: "eq", C: "dr", 1: "do" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fqer",
                white: "cndp",
            },
            marks: { A: "cq", B: "dq", C: "dr", 1: "er" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "eqfq",
                white: "cndp",
            },
            marks: { A: "cq", B: "dq", C: "dr", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "epfq",
                white: "dndp",
            },
            marks: { A: "dl", B: "eo", C: "dq", 1: "ep" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fqcr",
                white: "cndp",
            },
            marks: { A: "cq", B: "dq", C: "dr", 1: "cr" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "fqiq",
                white: "cndp",
            },
            marks: { A: "cp", B: "cq", C: "dq", 1: "iq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dofq",
                white: "cndp",
            },
            marks: { A: "co", B: "cp", C: "ep", 1: "do" },
            move_tree: this.makePuzzleMoveTree(["coepdq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cndpdq",
                white: "fqdr",
            },
            marks: { A: "eq", B: "cr", C: "er", 1: "dq" },
            move_tree: this.makePuzzleMoveTree(["crereqfrgr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cndpeq",
                white: "fqdr",
            },
            marks: { A: "cq", B: "iq", C: "er", 1: "eq" },
            move_tree: this.makePuzzleMoveTree(["er"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cndpcr",
                white: "fqdr",
            },
            marks: { A: "cq", B: "dq", C: "eq", 1: "cr" },
            move_tree: this.makePuzzleMoveTree(["cqdqbrercscpbpboeq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpfqiq",
                white: "cnbp",
            },
            marks: { A: "co", B: "cp", C: "cq", 1: "iq" },
            move_tree: this.makePuzzleMoveTree(["cq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best answer after Black's 1, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 8, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cndper",
                white: "fqdr",
            },
            marks: { A: "dq", B: "eq", C: "cr", 1: "er" },
            move_tree: this.makePuzzleMoveTree(["eqdqcr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
