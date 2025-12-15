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

export class BL4CapturingRace3 extends LearningHubSection {
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
        return "bl4-capturing-race-3";
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
                black: "brbqcperfrfqgqhrepeocn",
                white: "cqdqeqdrirhqgpfpipgn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["es"],
                ["hsds", "grgs", "fsgs", "gsdscsfs"],
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
                black: "dmeodoaraqbqcqcpaobnclblalemekgn",
                white: "dqcrbranambmcmcnerfqhqcodp",
            },
            move_tree: this.makePuzzleMoveTree(["bpapbo"], ["bobp", "apbpbodn"], 19, 19),
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
                black: "brcqdqdrdsepeodocobnfncl",
                white: "csbqbpcpdpeqerfpgqfoip",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bscrarasbs"],
                ["bscresas", "crbs", "escrarbsaqbo", "arbsescraqbo", "arbsaqbo"],
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
                black: "crereqdqfqgrfs",
                white: "bsbqcqdpdrepfpgqhrhpirbo",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["csds", "brds", "hsds"], 19, 19),
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
                black: "crdrdqeqfqfrgphpiriqfo",
                white: "brcscqgqgrfpepdpbqcodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esfsds", "esfsgs"],
                ["gses", "fses", "dses"],
                19,
                19,
            ),
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
                black: "bqbpcrdrdqfqeo",
                white: "brcqcpcocmdl",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["boar", "bsar", "aqbs"], 19, 19),
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
                black: "gpclblanarbqbpcpdmdndoepelfp",
                white: "hqbmcmbrcrdqdpboeqfqcogqcn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoaqcqambs", "aoaqbsamas", "aoaqbsamcq"],
                [
                    "aoaqapam",
                    "aoaqamal",
                    "aoaqbsamapbn",
                    "amao",
                    "apaoamal",
                    "apaocqaq",
                    "aqao",
                    "cqao",
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
                black: "arbqcqcrdpepfqgr",
                white: "brcpbpapdqdrdocofn",
            },
            move_tree: this.makePuzzleMoveTree(
                [
                    "bscsaqasds",
                    "bscsaqasbr",
                    "bscsaqasbs",
                    "bscsdsasaq",
                    "bscsdsasbr",
                    "bscsdsasbs",
                ],
                ["csbs", "aqbs", "dsbs"],
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
                black: "iqckblbmbrcqcpdrerfrgrdodncneodkbkhq",
                white: "iobobnclcmelemcrdqfkgndpfqgpcogo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqcsbpcrfo", "bqcsbpcrep", "bqcsbpcren", "bqcsbpcrdm"],
                ["bpbq", "fobp", "epbp", "enbp", "dmbp"],
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
                black: "fpfmfnbrbqbpbocncmdoeoeqgqgrdk",
                white: "dnenfogogpcocpcqhqhriphmcr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epdpdqeperfqfr", "epdpdqeperfqgs"],
                ["dpep", "dqep"],
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
                black: "arcrdrerfsgrbqbpcpeo",
                white: "brbscqdqeqfqgqfrho",
            },
            move_tree: this.makePuzzleMoveTree(["cseshr"], ["esds", "dses", "hrcs"], 19, 19),
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
                black: "drercqbqaqcpboanbmfqgp",
                white: "arbrcrclcmcnbndodpdqfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apbpcoaoblalak", "apbpbl"],
                ["apbpcoaocsds", "apbpcsds", "coap", "bpap", "csds", "blapamcs"],
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
                black: "arbrbqcsdsdrdqepdocobofpfnbm",
                white: "dpcpbpapcqcrereqgrhq",
            },
            move_tree: this.makePuzzleMoveTree(["bsases"], ["esbs"], 19, 19),
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
                black: "crcsbqbpcpdpepfqfrfscm",
                white: "brcqdqeqeresfpgphrhqeo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsargq", "bsargr", "bsargs"],
                ["ardr", "gqdr", "grdr", "gsdr"],
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
                black: "crdrdqeqfrbpcpcododm",
                white: "brbqcqfqgrepdpgphreo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["csbsasds", "fsbs", "esbs", "arbs"],
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
                black: "araqbqbpcodoepdqdrerfrfpfn",
                white: "brbscrcqcpdpeqfqgqgriq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobnds", "bobnfsdsgs"],
                ["bobnesds", "dsas", "fsas", "esas"],
                19,
                19,
            ),
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
                black: "apcocnbnandpdqcrbrdrfp",
                white: "araqbqcqcpbmcmdndoembk",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobsam"],
                ["bobsaobp", "bobsbpas", "ambp", "aobo", "bpbo", "bsbp"],
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
                black: "bpbocqeqdqfpfofrgrencm",
                white: "brbqcpdpepfqgqhrhpir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdrdsescs"],
                ["erdrdsescrcs", "erdrcres", "erdresds", "crer", "drer", "gsco"],
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
                black: "bsbrbqbocodpepeqerdrdncl",
                white: "cscrcqcpdoeofogpfqfrfsgm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsesfp", "esdsfp"],
                ["dsesdqbp", "esdsdqbp", "bpds", "dqds", "fpes"],
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
                black: "crdreqaraqfqfrgrbpbocohqhphocmimiriqcq",
                white: "bsbrbqcpdqdpepfpgpgqerglfnhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eshsds", "eshscs"],
                ["cses", "dses", "hses", "gses", "fses"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
