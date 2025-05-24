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

export class ConnectedShape extends LearningHubSection {
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
        return "connected-shape";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning connected shapes", "Connected Shape");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on connected shapes",
            "Prevent a cut",
        );
    }
}

class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The three white stones do not form a chain; still, they are connected. If Black tries to cut the stones by playing 1, White can prevent the cut by playing at A. Prevent Black from cutting.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fdheffeb",
                white: "edeegd",
            },
            marks: { 1: "fd", A: "fe" },
            move_tree: this.makePuzzleMoveTree(["fegefc"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The two white stones can be connected by playing at A. Prevent Black from cutting.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ddff",
                white: "dffd",
            },
            marks: { A: "ee" },
            move_tree: this.makePuzzleMoveTree(["eeedfeefde"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "The two white stones can be connected directly, or by playing at A or B; this is called a 'hanging connection' or 'tiger's mouth'. Prevent Black from cutting by playing a tiger's mouth.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cgdg",
                white: "dfeg",
            },
            marks: { A: "ee", B: "ff" },
            move_tree: this.makePuzzleMoveTree(["ee", "ff"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cdcgdgch",
                white: "efegdh",
            },
            move_tree: this.makePuzzleMoveTree(["eh", "fh", "di", "ei"], ["fiehdicieifh"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ebcdddffgg",
                white: "fdgddfdg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], ["efee", "deee", "edee", "feee"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gcddgddegedfgf",
                white: "edfdfffggghg",
            },
            move_tree: this.makePuzzleMoveTree(["ef", "fe", "ee"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eceddfefff",
                white: "ddfddefe",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "edeefggg",
                white: "dfffeg",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "eedfgfcgegfggh",
                white: "dcedfdcedeff",
            },
            move_tree: this.makePuzzleMoveTree(["fe", "ge"], ["effe"], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccceeggg",
                white: "fdeecg",
            },
            move_tree: this.makePuzzleMoveTree(["df"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efegggfhfi",
                white: "dfdgehei",
            },
            move_tree: this.makePuzzleMoveTree(["dh", "ch", "di"], ["cidhdich"], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccfcddcecfdf",
                white: "deeecgdgeg",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page13 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "fagagbecfchceeef",
                white: "eaebfbdcdddedf",
            },
            move_tree: this.makePuzzleMoveTree(["db", "cb", "da"], ["cadbdacb"], 9, 9),
        };
    }
}

class Page14 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "adbdcddeeeefagbgcgegeh",
                white: "aebecebfdfdgbhchdhdi",
            },
            move_tree: this.makePuzzleMoveTree(["cf", "ah"], [], 9, 9),
        };
    }
}

class Page15 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Make sure black can no longer cut the white stones.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "cccddeefffbg",
                white: "bcbdbedgeg",
            },
            move_tree: this.makePuzzleMoveTree(
                ["cf"],
                ["cecf", "cgcf", "dfcf", "bfcgcfdf", "bfcgdfcf"],
                9,
                9,
            ),
        };
    }
}
