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

export class AtariCorrectSide extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "atari-correct-side";
    }
    static title(): string {
        return pgettext(
            "Tutorial section name on learning atari at correct side",
            "Atari Correct Side",
        );
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on atari at correct side",
            "Choose correct side for atari",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "White can put the marked stones in atari by playing at A or B. Put the marked stones in atari at the correct side.",
        );
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ichdidfegeheefegfggg",
                white: "echcfdgdeeffgfhf",
            },
            marks: { A: "ib", B: "ie", triangle: "ichdidfegehe" },
            move_tree: this.makePuzzleMoveTree(["ib"], ["ieif"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Put the marked stones in atari at the correct side.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "bcadcddeafbfcf",
                white: "acbecedfagcg",
            },
            marks: { triangle: "cfbfaf" },
            move_tree: this.makePuzzleMoveTree(["bgaebd"], ["aebd"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Put the marked stones in atari at the correct side.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "gchcfdidiehfhg",
                white: "hdgegfggighh",
            },
            marks: { triangle: "hghf" },
            move_tree: this.makePuzzleMoveTree(["heific"], ["ifih"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Put the marked stones in atari at the correct side.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "dadbfbacbcccdcfcfddeeeff",
                white: "aaabbbcbebecadbdcddded",
            },
            marks: { triangle: "dcccbcacdbda" },
            move_tree: this.makePuzzleMoveTree(["eacaba"], ["caba"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Put the marked stones in atari at the correct side.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "efffdgfgdhghdi",
                white: "dfcgegchehfh",
            },
            marks: { triangle: "didhdg" },
            move_tree: this.makePuzzleMoveTree(["cieifi"], ["eifi"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("White to play. Put the marked stones in atari at the correct side.");
    }
    config(): GobanConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "white",
            initial_state: {
                black: "ccdedfegfgfhghgi",
                white: "efffcgdgggehhh",
            },
            marks: { triangle: "gighfhfgeg" },
            move_tree: this.makePuzzleMoveTree(["hidhfi"], ["fiei"], 9, 9),
        };
    }
}
