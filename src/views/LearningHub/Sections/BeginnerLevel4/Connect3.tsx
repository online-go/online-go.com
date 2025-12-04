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

export class BL4Connect3 extends LearningHubSection {
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
        return "bl4-connect-3";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on connect", "Connect");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpbpbqdneneodqeqergriqhoco",
                white: "brarcrdrcqdpdocnbnfldmcmck",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aqap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpepfpgqhqcmdmemfmhlfkfrbp",
                white: "cocnengngogpipimhm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eo"],
                ["dnfnfoeo", "fndndoeo", "dofnfoeo", "fodndoeo"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dodpdqenemeleriqiohm",
                white: "drcrcqcpcndmdlgq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["freseq"],
                ["esfr", "fses", "dses", "gres"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "crcqcpbpdpbneqerfoem",
                white: "aqbqbrcsdrdqfrgqhqho",
            },
            move_tree: this.makePuzzleMoveTree(["esdsdr"], ["dses", "fsds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bocpdpdoeoendlblflgn",
                white: "cqbqbpdqepdncnfphp",
            },
            move_tree: this.makePuzzleMoveTree(["bnaoco"], ["cobn", "aobn"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "eogpdmbmfmaqbpcqcrbsarhpgnip",
                white: "cpbodqdrfqgqhqir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["do"],
                ["frdp", "dpco", "epco", "eqdp", "codp", "fpdp", "cndp"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcpdqdrdncl",
                white: "bsbrbqfqfrfsfoiq",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqeqfqeofofmgnipiqirhn",
                white: "crcqcpgpgqgrdndmdk",
            },
            move_tree: this.makePuzzleMoveTree(["fsdrds", "dsfrfs"], ["esdsdrfs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpdpbobncldlfleneqfqgqeobl",
                white: "bqcqdqerfranbmcmcnhr",
            },
            move_tree: this.makePuzzleMoveTree(["bpaocoamap"], ["aoapbpamcoan", "apao"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpbpbqdocncmdlfpgpioim",
                white: "crcqdpdneneqfqhrgmgk",
            },
            move_tree: this.makePuzzleMoveTree(["eocoep"], ["epeo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bsbrbqbpcpdpeqfq",
                white: "cqcrcsgqfrfpeodocnbngpiq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esdser"],
                [
                    "esdsdrergrdq",
                    "esdsdrergsdq",
                    "esdsdrerfsdqdsgr",
                    "esdsdrerhrdq",
                    "esdsdrerdsdqfsgr",
                    "erdrdsdqesgr",
                    "fsdrdseserdqesgr",
                ],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "arbqcqdqdpfpfqercmaq",
                white: "bsbrcrdrdsfrhqhphn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsgrgq"],
                ["esgrfsgq", "esgreqgq", "gres", "gses"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpbpdoeodqeqerhqgo",
                white: "drcrcqdpcobocndncl",
            },
            move_tree: this.makePuzzleMoveTree(["apepbq"], ["bqap", "aqap"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqcpcocneqeofqgrgphpiqirisio",
                white: "bqcqdrerfrbpbohqhrhs",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fs"],
                ["gsfsgqgr", "gsfsesgqfscr", "gqgs"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcodpdnepfpeqdrcl",
                white: "cscrcqcpfqgqgpgoiqgm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdqdsfres"],
                ["dses", "frds", "esds", "dqfr"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "brcrdqdperdnenfngqhqfmfl",
                white: "eqcqcpepeodmemgpgognck",
            },
            move_tree: this.makePuzzleMoveTree(["dodrcn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqercpbpboeqeohp",
                white: "bqcqcrdrapcoclckfl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bndpao"],
                ["aobn", "anbnbmaodpcn", "anbnaoam"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcpcrdqepeocm",
                white: "bsbrbqeqfpfqgnhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drcscq"],
                ["csds", "ercs", "dscs", "cqer"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "blcldlelfmfneogoereqdpgrco",
                white: "drcrcqcpdoenemdmcmes",
            },
            move_tree: this.makePuzzleMoveTree(["bodncn"], ["cnbo", "bnbo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page20 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "dqepfohqhpho",
                white: "brbqcpfqgqcm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drereqcrdp", "drereqcrcq"],
                [
                    "drercreq",
                    "drercqeq",
                    "drerfreqescrdscsfscq",
                    "erdr",
                    "esdrdserfrcs",
                    "esdrdserfsfrgrcs",
                    "esdrdsercsfr",
                    "esdrdsercrfs",
                    "csdr",
                    "dser",
                    "eqdrdpgs",
                ],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bqcqdqeqerdpcogp",
                white: "arbrcrdrdodncnbnfn",
            },
            move_tree: this.makePuzzleMoveTree(["aqbpapaobo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "cpbpeqfpgrgqhqgodmgmepbn",
                white: "bqcqfqfrgshririqipin",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dreresfsfr"],
                [
                    "erdrdqes",
                    "dsdrcres",
                    "dsdrescr",
                    "dsdrercrdqfsescs",
                    "dsdrcses",
                    "cses",
                    "esdr",
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcodoenckdlekfkgn",
                white: "aqbqcqeqcncmclgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["boapcp", "bobnaoanap"],
                ["apao", "aoap", "cpbn"],
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
        return _("White to play. Play the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 9 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcocndpepfpfneqdrdl",
                white: "cscrcqcpgpgqfqiqhn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdsdq", "erfres"],
                ["erdsesdq", "esds", "dses"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
