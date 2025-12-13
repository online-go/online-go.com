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

export class BL4CapturingRace9 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-capturing-race-9";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capturing race", "Capturing Race");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on capturing race",
            "Win capturing race",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrdrerbpbocndnfncl",
                white: "brbqfrfqfpdqdpcpiq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["csaq", "eqbs", "esbs", "aqbs", "arbs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "csdrdqcpbpbobnepfres",
                white: "bqcqcrbmcncododpcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arbsap", "arbsan"],
                ["aqarbrbs", "aqarbsap", "anaq", "bsaq", "apbr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbrcrdrbodpdodneqfqerfp",
                white: "dqcqbqbpdmeneoepelcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cocnbn", "bncnco"],
                ["cocncmbm", "cocncpap", "cncoaoan", "bncncmbm"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "dreresdpepfogpgqgrirfnhn",
                white: "bobpbrcrdsdoeofpfqfrfscm",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], ["csgs", "eqdq", "cpgs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcrcqdqbpapepfpfqgrgqfnir",
                white: "bqaobocpdpeqerdrfrcn",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqds", "csbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcsdsdrdqbocodoeoepdl",
                white: "crcqdpcpbpeqerfpgqgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsases"],
                ["bsasbqaq", "bsasapaq", "bsasaqbq", "esbs", "aqbq", "bqaq", "apaq"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcpbodrerfqgqdoengofnfo",
                white: "crcocnbmdmdqdpepemfm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpbqbraparaqan"],
                [
                    "bpbqbraparaqbncs",
                    "bpbqbrapbnar",
                    "bpbqbrapanar",
                    "bpbqaqbr",
                    "bpbqapbr",
                    "bpbqbnbr",
                    "bqbp",
                    "brbp",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cndndsdrdqdpeofpbmbqbpbo",
                white: "cscrcqcpcodofngogpfqfrfsgqen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epeqfo"],
                ["epeqerbr", "epeqesbr", "foep", "eqbr", "erbr", "esbr", "brar"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "crbrbqcpcodofrfqfpepgrcm",
                white: "cqdpdqdrereofogpgqhrhqgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["escsgs", "escsfs"],
                ["dsfs", "gsfs", "fsesdsgs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "csdrdqeqfrcpbqbpdodn",
                white: "arbrcrcqfqgrgphrepdp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdsbs", "esdsfs"],
                ["bses", "dses", "fses", "eres"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrcsdpeocoboeqerdles",
                white: "bsbrbqbpcpdrepfpfqfrhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqdsdqdrfs"],
                ["dqdsfsdq", "fsdq", "dsdq"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "arbqbpboaocpdqeqerepfo",
                white: "bncncododpcqbrcrdrem",
            },
            move_tree: this.makePuzzleMoveTree(["aq"], ["anaqbsds", "apaq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcqdrbpbocncl",
                white: "cpdpbqaqeqeresdsfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["crcsdq"],
                ["crcsarap", "dqcr", "csar", "arap", "bsar"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbqcpdpepfqgr",
                white: "bpbocncqcrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dr"],
                ["csdrdqeqdsfs", "csdrdsdqesfr", "dqcseqfrdsfs", "aqdrdqcsdseq", "aqdrdscsdqeq"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcpcododqeqdrdsfrgqgsdm",
                white: "cscrcqdpepergrhrhqgpgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esfsfq"],
                ["esfshsbq", "esfsbqaq", "esfsesfp", "fqes", "fses", "bqaq"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqcrdpdocnfn",
                white: "drdqeqepcpbpapgq",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["csbs", "brbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "asarbqbpcpcrcsdodncmbmel",
                white: "cqdqdpcoboapeoergq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brbsao"],
                ["aobr", "bsbr", "drbr", "dsbr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "gngmdoeofoepeqfqdrgrgscncm",
                white: "bqbodpdqdnenfnfsesgqgpgofpipiqco",
            },
            move_tree: this.makePuzzleMoveTree(
                ["crfrhrerhsdscs", "crfrhrerhsdsfs", "crfrhrerhsdses"],
                ["crfrhrerdscs", "crfrdsdm", "crfrerds", "crfrhshr", "frer", "erfr", "dsfr"],
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
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "brcrdrdqdpdocnbnangq",
                white: "bqcqcpcobodnendlblfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ap"],
                ["amap", "bmap", "cmap", "aoap", "aqar"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            /* cSpell:disable */
            initial_state: {
                black: "cqdpcpbpaqbnereqgriqhohq",
                white: "bqbrcrdrdsdqepfpgpen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfqgqfses"],
                ["frfqgqfshres", "frfqesgq", "arbs", "esfr", "fqfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
