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

export class BL1Capture2 extends LearningHubSection {
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
        return "bl1-capture2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 2", "4.11 Capture 2");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture 2", "Capture stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dodpbqeqfq",
                white: "dneoepdq",
            },
            marks: { triangle: "dodp" },
            move_tree: this.makePuzzleMoveTree(
                ["cpcobocncm"],
                ["cpcobocnbncm", "cpcocnbobncq", "cpcocnbobpcq", "cocp"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnfncodobpbqcqdqerfr",
                white: "cmbnbocpdpepeq",
            },
            marks: { triangle: "cncodo" },
            move_tree: this.makePuzzleMoveTree(
                ["en"],
                ["eodndmen", "eodnendmdlemfmelekfl", "dneo"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epfpdqgqdrgrdsfsgs",
                white: "cpdpcqeqcrfrcs",
            },
            marks: { triangle: "dqdrds" },
            move_tree: this.makePuzzleMoveTree(["es"], ["eres"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elfmfnhndoeohofphpfqer",
                white: "emencofogoepeqdr",
            },
            marks: { triangle: "doeo" },
            move_tree: this.makePuzzleMoveTree(
                ["dndpdqcpbpcqcr"],
                [
                    "dndpdqcpbpcqbqcr",
                    "dndpdqcpcqbpbogn",
                    "dndpdqcpcqbpbqgn",
                    "dndpcpdq",
                    "dpdndmcnbncmcldl",
                    "dpdndmcnbncmdlgn",
                    "dpdndmcnbncmbmdl",
                    "dpdndmcncmbnbmgn",
                    "dpdndmcncmbnbogn",
                    "dpdncndm",
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "flgmdnhndodpepfp",
                white: "cmdmcncocpgpdqeqfqgq",
            },
            marks: { triangle: "dndodpepfp" },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["enfofngo", "enfogofn", "foenfnem", "foenemfn", "eoenfogofnem"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmemfmbncnfnbodoeogobpgpbqcqfqgqer",
                white: "dlelflcmgmgncofocpdpepfp",
            },
            marks: { triangle: "dmemfmfndoeo" },
            move_tree: this.makePuzzleMoveTree(["dn"], ["endn"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnenfofpfq",
                white: "fneogoepgpgq",
            },
            marks: { triangle: "fofpfq" },
            move_tree: this.makePuzzleMoveTree(
                ["freqdq", "eqfrergrhr", "eqfrgrerdr"],
                ["freqerdq"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlcmfmeobpepbqcqdqerfr",
                white: "bocogocpdpfpeqfqhqgr",
            },
            marks: { triangle: "eoep" },
            move_tree: this.makePuzzleMoveTree(
                ["en"],
                ["fnenemel", "fnendnem", "dnfn", "foen", "doen"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpeqdrer",
                white: "dobpepdq",
            },
            marks: { triangle: "cpdp" },
            move_tree: this.makePuzzleMoveTree(
                ["cqcocn"],
                ["cqcobocndnbq", "cqcobocnbnbq", "cocq"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hmcoeofocpfpcqeqdrer",
                white: "cndndodpepgpdqfqhqfr",
            },
            marks: { triangle: "eofofp" },
            move_tree: this.makePuzzleMoveTree(
                ["gnfnfm"],
                ["fngognho", "fngohogn", "engn", "gofnfmgn", "gofngnfm"],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmdpepfqgq",
                white: "eofpcqdqeq",
            },
            marks: { triangle: "dpep" },
            move_tree: this.makePuzzleMoveTree(
                ["docpbpcocn", "docpcobpbobqbr", "docpcobpbqbobn"],
                [
                    "docpbpcobocn",
                    "cpdodncobocn",
                    "cpdodncocnbobnfo",
                    "cpdodncocnbobpfo",
                    "cpdocodn",
                    "cofogpdodnen",
                    "cofogpdoendn",
                    "cofodogp",
                    "cofocpgp",
                ],
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
        return _("White to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hodpepeqhq",
                white: "doeocpcqdqer",
            },
            marks: { triangle: "dpepeq" },
            move_tree: this.makePuzzleMoveTree(
                ["fpfqgqfrgr"],
                [
                    "fpfqgqfrfsgrgphr",
                    "fpfqgqfrfsgrhrgp",
                    "fpfqfrgq",
                    "fqfpgpfofngo",
                    "fqfpgpfogofn",
                    "fqfpfogp",
                ],
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
                black: "bmbncodpbqdqcr",
                white: "cndndoepeqdrer",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["bocpbpcq", "cqcp"], 19, 19),
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
                black: "bqdqfqarcrergr",
                white: "apbpcpdpepaqeq",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], [], 19, 19),
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
                black: "dpephpfqgq",
                white: "fmcpfpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eododncobocncm"],
                ["eododncobocnbncm", "eododncocnbo", "eodocodn", "doeoenfo", "doeofoen"],
                19,
                19,
            ),
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
                black: "codocpepfphpcqdrds",
                white: "cndnenboeobpbqarcrcses",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], ["dpdq", "erdq"], 19, 19),
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
                black: "fpgpgqdrergrcsfsgs",
                white: "cqdqeqfqcrfrbs",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses"], 19, 19),
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
                black: "clcmdnencodpepcqcr",
                white: "dmemfneofofpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
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
                black: "bqcqfqardrfrbses",
                white: "eoapbpcpfpaqdqeqer",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["brcr", "cscr", "dscs"], 19, 19),
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
                black: "gndoeobpepbqcqdqerds",
                white: "cnenbococpdpeqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fo"],
                ["dnfo", "gofnfodnemdmdlcmbmclckel", "fpfo", "gpfo"],
                19,
                19,
            ),
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
                black: "gmboeoapcpepbqdqdr",
                white: "dmcododpfpeqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fndncn"],
                ["fndnencn", "foenfnem", "enfogofn"],
                19,
                19,
            ),
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
                black: "bndnbocpdpeqgqfr",
                white: "cobpbqcqdqdrerfs",
            },
            move_tree: this.makePuzzleMoveTree(["ep"], ["doep", "grfq"], 19, 19),
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
                black: "dmemdnfndofoepcqdqeqfqgq",
                white: "dlelflcmgmcngncoeogocpdpfpgp",
            },
            move_tree: this.makePuzzleMoveTree(["fm"], [], 19, 19),
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
                black: "dndoepdqfq",
                white: "dmcncocpdpfp",
            },
            move_tree: this.makePuzzleMoveTree(["eo"], ["eneo"], 19, 19),
        };
    }
}
