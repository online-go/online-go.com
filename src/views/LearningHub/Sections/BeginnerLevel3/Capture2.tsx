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

export class BL3Capture2 extends LearningHubSection {
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
        return "bl3-capture-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning chase down", "Capture");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on chase down", "Chase down");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcmbncncocpcq",
                white: "ambmanbobpbqcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoapalaobr"],
                ["alao", "braraoapalbsaoan"],
                19,
                19,
            ),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bndndodpaqdqarbrcr",
                white: "bmcmdmcnaoboapcpbqcqfqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["co"], ["anam"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofocpgpcqgqcrdr",
                white: "bocobpdpepbqdqbrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqfqfpeqfr", "eqfqfpeqes"],
                ["fpeqfrds", "fpeqescs", "fpeqfqfrgrcs", "fpeqfqfresgrhrcs", "frds"],
                19,
                19,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepgpeqgqfrhresfs",
                white: "dmbodofobpfpbqdqfqcrercsds",
            },
            move_tree: this.makePuzzleMoveTree(["cqdrbr"], ["drcq", "brcq"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbocodpepcqeqfqbr",
                white: "bmcmdndoeofobpcpfphpbqgqcr",
            },
            move_tree: this.makePuzzleMoveTree(["apdqaq", "aqdqap"], ["drdq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdmdndoapcpaqbqcqdqeqgq",
                white: "cldlelbmancnbocoeobpdpep",
            },
            move_tree: this.makePuzzleMoveTree(["aobnbl"], ["blem", "enfn"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codoeofogocpgpdqgqergrgs",
                white: "bobpepfpbqcqfqdrfres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fseqdpercr", "dpfseqdscr"],
                ["eqdp", "creqfsdp", "creqdpfs"],
                19,
                19,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmandncododpdqarbrcr",
                white: "ckdlbmcmcnboapcpaqbqcq",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["bnam"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneocpdpfpfqcrdrfrgrhs",
                white: "codobpepbqeqbrerbsdsgs",
            },
            move_tree: this.makePuzzleMoveTree(["esfsdq"], ["dqes", "fscq", "cscq"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdmemfnfocpfpcqdqeqbr",
                white: "blclflbmfmbndnencoeobpdpepbq",
            },
            move_tree: this.makePuzzleMoveTree(["cn"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodpepeqcrdr",
                white: "apbpcqdqbrerfr",
            },
            move_tree: this.makePuzzleMoveTree(["bqaqcpbqbs"], ["cpbq", "bsds"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible by chasing them down.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldmcndofocpepcqfresfs",
                white: "bnbocodpdqfqgqcrerhrds",
            },
            move_tree: this.makePuzzleMoveTree(["eqdrbr"], ["breq"], 19, 19),
        };
    }
}
