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

export class BL2ThrowIn1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-throw-in-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning throw in 1", "Throw In 1");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on throw in 1",
            "Capture after throwing in",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The three marked stones have three liberties, so Black can not put them in atari. If Black tries to capture them by playing at A, White will connect his stones at B. But if Black sacrifies a stone at B (thrown in), White loses a liberty by capturing this stone. Next, Black can put the stones in atari and capture them. Black to play. Capture stones by throwing in.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblbpcmcncocpdl",
                white: "apbmbnbobqcqdqeqfp",
            },
            marks: { triangle: "bmbnbo", A: "am", B: "ao" },
            move_tree: this.makePuzzleMoveTree(["aoanamaoaq"], ["amao"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmemdngncogofpeqfq",
                white: "dofobpcpepgpdqgqgr",
            },
            move_tree: this.makePuzzleMoveTree(["eoenfn"], ["fneo"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofogodpgpdqhqdr",
                white: "cnendocpepfpcqgqcrfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fqeqerfqgr", "fqeqerfqfs"],
                ["eqfq", "grer"],
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
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cngocpgpcqfqdrerfr",
                white: "eofphpbqdqeqgqbrcrgrds",
            },
            move_tree: this.makePuzzleMoveTree(["epdpdoepen"], ["dpep", "foep"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emcnendocpgpcqhqcrerhrds",
                white: "flfmfnineodpfpdqdr",
            },
            move_tree: this.makePuzzleMoveTree(["epeqfq"], ["eqep"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fnfohodpephpdqhqdrgr",
                white: "cmdoeocpfpgpcqgqcrfr",
            },
            move_tree: this.makePuzzleMoveTree(["fqeqgofqfs", "fqeqgofqer"], ["gofq"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofogocpdpgpcqhqgr",
                white: "bncodobpepfpdqgqbrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqfqfreqesdrcr", "eqfqfreqdr"],
                ["fqeq", "dreq"],
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
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdnfnboeobpfpcqcrdr",
                white: "cocpepbqdqfqgqhqbrer",
            },
            move_tree: this.makePuzzleMoveTree(["dpdocn"], ["cncs", "docs"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emencodobpgpbqfqbrdrerfr",
                white: "eogohocpfpcqdqeqgqhq",
            },
            move_tree: this.makePuzzleMoveTree(["epdpcr"], ["dpep", "crep"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfnhneogodpdqhqdrer",
                white: "dmdndofocpepcqeqgqcrfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fqfpgpfqgr", "fqfpgpfqfs"],
                ["fpfq", "gpes"],
                19,
                19,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeofocpgpcqgqiqcrdr",
                white: "cmcncobpdpepbqdqbrer",
            },
            move_tree: this.makePuzzleMoveTree(["eqfqfpeqfr", "eqfqfpeqes"], ["fpeq"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eneodpfpcqfqcrcsds",
                white: "dlcmhncodoepeqgqhqiqdrfr",
            },
            move_tree: this.makePuzzleMoveTree(["eresdqergr"], ["dqer"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture stones by throwing in.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elenfncodocpgpbqfqerfrds",
                white: "bncndneodpepfpcqarbrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqeqfo", "dqcrfo"],
                ["crdq", "fobp", "eqdq"],
                19,
                19,
            ),
        };
    }
}
