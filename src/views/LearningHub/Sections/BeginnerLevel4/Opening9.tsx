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

export class BL4Opening9 extends LearningHubSection {
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
        return "bl4-opening-9";
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
                black: "pdqpoqip",
                white: "dpdkddjd",
            },
            marks: { A: "pj", B: "qf", C: "nc" },
            move_tree: this.makePuzzleMoveTree(["pj"], [], 19, 19),
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
                black: "pdpqqofc",
                white: "jqdpddhc",
            },
            marks: { A: "lq", B: "fe", C: "cc" },
            move_tree: this.makePuzzleMoveTree(["cc"], [], 19, 19),
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
            /* cSpell:disable */
            initial_state: {
                black: "pcdpqejc",
                white: "qpdcceoq",
            },
            marks: { A: "gc", B: "qk", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["qk"], [], 19, 19),
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
                black: "dddfdkopocofoh",
                white: "dpcnfcldqdpiqg",
            },
            marks: { A: "id", B: "ip", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["id"], [], 19, 19),
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
                black: "pdppfq",
                white: "dpipdd",
            },
            marks: { A: "fp", B: "fo", C: "fn" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
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
                black: "bdcddcedocpcqdqfpqqo",
                white: "decegcjdodndncjqdpci",
            },
            marks: { A: "gq", B: "fp", C: "cn" },
            move_tree: this.makePuzzleMoveTree(["cn"], [], 19, 19),
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
                black: "pdjdfcpqqo",
                white: "dddfdpjqqi",
            },
            marks: { A: "lq", B: "qk", C: "qg" },
            move_tree: this.makePuzzleMoveTree(["qg"], [], 19, 19),
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
                black: "pdqfpjqpoqfqicfcdbfe",
                white: "dpeqfphqnckcccdddffg",
            },
            marks: { A: "ck", B: "cj", C: "ci" },
            move_tree: this.makePuzzleMoveTree(["ck"], [], 19, 19),
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
                black: "pdppqonpeq",
                white: "qnpnlqcpdd",
            },
            marks: { A: "nr", B: "pk", C: "jd" },
            move_tree: this.makePuzzleMoveTree(["pk"], [], 19, 19),
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
                black: "pcmcphqndpfqci",
                white: "qeneppnpjqcdec",
            },
            marks: { A: "pk", B: "dl", C: "cl" },
            move_tree: this.makePuzzleMoveTree(["pk"], [], 19, 19),
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
                black: "pdqpoqjpfq",
                white: "qjdpdndjdd",
            },
            marks: { A: "ql", B: "qf", C: "jc" },
            move_tree: this.makePuzzleMoveTree(["ql"], [], 19, 19),
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
                black: "qdocpq",
                white: "podpdd",
            },
            marks: { A: "np", B: "qo", C: "ql" },
            move_tree: this.makePuzzleMoveTree(["qo"], [], 19, 19),
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
                black: "qcndqnpnpoop",
                white: "ddeqqpqopqqg",
            },
            marks: { A: "qj", B: "qi", C: "qe" },
            move_tree: this.makePuzzleMoveTree(["qi"], [], 19, 19),
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
                black: "qdocqoqppqnq",
                white: "qnpopmqidpdd",
            },
            marks: { A: "fq", B: "qg", C: "lc" },
            move_tree: this.makePuzzleMoveTree(["qg"], [], 19, 19),
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
                black: "qdocldiccjcmjqppnpqq",
                white: "ecddcfcpeqhqrpqnqkqh",
            },
            marks: { A: "jo", B: "io", C: "ho" },
            move_tree: this.makePuzzleMoveTree(["jo"], [], 19, 19),
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
                black: "pdqopqcqcpcnbn",
                white: "jpdqdpdoemcldd",
            },
            marks: { A: "cg", B: "cf", C: "fc" },
            move_tree: this.makePuzzleMoveTree(["fc"], [], 19, 19),
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
                black: "ocqdqgqoqppqnq",
                white: "qioipoqnpmdpdd",
            },
            marks: { A: "fq", B: "dj", C: "fc" },
            move_tree: this.makePuzzleMoveTree(["fc"], [], 19, 19),
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
                black: "dpdogpkpopqopjpdnedc",
                white: "ccdbecdencldbncpcqer",
            },
            marks: { A: "lf", B: "dj", C: "dl" },
            move_tree: this.makePuzzleMoveTree(["lf"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
