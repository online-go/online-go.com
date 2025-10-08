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

export class BL3Opening1 extends LearningHubSection {
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
        ];
    }
    static section(): string {
        return "bl3-opening-1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning corner", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on corner", "Corner");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The first moves in the opening are played in the corners. The points suitable to play are marked in this diagram with the letters A-H. Playing at A, B, C or D is most common. Playing at E, F, G or H leads to complex josekis. A is the 3-3 point. You play here to take a small corner as territory. Your opponent can not prevent this. B is the 4-4-point. You should not play at 4-4 to take control of the corner. Your opponent can easily invade the corner by playing at the 3-3 point. You play at the 4-4 point if you want to develop influence in the centre. C and D are the 3-4 points. Playing at 3-4 is aiming at territory in the corner. Next, you can close the corner with a shimari. Play at one of the marked points to continue.",
        );
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
                black: "",
                white: "",
            },
            marks: { A: "cq", B: "dp", C: "cp", D: "dq", E: "co", F: "do", G: "ep", H: "eq" },
            move_tree: this.makePuzzleMoveTree(
                ["cq", "dp", "cp", "dq", "co", "do", "ep", "eq"],
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
        return _(
            "With a shimari you can close a corner. It is hard to attack a corner that is closed by a shimari. This is an efficient way of making territory, because you use two stones with a shimari instead of a wall of four or five stones to protect your territory. Later you can add stones to better protect or expand your territory. In this example, White attacks the shimari at 1 and 3 and Black defends at 2 and 4. Black to play. Defend against the white attack.",
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
                black: "codq",
                white: "dp",
            },
            marks: { 1: "dp", 2: "cp", 3: "eq", 4: "dr" },
            move_tree: this.makePuzzleMoveTree(["cpeqdr"], [], 19, 19),
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
            "If White invades too deep into the corner with 1, the white stones will be captured. Black to play. Defend against the invasion.",
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
                black: "codq",
                white: "cp",
            },
            marks: { 1: "cp", 2: "dp", 3: "bo", 4: "bp" },
            move_tree: this.makePuzzleMoveTree(["dpbobp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "co",
                white: "dq",
            },
            marks: { 1: "co", A: "ep", B: "cq", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["ep"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "cn",
                white: "dq",
            },
            marks: { 1: "cn", A: "cp", B: "cq", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["cp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "dn",
                white: "cq",
            },
            marks: { 1: "dn", A: "cp", B: "dp", C: "ep" },
            move_tree: this.makePuzzleMoveTree(["ep"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "do",
                white: "eq",
            },
            marks: { 1: "do", A: "cp", B: "bq", C: "dq" },
            move_tree: this.makePuzzleMoveTree(["cp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "dq",
                white: "do",
            },
            marks: { 1: "dq", A: "dp", B: "ep", C: "fp" },
            move_tree: this.makePuzzleMoveTree(["fp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "do",
                white: "dq",
            },
            marks: { 1: "do", A: "cn", B: "co", C: "cp" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "dp",
                white: "cq",
            },
            marks: { 1: "dp", A: "dq", B: "eq", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["dq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "dq",
                white: "dp",
            },
            marks: { 1: "dq", A: "do", B: "fp", C: "cq" },
            move_tree: this.makePuzzleMoveTree(["cq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "cpeq",
                white: "ep",
            },
            marks: { 1: "eq", A: "fp", B: "gp", C: "fq" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "eocp",
                white: "ep",
            },
            marks: { 1: "eo", A: "fo", C: "gp", B: "fq" },
            move_tree: this.makePuzzleMoveTree(["fo"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "dpfp",
                white: "fq",
            },
            marks: { 1: "fp", A: "gp", B: "gq", C: "hq" },
            move_tree: this.makePuzzleMoveTree(["gp"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Choose the best reply on Black's 1, A, B or C.");
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
                black: "docq",
                white: "dq",
            },
            marks: { 1: "cq", A: "dp", C: "eq", B: "cr" },
            move_tree: this.makePuzzleMoveTree(["cr"], [], 19, 19),
            /* cSpell:enable */
        };
    }
}
