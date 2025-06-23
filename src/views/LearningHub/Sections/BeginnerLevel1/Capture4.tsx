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

export class BL1Capture4 extends LearningHubSection {
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
        return "bl1-capture4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 4", "4.13 Capture 4");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on capture 4", "Capture stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocpcqeqcrdr",
                white: "cmbncodpfpdqerfr",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["epdo"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmdmandneoepdqeqer",
                white: "bncnaodobpdpcqbrdrds",
            },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcmbndnbobpcqcrdr",
                white: "dmcnencocpdqfqer",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], ["dodp", "emdo", "dldo"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdnboeocpepdq",
                white: "blclbncncododpeqer",
            },
            move_tree: this.makePuzzleMoveTree(["bm"], ["anbm"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "gofpeqgqdrer",
                white: "focpepdq",
            },
            move_tree: this.makePuzzleMoveTree(["eo"], ["cqdp", "fneo"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmeoepgpfqhqfr",
                white: "hmdninfocpfpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gn"],
                ["gofnengn", "gofngnen", "fngognho", "fngohogn", "engn"],
                19,
                19,
            ),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmbndnbobpfpcqgqdrerfr",
                white: "dmcnencoeofocpgpdqeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dp"],
                ["dodp", "epdp", "hpep", "dldo", "emdo"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmbncodoeodp",
                white: "bmcnbofocpepdqeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bp"],
                ["anaobpam", "cman", "dnan", "aoanbpbqcqap"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmancncocpbqbrbs",
                white: "alblcldlambnbobpdpcqeqcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ap"],
                ["aoapanaoaqan", "aoapaqan", "aoapaoan"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "endofofpeq",
                white: "fmfneodpep",
            },
            move_tree: this.makePuzzleMoveTree(["cpdqdr"], ["cpdqcqdr", "dqcp"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdmcnbobpdpfqgqdrer",
                white: "dnfncoeocpfpdqeq",
            },
            move_tree: this.makePuzzleMoveTree(["cq"], ["doep", "epdo"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cncodocpfpdqfqcrdrer",
                white: "clhneobpdpephpbqcqeqbrfrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fnenem"],
                ["enfofngo", "enfogofnfmgn", "enfogofngnfm", "foen"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eodpdq",
                white: "codoep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpeqer", "fpeqfqerdr"],
                ["fpeqfqerfrdrcrcq", "eqfp"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cocpdpcqfqdrer",
                white: "cmhobpepbqdqeqhqarcrbs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoen"],
                ["eofpgpfofngo", "eofpgpfogofn", "eofpfogp", "fpeo"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codoeoepbqfqdr",
                white: "dpcqeqbrcrfrgr",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], ["erdq", "cpdq"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dndoepeqbrdrds",
                white: "cmcobpdpdqcrcs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cqcpbq"],
                ["cnbq", "bscq", "bqcq", "cpcq"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdmeneoepcqeqdr",
                white: "cldlemfmdnbocodpbqdqcr",
            },
            move_tree: this.makePuzzleMoveTree(["do"], ["cndo", "cpdo", "brcp", "cscp"], 19, 19),
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bobpbqeqfqbrdrfrcs",
                white: "gncodoepgpcqdqgqcrergres",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsdsdr"],
                ["fsdscpbsdpfp", "cpdsdpbsfsfp", "dpdscpbsfsfp", "dsbs"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "docpcqcrdrdses",
                white: "dpdqergrfs",
            },
            move_tree: this.makePuzzleMoveTree(["eq"], ["epeqfqfr"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmendodpeq",
                white: "dmdneoepcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpfogo"],
                ["fpfofngo", "fofpgpfq", "fofpfqgp"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmbncnenbocpcqeq",
                white: "emfmdngncodobpdpgpgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eoepfp"],
                ["epeo", "dqeo", "bqep", "foeofnfp"],
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlcndncobpdqgqdr",
                white: "bodocpepbqeq",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], ["bnap", "cqapdpeo", "eodp"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "elcmdmfmfndoeo",
                white: "emcndnengnfofpcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bncocpbobp", "cobnbmbobp"],
                [
                    "bncocpboaobp",
                    "bncobocp",
                    "cobnbobmblflgmdl",
                    "cobnbobmblflamgm",
                    "cobnbobmblflangm",
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
        return _("Black to play. Capture one or more white stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpepcqbrbscs",
                white: "dnbobpgpbqdqgqcrdrgr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ereqfq"],
                [
                    "eqerfrfq",
                    "frdserar",
                    "frdsesar",
                    "frdseqar",
                    "fqdserar",
                    "fqdsesar",
                    "fqdseqar",
                    "dser",
                ],
                19,
                19,
            ),
        };
    }
}
