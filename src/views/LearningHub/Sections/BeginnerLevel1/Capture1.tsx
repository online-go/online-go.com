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

export class BL1Capture1 extends LearningHubSection {
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
        return "bl1-capture1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning capture 1", "4.10 Capture 1");
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
        return _("Black to play. Capture the marked stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbobpcqfqdrer",
                white: "emfngodp",
            },
            marks: { triangle: "dp" },
            move_tree: this.makePuzzleMoveTree(
                ["eo"],
                ["epdodneo", "epdoeodn", "doepfpeo", "doepeofp", "dneo", "fpeo"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodoapepfpdqcr",
                white: "bpcpdpaqeqbrercs",
            },
            marks: { triangle: "bpcpdp" },
            move_tree: this.makePuzzleMoveTree(["bq"], ["cqbq", "drds"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlelcmfmfneodq",
                white: "flgldmemdnenfofp",
            },
            marks: { triangle: "dmemdnen" },
            move_tree: this.makePuzzleMoveTree(
                ["docnbncocp"],
                [
                    "docnbncobocpdpgn",
                    "docnbncobocpbpdp",
                    "docncobnbmgn",
                    "cododpep",
                    "codoepgn",
                    "cndodpep",
                    "cndoepgn",
                ],
                19,
                19,
            ),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "endodpeq",
                white: "dmdncoeoep",
            },
            marks: { triangle: "eoep" },
            move_tree: this.makePuzzleMoveTree(
                ["fofpgpfqfrgqhq"],
                [
                    "fofpgpfqfrgqgrhq",
                    "fofpgpfqgqfrerdqcpdr",
                    "fofpgpfqgqfrerdqdrcp",
                    "fofpgpfqgqfrgrdq",
                    "fofpfqgp",
                    "fpfogofnemdqcpfq",
                    "fpfogofnemdqcqcp",
                    "fpfogofnemdqfmcp",
                    "fpfogofnemdqgncp",
                    "fpfogofnfmem",
                    "fpfogofngnfm",
                    "fpfofngo",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdmenfndodpdqfq",
                white: "alcldlelemcndnbpcqbrdr",
            },
            marks: { triangle: "cndn" },
            move_tree: this.makePuzzleMoveTree(
                ["bo"],
                ["bncocpbo", "bncobocp", "cobnboanaoam", "cobnboanambl", "cobnanbo"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmcncpaqbqcq",
                white: "anbncodoapbpdpdqdr",
            },
            marks: { triangle: "anbnapbp" },
            move_tree: this.makePuzzleMoveTree(["bo"], ["aobo"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnenfoep",
                white: "emfngndoeo",
            },
            marks: { triangle: "doeo" },
            move_tree: this.makePuzzleMoveTree(
                ["codpdqcpbpcqcr"],
                [
                    "codpdqcpbpcqbqcr",
                    "codpdqcpcqbpbocndmbn",
                    "codpdqcpcqbpbocnbndm",
                    "codpdqcpcqbpbqcn",
                    "codpcpdq",
                    "dpcocncpcqbqbobpbndqcrfp",
                    "dpcocncpcqbqbobpbndqeqcr",
                    "dpcocncpcqbqbobpbrbn",
                    "dpcocncpcqbqbrbnbpboaqcm",
                    "dpcocncpbocq",
                    "dpcocpcndmdl",
                    "cpdpdqfp",
                    "cpdpcodq",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clbmfmcndncodpdqeqer",
                white: "bnbodoeohocpgpcqfqcrdr",
            },
            marks: { triangle: "doeo" },
            move_tree: this.makePuzzleMoveTree(
                ["foenem", "foenfnemel"],
                ["gnfo", "fnfo", "fpfo", "enfo"],
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
        return _("Black to play. Capture the marked stone.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doepcq",
                white: "dpeq",
            },
            marks: { triangle: "dp" },
            move_tree: this.makePuzzleMoveTree(
                ["dqcpbpcocn", "dqcpcobpbobqbrcrdrercs", "dqcpcobpbqbobn"],
                [
                    "dqcpbpcobocn",
                    "dqcpcobpbobqbrcraqdr",
                    "dqcpcobpbobqbrcrapdr",
                    "dqcpcobpbobqapcrdrer",
                    "cpdqfqfrerdr",
                    "cpdqfqfrdrercrfp",
                    "cpdqfqfrdrergrcr",
                    "cpdqdrfq",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocodocpdqdrerfr",
                white: "gnbpdpepaqcqeqbrcr",
            },
            marks: { triangle: "dpepeq" },
            move_tree: this.makePuzzleMoveTree(
                ["fofpgp"],
                ["eofpfogp", "eofpgpfo", "fqfo", "fpeoenfo"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "emencodofogoeq",
                white: "cndnfngneohoepgr",
            },
            marks: { triangle: "eoep" },
            move_tree: this.makePuzzleMoveTree(
                ["fpdpcpdqdrcqbq"],
                [
                    "fpdpcpdqdrcqcrbqbpap",
                    "fpdpcpdqdrcqcrbqbrbo",
                    "fpdpcpdqcqdrerfqgpfr",
                    "fpdpcpdqcqdrerfqcrgp",
                    "fpdpcpdqcqdrcrerfqfr",
                    "fpdpdqcpcqbo",
                    "fpdpdqcpbocqcrfqbqgp",
                    "fpdpdqcpbocqcrfqgpgqhpip",
                    "dpfpgpfqfrgqhpiphqhr",
                    "dpfpgpfqfrgqhqhp",
                    "dpfpgpfqgqfrerhq",
                    "dpfpgpfqgqfrhrhq",
                    "dpfpfqgp",
                    "fqdpcpdqdrcqbqbpbobrapcrarerfrdsbsfpgpgq",
                    "fqdpcpdqdrcqbqbpbobrapcrarerfrdsbsfpgqgp",
                    "fqdpcpdqdrcqbqbpbobrapcrarerfrdsbsfpfsgp",
                    "fqdpcpdqdrcqbqbpbobrapcrarerfrdsfpbs",
                    "fqdpcpdqdrcqbqbpbobrapcrarerdsfrbsfpgqgp",
                    "fqdpcpdqdrcqbqbpbobrapcrarerdsfrbsfpgpgq",
                    "fqdpcpdqdrcqbqbpbobrapcrarerdsfrcsgqfpgp",
                    "fqdpcpdqdrcqbqbpbobrapcrarerdsfrcsgqbsfp",
                    "fqdpcpdqdrcqbqbpbobrapcrcserdses",
                    "fqdpcpdqdrcqbqbpbobrcraqaobsapbqerbn",
                    "fqdpcpdqdrcqbqbpbobrcraqaobsapbqfpbn",
                    "fqdpcpdqdrcqbqbpcrbo",
                    "fqdpcpdqdrcqcrbqbpap",
                    "fqdpcpdqcqdrcrfpgpgqhper",
                    "fqdpcpdqcqdrcrfpgpgqerhp",
                    "fqdpcpdqcqdrcrfpergp",
                    "fqdpcpdqcqdrfperfrfscrgq",
                    "fqdpcpdqcqdrfperfrfsgqhq",
                    "fqdpcpdqcqdrfperfrfshpgpgqhq",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fngneohocphp",
                white: "enhnfogogp",
            },
            marks: { triangle: "fogogp" },
            move_tree: this.makePuzzleMoveTree(
                ["gqfpepfqfreqdq", "gqfpfqepdoeqerdqcqdrcrfrgresgshqiqhrir"],
                [
                    "gqfpepfqfreqerdqcqdrcrgrhqes",
                    "gqfpepfqeqfrgrhqhriqipjpioinjoko",
                    "gqfpfqepdoeqerdqcqdrcrfrgresgshqhriqirio",
                    "gqfpfqepdoeqerdqcqdrcrfrgresgshqhriqipjpioin",
                    "fpgqfqgrfriq",
                    "fpgqfqgrhqfrerep",
                    "fpgqhqep",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fnbpepcqdq",
                white: "cpdpbqbrcr",
            },
            marks: { triangle: "cpdp" },
            move_tree: this.makePuzzleMoveTree(["cododn"], ["docobocn", "dococnbo"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmbncngndoeo",
                white: "fldnencogocpfphpdq",
            },
            marks: { triangle: "dnen" },
            move_tree: this.makePuzzleMoveTree(
                ["fmfnfo"],
                ["emfnfmfo", "emfnfofm", "fnem"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblcldmdnaoco",
                white: "ambmcmcnbobpcqeq",
            },
            marks: { triangle: "ambmcmcn" },
            move_tree: this.makePuzzleMoveTree(["bn"], ["anbn"], 19, 19),
        };
    }
}

class Page16 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpepfpcqdqfqbrfrcs",
                white: "gngpeqgqcrdrergrfsgs",
            },
            marks: { triangle: "eqcrdrer" },
            move_tree: this.makePuzzleMoveTree(["es"], ["dses"], 19, 19),
        };
    }
}

class Page17 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlelfmfneodq",
                white: "flgldmemenfofp",
            },
            marks: { triangle: "dmemen" },
            move_tree: this.makePuzzleMoveTree(
                ["cmdndocnbncocp"],
                [
                    "cmdndocnbncobocp",
                    "cmdndocncobnbmgn",
                    "cmdncndoepgn",
                    "cmdncndodpep",
                    "dncm",
                    "cngn",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fogodpephp",
                white: "doeohofpgp",
            },
            marks: { triangle: "fpgp" },
            move_tree: this.makePuzzleMoveTree(
                ["gqfqfreqdq"],
                [
                    "gqfqfreqerdqcphq",
                    "gqfqfreqerdqcqcp",
                    "gqfqeqfr",
                    "fqgqhqgr",
                    "fqgqgrhqiqip",
                    "fqgqgrhqipgn",
                ],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "alblcldlambncn",
                white: "bmcmdmemanaoeodpcqbr",
            },
            marks: { triangle: "anao" },
            move_tree: this.makePuzzleMoveTree(
                ["bp"],
                ["apbobpco", "apbocobp", "boapaqbp", "boapbpaqbqar"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofodpgpgq",
                white: "dogoepfpfq",
            },
            marks: { triangle: "epfpfq" },
            move_tree: this.makePuzzleMoveTree(["freqdq"], ["freqerdq", "eqfr"], 19, 19),
        };
    }
}

class Page21 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndncocpcqfqgqdrer",
                white: "gndoephpdqeqhq",
            },
            marks: { triangle: "doepdqeq" },
            move_tree: this.makePuzzleMoveTree(
                ["fo"],
                ["eofpgpfo", "eofpfogp", "fpfo", "dpfp"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdnbococpdqeqfq",
                white: "gmhndoeobpdpepaqcqbrdr",
            },
            marks: { triangle: "doeodpep" },
            move_tree: this.makePuzzleMoveTree(
                ["fn"],
                ["enfo", "foenemfn", "foenfnem", "fpfn"],
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfncodogoho",
                white: "cndngnhneofofr",
            },
            marks: { triangle: "eofo" },
            move_tree: this.makePuzzleMoveTree(
                ["fpepeqdpcpdqdrcqbq"],
                [
                    "fpepeqdpcpdqdrcqcrbq",
                    "fpepeqdpcpdqcqdrerfq",
                    "fpepeqdpcpdqcqdrcrfq",
                    "fpepeqdpdqcp",
                    "fpepdpeq",
                    "epfpgpfq",
                    "epfpfqgphpgq",
                    "epfpfqgpgqhp",
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
        return _("Black to play. Capture the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fmgmhmenhneogoepgpgq",
                white: "dmemfngnfohocpfpcqfqcr",
            },
            marks: { triangle: "fngnfofpfq" },
            move_tree: this.makePuzzleMoveTree(
                ["freqdqerdr", "ereqdq"],
                ["freqdqeresdr", "freqerdq", "eqfrergrhrhq", "eqfrgrerdrdq", "ereqfrdq"],
                19,
                19,
            ),
        };
    }
}
