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

export class CaptureWhite extends LearningHubSection {
    static pages(): Array<typeof LearningPage> {
        return [Page01, Page02, Page03, Page04, Page05, Page06];
    }
    static section(): string {
        return "exercise_1_5_5";
    }
    static title(): string {
        return pgettext("Tutorial section name on learning Exercise_1_5_5", "Capture White");
    }
    static subtext(): string {
        return pgettext(
            "Tutorial section subtext on learning on Exercise_1_5_5",
            "Capture white stones",
        );
    }
}
class Page01 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dcecfccddeeefe",
                white: "ddedfdcgdgeggg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["gd"], [], 9, 9),
        };
    }
}

class Page02 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dbfbecedee",
                white: "ebgbfcfdfe",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ea"], [], 9, 9),
        };
    }
}

class Page03 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dadbeb",
                white: "eaccdc",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["fa"], [], 9, 9),
        };
    }
}

class Page04 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dfefcgegggfh",
                white: "cecfdgchehei",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["dh"], [], 9, 9),
        };
    }
}

class Page05 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "dddebfcfefff",
                white: "eedfbgcgegfg",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["dg"], [], 9, 9),
        };
    }
}

class Page06 extends LearningPage {
    constructor(props: LearningPageProperties) {
        super(props);
    }

    text() {
        return _("Black to play. Capture one or more white stones.");
    }
    config(): PuzzleConfig {
        return {
            mode: "puzzle",
            initial_player: "black",
            initial_state: {
                black: "efdgbhchbi",
                white: "decfbgahai",
            },
            width: 9,
            height: 9,
            move_tree: this.makePuzzleMoveTree(["ag"], [], 9, 9),
        };
    }
}
