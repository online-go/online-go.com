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

export class BL2Connect extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl2-connect";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connect", "Connect");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on connect",
            "Choose the best connection",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "A beautiful shape to ensure connection is the bamboo joint. The three white stones in this diagram can be cut. The solid connection by White at A results in an ugly shape (empty triangle). White can also connect by playing at B. The resulting shape is called the bamboo joint. This bamboo joint offers more possibilities than a solid connection at A. White to play. Connect the white stones. Choose the best connection.",
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
                black: "dpdqgpgq",
                white: "eoeqfq",
            },
            marks: { A: "ep", B: "fo" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Another beautiful shape to ensure connection is the keima (knight's move) connection. The black stones still have a cutting-point at A. By playing a keima at B, Black can cover this cut. If White still tries to cut at A, Black can capture the cutting stones in a ladder. Black to play. Connect the black stones. Choose the best connection.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpepfqfr",
                white: "bqcqdqeqer",
            },
            marks: { A: "fp", B: "go" },
            move_tree: this.makePuzzleMoveTree(["gofpfogphp", "gofpgpfofn"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncncqdqfq",
                white: "dnbododp",
            },
            move_tree: this.makePuzzleMoveTree(["bp"], ["cobp", "cpbq"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmbndncobpaqeqdr",
                white: "endoeocpbqbr",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], ["dpcq", "cqdp"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cmcnboco",
                white: "anbnbpcpdpeq",
            },
            move_tree: this.makePuzzleMoveTree(["ao"], ["apao"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldlfmfncodofodpdqfqer",
                white: "cndnencpcqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["bo"], ["bnbo", "bpbo"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldlcododp",
                white: "bpcpfpeq",
            },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cldlhobpcpcqdqeqhqer",
                white: "cndnenbobqbrcrdr",
            },
            move_tree: this.makePuzzleMoveTree(["ap"], ["aoap", "aqap", "coap", "bnap"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dnfndogpdqgqcrdrgr",
                white: "cmcncoepbqcqfqfr",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], ["cpdp", "fpdp", "eqdp"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "dmcncoeqgqcrdr",
                white: "eofogobpcqbr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["dpdqcp"],
                ["dpdqepcp", "dpdqdocp", "dqdp", "cpdp", "bqdp"],
                19,
                19,
            ),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Connect the white stones. Choose the best connection.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "enfndocpdqeqer",
                white: "dlemcndncqcrdr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["bpbocodpbq", "bpbocodpaq", "bpbocodpap", "bpbocodpbr"],
                ["bpbocodpbnbqaobr", "cobp", "bobp", "bqbp"],
                19,
                19,
            ),
        };
    }
}
