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

export class BL4Opening2 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl4-opening-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning attack", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on attack", "Attack");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In response to a dividing stone you can decide to attack it. Attack at the side where your opponent can extend the easiest. If you have a stone on the third line at one side of the dividing stone and a stone on the fourth line on the other side, attack from the stone on the fourth line. This defends the open side. If you have a strong group at one side, e.g. because you played a corner enclosure there, and is the other corner weaker, then play from the weak corner. This makes your weak group stronger. Black to play. Choose the best side to attack, A or B.",
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
                black: "dpoqqp",
                white: "jq",
            },
            marks: { A: "hq", B: "lq" },
            move_tree: this.makePuzzleMoveTree(["hq"], ["lq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "qpoqepcp",
                white: "jq",
            },
            marks: { A: "gq", B: "hq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "dqcopqqo",
                white: "jq",
            },
            marks: { A: "hp", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "ppepcp",
                white: "jq",
            },
            marks: { A: "fq", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "qpoqdqco",
                white: "iq",
            },
            marks: { A: "kp", B: "kq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["kq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "pqqodpfpco",
                white: "kq",
            },
            marks: { A: "ip", B: "iq", C: "mq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "dpfpqpoq",
                white: "jq",
            },
            marks: { A: "kp", B: "lq", C: "mq" },
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
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "ppdqco",
                white: "jq",
            },
            marks: { A: "fq", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to attack, A, B or C.");
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
                black: "cpeqqpoq",
                white: "jqcndkqnqk",
            },
            marks: { A: "jo", B: "lq", C: "mq" },
            move_tree: this.makePuzzleMoveTree(["lq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
