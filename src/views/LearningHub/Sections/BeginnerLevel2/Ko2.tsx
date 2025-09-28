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

export class BL2Ko2 extends LearningHubSection {
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
        return "bl2-ko-2";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning rescue with ko", "Ko");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on rescue with ko", "Rescue with ko");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black threatens with move 1 to capture the white group. If White plays at A to connect the stones, Black plays at B and the white group is dead. But White can also start a ko by playing at B. Next, Black starts the ko-fight by capturing at A and White must play a ko-threat somewhere else on the board. White to play. Try to rescue the white group with a ko.",
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
                black: "bncncocpcqdreqcs",
                white: "arbobpbqcr",
            },
            marks: { 1: "cs", A: "br", B: "bs" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["brbs"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stone with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmdodpcqdr",
                white: "epdqfqcr",
            },
            marks: { triangle: "cr" },
            move_tree: this.makePuzzleMoveTree(["er"], ["cpeq", "dser"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enbocoapcpepeqer",
                white: "bpcqdqbrdr",
            },
            marks: { triangle: "drbrdqcqbp" },
            move_tree: this.makePuzzleMoveTree(["aq"], ["bqaq", "arcs"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbpcpcqbrdrer",
                white: "bqdqeqgqcrds",
            },
            marks: { triangle: "dscr" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["arcs", "frcs"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnaocododpdqcrdr",
                white: "bocpbqcqbrbs",
            },
            marks: { triangle: "bsbrcqbqcpbo" },
            move_tree: this.makePuzzleMoveTree(["ap"], ["bpap", "anbp"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "blclamcmdneneoepbqcqdq",
                white: "bmcnbodobpcpdp",
            },
            marks: { triangle: "dpcpbpdobocnbm" },
            move_tree: this.makePuzzleMoveTree(["an"], ["bnan", "aobn"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "eofogoephpdqhqdrerhrgs",
                white: "dodpfpgpcqeqgqcrfrgr",
            },
            marks: { triangle: "grfrgqeqgpfp" },
            move_tree: this.makePuzzleMoveTree(["es", "ds"], ["fsfq", "csfs"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boapcpdpepeqgq",
                white: "bpcqdqbr",
            },
            marks: { triangle: "brdqcqbp" },
            move_tree: this.makePuzzleMoveTree(["aq"], ["bqdr", "ardr"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncndneoeqfqarcrdrbs",
                white: "bocobpdpcqdqbr",
            },
            marks: { triangle: "brdqcqdpbpcobo" },
            move_tree: this.makePuzzleMoveTree(["aq"], ["bqao", "apbq"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bmcmcncocpcqdrcs",
                white: "bnbobpbqarcr",
            },
            marks: { triangle: "crarbqbpbobn" },
            move_tree: this.makePuzzleMoveTree(["bs"], ["brbs", "anbr"], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bndndodpeqfqcrdrfrbs",
                white: "bpcpaqcqdqbrer",
            },
            marks: { triangle: "brdqcqaqcpbp" },
            move_tree: this.makePuzzleMoveTree(
                ["as", "csdsasescs", "boaoas", "boaocsdsas", "aoboas", "aobocsdsas"],
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
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcocpepeqerbsdses",
                white: "bpbqcqdqdrcs",
            },
            marks: { triangle: "csdrdqcqbqbp" },
            move_tree: this.makePuzzleMoveTree(
                ["br"],
                ["ascr", "crboarap", "crboasar", "bocrbnbm"],
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
        return _("White to play. Try to rescue the marked stones with a ko.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "hpaqbqcqdqeqfqhqfrhrgshs",
                white: "bpcpdpepfpgpgqbrcrdrergrds",
            },
            marks: { triangle: "dserdrcrbr" },
            move_tree: this.makePuzzleMoveTree(
                ["fsarap", "fsarasbsap", "arbsfs"],
                ["fsaresbs"],
                19,
                19,
            ),
        };
    }
}
