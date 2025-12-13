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

export class BL4CapturingRace4 extends LearningHubSection {
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
        return "bl4-capturing-race-4";
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
        return _("Black to play. Win the capturing race.");
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
                black: "bsbrbqcpdpeqfqgreo",
                white: "aqbpbocqdqcrcsercncl",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["aras", "drds", "frar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "fpfqeqbrcqcpbpapdpfrfognhphr",
                white: "dqerdrcrdsbsbocofndoemeoepbm",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["fsar", "aqar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "apbpcqcrdrercodnbnen",
                white: "csbrbqfrfseqcpdpfpdofo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsasaq"],
                ["bsasaraq", "bsasdsdq", "dsbs", "aqbsards", "arbsaqds"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "brbqcqdpepeqfrfsfqhp",
                white: "araqcrdrerdqbpcpcodoclds",
            },
            move_tree: this.makePuzzleMoveTree(["bsapes"], ["esbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "dlbogocqeresdqcrfqfpeodocofogm",
                white: "cpdpepeqfrgrgqgphobsbqaqbphn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brards"],
                ["brarcsds", "csbr", "dsbr", "arbr"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "cqcpdpeofogphqfqgn",
                white: "bpcodogqdqeqepfpbodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drfrer"],
                ["drfrgrcr", "drfrcrhp", "frcr", "grcr", "crfrdrhp", "erdr"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "drdqdpcoboaoapfrgp",
                white: "aqbpcpcqcrdoeofmdmbm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brcsdsbsar", "brcsbs", "brcsbq", "brcsar"],
                ["csbrbsas", "arbr", "bqbr"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "bpcpcqdoeofogq",
                white: "brbqapbococmdpep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drdqcrereqfqfp"],
                ["drdqcrerfpeq", "dqeq", "fpdq", "eqdq", "fqdq", "crdr"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "brbqbpcpdpeqfqfr",
                white: "bscrcqdqerdocoboepfpgphripenbm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dscses"],
                ["dscsdres", "esds", "csds", "drds", "ards"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "epdqeqfqgqbobngrfofncpdp",
                white: "bqbpcqdrergpfphqhpeodocodmekinir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dnenemcncm"],
                ["dnencnem", "endn", "cndn"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "bqcqdpdodncmclblem",
                white: "brcrdqcpcocnbmdrepfp",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bnbp", "bobp", "aqar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "arbrcrcqdpdocnbmcmenbk",
                white: "bscsbqdrdqepcpcobobneqgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apbpan", "apbpaq"],
                ["apbpaoan", "aqap", "anaq", "aoaq", "bpap"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "aqbqbrcpdpdqeqfrfqhr",
                white: "bscrcqdreresbpbococm",
            },
            move_tree: this.makePuzzleMoveTree(["csdsfs"], ["fsap", "ascsfsar"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "bsbrcrdrdscqdpeococncmblem",
                white: "arbqbpbobncpdqeqeresfphp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqapanambm"],
                ["aqapbman", "bmaq", "anaq", "apaq", "aoaq"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "brbqbncncpdpdqepfpgperen",
                white: "aqbpboeqfqfrdrcrcqgqhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsesco", "bsesao", "bsesap"],
                [
                    "bsesarcsapao",
                    "csesbsar",
                    "csesarbsapao",
                    "dsesbscs",
                    "dsesarbsapao",
                    "arbsapao",
                    "apbsarao",
                    "aobs",
                    "cobs",
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
        return _("Black to play. Win the capturing race.");
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
                black: "bscscrdqdpdocnbnanergq",
                white: "brcqaqapaobococpdndmblcleofm",
            },
            move_tree: this.makePuzzleMoveTree(["bqbpas"], ["asam", "aras"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "braobococpbnbmdqdrepfreqgo",
                white: "crcqbqbpamblclcmcndodpen",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqbsar"],
                ["aqbsapar", "csbsasaq", "csbsards", "arap", "apaq", "bsap"],
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
        return _("Black to play. Win the capturing race.");
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
                black: "dndococpbpdsereqepgqfq",
                white: "bqcrdrdqdpeoendmcmbnfmfpgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brbsaraqcqasbrares"],
                [
                    "brbsaraqcqasbrarapao",
                    "brbsaraqcqasapao",
                    "brbsaraqapas",
                    "brbscqar",
                    "brbsaqar",
                    "cqbr",
                    "csbs",
                    "aqar",
                    "apbsarbraqao",
                    "apbsarbrcqao",
                    "apbsaqbrarao",
                ],
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
        return _("Black to play. Win the capturing race.");
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
                black: "braraqcqcpbpdodncmbmbkel",
                white: "cobobnandpdqdrcrcsbsgq",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aoap", "amap", "cnap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race.");
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
                black: "aqapbpcpdqeqepeofrfnhn",
                white: "arbqcqdpdocnbndrerfqgrgpiqdl",
            },
            move_tree: this.makePuzzleMoveTree(["crbrcs"], ["brcr", "bsbr", "cscr"], 19, 19),
            /* cSpell:enable */
        };
    }
}
