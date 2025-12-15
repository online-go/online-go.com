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

export class BL4Opening7 extends LearningHubSection {
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
        return "bl4-opening-7";
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
                black: "pppd",
                white: "cpdd",
            },
            marks: { A: "jp", B: "ep", C: "jd" },
            move_tree: this.makePuzzleMoveTree(["ep"], [], 19, 19),
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
                black: "pdjdpqqk",
                white: "jqdpddqf",
            },
            marks: { A: "qh", B: "qe", C: "nd" },
            move_tree: this.makePuzzleMoveTree(["qe"], [], 19, 19),
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
                black: "pdjdpjppfqhq",
                white: "dpfohojpdddj",
            },
            marks: { A: "dr", B: "cr", C: "dq" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
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
                black: "dppqqpqopnonpd",
                white: "poqnqmqjjcdccf",
            },
            marks: { A: "qf", B: "cn", C: "jp" },
            move_tree: this.makePuzzleMoveTree(["jp"], [], 19, 19),
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
                black: "jppppnpjpdmd",
                white: "dddfcjdphpjd",
            },
            marks: { A: "mp", B: "mo", C: "jn" },
            move_tree: this.makePuzzleMoveTree(["jn"], [], 19, 19),
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
                black: "pdqopqfq",
                white: "dpcnddjd",
            },
            marks: { A: "jp", B: "pj", C: "qf" },
            move_tree: this.makePuzzleMoveTree(["jp"], [], 19, 19),
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
                black: "pdpnqppqoqeqdodn",
                white: "opnpnqcpcocmdcjd",
            },
            marks: { A: "jq", B: "nc", C: "lc" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
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
                black: "pdpfqkpq",
                white: "ncjddddp",
            },
            marks: { A: "jp", B: "po", C: "cj" },
            move_tree: this.makePuzzleMoveTree(["jp"], [], 19, 19),
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
                black: "pdqlqpoq",
                white: "qjjqdpdd",
            },
            marks: { A: "lq", B: "ol", C: "qh" },
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
                black: "pdjdpplolqcqcpcnbn",
                white: "jpjnddgddqdpdoemcl",
            },
            marks: { A: "jr", B: "ir", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["jr"], [], 19, 19),
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
                black: "pdppcgcj",
                white: "dpddgccm",
            },
            marks: { A: "eg", B: "bd", C: "jd" },
            move_tree: this.makePuzzleMoveTree(["bd"], [], 19, 19),
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
                black: "pdpjpplq",
                white: "nqqqdpdd",
            },
            marks: { A: "pq", B: "qp", C: "np" },
            move_tree: this.makePuzzleMoveTree(["qp"], [], 19, 19),
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
                black: "pdicfcdbppnq",
                white: "ccddcfdpgqqj",
            },
            marks: { A: "cl", B: "ck", C: "cj" },
            move_tree: this.makePuzzleMoveTree(["ck"], [], 19, 19),
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
                black: "dqcooqpopnpmpd",
                white: "kqqpqoqnqlfccd",
            },
            marks: { A: "di", B: "gq", C: "iq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
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
                black: "qdocqjidcndndofp",
                white: "qlqpoqddcfdqcpco",
            },
            marks: { A: "oj", B: "ph", C: "pg" },
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
                black: "pdppepfqgp",
                white: "eqdqcpcndd",
            },
            marks: { A: "kq", B: "pn", C: "qn" },
            move_tree: this.makePuzzleMoveTree(["kq"], [], 19, 19),
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
                black: "jdndpdqepjpnpp",
                white: "qfpfqinqjpdpdd",
            },
            marks: { A: "qj", B: "pi", C: "fc" },
            move_tree: this.makePuzzleMoveTree(["qj"], [], 19, 19),
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
                black: "pdqgqpoqckdbfcic",
                white: "qjqmdpgqcicfddcc",
            },
            marks: { A: "cn", B: "cm", C: "ek" },
            move_tree: this.makePuzzleMoveTree(["cn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
