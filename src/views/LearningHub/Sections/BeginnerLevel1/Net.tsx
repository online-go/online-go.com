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

export class BL1Net extends LearningHubSection {
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
        return "bl1-net";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture in a net", "4.8 Net");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capture in a net",
            "Capture in a net",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dgcggfffefhecegddd",
                white: "hgggfgeghfdfeedebd",
            },
            marks: { triangle: "dfeede" },
            move_tree: this.makePuzzleMoveTree(
                ["edfege"],
                [
                    "edfefdge",
                    "fdcfbfcdbeeddcec",
                    "fdcfbfcdbeedecdc",
                    "fdcfbfcdedbe",
                    "fdcfedbf",
                    "feedecfdgefc",
                    "cffdfcge",
                    "cffdedfegefc",
                ],
                9,
                9,
            ),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gdceheefffgfcgdg",
                white: "bddedfhfegfggghg",
            },
            marks: { triangle: "dfde" },
            move_tree: this.makePuzzleMoveTree(
                ["ddeeed"],
                ["edddcddc", "eddddccd", "eedd", "cfdd"],
                9,
                9,
            ),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gdheefffgfcgdg",
                white: "bddfhfegfggghg",
            },
            marks: { triangle: "df" },
            move_tree: this.makePuzzleMoveTree(
                ["cededdeeed"],
                ["decfbfce", "cfdecddddcceccbcbebf", "ddce"],
                9,
                9,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edgdffgfdgegbhchdh",
                white: "beeeefbgfggghgehfi",
            },
            marks: { triangle: "efee" },
            move_tree: this.makePuzzleMoveTree(
                ["defege"],
                [
                    "defefdgehfhe",
                    "fede",
                    "dfdececdcfdd",
                    "cddddefddcfefcgehfhe",
                    "cddddefddcfegefc",
                    "cddddcfdecfegefc",
                    "cddddcfdecfefcgehfhe",
                ],
                9,
                9,
            ),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stone in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gdffgfdgegbhchdh",
                white: "beefbgfggghgehfi",
            },
            marks: { triangle: "ef" },
            move_tree: this.makePuzzleMoveTree(
                ["deeeed"],
                ["dddecdce", "eddeddcd", "eedfcfdeddce", "eedfcfdecedd", "eedfdecf", "dfee"],
                9,
                9,
            ),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ccecbfcfdfefdgehfhgh",
                white: "gehebgcgegfgbhdhhhci",
            },
            marks: { triangle: "fgeg" },
            move_tree: this.makePuzzleMoveTree(["gf"], ["ggff", "ffgghggf", "ffgggfhghfif"], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "decfgfdgeg",
                white: "fcdfefgghg",
            },
            marks: { triangle: "efdf" },
            move_tree: this.makePuzzleMoveTree(
                ["fe"],
                ["ffeeedfegefd", "eefffefg", "eefffgfefdge", "fdfffgge"],
                9,
                9,
            ),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bcccgcdedfdgggehfh",
                white: "bdgecfefcgegfgchdh",
            },
            marks: { triangle: "fgegef" },
            move_tree: this.makePuzzleMoveTree(
                ["fe"],
                ["ffeeedfe", "ffeefeed", "eeffgffe", "eefffegf"],
                9,
                9,
            ),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edcecfdfegfg",
                white: "eeefbgcgdgeh",
            },
            marks: { triangle: "efee" },
            move_tree: this.makePuzzleMoveTree(
                ["fe", "fd"],
                ["defe", "fffegefdfcgdhdgfhegg"],
                9,
                9,
            ),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dbdddedfgfhfegfgdh",
                white: "bcgchdceeecfefcgdg",
            },
            marks: { triangle: "efee" },
            move_tree: this.makePuzzleMoveTree(["fd"], ["edfegefd", "feedecfd", "fffd"], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bdcebfbgfgcheh",
                white: "fdgecfdfcggggh",
            },
            marks: { triangle: "cgdfcf" },
            move_tree: this.makePuzzleMoveTree(
                ["ee"],
                ["efdeddee", "efdeeedd", "deefffee", "deefeeff", "dgee"],
                9,
                9,
            ),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cbbcbddebfdfdgfgehfh",
                white: "dcfcgdefbgcgegbhdhci",
            },
            marks: { triangle: "egef" },
            move_tree: this.makePuzzleMoveTree(
                ["fe"],
                ["eeffgffe", "eefffegf", "ffeeedfe", "ffeefeed"],
                9,
                9,
            ),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnboepbqfqhqfr",
                white: "gmfohofpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["dndo", "eodpcpdo", "eodpdocp"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gnbpepcqdqcrerds",
                white: "cmcnbocpdpeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fodocoeoen"],
                [
                    "fodocoeofnfpgpgqenfr",
                    "fodocoeofnfpgpgqdnfr",
                    "fodocoeofnfpgpgqfrgr",
                    "fodoeoco",
                    "fnfpgpgqfrgr",
                    "fnfpgpgqfofr",
                    "fnfpgpgqeofr",
                    "fnfpgqgo",
                    "enfo",
                    "eofpgpfo",
                    "fpeofoen",
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmeocpdpgpgq",
                white: "bnencobpcqdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foepfp"],
                ["doepfofp", "doepfpfofqgn", "epdofodn", "epdodnfo", "fpfo"],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cogoepgpbqfqergrfs",
                white: "fngnfofpdqeqdrds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["do"],
                [
                    "eodp",
                    "dpeodoenemdncndmcmdl",
                    "dpeodoenemdncndmdlcm",
                    "dpeodoenemdndmcn",
                    "dpeodoendnem",
                ],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hoepbqcqdqerfr",
                white: "cncpdpeqfqgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoen", "eofpgo"],
                ["foeodoen", "foeofpen", "eofpgpfofngo", "eofpfogphpgo", "eofpfogpgohp", "fpeo"],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmcpdpcqgqdrerfrhr",
                white: "cobpbqdqeqfqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eo"],
                ["doepfpeoenfogogp", "doepfpeoenfogpgohpho", "epdodneo", "enfp", "fofp"],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmcngnepgpfqgqer",
                white: "flfmfofpdqeqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["do"],
                ["dpeoendo", "eodpcpdo", "dndocoendmfn", "coeoenfn", "coeofndn"],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmhndoeobpcpdqcreres",
                white: "cmdnbocodpepgpeqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fnfogo"],
                ["enfogofn", "enfofngo", "foenemfn", "fmfn"],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emfmgnhocpdpephp",
                white: "dncobpcqdqeqgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fofpgpeoen"],
                [
                    "fofpgpeofnen",
                    "fofpgpeofqen",
                    "fofpeogp",
                    "fofpfqgp",
                    "fpeoenfo",
                    "eofpgpfo",
                    "eofpfogp",
                    "enfo",
                ],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmepbqfqgqcrdrer",
                white: "fofphpcqdqeqhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["do"],
                ["dpeoendo", "eodpcpdodnco", "dncp", "cocp"],
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gmbnhnbodocpcqcrdr",
                white: "bmcmcncodpdqfqer",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "eneofoepeq",
                    "eodnemepeqenfnfodmeogo",
                    "fneneodnem",
                    "fnepeqenemfodneogo",
                    "fnepeqeofo",
                    "fnepeqfogoenemfmdngnfp",
                    "fnepeqfoeneogo",
                ],
                [
                    "eneofoepfpeq",
                    "dneo",
                    "eodndmenfnemelfm",
                    "eodnendmdlemfmelflek",
                    "eodnendmemdl",
                    "emepeqfo",
                    "fnenemfogofmgngp",
                    "fnenemfodneogofmgngp",
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
        return _("White to play. Capture one or more black stones in a net.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmgncohodpepbqcqbrdr",
                white: "bmcndnbobpcpdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fo"],
                ["dofo", "fpeofnfo", "fpeoenfo", "fpeofoen", "eofpgpfo", "fnfo", "enfo", "gpfo"],
                19,
                19,
            ),
        };
    }
}
