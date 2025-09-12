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

export class BL2Opening extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07];
    }
    static section(): string {
        return "bl2-opening";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning opening", "Opening");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on opening", "Play an opening move");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The main target in the game of go is to make territory. Making territory is easiest in the corners, because you need to defend a corner only from two sides. That is why the first moves of the opening are often in the corners. Next, the sides follow and the centre comes last. White to play. Choose the best continuation, A, B or C.",
        );
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "pdpq",
                white: "dp",
            },
            marks: { C: "dd", B: "jj", A: "jp", 1: "pd", 2: "dp", 3: "pq" },
            move_tree: this.makePuzzleMoveTree(["dd"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "When your first move in a corner is at the 3-4 point, you can close the corner with one move. Such a corner enclosure is called shimari in Japanese. You can do this by playing at A or B. Black to play. Close the corner with a shimari.",
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
                black: "cp",
            },
            marks: { A: "ep", B: "eq" },
            move_tree: this.makePuzzleMoveTree(["ep", "eq"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "If your opponent has not enclosed the corner, you can attack it with a corner approach. This is called kakari in Japanese. In this diagram White has a stone at the 4-4 point. Black can attack this corner by playing at A or B. Black to play. Attack the corner with a kakari.",
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
                white: "dp",
            },
            marks: { A: "fp", B: "fq" },
            move_tree: this.makePuzzleMoveTree(["fp", "fq", "cn", "dn"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "When your stone in the corner is attacked with a kakari, you may want to defend it. If you do not defend, your opponent might attack your stone again with a kakari from the other side. The usual way to react on a kakari is a knight's move or a 1-point jump. In this example Black can react on White's kakari 1 with a move at A or B. Black to play. Defend against the kakari.",
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
                black: "dp",
                white: "fq",
            },
            marks: { A: "cn", B: "dn", 1: "fq" },
            move_tree: this.makePuzzleMoveTree(["cn", "dn"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best continuation, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "qdpq",
                white: "dddp",
            },
            marks: { C: "oc", B: "nj", A: "kr", 1: "qd", 2: "dp", 3: "pq", 4: "dd" },
            move_tree: this.makePuzzleMoveTree(["oc"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best continuation, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "pdpq",
                white: "dddp",
            },
            marks: { C: "jl", B: "fn", A: "fq", 1: "pd", 2: "dp", 3: "pq", 4: "dd" },
            move_tree: this.makePuzzleMoveTree(["fq"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Choose the best continuation, A, B or C.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "qcpq",
                white: "dccp",
            },
            marks: { C: "oe", B: "fj", A: "po", 1: "qc", 2: "cp", 3: "pq", 4: "dc" },
            move_tree: this.makePuzzleMoveTree(["po"], [], 19, 19),
        };
    }
}
