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
/* cSpell:disable */

import { GobanConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class BL2Defense1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-defense-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning defense 1", "Defense 1");
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
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dobpcpdpfq",
                white: "cmdnbocoap",
            },
            marks: { triangle: "ap" },
            move_tree: this.makePuzzleMoveTree(["aq"], ["bqaq"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndncobpcqcr",
                white: "bodofocpdpdqdr",
            },
            marks: { triangle: "bo" },
            move_tree: this.makePuzzleMoveTree(["bqbnbm"], ["bnbqaobr"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocqdq",
                white: "dmcpdpep",
            },
            marks: { triangle: "cp" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bqbp"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndpeq",
                white: "fpfqer",
            },
            marks: { triangle: "er" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["dqdr"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocpdpfq",
                white: "ckbncodoeo",
            },
            marks: { triangle: "bn" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["apbqbpdr", "aoan"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcncpbqdq",
                white: "dndodpeq",
            },
            marks: { triangle: "eq" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["erdrcqfr", "crdr"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdnbpcpdpcrdrdses",
                white: "epcqdqeqergrfs",
            },
            marks: { triangle: "cq" },
            move_tree: this.makePuzzleMoveTree(["brbqaq"], ["brbqaraq", "bqbr"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnbocpcqeq",
                white: "clbmancnco",
            },
            marks: { triangle: "an" },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aobpamap", "bpao"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fodpepbqcqeqer",
                white: "cndobpcpdqcrdr",
            },
            marks: { triangle: "cr" },
            move_tree: this.makePuzzleMoveTree(["br"], ["aqbr"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "apbpcqeqfqdrfr",
                white: "cnaobocpdpdqer",
            },
            marks: { triangle: "dp" },
            move_tree: this.makePuzzleMoveTree(["br"], ["crbq", "bqcresbr"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dobpcpdpaqfq",
                white: "cmdnaobocoap",
            },
            marks: { triangle: "ao" },
            move_tree: this.makePuzzleMoveTree(["bq", "br"], [], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Play a good defense in reply of White's marked move.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldmcnco",
                white: "bmcmdnencpdp",
            },
            marks: { triangle: "bm" },
            move_tree: this.makePuzzleMoveTree(
                ["blbnbo"],
                ["bnblckbkcjbp", "bnblckbkbjcj", "bnblbkdl"],
                19,
                19,
            ),
        };
    }
}
