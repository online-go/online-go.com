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

export class BL3Endgame4 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-endgame-4";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning biggest play", "Endgame");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on biggest play", "Biggest move");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "hmgnhnfodpfpgpdqgqarbrdrerfrhrbsds",
                white: "flgmdnenfnbodocpepaqbqcqeqcr",
            },
            marks: { A: "eo", B: "cs" },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A, B or C.");
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
                black: "dmanbncndoeofohoapgpdqgqgresgs",
                white: "bococpepfpbqcqfqardrerfrbsds",
            },
            marks: { A: "ao", B: "dp", C: "fs" },
            move_tree: this.makePuzzleMoveTree(["ao"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "fogohoiodpfpcqdqeqgqdrcsds",
                white: "cnenfngnhninbodocpepbqarbrcr",
            },
            marks: { A: "eo", B: "bs" },
            move_tree: this.makePuzzleMoveTree(["eo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "enfngndodpbqcqeqcrcs",
                white: "blcmdmemfmbnaocobpcpaqarbr",
            },
            marks: { A: "dn", B: "bs" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A, B or C.");
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
                black: "blcmdmemgmanbnfndoeogoapbpgpgqergrfsgs",
                white: "cndnbocofocpdpepfpaqbqcqfqarcrfrbscsds",
            },
            marks: { A: "en", B: "ao", C: "es" },
            move_tree: this.makePuzzleMoveTree(["es"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "coeofogodpdqcreres",
                white: "bncndnenbocpcqbrbs",
            },
            marks: { A: "do", B: "cs" },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "bkdkekclhlambmhmanhnbohobphphqergrhresgs",
                white: "fkdlelflcmgmbncngncogocpgpaqbqcqeqfqgqdrfrds",
            },
            marks: { A: "ao", B: "fs" },
            move_tree: this.makePuzzleMoveTree(["ao"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "cndneofoepeqcrercses",
                white: "blcmdmembnbocododpbqcqbrdrbs",
            },
            marks: { A: "en", B: "ds" },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A, B or C.");
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
                black: "clambmcndnenaoeogoapcpfpcqgqergresgs",
                white: "bnbodobpdpaqbqdqeqfqarcrdrfrbscs",
            },
            marks: { A: "an", B: "co", C: "fs" },
            move_tree: this.makePuzzleMoveTree(["fs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "gncoeofocpfpeqbrdrfrds",
                white: "bmemcndnbobpdpepaqbqcqdqcr",
            },
            marks: { A: "do", B: "cs" },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "emfmgmdnhnbocoeohobpdpgphpbqcqeqfqgqarcrfrcs",
                white: "clelfldmanbncninioapipaqhqdrgrirfsgs",
            },
            marks: { A: "ao", B: "es" },
            move_tree: this.makePuzzleMoveTree(["es"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the biggest move, A or B.");
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
                black: "fngnfocpdpfpeqarbrdrfrcsds",
                white: "emfmbndnencoeobpaqbqcqdqcr",
            },
            marks: { A: "ep", B: "bs" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
