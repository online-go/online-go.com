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

export class BL3LifeDeath5 extends LearningHubSection {
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
        return "bl3-life-death-5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning live along the side", "Life&Death");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on live along the side",
            "Live along the side",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you have six stones along the side on the second line, this is not enough to live. Even if it is your turn to move, you can not save the stones. White to play. If White plays at A, Black will play at B. Play at A or B to see what will happen.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrdqeqfqgqhqiqjqjr",
                white: "drerfrgrhrir",
            },
            marks: { A: "ds", B: "is" },
            move_tree: this.makePuzzleMoveTree(["isdsesgs", "dsishsfs"], [], 19, 19),
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
            "If you have seven stones along the side on the second line, it is possible to live. If White is to play, White can give the group two eyes by playing at A, B or C. If Black is to play, the white stones can be captured. White to play. Make the white group along the side alive.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrdqeqfqgqhqiqjqkqkr",
                white: "drerfrgrhrirjr",
            },
            marks: { A: "ds", B: "gs", C: "js" },
            move_tree: this.makePuzzleMoveTree(
                ["jsdsesgshs", "dsjsisfsgs", "gsdsesjsis"],
                [],
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
        return _(
            "If you have eight stones along the side on the second line, the group is alive, even if your opponent is to play. If Black attacks the white group with 1, White can defend and live. White to play. Defend the white group along the side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "cqcrdqeqfqgqhqiqjqkqlqlrds",
                white: "drerfrgrhrirjrkr",
            },
            marks: { 1: "ds" },
            move_tree: this.makePuzzleMoveTree(["es", "ks"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you have four stones in the corner on the second line, this is not enough to live. Even if it is your turn to play, you can not save the four stones. Here, White tries to save the four stones with 1. Capture the white stones by preventing two eyes.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqeqer",
                white: "arbrcrdrds",
            },
            marks: { 1: "ds" },
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
        return _(
            "If you have five stones in the corner on the second line, you can live by giving the group two eyes. Here, White can make two eyes. If it is Black's turn to play, Black can capture the white group. Black to play. Capture the white group.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqeqfqfr",
                white: "arbrcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["esdsbs"], ["esdsfsbs"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If you have six stones in the corner on the second line, your group is alive, even if your opponent is to play. Here, Black tries to capture the white stones with 1. Save the white group.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "aqbqcqdqeqfqgqgrfs",
                white: "arbrcrdrerfr",
            },
            marks: { 1: "fs" },
            move_tree: this.makePuzzleMoveTree(["esbscs"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcqdqeqfqgqhqiqjqbrjrlr",
                white: "crdrerfrgrhrir",
            },
            move_tree: this.makePuzzleMoveTree(["is", "cs", "fs"], ["jscs", "bsis"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "hrgqfqeqdqcqbqhpbo",
                white: "erdrcrbr",
            },
            move_tree: this.makePuzzleMoveTree(
                ["aresfrfsgsgrdsfsbs", "aresfrfsgsdscs", "aresfrfsgsdsgr"],
                ["frar", "esar", "bsar"],
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
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "eofohobpepgpjpcqdqeqgqiqbrjr",
                white: "fpfqcrdrergrhrir",
            },
            move_tree: this.makePuzzleMoveTree(
                ["fsfrfq"],
                ["frcsdsis", "isfrfsgs", "csfrfses"],
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
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bpcqdqeqgqhqiqkqbrjr",
                white: "crdrergrhrir",
            },
            move_tree: this.makePuzzleMoveTree(["fs"], ["fris", "frcs", "isfr", "csfr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bobpcqdqeqfqfr",
                white: "arcrdrer",
            },
            move_tree: this.makePuzzleMoveTree(["bs"], ["bres", "esbr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "jpbqcqdqeqfqgqhqiqarjr",
                white: "brcrdrerfrhrir",
            },
            move_tree: this.makePuzzleMoveTree(["gr"], ["gsgr", "bsgr", "isgr"], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make the white group along the side alive.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 12 },
            /* cSpell:disable */
            initial_state: {
                black: "bocobpdpfphpaqbqdqfqgr",
                white: "cpcqbrdrerfrcs",
            },
            move_tree: this.makePuzzleMoveTree(["arcrcq"], ["crar", "fsar"], 19, 19),
            /* cSpell:enable */
        };
    }
}
