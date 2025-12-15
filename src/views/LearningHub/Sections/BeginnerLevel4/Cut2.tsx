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

export class BL4Cut2 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl4-cut-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning cut", "Tesuji");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on cut", "Cut");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
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
                black: "crereqeofngnhlbr",
                white: "gohogqhqiqcqcobpcndl",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epdpfpdodq", "epdpfpdqdo", "epfpdpfqfo", "epfpdpfofq"],
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
        return _("White to play. Cut the black stones.");
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
                black: "epfofndmdobobmcmeqerfrdk",
                white: "cpbpemfmbrdrdqfqfpgognhmdphriphq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dncnencoeo"],
                ["dncneoen", "dncncoen", "codn", "eneo"],
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
        return _("White to play. Cut the black stones.");
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
                black: "cqcrbsdresgrgqgnfp",
                white: "arbrbqbpcpdqeqfqdocm",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsfrergsdscsas"],
                ["fsfrergscsds", "fsfrdser", "fsfrcser", "frfs", "erfs", "dser"],
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
        return _("White to play. Cut the black stones.");
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
                black: "brcqcpepfpgpfngnio",
                white: "crdreqfqgqhqendnbnclbo",
            },
            move_tree: this.makePuzzleMoveTree(["dpdodqeoco", "dpdodqcoeo", "dpdqdo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
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
                black: "brcrdrcqcndkcm",
                white: "dodpdqerdseqhq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpcpco"],
                [
                    "bococpbp",
                    "cobobpancpapaqbq",
                    "cobobpancpapbqaq",
                    "cobobpanapcp",
                    "cobobpanbqcp",
                    "cobobpanaqcp",
                    "cpbpboco",
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
        return _("White to play. Cut the black stones.");
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
                black: "crcqcpbobncmergrgqgo",
                white: "bsbrbqbpcodoeq",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drdqdpdscsdrfr", "drdqcsdsdpdrfr"],
                ["drdqdpdsfrfq", "drdqcsdsfrep", "dpdr", "dqdr", "frdrfqfs", "frdrfsfq", "csdr"],
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
        return _("White to play. Cut the black stones.");
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
                black: "bpcpepfpgpgmgnhohk",
                white: "brdreqfqgqhqbndnfndmflipck",
            },
            move_tree: this.makePuzzleMoveTree(["dpdodqeoco"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
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
                black: "crbrbqbocncl",
                white: "bscsdrdqdpbpgq",
            },
            move_tree: this.makePuzzleMoveTree(["apcpcq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 10 },
            /* cSpell:disable */
            initial_state: {
                black: "cqdreqfqgrhqcpbnclcm",
                white: "hrgqfpepdpdqjqdnjpinel",
            },
            move_tree: this.makePuzzleMoveTree(["frgpergqcr"], ["erfr", "gpfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
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
                black: "cpdpfpgpiphq",
                white: "crdrerfrgrdnenfnbn",
            },
            move_tree: this.makePuzzleMoveTree(
                ["epeqeofqdq", "epeqeodqfq", "epeoeqfodo", "epeoeqdofo"],
                [],
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
        return _("White to play. Cut the black stones.");
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
                black: "brbqcpdpcsereofndncl",
                white: "crdrdqepfqfogohqhm",
            },
            move_tree: this.makePuzzleMoveTree(["es"], ["dseq", "eqds"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
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
                black: "cqfqiq",
                white: "coeofo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["eqerfrepgqdqfp"],
                [
                    "eqerfrepfpgqdqdr",
                    "eqerfrepfpgqdpdr",
                    "dqdrcreqdpbr",
                    "dqdrcreqerdp",
                    "dqdrereq",
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
        return _("White to play. Cut the black stones.");
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
                black: "brbqaqapaocndoepeqfqfrencl",
                white: "bscrcqcpbpcodqeres",
            },
            move_tree: this.makePuzzleMoveTree(["bnbman"], ["bnbmboan"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Cut the black stones.");
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
                black: "brbqcqbpfqgrgqgo",
                white: "apbococpdpfreo",
            },
            move_tree: this.makePuzzleMoveTree(
                ["drerdqdscs"],
                [
                    "drereqfsdqdscscr",
                    "drereqfsdqdscrcs",
                    "drereqfsdsdq",
                    "drereqfscrdq",
                    "drerdsdq",
                    "dqdrereq",
                    "ereqdqdr",
                    "eqerdrfsdqdscscr",
                    "eqerdrfsdqdscrcs",
                    "eqerdrfsdsdq",
                    "eqerdqdr",
                ],
                19,
                19,
            ),
            /* cSpell:enable */
        };
    }
}
