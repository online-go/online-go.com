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

export class BL4CapturingRace6 extends LearningHubSection {
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
        return "bl4-capturing-race-6";
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
                black: "dqeqcpbp",
                white: "bqcqdpdobn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["brcraqbsar", "brcrdraqcs"],
                [
                    "brcraqbsdrar",
                    "brcrdraqapbs",
                    "brcrdraqarbs",
                    "crbrbsdraqcsaras",
                    "crbrbsdrarcsaqas",
                    "crbrbsdrcsds",
                    "crbraqbs",
                    "crbrarbs",
                    "crbrdrap",
                    "aqbrarbs",
                    "aqbrcrbs",
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
                black: "epeoencpbpapbmcmdmeleqdq",
                white: "aqbqcqdrerfqfpbnbodpdodncnfrhoiq",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["aoan", "coao", "amao", "crao"], 19, 19),
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
                black: "dqeqepeogofndncngl",
                white: "crdrerfqgqenemdlcldodpboek",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcobn"],
                [
                    "bpcocpbn",
                    "cocpcqbpbqbn",
                    "cocpcqbpbnbq",
                    "cocpbpcq",
                    "cocpbnbp",
                    "cpcobpbn",
                    "cpcobnbpcqbq",
                    "cqbpbnbq",
                    "cqbpbqbnbmcm",
                    "bncp",
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
                black: "arbrcqdpeqfqfrfsesdobqcm",
                white: "bscrdrdqepfpgqgrgpirfm",
            },
            move_tree: this.makePuzzleMoveTree(["dsgsas"], ["dsgscser", "csds", "asds"], 19, 19),
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
                black: "drdqdpdoerenfnfpgn",
                white: "brbqcpcodnbneoepeqfqhoiqiodm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["gqfogogpfr"],
                ["gqfogogphpgr", "gqfogpgo", "gqfofrgo", "fogq", "frgq", "gpgq"],
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
                black: "cocpcqcrdnenep",
                white: "brbqbobncndodpdqgrhqcl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dreqfqeofofper"],
                [
                    "dreqfqeofofpgper",
                    "dreqfqeofpfo",
                    "dreqerfq",
                    "dreqeofq",
                    "eqdr",
                    "eodr",
                    "bpdr",
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
                black: "apbpcpdqdreqfpfqdocmbmhpck",
                white: "aqbqcqcrdpepcocneofodmgo",
            },
            move_tree: this.makePuzzleMoveTree(["an"], ["bobn", "bnbo", "aoan"], 19, 19),
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
                black: "cpdpeqeofogohphqhrhnhs",
                white: "brcqdqbpfpgpgqgrbocmer",
            },
            move_tree: this.makePuzzleMoveTree(
                ["frfsgsfqepfrdr", "frfsepfqgsfrdr"],
                ["frfsfqep", "gsfr", "epfr", "fqep"],
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
                black: "araqbpcpdpepfpfqdmbnerdr",
                white: "brbqbscqdqeqfrgrgqgpgo",
            },
            move_tree: this.makePuzzleMoveTree(["csesap"], ["cres", "escr", "dsfs"], 19, 19),
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
                black: "hqasarbqcqdqbpesereoepdsfrgr",
                white: "aqaobocodpeqfqfpfobrcrdrgn",
            },
            move_tree: this.makePuzzleMoveTree(["csbsar"], ["bscs", "apcp"], 19, 19),
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
                black: "aqarbrcrdqeqfpeofm",
                white: "bqcqcpapdrerfrephq",
            },
            move_tree: this.makePuzzleMoveTree(["cobodp"], ["dpco", "dsbs"], 19, 19),
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
                black: "crcqbpboardpepeoen",
                white: "cpcocndodldkfldrdqeqfqfpgn",
            },
            move_tree: this.makePuzzleMoveTree(["cm"], ["dncm", "dmcm", "bncm"], 19, 19),
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
                black: "cscrdqdpcoboaoeo",
                white: "brcqcpbpdrerfqhq",
            },
            move_tree: this.makePuzzleMoveTree(["bqaqap"], ["apbq", "bsds", "aqbs"], 19, 19),
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
                black: "brcrcpdqdpdodnfrfqfmgohr",
                white: "bqcqbpcocncmdrercsdl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["arbsbo"],
                ["bses", "boar", "esar", "eqar", "dsarbses", "asar", "aqbs"],
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
                black: "brcrcpdpdqeqfqgrgpfmhr",
                white: "arcqbqbpcodofrerdrcm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bsaqbo"],
                ["bsaqfsas", "bsaqesas", "bsaqdsas", "csds", "dsbs", "fscs"],
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
                black: "crfrfqepdpcpbpbqarcmdn",
                white: "bsbrdsereqdqcqfpgphrhpgmeo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsescsdrcs", "fsescsdrcr", "fsescsdraqgrcr", "fsescsdraqgrcs"],
                ["fsescsdraqgrasgs", "csgr", "drcs", "esfs", "aqgr"],
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
                black: "eofpgpaqarbrcreqdqdrfofmhm",
                white: "bqcqapcpdpepgqhqfqfrdmcmelerdsck",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cobodo"],
                ["cobobndo", "dococnbn", "bododncn"],
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
                black: "bqcqcpdoeofp",
                white: "epdpdrgrgqhphncocnbpaodmgo",
            },
            move_tree: this.makePuzzleMoveTree(["erdqcr", "erdqeq"], ["dqeq", "eqcr"], 19, 19),
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
                black: "dqeqerepeofogpbqbpgqbocogripdp",
                white: "brcrdrcqcpdodnfrfsesgognfpfqclgl",
            },
            move_tree: this.makePuzzleMoveTree(["dscsgsdsar"], ["gsds", "aren"], 19, 19),
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
                black: "dsereqdpcpcqcocndm",
                white: "bsasaraqbqcrdrdqepfpdoeogqfm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["esfrcs"],
                ["esfrbpfs", "bpfr", "cses", "grfr"],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
