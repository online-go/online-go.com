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

export class BL4Cut1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-cut-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning cut", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on cut", "Cut");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The knight's move (keima) is good shape, but can be cut. Black to play. Playing at A is the best way to cut the white keima. If Black plays at B, White ends with good shape. Cut the white stones.",
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
                black: "dp",
                white: "dnfo",
            },
            marks: { A: "en", B: "eo" },
            move_tree: this.makePuzzleMoveTree(["eneodocnem"], ["eoenfnfp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "In this position, it is better to cut the white keima at B. Black to play. Cut the white stones.",
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
                black: "ep",
                white: "dnfo",
            },
            marks: { A: "en", B: "eo" },
            move_tree: this.makePuzzleMoveTree(["eoenfn"], ["eneodo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black can cut the marked knight's move shape by playing at A. White can not connect underneath. Black to play. Cut the white stones.",
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
                black: "bncocpcqdmdneneogm",
                white: "bmckcmcndodpeqgphqip",
            },
            marks: { A: "fq", triangle: "eqgp" },
            move_tree: this.makePuzzleMoveTree(["fqfrerdrdqesep"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Cutting the knight's move does not always succeed. Here, White can defend against Black 1. White to play. Defend against the black cut.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "bqbrcncpcqdoeoepfpfripiqjnkq",
                white: "bscrdpdqergqhmhohp",
            },
            marks: { 1: "fr" },
            move_tree: this.makePuzzleMoveTree(["grfsfqeqdr"], ["fqeqdrgr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "cpdpep",
                white: "cqdqfq",
            },
            move_tree: this.makePuzzleMoveTree(["eqerfrgrdrfscr", "eqerdrcrfr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "brcqbpcocndngrfqhphnirclgq",
                white: "crdrerfrdpdoenfoemgl",
            },
            move_tree: this.makePuzzleMoveTree(["epeodq"], ["dqeqepfp", "eqdq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "arbrcrdrcqanbncndnenfofpgn",
                white: "bqapcpcoboeodqeqergqhpip",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], ["fqfr", "epdp", "dodp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "drdqcqcmdmdndodpgq",
                white: "crbrbqcocnbmclck",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpboaoanap"],
                ["bpboapcp", "bpbocpap", "bpboaqcp", "cpbp", "bobn"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bqcqdrerfqfpcncmdk",
                white: "epeqdqcpbpfoengohp",
            },
            move_tree: this.makePuzzleMoveTree(["doeodp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "dpdoeobrbqbpbscsfofrgogmcq",
                white: "dsdrdqcoboapdnencmhqhrepfqiocpcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eseqgqgrgp", "eseqgqgpgr", "gqgreseqgp"],
                ["gqgrgpfs", "ereq", "grgq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "cqdpepfpgqhpbp",
                white: "brcrdqeqgrhriq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["freresdsfs"],
                ["freresdsfqfs", "frerfsfq", "frerfqfs", "frergsfq", "fqfr", "erfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "dqeqercpcodogpdl",
                white: "dpephqhphofnhmbpbqcqdrcsbr",
            },
            move_tree: this.makePuzzleMoveTree(["foeoen"], ["eofpfofq", "fpeo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bqcodoepfpgphpiqiocl",
                white: "irjrhqgqdpdqerkq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frgreqdrgs"],
                [
                    "frgreqdrfsfq",
                    "frgreqdresfq",
                    "frgrfqfs",
                    "frgrfsfq",
                    "frgrgsfq",
                    "frgresfq",
                    "fqfr",
                    "eqfr",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bsbqcqdpeqepfqen",
                white: "csdrdqcpcocmfsgrhqhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eserfrdscr"],
                ["esercrfr", "eres", "dses", "fres", "crer"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "dodnfnbobncldrerfrgrhqiq",
                white: "cqcpcreqeogphpgnhngldsel",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epdpfpfqfogqdq", "epfpdpdqfq", "epfpdpfqdq"],
                [
                    "epdpfpfqdqfo",
                    "epdpfpfqgqfo",
                    "dpdqepfq",
                    "dpdqfqep",
                    "dqdpfqep",
                    "dqdpfpfo",
                    "fpepfofqgqenfmem",
                    "fpepfqfo",
                    "fqep",
                    "fofpdpdq",
                    "fofpdqdp",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "brcqdrdpdocnfp",
                white: "cocpbpbqcmdmfm",
            },
            move_tree: this.makePuzzleMoveTree(["bn"], ["bmbn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "cqcpcnfogohofrgrgqhqdkcmdl",
                white: "ereqfqeofnengnelhlek",
            },
            move_tree: this.makePuzzleMoveTree(["epdpfpdodq"], ["fpep", "dpep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "dodqeqfqdngpfoipiriqhm",
                white: "crcqcpcocmdlgqgres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsfrdserdr", "dsdrfserfr"],
                ["fsfrerds", "fsfrdrds", "dsdrerfs", "dsdrfrfs", "frfs", "drds", "erfs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bqbpcodpeperfqdodl",
                white: "brcqarcpdqdrfrgqgpgngr",
            },
            move_tree: this.makePuzzleMoveTree(["dscses"], ["eseq", "eqes", "fseq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bndndodpeqepgqgn",
                white: "cqdqbocncmdlfldk",
            },
            move_tree: this.makePuzzleMoveTree(["bpcpco"], ["cobp", "cpbp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bpcpdpepfpgphndmbm",
                white: "boapbqcqergqhqip",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfqdr", "drdqfrfqeq"],
                ["fqfr", "dqdr", "eqdr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Cut the white stones.");
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
                black: "bqbocpdpepfpfqcm",
                white: "brcrcqdqfrgqgpgniq",
            },
            move_tree: this.makePuzzleMoveTree(["ereqgr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
