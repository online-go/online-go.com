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

export class BL4Skills4 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07];
    }
    static section(): string {
        return "bl4-skills-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning prevent atari", "Skills");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on prevent atari", "Prevent atari");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "When your opponent puts you in atari, you're often forced to respond. This presents your opponent with a good opportunity to strengthen their position or give your pieces a bad shape. In this example, White can put a stone in atari by playing at A. If you then protect that stone, you'll be left with bad shape, and White will take the corner. You're better off playing at A yourself to prevent the atari. Playing at B is a step too far. White can still play atari and then capture your stone at B. Black to play. Prevent atari. Choose the best move, A or B.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdoep",
                white: "bpclcnco",
            },
            marks: { A: "cq", B: "bq" },
            move_tree: this.makePuzzleMoveTree(["cq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent atari. Choose the best move, A or B.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqdpco",
                white: "crdqeqgq",
            },
            marks: { A: "bp", B: "bq" },
            move_tree: this.makePuzzleMoveTree(["bq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent atari. Choose the best move, A or B.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "crcqcpdo",
                white: "eodpdqdrfphp",
            },
            marks: { A: "cn", B: "dn" },
            move_tree: this.makePuzzleMoveTree(["dn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent atari. Choose the best move, A or B.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dqepdofqgq",
                white: "fpfoeodnemdk",
            },
            marks: { A: "cn", B: "co" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent atari. Choose the best move, A or B.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqbpcocl",
                white: "crdqeqhq",
            },
            marks: { A: "bq", B: "br" },
            move_tree: this.makePuzzleMoveTree(["br"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent atari. Choose the best move, A or B.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dqdpcofphq",
                white: "cndndodk",
            },
            marks: { A: "bn", B: "bo" },
            move_tree: this.makePuzzleMoveTree(["bo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Prevent atari. Choose the best move, A or B.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dneneodpdqer",
                white: "crdrcqcpcodocm",
            },
            marks: { A: "fp", B: "fq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
