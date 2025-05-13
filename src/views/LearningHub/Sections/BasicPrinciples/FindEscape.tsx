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

export class FindEscape extends LearningHubSection {
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
        return "find_escape";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning escape", "Find Escape");
    }
    static subtext(): string {
        return pgettext("Tutorial section subtext on learning on escape", "Find atari and escape");
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Find the black chain that is in atari and escape with this chain.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "eddefedfefcg",
                white: "ddcecfffdgeg",
            },
            move_tree: this.makePuzzleMoveTree(["ee"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecddeefg",
                white: "dccddedf",
            },
            move_tree: this.makePuzzleMoveTree(["ed"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gdhddefegf",
                white: "gchcfdidhe",
            },
            move_tree: this.makePuzzleMoveTree(["ge"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "cfeffgghhi",
                white: "hfhghhihii",
            },
            move_tree: this.makePuzzleMoveTree(["gi"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "edfdceeedfdh",
                white: "ecfcddgdfeef",
            },
            move_tree: this.makePuzzleMoveTree(["de"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fffhdieigi",
                white: "cecfdhehci",
            },
            move_tree: this.makePuzzleMoveTree(["fi"], [], 9, 9),
        };
    }
}

class Page07 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfcgegdh",
                white: "decfeffgeh",
            },
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}

class Page08 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "ecfdfecfefgffg",
                white: "fcgcedgdeegehfif",
            },
            move_tree: this.makePuzzleMoveTree(["ff"], [], 9, 9),
        };
    }
}

class Page09 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfcgegfgch",
                white: "gcbfcfefdgdh",
            },
            move_tree: this.makePuzzleMoveTree(["de"], [], 9, 9),
        };
    }
}

class Page10 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "fedfffeg",
                white: "gfhfdgfgeh",
            },
            move_tree: this.makePuzzleMoveTree(["ef"], [], 9, 9),
        };
    }
}

class Page11 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "gfdgfgehgh",
                white: "fedfefffcgeg",
            },
            move_tree: this.makePuzzleMoveTree(["dh"], [], 9, 9),
        };
    }
}

class Page12 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Escape with the chain that is in atari.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dccdcedfffdg",
                white: "decfefcgbhdhfh",
            },
            move_tree: this.makePuzzleMoveTree(["eg"], [], 9, 9),
        };
    }
}
