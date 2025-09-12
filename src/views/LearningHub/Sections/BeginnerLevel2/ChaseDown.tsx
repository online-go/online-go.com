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

export class BL2ChaseDown extends LearningHubSection {
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
        return "bl2-chase-down";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning chase down", "Chase Down");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on chase down", "Chase down stones");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofocpdpgpcqhqgr",
                white: "codobpepfpdqfqgqer",
            },
            marks: { triangle: "gqfqfpep" },
            move_tree: this.makePuzzleMoveTree(
                ["freqdr", "freqes"],
                ["freqcrhp", "drfreqhr"],
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
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnenfocpdpepfpaqbq",
                white: "clcmfmbnfnaocodoeoapbp",
            },
            marks: { triangle: "codoeo" },
            move_tree: this.makePuzzleMoveTree(["cnbobm"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "codoeogobpepfpbqfqbrdrfrbs",
                white: "bncndnbocpdpgpcqgqcrergrdsfsgs",
            },
            marks: { triangle: "cpdpcqcr" },
            move_tree: this.makePuzzleMoveTree(["csdqeq"], ["dqeq", "eqcs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dlambmcncocpbqcq",
                white: "bnaobobpfpaqdqbrcrer",
            },
            marks: { triangle: "bnaobobp" },
            move_tree: this.makePuzzleMoveTree(["an"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dqeqfqgqhqdrhrhs",
                white: "bocpcqcrerfrgrds",
            },
            marks: { triangle: "erfrgr" },
            move_tree: this.makePuzzleMoveTree(["esfsgs"], ["cses", "gses", "fses"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aobocodoeoepdqcrdr",
                white: "bpcpdpfpaqcqeqgqbrer",
            },
            marks: { triangle: "bpcpdpcq" },
            move_tree: this.makePuzzleMoveTree(["apbqbs"], ["apbqcsbs", "bsds"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnendofocpcqgqcrdr",
                white: "cncoeobpdpbqdqfqbrer",
            },
            marks: { triangle: "eodpdq" },
            move_tree: this.makePuzzleMoveTree(
                ["eqepfpeqfr", "eqepfpeqes"],
                ["eqepescs", "epeq", "fpeq"],
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
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "ambmcmandneocpdpaq",
                white: "bncnaocobpcqdqeqbr",
            },
            marks: { triangle: "bncnco" },
            move_tree: this.makePuzzleMoveTree(
                ["dobobq", "bqardo"],
                ["doboapbq", "apbobqar", "apbodobq"],
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
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cocpepbqcqeqhqdrcsds",
                white: "clbncnbobpaqbrcras",
            },
            marks: { triangle: "brcras" },
            move_tree: this.makePuzzleMoveTree(["bs"], [], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmdnboeocpepbqcqdqeqbrdr",
                white: "enfnfoapbpfpaqfqarcrerfrbscsds",
            },
            marks: { triangle: "apbpaqar" },
            move_tree: this.makePuzzleMoveTree(["ao"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blcldlelflbmcndndobpcpdp",
                white: "cmdmemanbnenbocoapfpbqcqdqfq",
            },
            marks: { triangle: "anbnboco" },
            move_tree: this.makePuzzleMoveTree(["am"], [], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Chase down the marked stones.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnaoboapdpbqcrdr",
                white: "bmcmbncodobpcpdq",
            },
            marks: { triangle: "codobpcp" },
            move_tree: this.makePuzzleMoveTree(
                ["eoepcqdpfpeqfq", "eoepcqdpfpeqerfqgq"],
                ["eoepcqdpfpeqerfqfrgq", "eoepcqdpeqfp", "eoepfpen", "cqeo", "epeofoen"],
                19,
                19,
            ),
        };
    }
}
