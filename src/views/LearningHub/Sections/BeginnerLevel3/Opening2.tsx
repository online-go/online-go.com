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

export class BL3Opening2 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07, Page08, Page09, Page10];
    }
    static section(): string {
        return "bl3-opening-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning opening", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on opening", "Base");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In the opening you try to stake out as much territory as possible, in particular in the corners and along the sides. You stake out by placing your stones as boundary posts at well-chosen points. You do not want to place your boundary posts too far apart, because you would risk your opponent placing a stone in between. But you do also not want them to be too close to each other. There are rules of thumb to help you. An important one is the base. A base is a formation of two separate stones at the third line, with two empty intersections in between. Here, Black can make a base by playing at A. White will not play in between these two black stones any time soon. With a base, usually you succeed in making a living group. Black to play. Make a base.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "fq",
                white: "codq",
            },
            marks: { A: "iq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
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
                black: "djdndp",
                white: "fq",
            },
            marks: { A: "hq", B: "dr", C: "er" },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
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
                black: "cnbp",
                white: "dpjpfq",
            },
            marks: { A: "bq", B: "cq", C: "cr" },
            move_tree: this.makePuzzleMoveTree(["cq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
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
                black: "fq",
                white: "djdpjqmq",
            },
            marks: { A: "cn", B: "dn", C: "eq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
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
                black: "djcndpeqkq",
                white: "fpfq",
            },
            marks: { A: "ip", B: "hq", C: "iq" },
            move_tree: this.makePuzzleMoveTree(["iq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
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
                black: "cndpkqnq",
                white: "iq",
            },
            marks: { A: "io", B: "fq", C: "gq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
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
            /* cSpell:disable */
            initial_state: {
                black: "pdpp",
                white: "dddq",
            },
            marks: { A: "nc", B: "jj", C: "do" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
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
            /* cSpell:disable */
            initial_state: {
                black: "pdcnpp",
                white: "ddcpdq",
            },
            marks: { A: "ck", B: "en", C: "jq" },
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
            /* cSpell:disable */
            initial_state: {
                black: "dbfcpdpjpp",
                white: "ccdddfdjdp",
            },
            marks: { A: "hc", B: "ic", C: "fe" },
            move_tree: this.makePuzzleMoveTree(["ic"], [], 19, 19),
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
            /* cSpell:disable */
            initial_state: {
                black: "mcpdciqlppfqiqoqdr",
                white: "fcddrdcgqgqjcndpcq",
            },
            marks: { A: "jc", B: "ei", C: "cl" },
            move_tree: this.makePuzzleMoveTree(["cl"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
