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

export class BL4Opening5 extends LearningHubSection {
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
        return "bl4-opening-5";
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "nq",
                white: "dpqppq",
            },
            marks: { A: "cn", B: "fq", C: "kq" },
            move_tree: this.makePuzzleMoveTree(["kq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "iqqoqnpmqlnl",
                white: "npppqponpndqcocl",
            },
            marks: { A: "fq", B: "gq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["lq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "ppqngq",
                white: "lqeqcp",
            },
            marks: { A: "jq", B: "nq", C: "oq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "fq",
                white: "cpdqhqpqqo",
            },
            marks: { A: "fo", B: "jq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "opnpnqcpcocm",
                white: "oqpqqpqoeqdodn",
            },
            marks: { A: "om", B: "iq", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "dp",
                white: "pqpo",
            },
            marks: { A: "hq", B: "jq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "nqfq",
                white: "dpdnpppn",
            },
            marks: { A: "ip", B: "jp", C: "kp" },
            move_tree: this.makePuzzleMoveTree(["jp"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "dqco",
                white: "pp",
            },
            marks: { A: "gq", B: "hq", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "oqop",
                white: "pqqpqnlpdqdo",
            },
            marks: { A: "on", B: "hq", C: "mq" },
            move_tree: this.makePuzzleMoveTree(["on"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "ppqmhqdp",
                white: "jqmq",
            },
            marks: { A: "ho", B: "fp", C: "oq" },
            move_tree: this.makePuzzleMoveTree(["oq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "oqlqdpeqdn",
                white: "qpqmfqfp",
            },
            marks: { A: "fn", B: "ip", C: "fr" },
            move_tree: this.makePuzzleMoveTree(["ip"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "dppnqppqoq",
                white: "nqnpop",
            },
            marks: { A: "nn", B: "kp", C: "nr" },
            move_tree: this.makePuzzleMoveTree(["kp"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "ppeqdqcpcn",
                white: "epfqgp",
            },
            marks: { A: "jp", B: "lq", C: "nq" },
            move_tree: this.makePuzzleMoveTree(["jp"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "fqpqpppopnpmnmnp",
                white: "dpcnqqqpqoqnqmpkoo",
            },
            marks: { A: "hp", B: "ip", C: "iq" },
            move_tree: this.makePuzzleMoveTree(["ip"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qnqk",
                white: "cndpeqoqqp",
            },
            marks: { A: "iq", B: "jq", C: "kq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qpdpfpcpdnen",
                white: "oqcocndmcl",
            },
            marks: { A: "iq", B: "jq", C: "kq" },
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "dqcqcpcnpqqo",
                white: "dpeqfpjq",
            },
            marks: { A: "lp", B: "lq", C: "mq" },
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
            bounds: { top: 9, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "iq",
                white: "ppnpdqco",
            },
            marks: { A: "fq", B: "lq", C: "mq" },
            move_tree: this.makePuzzleMoveTree(["lq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
