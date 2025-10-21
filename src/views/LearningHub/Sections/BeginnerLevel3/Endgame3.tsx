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

export class BL3Endgame3 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-endgame-3";
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
        return _(
            "In the endgame you can calculate which is the best (biggest) move. First you look at all moves, that can still yield points. Next you calculate how much each move is worth and then you choose the move that yields most points. The move at A is worth two points and the move at B three points. Choose the biggest move for Black, A or B.",
        );
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
                black: "amaobmbscmdndodrdsepeqfrgoipiqir",
                white: "aparbnbobpbqbrcpcrdpdq",
            },
            marks: { A: "an", B: "cs" },
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
                black: "ckclcmdnendofodpcqbrdrdsfs",
                white: "dlglemfmgneogoepfpdqeqhqerfrgrhs",
            },
            marks: { A: "fn", B: "es" },
            move_tree: this.makePuzzleMoveTree(["es"], [], 19, 19),
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
                black: "anbncnendoepfqfrfs",
                white: "bococpdpaqbqdqcreres",
            },
            marks: { A: "ao", B: "eq" },
            move_tree: this.makePuzzleMoveTree(["ao"], [], 19, 19),
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
                black: "flcmfmdnencofocpfpcqarcrdrerbs",
                white: "gmgneogoepgpeqfqgqfrdsfs",
            },
            marks: { A: "fn", B: "es" },
            move_tree: this.makePuzzleMoveTree(["fn"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
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
                black: "anbncndnaoeoepgpfqgrgs",
                white: "bocoapdpbqdqerfrfs",
            },
            marks: { A: "do", B: "eq" },
            move_tree: this.makePuzzleMoveTree(["eq"], [], 19, 19),
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
                black: "cldnenfnbodocpepfpbqbrbscs",
                white: "gmgneofogogpcqdqeqfqhqcrfrfs",
            },
            marks: { A: "dp", B: "ds" },
            move_tree: this.makePuzzleMoveTree(["dp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
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
                black: "emanbncndnaoeoepgpaqfqfrfs",
                white: "bocodobpdpbqcqarcrdrercs",
            },
            marks: { A: "ap", B: "eq", C: "es" },
            move_tree: this.makePuzzleMoveTree(["ap"], [], 19, 19),
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
                black: "gnhnfohoepgphpcqdqfqbrcrercses",
                white: "flgmhmimenfninboeoiocpdpipaqbqgqhqiqfrgrhs",
            },
            marks: { A: "ar", B: "fs" },
            move_tree: this.makePuzzleMoveTree(["ar"], [], 19, 19),
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
                black: "anbncnenaodoepfpdqfqhqgrgs",
                white: "bococpdpcqarbrcrdrerfrbsds",
            },
            marks: { A: "ap", B: "eq", C: "fs" },
            move_tree: this.makePuzzleMoveTree(["ap"], [], 19, 19),
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
                black: "ekelbmemcndnbobpcpbqbrbs",
                white: "glgmenfnfodpepgpcqcrdreres",
            },
            marks: { A: "do", B: "cs" },
            move_tree: this.makePuzzleMoveTree(["do"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
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
                black: "cmanbncodofoapepcqeqfqhqgrgs",
                white: "bobpdpbqdqarbrcrdrerfrbsds",
            },
            marks: { A: "ao", B: "cp", C: "fs" },
            move_tree: this.makePuzzleMoveTree(["ao"], [], 19, 19),
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
                black: "eldmemencoeocpdpepcqeqcreres",
                white: "dkbldlcmbndnbodobpbqbrdrbsds",
            },
            marks: { A: "cn", B: "cs" },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
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
                black: "dlcmimdneninaocoioapbpipaqiqbrirbsfsgsis",
                white: "fmhmfnhndoeogocpgpbqcqeqhqcrfrgrhrcses",
            },
            marks: { A: "ar", B: "hs" },
            move_tree: this.makePuzzleMoveTree(["ar"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
