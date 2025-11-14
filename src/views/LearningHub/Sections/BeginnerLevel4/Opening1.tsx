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

export class BL4Opening1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09];
    }
    static section(): string {
        return "bl4-opening-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning divide", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on divide", "Divide");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "After the corners are occupied, you can play at the sides. Play at a side that has sufficient space to make a base. Choose the side with the most space. Play preferably at a side between two corners that are both occupied by your opponent. By playing at such a side, you can divide your opponent´s stones. Divide by playing on the third line. If you play a stone at a side, your opponent might attack this stone. You will be attacked from one of both sides. In that case, you would like to defend by making a base at the other side. To ensure this, make certain you can extend you first stone to both sides. When your opponent attacks you from one side, you can extend to the other side. Black to play. Choose the best move to divide, A, B or C.",
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
                white: "codqoqqp",
            },
            marks: { A: "hq", B: "jq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["jqhqmq"], ["hqjq", "lqjq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                white: "dppqqo",
            },
            marks: { A: "gq", B: "jq", C: "mq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                white: "ppnqdqcn",
            },
            marks: { A: "hq", B: "iq", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                white: "qpopdodq",
            },
            marks: { A: "jp", B: "jq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                white: "codqpqqo",
            },
            marks: { A: "iq", B: "jq", C: "kq" },
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
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                white: "cpeqppoqqn",
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
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                white: "ppcpep",
            },
            marks: { A: "jp", B: "kp", C: "jq" },
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
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                black: "cocndmcj",
                white: "pqqofqdpcpdnen",
            },
            marks: { A: "jq", B: "kq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["kq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best move to divide, A, B or C.");
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
                black: "cocndmcl",
                white: "cpdpfpdnenppqn",
            },
            marks: { A: "kp", B: "kq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["kq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
