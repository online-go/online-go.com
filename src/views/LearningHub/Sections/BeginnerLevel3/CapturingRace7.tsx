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

export class BL3CapturingRace7 extends LearningHubSection {
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
        return "bl3-capturing-race-7";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capturing race", "Capturing race");
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
                black: "bnbocoarbrcrdreqepeodnamengnfr",
                white: "bqaqbpcnbmaldocmbldpdmemdqcq",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["anao"], 19, 19),
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
                black: "brcsdsdrdqbocodoepeobm",
                white: "crcqcpdpbpeqerfpgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsases"],
                ["esbs", "aqbq", "bqaq", "asap", "arap", "apaq"],
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
                black: "crcqbpbocndnbmfn",
                white: "bqcocpdpdqergq",
            },
            move_tree: this.makePuzzleMoveTree(["br"], ["drbr", "csbr", "aqbr"], 19, 19),
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
                black: "hrfsesaraqapbscrdrdqepfphqhobocmcngo",
                white: "frgrgsbrbqcpeododpeqgnerfnem",
            },
            move_tree: this.makePuzzleMoveTree(["csdscq"], ["dscs", "cqcs"], 19, 19),
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
                black: "bqbpcpaoanbkclcmckcndodnfm",
                white: "arbrbobnbmblcodpdqdrgq",
            },
            move_tree: this.makePuzzleMoveTree(["apaqcq"], ["aqal", "cqal", "amal"], 19, 19),
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
                black: "bobncpdpepdqerfofnenhn",
                white: "bqbpcodoeoeqfpgpgqiq",
            },
            move_tree: this.makePuzzleMoveTree(["drfqcq"], ["fqcn"], 19, 19),
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
                black: "dpdodncrdrereqbpapbncofpgqbs",
                white: "bobmcmdmdqeneoepcqbqelgmao",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpanboaocn", "cnanbocpaq"],
                [
                    "cpancnboamaq",
                    "cpancnboaqar",
                    "cpanaqar",
                    "cpanamaq",
                    "anam",
                    "cnancpboaqar",
                    "cnancpboamaq",
                    "aqan",
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
                black: "brbqbpcobndqdpepdndmgper",
                white: "doeocpcqcrdrenemgohpgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqfqfp", "eqfpfq", "eqfpfo"],
                ["fpeq", "fqds", "frds"],
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
                black: "dqdpdobpenfndmcmbmel",
                white: "crdreqepeobocndnfrhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpcqbq"],
                [
                    "cpcqcobq",
                    "cocp",
                    "cqco",
                    "bqco",
                    "bnbqcqcp",
                    "bnbqcpcqbrco",
                    "bnbqcpcqaqco",
                    "bnbqcpcqapco",
                ],
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
                black: "brcrcqdpdoeqfqgrgsgp",
                white: "bqbpcpdqdrerfrbncm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                [
                    "csbsards",
                    "csbsdsfs",
                    "bscsdsas",
                    "bscsarasaqds",
                    "bscsarasdsaq",
                    "dsfs",
                    "fsds",
                ],
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
                black: "arasbscscrbqbpcpdodndmbm",
                white: "apbocodpdqcqerepeo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aobnaq"],
                ["aobndran", "aobndsan", "drbndscn", "drbnaoan", "dsbnaoan", "dsbndrcn"],
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
                black: "arbqcqcrfrfqepdpfofnhr",
                white: "bsdqeqerescpbpapaqcodocm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["csfsbr"],
                [
                    "csfsdsbr",
                    "csfsdrds",
                    "brcsasar",
                    "brcsdras",
                    "brcsdsas",
                    "ascsbrar",
                    "ascsdsbr",
                    "ascsdrbr",
                    "drfs",
                    "dscs",
                ],
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
                black: "cqbqcpdpbocnereqfpcmfqhp",
                white: "arbrcrdrdqcodoeoepfn",
            },
            move_tree: this.makePuzzleMoveTree(["bpapaqbpbn"], ["aqbp", "dsbs"], 19, 19),
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
                black: "brdrdqdpbocobldlgq",
                white: "cqcpbpdodnfogm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bncncm"],
                ["bncnaocm", "cnbnbmcm", "aobn"],
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
                black: "arbqcqcpcoboaodnclbldmfm",
                white: "anbncndodpdqcrbrerfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apaqbscmas"],
                ["apaqasbs", "aqap", "bpap", "bscm", "ascm"],
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
                black: "ereqgphqhrdpcpbpgobnhs",
                white: "brcsdrdqcqepfpgqdoeoem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfsesdsfq"],
                ["frfsfqes", "esfr", "fqfr"],
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
                black: "cqbqaqaobmblcndodpdm",
                white: "brcrdrdqcpcobobnamepfp",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["apbp", "bpap", "anbp"], 19, 19),
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
                black: "bscrcqdpepfrfp",
                white: "csdrdqcpcodn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brbqas"],
                [
                    "brbqdsar",
                    "bqbrdsbp",
                    "bqbrbpds",
                    "dsbqarerbreqases",
                    "dsbqbpar",
                    "dsbqaqarapbp",
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
                black: "arbqbpbocpblclcmdndoem",
                white: "brcqdpcocnbnanbmeoepcrer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoaqbs"],
                ["apaqbsao", "aqapbsal", "asao", "bsao"],
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
                black: "bqcqcrdrbndodpdnbm",
                white: "brbpcpbodqeqerep",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aq"],
                ["dsarbsaqcsao", "dsarbsaqapco", "dsarbsaqascs", "csarbsdsesas"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
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
                black: "brcrdrcqerbpbocncm",
                white: "araqbqesfreqdqcpcododnfp",
            },
            move_tree: this.makePuzzleMoveTree(["bn"], ["bsap", "dsap", "csap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
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
                black: "asbscrdrdqbqaqepfpgqgrgo",
                white: "dsereqdpcpcqboeodocm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brares"],
                [
                    "brarbpesfsfresgs",
                    "brarapesfsfrbpfqesgs",
                    "esbrbpfsapfr",
                    "esbrcsfsbpfr",
                    "esbrcsfsapfr",
                    "esbrapfsbpfr",
                    "esbrapfscsfr",
                    "bpbresfscsfr",
                    "bpbresfsapfr",
                    "bpbrapfresfs",
                    "apbrbpfresfs",
                    "apbresfsbpfr",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page23 extends LearningPage {
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
                black: "dqdrdseqcpbpbqdoco",
                white: "brcrcqfqepdpfp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esfscserfr", "esfsfrarer"],
                [
                    "esfserfr",
                    "esfsfrarcsbs",
                    "csar",
                    "erfresfs",
                    "erfrcsesgrar",
                    "erfrcsesaraq",
                    "erfrargr",
                    "arfrgraqescs",
                    "arfrgraqcsas",
                    "arfrgraqeres",
                    "arfrgraqfscs",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}

class Page24 extends LearningPage {
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
                black: "dsdrdqeqfpgpgqgrfn",
                white: "crcqdpepfqfrcodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["es"],
                ["erfs", "csfs", "fsgs", "gserfshs", "gsercsfs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
