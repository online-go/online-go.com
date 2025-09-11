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

export class BL2Capture1 extends LearningHubSection {
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
        return "bl2-capture-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 1", "Capture 1");
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
                black: "cmbncnencodpdqfqer",
                white: "bodoeobpcpcqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fo"],
                ["dnfo", "epfo", "fnfpgpeq", "fnfpfoep", "fnfpeqgp"],
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
                black: "cmdmemfneo",
                white: "cldlelfmgmdnenhngo",
            },
            move_tree: this.makePuzzleMoveTree(["cndodp"], ["docn", "cocn"], 19, 19),
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
                black: "enfocpfpcqeqdr",
                white: "dncoeoepdq",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["dpdo"], 19, 19),
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
                black: "eocpfp",
                white: "dmfnfoephp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqdpdodqdr"],
                ["eqdpdodqcqdr", "eqdpdqdo", "dofq", "fqdo"],
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
                black: "codoeocpbqbrerbscs",
                white: "dpgpcqeqgqcrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["esdqfq"], ["epfr", "fqfrepes"], 19, 19),
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
                black: "dmdnbocoeobpepeqdr",
                white: "enfndofocpdpfpbqfqarcrfrbs",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["dqcq"], 19, 19),
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
                black: "bocpfpcqdqeq",
                white: "bncobpdpep",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["bqao", "cndo", "apao"], 19, 19),
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
                black: "dmcododpfpeqfqhq",
                white: "flgmboeohobpcpepdqbrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fnenem"],
                ["fnenfoem", "fnendnem", "enfogofn", "enfofngo", "foenemfn"],
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
                black: "dnencocpcq",
                white: "dlelcmfmcndodpgqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqdqdrepfp"],
                ["epdqeqdreres", "epdqeqdrcrer", "epdqdreq", "eoeq", "dqepfpeq", "dqepeqfp"],
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
                black: "dmemfnfoeper",
                white: "fmgmdneneofpgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cndodpcobo"],
                ["cndocodp", "docn", "dpgo", "cogo"],
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
                black: "dmemfnfodpep",
                white: "elfmgmdnendoeofpfqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cncobocpcq"],
                ["cncobocpbpcq", "cncocpbo", "cocnbncmcldl", "cocnbncmdlgo", "cocncmbn"],
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
                black: "aobocoapcpdpbqeqfqarfrfs",
                white: "anbncndneoepcqdqbrcreres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsdrbs"],
                ["drdsbsdo", "bscsdsasdraq", "bscsasaqardo", "csbsdsdrcsdo", "csbsdsdrdsdo"],
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
                black: "anbncncobpbqeqdr",
                white: "ambmcmdndoapcp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bo"],
                [
                    "cqaqaobobrcr",
                    "cqaqaobocrbrbsdscsdp",
                    "cqaqaobocrbrcsbs",
                    "cqaqbrao",
                    "cqaqboao",
                    "aobocqaqbrcr",
                    "aobocqaqcrbrbsdscsdp",
                    "aoboaqcq",
                ],
                19,
                19,
            ),
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
                black: "dpephpbqcqfqgqcrhr",
                white: "bpcpfpgpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eododncobocncm"],
                [
                    "eododncobocnbncm",
                    "eododncocnbo",
                    "eodocodn",
                    "doeoenfogofnfmgnhoer",
                    "doeoenfofngo",
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
                black: "cserdrbrgqbqapcoboao",
                white: "crdqcqaqdpdocnbnan",
            },
            move_tree: this.makePuzzleMoveTree(["bparcpaqbs"], ["cpbp", "aras"], 19, 19),
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
                black: "blcmdnaobodocpdpaqbq",
                white: "anbncncocqeqarbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["apbp"], 19, 19),
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
                black: "bodoeohoapcpgpcqfqcrdr",
                white: "fmbncndncodpdqeqer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foenem"],
                ["enfo", "fpfo", "frfo", "bqbr", "fnfo"],
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
                black: "gndodpfpeqer",
                white: "dneocpdq",
            },
            move_tree: this.makePuzzleMoveTree(["epcobocncm"], ["coep"], 19, 19),
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
                black: "cnfncodobpbqcqdqfr",
                white: "cmbnbocpdpep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eneofo"],
                ["eodndmen", "eodnendmdlemelfm", "eodnendmdlemfmelekfl", "dneo", "dmeo"],
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
                black: "enfncodoeqcrdr",
                white: "cndneodp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bocpcqbpbq"],
                ["bocpcqbpapbq", "cpbobnep", "cpbobpep", "bpep"],
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
                black: "cmephpfqgq",
                white: "fpcqdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eodpdocpbpcocnbobn"],
                [
                    "eodpdocpbpcocnboaobn",
                    "eodpdocpbpcobocn",
                    "eodpdocpcobpbofo",
                    "eodpdocpcobpbqfo",
                    "eodpcpdodncobocn",
                    "eodpcpdodncocnbobnfo",
                    "eodpcpdodncocnbobpfo",
                    "dpeo",
                    "doeoenfo",
                    "doeofoen",
                    "doeodpen",
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
                black: "cpepfpcqeqgqhqbrdr",
                white: "doeofogodpgpdqcr",
            },
            move_tree: this.makePuzzleMoveTree(["er"], [], 19, 19),
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
                black: "cndnboeodpepbqcq",
                white: "bmcmdmbnaodobpcp",
            },
            move_tree: this.makePuzzleMoveTree(["en"], ["coen"], 19, 19),
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
                black: "docpephpeqfrgr",
                white: "eobpfpfqbrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpdqcqdpdncocn", "dpdqcqdpdncobocncm"],
                ["dpdqcqdpdncobocnbncm", "dpdqcqdpcodn", "dpdqdnfo", "dqdp", "cqdp"],
                19,
                19,
            ),
        };
    }
}
