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

export class BL3Opening4 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-opening-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning extension", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on extension", "Extension");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you have a wall of stones, which runs from the side towards the centre, like the black wall here, the rule of thumb now states that you can play an extension from that wall, which is two intersections wider than the length of that wall. In this example the length of the wall is three stones, so you can play an extension, which is at a distance of five points from that wall, e.g. at A. Black to play. Play a good extension.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "eoepeq",
                white: "cncpdq",
            },
            marks: { A: "jp" },
            move_tree: this.makePuzzleMoveTree(["jp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best move, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 7, left: 0, bottom: 18, right: 14 },
            /* cSpell:disable */
            initial_state: {
                black: "codpfp",
                white: "cndn",
            },
            marks: { A: "cj", B: "ck", C: "cl" },
            move_tree: this.makePuzzleMoveTree(["cj"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "jq",
                white: "coppdqlq",
            },
            marks: { A: "fq", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "ppfqdr",
                white: "cndpcq",
            },
            marks: { A: "hq", B: "iq", C: "jq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "codqnqpr",
                white: "pnppfqiqqq",
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
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "codqmq",
                white: "qpoq",
            },
            marks: { A: "hq", B: "iq", C: "jq" },
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
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qogqpq",
                white: "cpeqlq",
            },
            marks: { A: "jp", B: "iq", C: "jq" },
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
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qpeqoq",
                white: "cocqjqmq",
            },
            marks: { A: "hp", B: "gq", C: "hq" },
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
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "epfpfq",
                white: "cncpppdqeq",
            },
            marks: { A: "iq", B: "jq", C: "kq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "jq",
                white: "coppdqnq",
            },
            marks: { A: "fq", B: "gq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["gq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "qodpcqdqpq",
                white: "cmcocpbqkqnqbr",
            },
            marks: { A: "gq", B: "hq", C: "iq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "pnppfq",
                white: "cpkpdqnq",
            },
            marks: { A: "ip", B: "hq", C: "iq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 18 },
            /* cSpell:disable */
            initial_state: {
                black: "npnq",
                white: "pncoppdqoq",
            },
            marks: { A: "jq", B: "kq", C: "lq" },
            move_tree: this.makePuzzleMoveTree(["jq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best extension, A, B or C.");
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
                black: "qkqnlprplq",
                white: "conpppdqmqqq",
            },
            marks: { A: "gq", B: "hq", C: "iq" },
            move_tree: this.makePuzzleMoveTree(["hq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
