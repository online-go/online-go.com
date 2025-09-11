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

export class BL2Capture2 extends LearningHubSection {
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
        return "bl2-capture-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 3", "Capture 2");
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeocpaqcqeqbrcrcsdses",
                white: "bndncobpdpepbqdqerfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpfqdreqgq", "apbofpfqdreqgq"],
                ["fpfqgqfo", "fqfpfrgq", "apboenfq", "frfq"],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqfqdrer",
                white: "bmcmdmdqeqfrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epdpdocpbpcocnbobn", "gqhqepdpdocpbpcocnbobn"],
                [
                    "epdpdocpbpcocnboaobn",
                    "epdpdocpbpcobocn",
                    "epdpdocpcobp",
                    "epdpcpdo",
                    "dpepeofp",
                ],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cododpdqgqerfr",
                white: "gocpepcqeqfqcrdrhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoen"],
                ["fpeoenfo", "fpeofoen", "eofp", "gpfo"],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emfnfodpep",
                white: "fmgmendoeofpfqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["codndmcnbncmcl"],
                ["codndmcnbncmbmcl", "codndmcncmbn", "codncndm", "dnco", "cngo"],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doeoepbqeqbrdrcs",
                white: "cmcobpdpdqcr",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["cqcp"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmanbncncocqeqarbr",
                white: "clcmdnaobodoapcpdpaq",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bqbp"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmenboeocpepdqdr",
                white: "bncndndobpdpcqeqbrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["an"],
                ["coao", "crco", "apco", "aocoancpapcr", "aocoancpcrcs"],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcmcnfndodpepeqgqfr",
                white: "ckdkekfldnencocpcqdqerds",
            },
            move_tree: this.makePuzzleMoveTree(["emdmdl"], ["dmem", "eoem", "elem"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndobpdpaqcqdq",
                white: "bldmdnaobococpbqbr",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["apar", "crar"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofocpdpgp",
                white: "codobpepfphr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fqeqerdqcqdrcr"],
                ["fqeqerdqcqdrdscr", "fqeqerdqdrcq", "fqeqdqer", "eqfqfrgq", "eqfqgqfr"],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmemcnfn",
                white: "elfmgmdneneq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eododpcobocpcq"],
                ["doeofoep", "doeoepfo"],
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
        return _("Black to play. Capture as many stones as possible.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpbqeqfqcrfrfs",
                white: "bocodoepcqdqbrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsescrar", "escsdscrar"],
                ["dscsares", "csaq", "arcsesap", "eoaqfpap", "escsarap"],
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
                black: "bqdqeqcrfrbs",
                white: "cpdpepfpcqfqbr",
            },
            move_tree: this.makePuzzleMoveTree(["dr", "araqdr"], ["erdr", "bpar"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
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
                black: "bmcmdmepdqeqgqfrgr",
                white: "fpcqfqdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eodpdocpbpcocnbobn"],
                [
                    "eodpdocpbpcocnboaobn",
                    "eodpdocpbpcobocn",
                    "eodpdocpcobp",
                    "eodpcpdocodn",
                    "eodpcpdodncobocn",
                    "eodpcpdodncocnbo",
                    "dpeo",
                    "doeoenfo",
                ],
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
                black: "bncodobpepfpbqfqbrer",
                white: "eneogocpdpgpcqgqcrfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqdqfoeqes", "eqdqfoeqdr"],
                ["eqdqdrgreqfs", "foeqgrdscsbs", "foeqesgr", "drgr"],
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
                black: "gmcnhneobpepcqdq",
                white: "emdodpfpeqgqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["enfogofn", "enfofngo", "enfognfngofm", "enfognfnfmgo", "foendnfn", "foenfndn"],
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
                black: "elfmgmdneneocrdr",
                white: "dmemcnfnfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epdodpcobocpcqbpbq"],
                [
                    "epdodpcobocpcqbpapbq",
                    "epdodpcobocpbpcq",
                    "epdodpcocpbo",
                    "epdocodpcpdq",
                    "epdocodpdqcpbpcq",
                    "epdocodpdqcpcqbp",
                    "doep",
                    "dpepeqfpgpgo",
                    "coep",
                ],
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
                black: "fldoeocpfpcqfq",
                white: "hncofogodpep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dnenemfnfm"],
                ["dnenemfngnfm", "dnenfnem", "endncndm", "endndmcn"],
                19,
                19,
            ),
        };
    }
}

class Page19 extends LearningPage {
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
                black: "codqeqdrfrfs",
                white: "fqgqergrds",
            },
            move_tree: this.makePuzzleMoveTree(["gs"], ["escs"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
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
                black: "clbmbndnenfnbocofobpdpepbq",
                white: "cmdmemfmcngndogocpcqdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
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
                black: "cpgphpeqfqhqbrdrfrfs",
                white: "epfpdqgqgrgs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esercrdscs"],
                ["eserdscs", "eres", "crhr"],
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
                black: "eofocpdpgpbqcrgr",
                white: "codoepcqeqbrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpdqdrcqcs", "bpdqdrcqaq"],
                ["dqbp", "aqdqbpdr"],
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
                black: "elgmdoeocpcqfqdrgr",
                white: "dnbocogodpep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["enfofpfn", "enfofnfp", "foenfnem", "foenemfn", "fpfn"],
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
                black: "alcldlelemcndnbpcqbrdrcs",
                white: "bmcmdmenfndodpdqfqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bococp", "cobnbo"],
                ["bocobncp", "bnco", "cobnanbo"],
                19,
                19,
            ),
        };
    }
}
