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

export class BL4Opening3 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "bl4-opening-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning extend", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on extend", "Extend");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Normally you extend your dividing stone by making a base with a 2-points extension. Sometimes you can extend your stone and at the same time attack a corner. Then, a 3-points extension might be more effective, like in this example. Black to play. Choose the best move to extend and attack the corner after White's 2.",
        );
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
                black: "jq",
                white: "dplqpp",
            },
            marks: { 1: "jq", 2: "lq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If there is not enough space for a 2-points jump, play a 1-point jump, as in this example. Black to play. Choose the best move to extend after White's 2.",
        );
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
                black: "kq",
                white: "dpfqoqqpiq",
            },
            marks: { 1: "kq", 2: "iq" },
            move_tree: this.makePuzzleMoveTree(["mq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "jq",
                white: "codqpqqohq",
            },
            marks: { A: "lq", B: "mq", C: "nq" },
            move_tree: this.makePuzzleMoveTree(["mq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "jq",
                white: "dqcopplq",
            },
            marks: { A: "fq", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "jq",
                white: "dqcopphq",
            },
            marks: { A: "lq", B: "mq", C: "nq" },
            move_tree: this.makePuzzleMoveTree(["nq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "jq",
                white: "cpeppqqohq",
            },
            marks: { A: "lq", B: "mq", C: "nq" },
            move_tree: this.makePuzzleMoveTree(["mq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "jq",
                white: "cpeqhqppnp",
            },
            marks: { A: "lp", B: "lq", C: "mq" },
            move_tree: this.makePuzzleMoveTree(["lq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "qnqkcndkjq",
                white: "cpeqoqqplq",
            },
            marks: { A: "jo", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "eqdpdnkq",
                white: "pqqoiqfqfp",
            },
            marks: { A: "ko", B: "mq", C: "nq" },
            move_tree: this.makePuzzleMoveTree(["nq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to extend, A, B or C.");
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
                black: "jq",
                white: "dpqpoplq",
            },
            marks: { A: "fq", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
