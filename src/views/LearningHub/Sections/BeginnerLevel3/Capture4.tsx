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

export class BL3Capture4 extends LearningHubSection {
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
        return "bl3-capture-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 4", "Capture");
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
                black: "cmdnencoeoepeqbrcrdr",
                white: "clbmbncndodpbqcqdq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpapaoboaq"],
                ["aqbpapbo", "aqbpboao", "apbobpcp", "boapaoan"],
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
                black: "dmenbpcpdpeqfqfr",
                white: "hneohoephpbqcqdqcrerds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fodoco"],
                ["dofo", "fpfofngo", "fpfogogn"],
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
                black: "ckdlemanbnencodocqdqarbrcr",
                white: "bmcmdmdnaoeoapcpdpepaqbqeqer",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bobp", "blbp", "cnam"], 19, 19),
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
                black: "cpepbqcqfqgqdrcsds",
                white: "dlbocodobpaqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["arasbs"], ["bsar", "asar", "apar"], 19, 19),
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
                black: "bmcmdmdnfncoeoepdqbrdrer",
                white: "blcldlemfmgmcnendocpdpgpeqfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpbocq"],
                ["bnfo", "bofo", "cqbpbofo", "cqbpbqbo"],
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
                black: "bocobpdpdqbrdrgrbsgs",
                white: "doeocpcqcrercsds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esfsbqeseq"],
                ["esfsbqesfreq", "esfsfreq", "esfseqfq", "bqeseqfq", "eqfq", "fqeq"],
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
                black: "doeofogohodphpcqeqcrds",
                white: "cnbpcpepfpgpdqhqiqdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfqes"],
                ["gqfqgrfr", "gqfqfrgr", "fqfrgqgr"],
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
                black: "bldlcmcncobpcp",
                white: "ambmbnboapdpbqcqeq",
            },
            move_tree: this.makePuzzleMoveTree(["aoaqal"], ["alao", "aqao", "anao"], 19, 19),
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
                black: "cmdnenfngncogocpcqdrer",
                white: "doeofohodpgpbqdqgqbrcr",
            },
            move_tree: this.makePuzzleMoveTree(["fpfqeq"], ["fqfp", "eqfp", "epfp"], 19, 19),
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
                black: "bncndnenfogogpeqgqcrergrfsgs",
                white: "bocodoeoepfpfqbrfrcsdses",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsasdrbsbq"],
                ["drbsbqcq", "drbscqbq", "bqcq", "aocq", "cqbq"],
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
                black: "bobpbqeqbrdrfrcs",
                white: "codogocqdqgqcrergres",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["dsbs", "dpdscpbs", "cpdsdpbs"], 19, 19),
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
                black: "dlbncobpcpdpepfpbq",
                white: "aoboapaqcqdqeqfqgqbr",
            },
            move_tree: this.makePuzzleMoveTree(["arasanarcr"], ["anar", "crar"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
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
                black: "codobpepfpbqbrer",
                white: "clbnboeofogocpdphpeqhqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqcqcrdqfq"],
                ["dqcqcrdqfrdn", "dqcqfqdn", "cqdq", "fqdq", "crdq"],
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
                black: "dmaobocoeodpeqcrdr",
                white: "goapbpcqdqgqarbrerfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqaqcpbqbs"],
                ["bqaqcpbqasbs", "bqaqbsds", "cpbq", "bsds", "ascs"],
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
                black: "cnbocodpepcqeqfqbr",
                white: "dlbmcmdndoeogobpcpfpbqgqcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apdqaqcqdr", "apdqaqcqcs", "aqdqapcqdr", "aqdqapcqcs"],
                ["apdqdrbn", "aqdqdrao", "drao", "dqao"],
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
                black: "bpcpdpfphpbqeqfqcrfrasfs",
                white: "cmgncodoeoepcqdqarbrdrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscsescraq", "escsdscraq"],
                ["dscsaqes", "escsaqds", "csbs", "aqcs", "bscs"],
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
                white: "flcmgmcnbocobpdpepbqdqerfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpfqdreqgq"],
                ["fpfqgqfo", "fqfpgpfo", "fqfpfogp", "drfp", "frfq"],
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
                black: "enhncodoepcqeqbr",
                white: "clbncpdphpbqgqcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpdqdrcqaq", "bpdqdrcqcs"],
                ["bpdqaqer", "dqbp"],
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
                black: "fmcodoeobpepbqfqbrdrfrbs",
                white: "cmbnbohocpdpcqgqcrergrdsfsgs",
            },
            move_tree: this.makePuzzleMoveTree(["csdqeq"], ["dqeq", "eqcs"], 19, 19),
        };
    }
}

class Page20 extends LearningPage {
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
                black: "fnfohogpeqgqcrergrfsgs",
                white: "dmcoeoepfpfqbrfrcsdses",
            },
            move_tree: this.makePuzzleMoveTree(["bsasdrbsbq"], ["drbs"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
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
                black: "bodoeocpbqbrerbscs",
                white: "dphpcqeqgqcrdrds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdqfq"],
                ["esdqepfq", "epfr", "fqfr", "frfq"],
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
                black: "dmenepfpdqgqgrgs",
                white: "hmcogocpgpipbqeqfqhqbrdrfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["esercrdscs"], ["eres", "dsdp"], 19, 19),
        };
    }
}

class Page23 extends LearningPage {
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
                black: "clcnbocobpdphpdqhqbrdrgrbsgs",
                white: "emdoeocpcqcrercsds",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esfsbqeseq"],
                ["esfsbqesfreq", "esfseqfq", "esfsfreq", "bqes", "eqfq", "epfp"],
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
                black: "gobqcqdqfqdrergrhr",
                white: "clcnboeobpaqbrcrdsesfs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arascsbsgs", "arascsbsfr"],
                ["arasgscs", "csar", "gscs", "frcs"],
                19,
                19,
            ),
        };
    }
}
