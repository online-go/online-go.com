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

import { PuzzleConfig } from "goban";
import { LearningPage, LearningPageProperties } from "../../LearningPage";
import { _, pgettext } from "@/lib/translate";
import { LearningHubSection } from "../../LearningHubSection";

export class AtariToSide1 extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "atari-to-side1";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning atari to side", "Atari To Side 1");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on atari to side",
            "Give atari towards the edge",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bdbf",
                white: "ccbe",
            },
            marks: { A: "ae", B: "ce", triangle: "be" },
            move_tree: this.makePuzzleMoveTree(["ce"], ["aece"], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dbfbdcfc",
                white: "ebeccecg",
            },
            marks: { A: "ea", B: "ed", triangle: "eceb" },
            move_tree: this.makePuzzleMoveTree(["ed"], ["eaed"], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "bccddd",
                white: "bdcecf",
            },
            marks: { A: "ad", B: "be", triangle: "bd" },
            move_tree: this.makePuzzleMoveTree(["be"], ["adbe"], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dgegchdi",
                white: "fgggdheh",
            },
            marks: { A: "fh", B: "ei", triangle: "ehdh" },
            move_tree: this.makePuzzleMoveTree(["fh"], ["eifh"], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "becfcgggdheh",
                white: "cdceeebfdfdg",
            },
            marks: { A: "af", B: "bg", triangle: "bf" },
            move_tree: this.makePuzzleMoveTree(["bg"], ["afbgchbd"], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _(
            "Black to play. Choose the point to play to push the marked white chain to the side, A or B.",
        );
    }
    config(): PuzzleConfig {
        return {
            width: 9,
            height: 9,
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfcgegch",
                white: "dgfgggdh",
            },
            marks: { A: "eh", B: "di", triangle: "dhdg" },
            move_tree: this.makePuzzleMoveTree(["eh"], ["dieheffh"], 9, 9),
        };
    }
}
