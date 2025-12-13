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

export class BL4CapturingRace8 extends LearningHubSection {
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
        return "bl4-capturing-race-8";
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
                black: "dqdrepeogqhqgnio",
                white: "brbpcpdpeqergrcm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfqesfsdscrfp"],
                [
                    "frfqesfsfpds",
                    "frfqfpesdsfs",
                    "frfqfpeshrcr",
                    "frfqfpesfsgs",
                    "frfqfses",
                    "fqfr",
                    "esfr",
                    "dsfr",
                ],
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
                black: "brcrcqbmcmcnbkdodpem",
                white: "bqbpcpcobndrdqeqephq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["araoaqapam"],
                ["araoaqapcsds", "araoamaqancs", "aoar", "anar", "aqar"],
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
                black: "crcqbncndoeofqer",
                white: "bqbocodndmclblfm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcpaoapanbrdpbpbs", "bpcpaoapanbrbs"],
                [
                    "bpcpaoapanbrdpbpcscm",
                    "bpcpaoapdpan",
                    "bpcpaoapbran",
                    "bpcpapao",
                    "bpcpdpap",
                    "cpbp",
                    "aobp",
                    "anbp",
                ],
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
                black: "crcqdpeofogogpfqfrgrcpcn",
                white: "fpepeqdqdrdsesgqhphqhrioim",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["ergs", "gshs", "csgs"], 19, 19),
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
                black: "fsaqarbrcrbpcodoeofpfqfrcm",
                white: "irfogpgqgrerdrcqbqdpephnfn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dseseqcscp"],
                [
                    "dseseqcsdqgs",
                    "dsescsgs",
                    "dsescpgs",
                    "dsesdqeq",
                    "dqeqcpgs",
                    "dqeqdses",
                    "dqeqesds",
                    "esdscpeq",
                    "eqdq",
                    "cpgs",
                ],
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
                black: "bsbrbqcpdpepfqfrfnfl",
                white: "bpbocncmcqdqcrerfsgrgqgphnckir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqesdr"],
                ["eqescsdr", "eqesdsdr", "cseq", "dses", "dreq", "eseq"],
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
                black: "bncncocpdqdrbrdscsfqfpao",
                white: "bqbsaqcrcqbpbodndmclblfmdpdo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arasarbran", "arasan", "arasbraran"],
                ["asbm", "anar"],
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
                black: "bqbpcodoepeqeresbncl",
                white: "bsbrcqcpdpdrdseofpfqgrengn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["crcsdq"],
                ["crcsarfr", "dqcr", "cscr", "arfr"],
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
                black: "bscscrcqdpcobnbldodm",
                white: "dqdrdsfqbobpcpaqhp",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arbqao"],
                ["arbqanbr", "aobr", "bqaraoap", "bqarapaoanap", "anbq"],
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
                black: "crcsdqeqerfrcpbpcodoem",
                white: "bsbrbqcqgrgqfqfpepdpgnir",
            },
            move_tree: this.makePuzzleMoveTree(["dsfsaq", "dsfsar"], ["aqds", "fsds"], 19, 19),
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
                black: "bsbrbqcpdpepfqfrfsbo",
                white: "cqdqeqcrfpfogqgrgsho",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], ["erdr", "esds", "cser", "drer"], 19, 19),
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
                black: "bsbrbpcpdrdqeqfqfphq",
                white: "arbqcqcrcsdpepfoeobndn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["apasaq", "apasbs", "apasbr"],
                ["dsasapbo", "dsasbrbo"],
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
                black: "bsbrbqcpdpepfqgqhrgshpen",
                white: "bpbocogrfreqdqcqcrcsdsescm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["erdrhs"],
                ["draq", "hsaqfsar", "hsaqerar", "hsaqdrar", "aqap"],
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
                black: "brcrdqdpfqfngp",
                white: "erdrcqbqdocodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arcscpbpbo", "cpbparcsbo"],
                ["arcsfrbs", "arcseqbs", "arcsdsbsasaq", "frar", "eqar", "csar", "bsar"],
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
                black: "brcqcpdpepfrfqhphodnenhm",
                white: "bscrbqbpbodqeqerfpgphqhr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsdrgq", "fsdrcsargq"],
                ["fsdresgq", "fsdrcsaresgq", "fsdrdsgq", "gqfs", "esdr", "drds"],
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
                black: "brcqcpcocnclfn",
                white: "bqbpcrdqdpgqdr",
            },
            move_tree: this.makePuzzleMoveTree(["ar"], ["bsar", "boar"], 19, 19),
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
                black: "aqarbrcrcqbmcmdndodpfn",
                white: "bqbpcpcobnamblcldqdrfqgp",
            },
            move_tree: this.makePuzzleMoveTree(["cn"], ["apcn", "aoan"], 19, 19),
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
                black: "crcqcpepeofqcn",
                white: "eqdqfpgphqgn",
            },
            move_tree: this.makePuzzleMoveTree(["fr"], ["erfr", "drfr", "dpfr"], 19, 19),
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
                black: "aqbqbpcpboblcldmdoeoemdk",
                white: "arbrcqcocncmbmamdpepfpcrhq",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["anbn", "bnan", "alao", "dnao"], 19, 19),
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
                black: "arbqcqcrdpeqepfqfr",
                white: "brcsdrerdqfsgrgqgpcpcocnfn",
            },
            move_tree: this.makePuzzleMoveTree(["esdsbs"], ["bses", "dses"], 19, 19),
            /* cSpell:enable */
        };
    }
}
