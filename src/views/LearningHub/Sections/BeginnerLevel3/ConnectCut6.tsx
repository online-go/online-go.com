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

export class BL3ConnectCut6 extends LearningHubSection {
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
        return "bl3-connect-cut-6";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "Connect and Cut");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on connect", "Connect your stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "fpeocsbrbqcpcodofngpio",
                white: "cndncrcqbpbodpepfqgqerclhq",
            },
            marks: { C: "dr", A: "dq", B: "eq" },
            move_tree: this.makePuzzleMoveTree(["dr"], ["dqdr", "eqdq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "bqcqdpcodn",
                white: "bpcpcrdqeqgq",
            },
            marks: { A: "bo", B: "ap", C: "br" },
            move_tree: this.makePuzzleMoveTree(["br"], ["bobr", "apbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "eohpgofocsbsbrbqcqeqdpdohn",
                white: "crdrdqdsergpfpepbpcpcodndmbmdkhr",
            },
            marks: { C: "fr", A: "fq", B: "gq" },
            move_tree: this.makePuzzleMoveTree(["frfqgq"], ["gqfr", "fqfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "bpcn",
                white: "cpdpfqhq",
            },
            marks: { A: "bo", B: "co", C: "bq" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["bobq", "cobq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "cqdpepeqercobohp",
                white: "brbpcpdqdrdodndlgn",
            },
            marks: { A: "ap", B: "bq", C: "cr" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["apbq", "crbq"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "bqcqcrdrdmcmel",
                white: "erdqdpcpfqdnen",
            },
            marks: { A: "bn", B: "bo", C: "bp" },
            move_tree: this.makePuzzleMoveTree(["bobpap"], ["bpbo", "bnbp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "eqgsfsfrcsbsbrbqbpdrerhriqiocn",
                white: "crcqdqdshsgrgqfqfpepgn",
            },
            marks: { C: "is", A: "dp", B: "es" },
            move_tree: this.makePuzzleMoveTree(["is"], ["dpes", "esds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "gohpipdpcpcqbqboiqeofo",
                white: "crbrdqcofqhqcndoenfngnhohmblbnirhrdrfr",
            },
            marks: { C: "gp", A: "ep", B: "fp" },
            move_tree: this.makePuzzleMoveTree(["fp"], ["epgp", "gpep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "bqdpepcpbocncmblamdkbr",
                white: "bmbnbpcodoeofpeqdqhq",
            },
            marks: { A: "an", B: "ap", C: "cq" },
            move_tree: this.makePuzzleMoveTree(["ap"], ["ancq", "cqao"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "dqcpcogqhqcmiq",
                white: "fqgphpeoemip",
            },
            marks: { A: "eq", B: "er", C: "fr" },
            move_tree: this.makePuzzleMoveTree(["frereq"], ["erfr", "eqfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "hrcpbpcqbrdpeoenfmgngogpfqeqim",
                white: "bocodofofnelemcrdrdqbqapercmdnao",
            },
            marks: { C: "aq", A: "ep", B: "fp" },
            move_tree: this.makePuzzleMoveTree(["ep"], ["fpep", "aqep"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "dodpdqdrhqiqipio",
                white: "brbqbpcocneqepeoemgphphn",
            },
            marks: { A: "er", B: "fr", C: "gr" },
            move_tree: this.makePuzzleMoveTree(
                ["freres"],
                ["erfrfqgqgrfs", "erfrfqgqfsgr", "grer"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "drdqdpcqeoenemdmgm",
                white: "cpdodncmclepfpfrhqdkek",
            },
            marks: { A: "cn", B: "co", C: "bp" },
            move_tree: this.makePuzzleMoveTree(["cncobn"], ["cocn", "bpco"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "brcqcpboeq",
                white: "cocnbpbqen",
            },
            marks: { A: "bn", B: "ap", C: "aq" },
            move_tree: this.makePuzzleMoveTree(["bn"], ["aqbn", "apbn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "dqhqgqfpbsbrcqcpgpcngnhoeoepfnirbm",
                white: "dnemfmfqeqgrhrdrcrcsdpiqiojrdojpin",
            },
            marks: { A: "co", B: "er", C: "fr" },
            move_tree: this.makePuzzleMoveTree(["frerfs"], ["erfr", "coer"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "bpcocnbndmclfpepdpfn",
                white: "bqcqdqeqgqcpbododnfogohpgr",
            },
            marks: { A: "en", B: "ao", C: "eo" },
            move_tree: this.makePuzzleMoveTree(["eo"], ["aoeo", "eneo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "eqdqcpbp",
                white: "bqcqdrerfqfp",
            },
            marks: { A: "do", B: "eo", C: "dp" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page18 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "brcrdrgqgpgo",
                white: "dqcqbqbofqfpdoen",
            },
            marks: { A: "er", B: "fr", C: "gr" },
            move_tree: this.makePuzzleMoveTree(["freres"], ["grfr", "erfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "cocneogo",
                white: "cpdpcmdlfq",
            },
            marks: { A: "em", B: "en", C: "do" },
            move_tree: this.makePuzzleMoveTree(["em"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "frfqeqdpdocncmdl",
                white: "dserdqcqcpcodnen",
            },
            marks: { A: "fo", B: "ep", C: "fp" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "bqcqdpdodm",
                white: "brcreqfqdqcp",
            },
            marks: { A: "bo", B: "co", C: "bp" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["cobp", "bobp"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "cocncmdpdqer",
                white: "crdrcqcpbobn",
            },
            marks: { A: "do", B: "eq", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page23 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "cqcpcodndmbnfpfqhqhp",
                white: "dqdpdoepenfogoioiqiphm",
            },
            marks: { A: "dr", B: "er", C: "es" },
            move_tree: this.makePuzzleMoveTree(["drereq"], ["erdr", "esdr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page24 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best connection: A, B or C.");
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
                black: "arbrcrdrgqgpiqhoin",
                white: "bqcqdqbofqfpfogngldm",
            },
            marks: { A: "fr", B: "es", C: "fs" },
            move_tree: this.makePuzzleMoveTree(["freres"], ["esfr", "fseserfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}
