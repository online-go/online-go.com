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

export class BL1Capture3 extends LearningHubSection {
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
            Page15,
            Page16,
            Page17,
            Page18,
            Page19,
            Page20,
            Page21,
            Page22,
            Page23,
            Page24,
        ];
    }
    static section(): string {
        return "bl1-capture3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 3", "4.12 Capture 3");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture 3", "Capture stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpfpfq",
                white: "eocpdq",
            },
            move_tree: this.makePuzzleMoveTree(["epdodn"], ["epdocodn", "doep", "eqep"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmbncocpdqbrdrcs",
                white: "cndnbododpeqerdses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcqbqcrar"],
                ["bpcqarbq", "cqbp", "crcq", "bqbpcqao"],
                19,
                19,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncodpdqcrer",
                white: "bocpcqeqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["do"],
                ["epdo", "cndobmbp", "brds", "dsbqfrbp", "frds"],
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
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eodpfpdqergrfs",
                white: "codocpcqcrdrdses",
            },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlgmdoeobpdpaqcqbrcrdr",
                white: "dnbococpepdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(["fnfogo"], ["enfo", "foenemfn"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndofoepgpfq",
                white: "bncocpdpeqer",
            },
            move_tree: this.makePuzzleMoveTree(["dn"], ["cmdn"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "foapbpcpcqfqbrerbscsds",
                white: "cmbocodpbqdqarcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["aqas", "asaq", "esaq"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dpepfqfr",
                white: "eocpfpeq",
            },
            move_tree: this.makePuzzleMoveTree(["dqdodn"], ["dodq"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndnaobpcqarcrcs",
                white: "bocoeocpfpdqdrbsds",
            },
            move_tree: this.makePuzzleMoveTree(["bq"], ["brbq", "apaq"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clelbmbodoeohoapcpbqcqcr",
                white: "bncnencodpdqgqhqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foepfpeqer"],
                [
                    "foepfpeqfqer",
                    "foepeqfpfqgp",
                    "foepeqfpgpfngodn",
                    "dnfo",
                    "fpfogofnfmgn",
                    "fpfogofngnfm",
                    "fpfofngo",
                    "epfo",
                ],
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
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blclcododp",
                white: "dneocpepdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bocncmbnbm", "cnbobnbpcqbqbr"],
                ["bocncmbnanbm", "bocnbncm", "cnbobpbnbmcm"],
                19,
                19,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cngobpgpdqeqfq",
                white: "hnepfphpgqhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["hofn", "fognfngm", "fogngmfnenfmflemdmdpeodn", "gnfoeofnfmendnemeldo"],
                19,
                19,
            ),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmfndoeo",
                white: "dnenfoep",
            },
            move_tree: this.makePuzzleMoveTree(["codpdq"], ["dpco"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hneohoephpbqcqdqcrerds",
                white: "dmenbpcpdpeqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fodoco"],
                ["fodocnfpgpgo", "dofo", "fpfogofnfmgn"],
                19,
                19,
            ),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblcldlambnbodoapcpdpaqardras",
                white: "bmcmcncobpbqbrbs",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["aoan"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncodpdqcrer",
                white: "bocpcqeqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["do"],
                ["brdsdocn", "brdscndobmbp", "epdo", "frdscndobmbp"],
                19,
                19,
            ),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbmcnbococpbqar",
                white: "cmdmdndoapdpcqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqaoas"],
                ["aqaobpbq", "bpaoaqbq", "anao", "aoan"],
                19,
                19,
            ),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bobpcqeqdrfr",
                white: "dncpdpdqer",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["bqcr", "fqes", "epes", "dscr"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dodpcq",
                white: "gmdncocpdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epeofoenem"],
                ["epeofoenfnem", "epeoenfo", "eoepfpeq", "eoepeqfp", "crbq", "bqcr"],
                19,
                19,
            ),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmbndncobpdpdqcr",
                white: "doeoepeqbrdr",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["cpcq", "cscq", "bqcq"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpbqcqfqardrfrbses",
                white: "eoapbpcpaqdqeqer",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["brcr", "dscs", "cscr"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gncodogoepfpdq",
                white: "hmcndneofohogphp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fm"],
                ["hnen", "fnfmgmen", "fnfmengm", "gmen"],
                19,
                19,
            ),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmgmgngoepfphphqgr",
                white: "fnfodpgpfqgqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eoeqerdqcq"],
                [
                    "eoeqerdqdrcq",
                    "eoeqdqer",
                    "eqeoendocodndmcn",
                    "eqeoendocodncndm",
                    "eqeoendodnco",
                    "eqeodoen",
                ],
                19,
                19,
            ),
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndncqdqfqergrfs",
                white: "epeqbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpbqbp"],
                ["cpbqaqbpbodp", "bqcp", "dpcpcobo", "bpdpdoco"],
                19,
                19,
            ),
        };
    }
}
