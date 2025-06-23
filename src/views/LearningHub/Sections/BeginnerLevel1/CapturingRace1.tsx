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

export class BL1CapturingRace1 extends LearningHubSection {
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
        return "bl1-capturing-race-1";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning win the capturing race",
            "4.22 Capturing Race",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on win the capturing race",
            "Fill outside liberties first",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Both marked chains have 3 liberties. In filling the liberties of your opponent, you must pay attention with which liberties to start. You have liberties shared by the two struggling chains (common liberty A) and liberties at the outside (outside liberties B and C). Always start with filling the outside liberties. White to play. Win the capturing race between the marked chains.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmdneneoapbpcpdp",
                white: "bnbocodoepfpcqdq",
            },
            marks: { triangle: "bnbocodoapbpcpdp", A: "ao", B: "aq", C: "bq" },
            move_tree: this.makePuzzleMoveTree(
                ["bqanaq", "aqbqbrarao"],
                ["bqanaocn", "aocn", "aqbqaobr", "aqbqarbrcras", "aqbqarbraocn"],
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldmemenaobocodo",
                white: "anbncndneodpepbqcq",
            },
            marks: { triangle: "anbncndnaobocodo" },
            move_tree: this.makePuzzleMoveTree(
                ["cpcmbp", "cpcmap", "apcmbp", "apcmcp", "bpcmap", "bpcmcp"],
                [],
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmbncocpcqfqbr",
                white: "blclcndnbobp",
            },
            marks: { triangle: "bmbnbobp" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "cmbqam",
                    "cmbqan",
                    "anamcmaoal",
                    "anamalaocm",
                    "amancmalao",
                    "amanalbqcm",
                    "amanaoalcm",
                ],
                [
                    "anamcmaoapbq",
                    "anamaobq",
                    "anamalaoapbq",
                    "amancmalakbq",
                    "amanalbqaoap",
                    "amanaoalakbq",
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boapbpcpepdqfqcrdrbs",
                white: "dmbncododpbqcqarbr",
            },
            marks: { triangle: "boapbpcpbqcqarbr" },
            move_tree: this.makePuzzleMoveTree(["ancsao"], ["ancsaqas", "aqas"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncnbododpcqeqbr",
                white: "blcmdmdncoapbpcp",
            },
            marks: { triangle: "anbncnbocoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                ["ambqbm", "bmbqam"],
                ["ambqaoaq", "bmbqaoaq", "aobq"],
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cpdpcqeqfqbrergres",
                white: "epfpgpdqhqdrdsfs",
            },
            marks: { triangle: "dqeqfqdrergrdses" },
            move_tree: this.makePuzzleMoveTree(["gqfrhrgshs"], ["frgs", "hrcr"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncnbododpdqgqbr",
                white: "bldmdncoapbpcp",
            },
            marks: { triangle: "anbncnbocoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "cmcqbmbqam",
                    "cmcqambqbm",
                    "bmbqcmcqam",
                    "bmbqamcqcm",
                    "amcqbmbqcm",
                    "amcqcmbqbm",
                ],
                [
                    "cmcqbmbqaoaq",
                    "cmcqambqaoaq",
                    "cmcqaobq",
                    "bmbqcmcqaoaq",
                    "bmbqamcqaoaq",
                    "bmbqaocq",
                    "amcqbmbqaoaq",
                    "amcqcmbqaoaq",
                    "amcqaobq",
                    "aobq",
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fogoephpeqhqerhresfs",
                white: "doeocpfpcqfqgqdrgrdsgs",
            },
            marks: { triangle: "epfpeqfqgqergresfsgs" },
            move_tree: this.makePuzzleMoveTree(
                ["dpgpdq", "dqgpdp"],
                ["dpgpfrhs", "dqgpfrhs", "frgp"],
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "clcndodpbqcqbr",
                white: "bpcpepdqfqcrdr",
            },
            marks: { triangle: "bpcpbqcqbr" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "bsboaq",
                    "bsboar",
                    "bsboapaoar",
                    "bsboapaoaq",
                    "aqbsarbocs",
                    "aqbsarboapaocs",
                    "aqbscsboar",
                    "apboaq",
                ],
                ["aqbsarboapaoasco", "aqbsarboasap"],
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndncoeoepbqcqdqeq",
                white: "bmcmdmenfndobpcpdp",
            },
            marks: { triangle: "anbncndncodobpcpdp" },
            move_tree: this.makePuzzleMoveTree(["aoaqam"], ["aoaqboap", "amap", "boap"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndodpbqcqbrbs",
                white: "bpcpepdqfqcrdrcs",
            },
            marks: { triangle: "bsbrcqbqcpbp" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "aqboar",
                    "aqboas",
                    "apaoaq",
                    "apaoar",
                    "apaoas",
                    "arapaoboaq",
                    "arapaqasaq",
                    "arapaqasao",
                    "araqap",
                    "arboaq",
                    "arcoaq",
                ],
                [],
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
        return _("White to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            initial_state: {
                black: "codpepcqfqgqcrgrhrircsgs",
                white: "fpgpdqeqhqiqjqdrfrjrdses",
            },
            marks: { triangle: "dqeqfqgqdrfrgrhrirdsesgs" },
            move_tree: this.makePuzzleMoveTree(["is"], ["fser", "hsis", "jsfs"], 19, 19),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codocpepcqeqfqcrfrgrcs",
                white: "eofodpfphpdqgqdrhrdsgs",
            },
            marks: { triangle: "dpepdqeqfqdrfrgrds" },
            move_tree: this.makePuzzleMoveTree(["es", "er"], ["fshs"], 19, 19),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ckbldlbmdnencoapbpcp",
                white: "cmanbncnbododpdqgqbr",
            },
            marks: { triangle: "cmanbncnbocoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "ambqdmaqcl",
                    "ambqclaqdm",
                    "dmbqamaqcl",
                    "dmbqclaqam",
                    "clbqdmaqam",
                    "clbqamaqdm",
                ],
                [
                    "ambqdmaqaocq",
                    "ambqclaqaocq",
                    "ambqaoaq",
                    "dmbqamaqaocq",
                    "dmbqclaqaocq",
                    "dmbqaoaq",
                    "clbqdmaqaocq",
                    "clbqamaqaocq",
                    "clbqaoaq",
                    "aobq",
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndnaoeodpepcqbr",
                white: "blcmdmemencodoapbpcp",
            },
            marks: { triangle: "anbncndnaocodoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                ["bqbmaq", "aqbmbq"],
                ["bqbmboam", "aqbmboam", "bobm"],
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbncndnboeoepdqeqbr",
                white: "clbmemenaodoapbpcpdp",
            },
            marks: { triangle: "anbncndnaobodoapbpcpdp" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "bqcmcqdmaq",
                    "bqcmaqdmcq",
                    "aqcmcqdmbq",
                    "aqcmbqdmcq",
                    "cqcmbqdmaq",
                    "cqcmaqdmbq",
                ],
                [
                    "bqcmcqdmcoam",
                    "bqcmaqdmcoam",
                    "bqcmcodm",
                    "aqcmcqdmcoam",
                    "aqcmbqdmcoam",
                    "aqcmcodm",
                    "cqcmbqdmcoam",
                    "cqcmaqdmcoam",
                    "cqcmcodm",
                    "cocm",
                ],
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodpepdr",
                white: "bmdndoapbpcp",
            },
            marks: { triangle: "aobocoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                ["cqbnbq"],
                [
                    "bqcqcrbrdqaqbscnasbn",
                    "bqcqcrbrdqaqbscnaras",
                    "bqcqcrbraqardqcnbqaqbsbn",
                    "bqcqbrcn",
                    "bqcqdqbrcraqbscnasbn",
                    "bqcqdqbrcraqbscnaras",
                    "bqcqdqbrcraqcsbs",
                    "aqbrcqbqcrcnbsarcsbn",
                    "aqbrbqcqcrardqcnbqaq",
                    "aqbrbqcqcrardqcnaqbq",
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blamcmdmdndoapbpcp",
                white: "clbmbncncodpepaqbqcqgq",
            },
            marks: { triangle: "bmbncncoapbpcp" },
            move_tree: this.makePuzzleMoveTree(["an"], ["boao", "aobkanal", "aobkalak"], 19, 19),
        };
    }
}

