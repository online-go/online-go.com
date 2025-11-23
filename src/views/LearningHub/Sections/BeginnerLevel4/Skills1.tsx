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

export class BL4Skills1 extends LearningHubSection {
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
            Page13,
        ];
    }
    static section(): string {
        return "bl4-skills-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning block", "Skills");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on block", "Block");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "To keep an opponent's group weak, good tactics is to surround or cut this group. Surrounding is often done by blocking the advance of the opponent's stones. In this example, the black stones can advance in different directions. In direction A, Black can develop towards the center. In direction B, Black runs toward the edge. That's a dead end. In direction C, Black can develop along the edge, but there is already a white stone on that side. If White wants to stop Black's development, the best way is to play A, thus blocking the advance to the center. White to play. Choose the best way to block, A, B or C?",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpdq",
                white: "cpcqfp",
            },
            marks: { A: "do", B: "dr", C: "fr" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpepeq",
                white: "dohocpcqdqhq",
            },
            marks: { A: "eo", B: "fp", C: "er" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "eocpdpcq",
                white: "doepfpdqdr",
            },
            marks: { A: "en", B: "co", C: "cr" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dpdq",
                white: "coep",
            },
            marks: { A: "do", B: "cp", C: "eq" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cmcocpcqfqgqiqir",
                white: "dndodpfpgphpipjqjr",
            },
            marks: { A: "dm", B: "cn", C: "dq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cmdmfmepcqdqfqfr",
                white: "cncpfpgpbqgqiqbr",
            },
            marks: { A: "eo", B: "dp", C: "gr" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "epdqeq",
                white: "dodpcqcr",
            },
            marks: { A: "eo", B: "fp", C: "dr" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cncpdpcq",
                white: "dmeoepdqiqcrer",
            },
            marks: { A: "cm", B: "dn", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["cm"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "hndodphpdq",
                white: "emcncocqeqcrdrfr",
            },
            marks: { A: "dn", B: "cp", C: "ep" },
            move_tree: this.makePuzzleMoveTree(["ep"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "goeqfq",
                white: "dniodpepdqiq",
            },
            marks: { A: "fp", B: "gq", C: "er" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dncpdpcq",
                white: "enepdqeqbrcr",
            },
            marks: { A: "dm", B: "eo", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["dm"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cpephpdqeqfrgr",
                white: "cnenbqcqfqdrer",
            },
            marks: { A: "eo", B: "bp", C: "fp" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best way to block, A, B or C?");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "dodpepfp",
                white: "codqeqfq",
            },
            marks: { A: "dn", B: "cp", C: "gp" },
            move_tree: this.makePuzzleMoveTree(["cp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
