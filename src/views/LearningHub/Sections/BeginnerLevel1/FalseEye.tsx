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

export class BL1FalseEye extends LearningHubSection {
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
        return "bl1-false-eye";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning make eye false", "False Eye");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on make eye false", "Make eye false");
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "anbnboapaqbqarcrbs",
                white: "bmcmcncocpcqeqdr",
            },
            marks: { A: "ao" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["ambp"], 19, 19),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "boapbqarcrbs",
                white: "bncocpcqeqdr",
            },
            marks: { A: "aq" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["aobp", "anbp"], 19, 19),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bpaqcqbrdrercs",
                white: "cpdpdqfqfresfs",
            },
            marks: { A: "cr" },
            move_tree: this.makePuzzleMoveTree(["ds"], ["eqds"], 19, 19),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncnaocobpbqcqbrdrcs",
                white: "ambmcmdmandndpdqfqer",
            },
            marks: { A: "bo" },
            move_tree: this.makePuzzleMoveTree(["cp"], ["docp"], 19, 19),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cnbpbqarcrdrbs",
                white: "dpeqercsdses",
            },
            marks: { A: "br" },
            move_tree: this.makePuzzleMoveTree(["cq"], ["dqcq", "cpcq"], 19, 19),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndnenbodofoapcpepbqbrbs",
                white: "bmcmdmembnfngngogpdqeqfqcr",
            },
            marks: { A: "co" },
            move_tree: this.makePuzzleMoveTree(["dp"], ["cqdp"], 19, 19),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bnaoboapbqarcrdrbs",
                white: "bmcmcncocpfpcqeq",
            },
            marks: { A: "aq" },
            move_tree: this.makePuzzleMoveTree(["bp"], ["ambp"], 19, 19),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "cndncocpcqeqbrdrercs",
                white: "emendodpfpdqfqfresfs",
            },
            marks: { A: "cr" },
            move_tree: this.makePuzzleMoveTree(["ds"], ["epds"], 19, 19),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bncnaocobpbqcqdrer",
                white: "ambmcmdmencpdpfpdqfq",
            },
            marks: { A: "bo" },
            move_tree: this.makePuzzleMoveTree(["an"], ["doan", "dnan", "apan"], 19, 19),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "amanbodofoapcpdpfpbqbrcrdr",
                white: "blembncnfngngogpcqdqeqfqhq",
            },
            marks: { A: "bp" },
            move_tree: this.makePuzzleMoveTree(["co"], [], 19, 19),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "doapbpdpbqdqbrcrerdses",
                white: "cmdnenbocofocpfpcqfqfrfs",
            },
            marks: { A: "dr" },
            move_tree: this.makePuzzleMoveTree(["eq"], ["epeq", "eoeq"], 19, 19),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make eye A false.");
    }
    config(): GobanConfig {
        return {
            width: 19,
            height: 19,
            mode: "puzzle",
            initial_player: "white",
            bounds: { top: 10, left: 0, bottom: 18, right: 8 },
            initial_state: {
                black: "bocodoeoapcpbqarcrcs",
                white: "bmcmandnenfnfodpfpcqdqgqdr",
            },
            marks: { A: "bp" },
            move_tree: this.makePuzzleMoveTree(["ao"], ["bnao", "cnao"], 19, 19),
        };
    }
}