class Page19 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "epfpdqgqhqiqdrirds",
                white: "cpdpcqeqfqbrergrhres",
            },
            marks: { triangle: "dqeqfqdrergrhrdses" },
            move_tree: this.makePuzzleMoveTree(
                ["fsfrhs"],
                ["fsfriscr", "fsfrgshs", "frfshscr", "frfsgshs", "hscr", "gscr"],
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldmandndoapbpcp",
                white: "bmcnaobocodpcqdqgq",
            },
            marks: { triangle: "bmcnaobocoapbpcp" },
            move_tree: this.makePuzzleMoveTree(
                ["cmbnblamal"],
                ["cmbnamal", "bncmblam", "blbq", "ambq"],
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blclcmdndoeoapbpcpcqarcr",
                white: "bmdmemancnfnaobocodpfpdq",
            },
            marks: { triangle: "bmancndnaobocodoeo" },
            move_tree: this.makePuzzleMoveTree(["alfoam"], ["amalakbk"], 19, 19),
        };
    }
}

class Page22 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncnencodpepbqcqarbr",
                white: "bofoapbpcpfpdqfqcrerbs",
            },
            marks: { triangle: "boapbpcpbqcqarbr" },
            move_tree: this.makePuzzleMoveTree(
                ["ancsao"],
                ["ancsaqas", "aqas", "aoanambm"],
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "fpgphpdqeqhqdrhrds",
                white: "cpdpepcqfqgqcrgrgs",
            },
            marks: { triangle: "dqeqfqgqdrgrdsgs" },
            move_tree: this.makePuzzleMoveTree(
                ["hserfs", "hserescsfr"],
                [
                    "hserescsfsfr",
                    "hserfrfsescs",
                    "frfsercs",
                    "frfseser",
                    "erfshscs",
                    "erfsfrcs",
                    "erfsescs",
                    "fsfrescs",
                    "fsfreres",
                    "fsfrhses",
                    "esfrfscs",
                    "esfrhscs",
                    "esfrercs",
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
        return _("Black to play. Win the capturing race between the marked groups.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlbmcmancncododpbqcqarbr",
                white: "dmbnboeoapbpcpepdqfqcrerbs",
            },
            marks: { triangle: "bnboapbpcpbqcqarbr" },
            move_tree: this.makePuzzleMoveTree(
                ["amcsao"],
                ["amcsaqas", "aoamalaq", "aoamancsalas", "aoamancsaqas", "aoamaqas", "aqas"],
                19,
                19,
            ),
        };
    }
}
