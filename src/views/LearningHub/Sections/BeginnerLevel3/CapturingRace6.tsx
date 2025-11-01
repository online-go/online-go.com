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

export class BL3CapturingRace6 extends LearningHubSection {
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
        return "bl3-capturing-race-6";
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
                black: "arbqbpcpcocnblcldmelcr",
                white: "bobnbmcmdndodpdqcqbrbsdr",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["amap", "anap", "aqcs", "apao"], 19, 19),
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
                black: "bnendsargsgrgqbqcpfqeqdpbp",
                white: "asbsbrcqdqdrerfrfshphrirepfpgphn",
            },
            move_tree: this.makePuzzleMoveTree(["cr"], ["csaq", "escs", "aqhq"], 19, 19),
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
                black: "bmblcldmdncocpbpbqelfn",
                white: "aqbrcrcqdpeqdoanbncncmgp",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["boap", "apar", "amap"], 19, 19),
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
                black: "brbqbpcodoeofpeqfobn",
                white: "crcqcpdpepfqfrgphrgo",
            },
            move_tree: this.makePuzzleMoveTree(["drercs"], ["eres", "dqdr", "csdr"], 19, 19),
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
                black: "dodmdlbrcrcqbocmblcndpfoflhn",
                white: "bnbmbkckcldkekbqbpcpdqdrfqgqhpco",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ao"],
                ["aqao", "apao", "anao", "amao", "alao"],
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
                black: "crcqcpdoeoanbncndmgo",
                white: "csaqdsdrdqdpcoboaofqhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpapar"],
                [
                    "bqbr",
                    "apbp",
                    "brarbpap",
                    "brarbsbp",
                    "brarbqbs",
                    "brarapbp",
                    "brarasbp",
                    "arbpbrbs",
                    "arbpbqbr",
                    "arbpbsbr",
                    "bsbr",
                ],
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
                black: "brcrdreqepdpcobogq",
                white: "ardqcqbqcpbncndoeodmfo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ap"],
                ["bpaq", "aoap", "aqap", "asbs", "bsao", "anbp"],
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
                black: "cpcodoeofogsgrgqgpgncmdq",
                white: "cqcrbpbobqdpepfpfqfrfsbn",
            },
            move_tree: this.makePuzzleMoveTree(["er"], ["eqdr", "drds", "eser"], 19, 19),
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
                black: "aqbrcrcqbmcndodpdm",
                white: "bqbpcpcobnaodqdrfq",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["amcs"], 19, 19),
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
                black: "bqcqdqepfpfqgogn",
                white: "aqbpcpdpeqerhqdoeo",
            },
            move_tree: this.makePuzzleMoveTree(["drfrgr"], ["frdr"], 19, 19),
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
                black: "arbrcrcqbmcmcndodpenck",
                white: "bqaqbpcpcobndqdrepeqfrgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aocsbo", "aocsap"],
                ["aocsanbs", "anao", "boao", "apao", "csds", "bsds"],
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
                black: "crcqcodpepdnfm",
                white: "cpbpdqdrfrgqcmclhq",
            },
            move_tree: this.makePuzzleMoveTree(["bobqbr"], ["bqbobncn"], 19, 19),
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
                black: "bqcqdqdpeofobncmdmfm",
                white: "brcrdreqepdodncnbofrgp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cocpen"],
                [
                    "cocpbpaq",
                    "cocpaobm",
                    "encoaobm",
                    "encobpbm",
                    "encocpaq",
                    "encobmaq",
                    "cpco",
                    "bpbm",
                    "bmbp",
                ],
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
                black: "bqcqdpdndocmbldl",
                white: "brcrdqerepcpcocnbmgq",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["bnbp", "aqar", "bobp", "apbp"], 19, 19),
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
                black: "bsbrapbpcpdqdrfrgq",
                white: "arbqcqcrcsdpepgocobndn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqasbrbobsards", "aqasbsbobrards"],
                ["aqasbrbobsarasar", "aqasdsbo", "dsasaqbo", "dsasbsbo", "dsasbrbo"],
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
                black: "cqdpepeqercocn",
                white: "cpbpgrgqfpfoeodobmcmdmfm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bobqbrcraq", "bobqbrcrap"],
                ["bobqbrcrdqar", "bobqcrao", "bobqapbr", "bobqaqbr", "bqbo", "bnbo", "apbo"],
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
                black: "cmbmambrcrcqdpdoeqapcngp",
                white: "cpcobobnanaqdnenblcldlgnbqfl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpaobp", "bpaoap"],
                ["bpaoardm", "aobp", "ardm"],
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
                black: "cqcpcodnendreremflfk",
                white: "eqdpdobpbocndmbmdlhrhqipioim",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epeofofpdqepgpfqgqfrgr"],
                [
                    "epeofofpdqepgpfqgqfrfsgr",
                    "epeofofpdqepgpfqfrgq",
                    "epeofofpdqepfqgp",
                    "epeofofpgpgq",
                    "epeofofpfqgp",
                    "epeodqfo",
                    "epeofpfogogpfqgn",
                    "eofq",
                    "dqfp",
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
                black: "dqcqbqbpeneoepcm",
                white: "brcrdreqbocpdpdofpfrem",
            },
            move_tree: this.makePuzzleMoveTree(
                ["codndmcnbn"],
                [
                    "codndmcnaoaq",
                    "codndmcnbmaq",
                    "codncndm",
                    "dnco",
                    "apao",
                    "aqar",
                    "cnaq",
                    "bnaq",
                ],
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
                black: "brcrdreqepfofn",
                white: "cqdqerfrfqcndmgp",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], ["bqcp", "dpcpcobo", "bpcpcodo"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page21 extends LearningPage {
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
                black: "bsbrcrdrbncncocpdpeqep",
                white: "arbqcqdqbpboaoerdsfrfqfp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aqesan"],
                ["aqesascs", "anaq", "apesanaq", "ascs", "csas"],
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
                black: "bsbrbqcqdpepfpfn",
                white: "aqbpcpdqdrcrhqhpcnhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["ereqfqfrdsescsergr", "ereqfqfrcsesdsergr"],
                [
                    "ereqfqfrdsesgrcs",
                    "ereqfqfrcsesgrds",
                    "ereqfqfresfs",
                    "ereqdsfqgqgr",
                    "ereqdsfqfrgq",
                    "eqer",
                    "csds",
                    "dser",
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
                black: "dqdpeofodncnbnem",
                white: "brdreqepdocoboergq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcpcq"],
                ["cpbp", "aocq", "cqbq", "crcq", "bqcq"],
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
                black: "drerfqdpcpbpcqbn",
                white: "bsarbqcrdqeqephrhqho",
            },
            move_tree: this.makePuzzleMoveTree(
                ["foeoen"],
                ["foeofpen", "foeodoen", "eofp", "fpeo"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
