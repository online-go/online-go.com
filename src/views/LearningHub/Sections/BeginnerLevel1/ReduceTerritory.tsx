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

export class BL1ReduceTerritory extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06, Page07];
    }
    static section(): string {
        return "bl1-reduce-territory";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning reduce territory", "4.21 Territory");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on reduce territory",
            "Reduce opponent's territory",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black's group has two eyes, so White can not capture it. In the endgame White can prevent Black from making two additional territory points. White to play. Play the best move to reduce Black's territory.",
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
                black: "aparbrcqcsdqdrds",
                white: "aobocpdndpeqeresfsgr",
            },
            marks: { cross: "bp" },
            move_tree: this.makePuzzleMoveTree(["bp"], [], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Reduce Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boapbpcpdpdqbrcrdr",
                white: "cmanbncodofoepeqerds",
            },
            move_tree: this.makePuzzleMoveTree(["cs"], [], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Reduce Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bqcqdqardrbs",
                white: "apbpcpdpfpeqer",
            },
            move_tree: this.makePuzzleMoveTree(["ds"], [], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Reduce Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpepaqbqeqfqcrfres",
                white: "aobocodoeogofpgqgr",
            },
            move_tree: this.makePuzzleMoveTree(["dp"], [], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Reduce Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpcpdpaqdqbr",
                white: "aobocodofoepeq",
            },
            move_tree: this.makePuzzleMoveTree(["dr"], [], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Reduce Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "aoapbpcqdqeqcrerds",
                white: "anbnbocodpepgpfqfrfs",
            },
            move_tree: this.makePuzzleMoveTree(["cp"], [], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Reduce Black's territory.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cqaqcpbpboaobn",
                white: "dqdpdococnbmamcl",
            },
            move_tree: this.makePuzzleMoveTree(["cr", "drcrcs"], [], 19, 19),
        };
    }
}
