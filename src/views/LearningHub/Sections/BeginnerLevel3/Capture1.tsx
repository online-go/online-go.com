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

export class BL3Capture1 extends LearningHubSection {
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
        return "bl3-capture-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 1", "Capture");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture 1", "Capture stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmemcncodpfpdq",
                white: "clcmbndndo",
            },
            move_tree: this.makePuzzleMoveTree(["cpbobp"], ["cpboaobp", "bocp"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmgndobpdpgphpcqhqbrcr",
                white: "cncocpepbqdqeqgqgr",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["dneo", "eodn", "boaq"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aqbqcqdqgqerfr",
                white: "coepeqarbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bp", "cp", "dp"], ["apbp"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ckelbmfmbnbodocpcqcr",
                white: "cmcncodpdqfqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eneofoepeq", "eneofoepfp"],
                [
                    "eneodnfo",
                    "eneofnfogodndmemgndl",
                    "eodnendm",
                    "eodndmen",
                    "eodnemdm",
                    "dneo",
                    "fnen",
                ],
                19,
                19,
            ),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dsfrergqdqcqbqdpdocncm",
                white: "drcrbreqepeocobodn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqarasapbparcp", "aqarasapcparbp", "aqarbpapcpaqao", "bp", "cp"],
                ["aqarapbs", "aqarasaparcs", "aqarbpapcpaqasbs", "apendmemdlfo", "cses"],
                19,
                19,
            ),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hnbpephpaqcqdqhqbr",
                white: "cnbocpdpeqfq",
            },
            move_tree: this.makePuzzleMoveTree(["fo"], ["eofpgpfofngo", "fpeo"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcncodpaqbqdqfqbrerasbs",
                white: "bnbobpcpcqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["cs", "ap"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmhndoeocphpcqdqeqgqhq",
                white: "dmcncodpepfpgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["foenemfn", "foenfmfn", "foenfnem", "enfogofn", "enfofngo", "enfogngo"],
                19,
                19,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlbmbncocpdpcqarbr",
                white: "cndnbobpbqeqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ep"],
                [
                    "dqepfpeoenfo",
                    "dqepfpeofoen",
                    "dqepfpeofnao",
                    "doepfpeoenfo",
                    "doepfpeofoen",
                    "doepfpeofnao",
                    "bsaq",
                    "aqao",
                ],
                19,
                19,
            ),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bogohoapcpepcqeqfqcrdr",
                white: "cmbncododpdqgqerfr",
            },
            move_tree: this.makePuzzleMoveTree(["fo"], ["eofp", "fpeo"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elcmcndoeofobpcpfqdrer",
                white: "dnenfnbocogodpeq",
            },
            move_tree: this.makePuzzleMoveTree(["fp"], ["epfp", "cqdq"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlelbmcmdmcpdpeqfqhqcrdr",
                white: "emfmdneogoepbqcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobpap"],
                ["bobpcoaq", "bpcocnbobnan", "cobpboaq", "cobpbrbo"],
                19,
                19,
            ),
        };
    }
}
