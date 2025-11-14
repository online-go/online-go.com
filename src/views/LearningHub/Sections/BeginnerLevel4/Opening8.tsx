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

export class BL4Opening8 extends LearningHubSection {
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
            Page14,
            Page15,
            Page16,
            Page17,
            Page18,
        ];
    }
    static section(): string {
        return "bl4-opening-8";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning opening", "Opening");
    }
    static subtext(): string {
        return "";
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "ocqdqgqoqppqnq",
                white: "qioipoqnpmdpdc",
            },
            marks: { A: "fq", B: "og", C: "de" },
            move_tree: this.makePuzzleMoveTree(["de"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdqpoq",
                white: "qjdddp",
            },
            marks: { A: "ql", B: "oj", C: "jd" },
            move_tree: this.makePuzzleMoveTree(["ql"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qcpdqfcocqhqppnq",
                white: "pbnckcddeqeohojp",
            },
            marks: { A: "jr", B: "kq", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["jr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qdocqjppjpcccdde",
                white: "cpeqcibbcbdcfdjc",
            },
            marks: { A: "ck", B: "oj", C: "cg" },
            move_tree: this.makePuzzleMoveTree(["cg"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdpjppfcfd",
                white: "idddeccfdp",
            },
            marks: { A: "ff", B: "hc", C: "eb" },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "dqcocfpcpdqepfpkqn",
                white: "ddfdkcocodoeppnqiq",
            },
            marks: { A: "di", B: "eo", C: "gq" },
            move_tree: this.makePuzzleMoveTree(["di"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdqppqqn",
                white: "oqopdpddjc",
            },
            marks: { A: "lp", B: "on", C: "pj" },
            move_tree: this.makePuzzleMoveTree(["lp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdqpoq",
                white: "qfdpdd",
            },
            marks: { A: "qh", B: "qe", C: "jd" },
            move_tree: this.makePuzzleMoveTree(["qh"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdncrdppiqfqdr",
                white: "qfdpcqcndiddfc",
            },
            marks: { A: "qh", B: "of", C: "jc" },
            move_tree: this.makePuzzleMoveTree(["qh"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qpqopqnqqdocbdcfci",
                white: "poqnpmqijcddccfddp",
            },
            marks: { A: "fq", B: "jp", C: "qg" },
            move_tree: this.makePuzzleMoveTree(["qg"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qdocplpqnpjq",
                white: "pnqorqdqcodc",
            },
            marks: { A: "gq", B: "pi", C: "ce" },
            move_tree: this.makePuzzleMoveTree(["ce"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "cpepjpqipepc",
                white: "lppqqojcdcde",
            },
            marks: { A: "je", B: "cj", C: "ql" },
            move_tree: this.makePuzzleMoveTree(["cj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qcpdqfcjhqgqeqdqpo",
                white: "pbnckcddclcoepfpgp",
            },
            marks: { A: "ch", B: "cf", C: "fc" },
            move_tree: this.makePuzzleMoveTree(["cf"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdqhqlqpoq",
                white: "qfofqjdpdd",
            },
            marks: { A: "pi", B: "oh", C: "nd" },
            move_tree: this.makePuzzleMoveTree(["nd"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qdocqjlqhpcpcmid",
                white: "pgqmppoqepenccfc",
            },
            marks: { A: "oj", B: "qh", C: "oe" },
            move_tree: this.makePuzzleMoveTree(["oj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdpfqkpqkp",
                white: "iqdpkdncdd",
            },
            marks: { A: "io", B: "cn", C: "dn" },
            move_tree: this.makePuzzleMoveTree(["io"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "ppqqpndpgqpd",
                white: "prnqjqjdddcf",
            },
            marks: { A: "lq", B: "dj", C: "fc" },
            move_tree: this.makePuzzleMoveTree(["lq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 0, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pdqpoq",
                white: "dddpql",
            },
            marks: { A: "qn", B: "qj", C: "qf" },
            move_tree: this.makePuzzleMoveTree(["qj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
