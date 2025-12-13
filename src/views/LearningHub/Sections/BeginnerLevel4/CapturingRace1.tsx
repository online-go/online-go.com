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

export class BL4CapturingRace1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-capturing-race-1";
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
        return _(
            "The white group has four liberties and the black group five. But White can win the capturing race by first throwing in at A. Win the capturing race with White.",
        );
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
                black: "arbnbrclcncrdndseoeperesfpfqgr",
                white: "aqbqcqdmdodpdqdreneqfmfogohphqhr",
            },
            marks: { A: "fr" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "frfsgqbpgpfrhscogs",
                    "frfsgqbphscogp",
                    "frfsgqbphscogp",
                    "frfsgpbpgqfrhscogs",
                    "frfsgpbphscogqfrgs",
                ],
                [],
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
        return _(
            "Stretching towards the edge of the board is called 'sagari' in Japanese. It is a tesuji to create extra liberties. White can play sagari at A to create extra liberties. Win the capturing race with White.",
        );
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
                black: "aqbobpcocqcrdndrfn",
                white: "bqbrcpdpeperfrgp",
            },
            marks: { A: "bs" },
            move_tree: this.makePuzzleMoveTree(["bsardq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White has two liberties and Black three. White can prevent Black from playing atari at A by playing at B. Black has to capture this white stone first, before playing atari at A. This gives White time to fill the liberties of the black group of three stones. Win the capturing race with White.",
        );
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
                black: "arbobpbscmcncpdqdrds",
                white: "aqbqcocqcrcsdodpfpfr",
            },
            marks: { A: "ap", B: "bn" },
            move_tree: this.makePuzzleMoveTree(
                [
                    "bnbmeqaner",
                    "bnbmeqanes",
                    "bnbmeraneq",
                    "bnbmeranes",
                    "bnbmesaneq",
                    "bnbmesaner",
                ],
                [],
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
                black: "cqdqeqgrgqgpfpgn",
                white: "bqfqfrepdpcpboen",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["crer", "fser"], 19, 19),
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
                black: "bpbocncqcrdrerdm",
                white: "brbqcpdpdqfrfqeohrgo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bs"],
                ["eqbs", "csbsasds", "esbs", "aqbs", "arbs"],
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
                black: "braraqbpcpbmcmdndoeldm",
                white: "bscrcqbqbncncodpeoeperfm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aoapcs"],
                ["csan", "anao", "apao", "amao"],
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
                black: "braqbpcpdpeqergq",
                white: "apaobocodoepfodqdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bqcqcr"],
                ["cqbq", "crbq", "dscr", "cscr"],
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
                black: "hofnfodpepeqerescrcqhpgqhrhmhq",
                white: "frfqfpgpbrbqcpbodmdodseo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drcsfs", "drcsbs"],
                ["csfs", "dqdr", "fsdr"],
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
                black: "aqbpcpcrcsdqeqerfrdocm",
                white: "bsbrbqcqdpepfqgrgphr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dsdrfs"],
                ["dsdresfs", "fsar", "drds", "esfs"],
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
                black: "bmamcobrcrcqbpapdodndmcm",
                white: "dqbqcpdpdrboalblcldlelemeneofp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["anaqbn", "anaqcn"],
                ["aoaq", "bnan", "cnbn", "aqar"],
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
                black: "cpdoeocncmdlflhmhngp",
                white: "drdpcobodnenfn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fpepeqdqfodpbp", "fpepeqdqfodpcq"],
                ["cqfo", "epfo", "foepfpeq", "foepeqfp", "foepdqfp"],
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
                black: "bpbqbncncodpdqdrdscl",
                white: "brcrcqcpbodoeoepfrfqem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ar"],
                [
                    "aobsapcsaqar",
                    "aobsapcsarasaqan",
                    "aobsaqcsaras",
                    "aobsaqcsapar",
                    "aobsarcs",
                    "esar",
                    "erar",
                    "eqar",
                    "aqao",
                    "apao",
                    "csar",
                    "bsar",
                    "ascs",
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
                black: "bocobpeseqepbscrcqdrerdncl",
                white: "bqdqdpcpdoeofpfqfrarfnbriq",
            },
            move_tree: this.makePuzzleMoveTree(["csdsfs"], ["dscs", "fscs"], 19, 19),
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
                black: "cscobocldpdqdrfreogodk",
                white: "crcqcpcndndoemgm",
            },
            move_tree: this.makePuzzleMoveTree(["bpbnbm"], ["bpbnaobm", "bnbp"], 19, 19),
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
                black: "arbqbpcpbmcmdndodl",
                white: "aoanbncncodpepcqbrbscr",
            },
            move_tree: this.makePuzzleMoveTree(["apamas"], ["asap", "aqap"], 19, 19),
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
                black: "hrhqhpgohnfqfpepdpdrcrcqgs",
                white: "brbqcpdoboeofogpgqgrfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dqeqer", "erdqesdsbs"],
                ["eqdq", "fser", "erdqdsesfscs", "erdqcses", "erdqeqes"],
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
                black: "bqcqcrdpdocncl",
                white: "bpcpdqdrepfq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["araqap", "araqcsbsds", "ap"],
                [
                    "araqbrbs",
                    "aqarapbs",
                    "aqarcsap",
                    "bsbo",
                    "csbsaqdsarer",
                    "csbsdsar",
                    "csbsardsaqes",
                    "brbsaraq",
                    "brbsaqar",
                ],
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
                black: "crcqbqdpepfqfrfsfn",
                white: "drdqcpbpdococm",
            },
            move_tree: this.makePuzzleMoveTree(["dscsbs"], ["dscsaqar", "csbs", "aqds"], 19, 19),
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
                black: "cpdpdqdreqfpgpgqgr",
                white: "cscrcqbpcoboepeofofqfr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eserfs"],
                ["eres", "dsfs", "fsesdsgs", "dofs"],
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
                black: "bqbpcrdreqfqgp",
                white: "brcqbocndpdofn",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqbs", "bsar", "cpar", "apar"], 19, 19),
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
                black: "aqbqcqdrerfrdndodpbmgq",
                white: "arbrcrdqeqepeoendmel",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cpbpbococn"],
                ["cpbpbocobncs", "cpbpbococmcs", "cpbpcobo", "csds", "dsbo"],
                19,
                19,
            ),
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
                black: "drereqfqfpdpcpbpbqgo",
                white: "brcrcqdqepeocobnemcm",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["aqcs", "boar", "doar"], 19, 19),
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
                black: "arbqbpcocncqdrerfreq",
                white: "brcrdqcpdpepfqgrgqgoir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsdsfsaqbo"],
                ["bsdsbocs", "csds", "dsbs", "fscs"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
